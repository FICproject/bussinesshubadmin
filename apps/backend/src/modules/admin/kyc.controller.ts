import { Router, Response } from 'express';
import { KycSubmissionModel } from '../../database/KycSubmission';
import { MemberModel } from '../../database/Member';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';

const router = Router();

// GET /api/admin/kyc - List KYC submissions with filter
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, categoryId } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (categoryId) filter.categoryId = categoryId;

    const submissions = await KycSubmissionModel.find(filter)
      .populate('memberId', 'name email phone status')
      .populate('categoryId', 'name')
      .populate('assignedTo', 'name')
      .sort({ submittedAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/kyc/:id - Get specific KYC submission details
router.get('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const submission = await KycSubmissionModel.findById(req.params.id)
      .populate('memberId')
      .populate('categoryId')
      .populate('assignedTo', 'name email role');

    if (!submission) {
      res.status(404).json({ success: false, error: 'KYC submission not found' });
      return;
    }

    res.json({ success: true, data: submission });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/kyc/:id/review - Review/Decision on KYC submission
router.patch('/:id/review', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, reviewerNotes, rejectionReason } = req.body; // 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED'

    if (!['APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'].includes(decision)) {
      res.status(400).json({ success: false, error: 'Invalid review decision' });
      return;
    }

    const submission = await KycSubmissionModel.findById(id);
    if (!submission) {
      res.status(404).json({ success: false, error: 'KYC submission not found' });
      return;
    }

    submission.status = decision;
    submission.reviewerNotes = reviewerNotes || submission.reviewerNotes;
    submission.rejectionReason = rejectionReason || (decision === 'APPROVED' ? undefined : submission.rejectionReason);
    if (decision === 'APPROVED') {
      submission.verifiedAt = new Date();
    }
    await submission.save();

    // Update corresponding Member record status
    const member = await MemberModel.findById(submission.memberId);
    if (member) {
      member.kycStatus = decision;
      if (decision === 'APPROVED' && member.paymentStatus === 'PAID') {
        // Blueprint rule: full dashboard active only after payment + approved KYC
        member.status = 'ACTIVE';
      } else if (decision === 'REJECTED') {
        // Resubmission allowed without recharging
        member.status = 'PENDING_KYC';
      }
      await member.save();
    }

    // Synchronize to users collection so customer portal user can immediately login and access portal
    const isApproved = decision === 'APPROVED';
    try {
      const db = submission.db;
      await db.collection('users').updateOne(
        { $or: [{ _id: submission.memberId }, { email: submission.memberEmail?.toLowerCase() }] },
        {
          $set: {
            isKycApproved: isApproved,
            status: isApproved ? 'ACTIVE' : 'UNDER_REVIEW'
          }
        }
      );

      await db.collection('kycsubmissions').updateOne(
        { $or: [{ userId: submission.memberId }, { userId: member?._id }] },
        {
          $set: {
            status: isApproved ? 'APPROVED' : (decision === 'REJECTED' ? 'REJECTED' : 'RESUBMISSION_REQUESTED'),
            rejectionReason: rejectionReason || undefined,
            reviewedAt: new Date()
          }
        }
      );
    } catch (syncErr) {
      console.warn('User portal access sync warning:', syncErr);
    }

    await logAdminAction(req, `KYC_${decision}`, 'KycSubmission', id, {
      memberId: submission.memberId.toString(),
      decision,
      rejectionReason,
    });

    res.json({
      success: true,
      message: `KYC submission marked as ${decision}`,
      data: submission,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

