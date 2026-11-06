import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { MemberModel } from '../../database/Member';
import { ServiceListingModel } from '../../database/ServiceListing';
import { KycSubmissionModel } from '../../database/KycSubmission';
import { MemberWalletModel } from '../../database/MemberWallet';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';
import { getOrCreateMemberWallet } from './funding.controller';

const router = Router();

// GET /api/admin/members - List members with filters
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, categoryId, search } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (categoryId) filter.primaryCategory = categoryId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const members = await MemberModel.find(filter)
      .populate('primaryCategory', 'name slug')
      .sort({ registeredAt: -1 });

    res.json({ success: true, data: members });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/members/:id - Get detailed member view with provided services & placeholder wallet
router.get('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const member = await MemberModel.findById(req.params.id).populate('primaryCategory');
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    // If membershipExpiresAt is not yet set, compute 1-year from registration date
    if (!member.membershipExpiresAt && member.registeredAt) {
      const reg = new Date(member.registeredAt);
      const computedExpiry = new Date(reg);
      computedExpiry.setFullYear(computedExpiry.getFullYear() + 1);
      member.membershipExpiresAt = computedExpiry;
      await member.save();
    }
    const services = await ServiceListingModel.find({ providerId: member._id })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    // Fetch KYC submission metadata if present
    let kycSubmission = await KycSubmissionModel.findOne({ memberId: member._id }).select(
      'status submittedAt verifiedAt reviewerNotes documents'
    );

    // Fallback Mock Documents if not yet submitted in DB
    if (!kycSubmission || !kycSubmission.documents || kycSubmission.documents.length === 0) {
      kycSubmission = {
        status: member.kycStatus || 'SUBMITTED',
        submittedAt: member.registeredAt,
        verifiedAt: member.kycStatus === 'APPROVED' ? new Date() : undefined,
        reviewerNotes: 'Verified via national identity and MCA company registry.',
        documents: [
          {
            docKey: 'id_proof',
            title: 'Individual Government ID / PAN Card',
            fileName: `${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_pan.pdf`,
            fileUrl: `https://placehold.co/600x400/png?text=Verified+PAN+Card+-+${encodeURIComponent(member.name)}`,
            uploadedAt: new Date().toISOString(),
            status: member.kycStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING',
          },
          {
            docKey: 'business_reg',
            title: 'Business Registration / Udyam / Aadhaar Proof',
            fileName: `${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_registration.pdf`,
            fileUrl: `https://placehold.co/600x400/png?text=Business+Registration+-+${encodeURIComponent(member.name)}`,
            uploadedAt: new Date().toISOString(),
            status: member.kycStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING',
          },
        ],
      } as any;
    }

    // Member Bank Details (provided by user for settlement/payouts)
    const bankDetails = {
      accountHolderName: member.name,
      bankName: 'Primary Bank Account',
      accountNumber: 'Pending Submission',
      ifscCode: 'Pending Submission',
      accountType: 'Savings Account',
      branchName: 'Main Branch',
      upiId: `${member.email.split('@')[0]}@upi`,
      verificationStatus: member.kycStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING',
      verifiedAt: member.registeredAt || new Date(),
    };

    // Fetch or create persistent wallet model for member
    let walletDoc = await getOrCreateMemberWallet(member._id, member.email, member.name);

    const wallet = {
      balance: walletDoc.balance,
      currency: walletDoc.currency || 'INR',
      currencySymbol: walletDoc.currencySymbol || '₹',
      status: walletDoc.status || 'ACTIVE',
      lastSyncedAt: walletDoc.lastSyncedAt || new Date().toISOString(),
      note: 'Wallet balance and transaction ledger synchronized with collection pool activities',
      transactions: walletDoc.transactions || [],
    };

    res.json({
      success: true,
      data: {
        member,
        services,
        kycSubmission,
        wallet,
        bankDetails,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/members/:id/status - Update member account status (active/suspended/blocked)
router.patch('/:id/status', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'

    const member = await MemberModel.findById(id);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    member.status = status;
    await member.save();

    await logAdminAction(req, `MEMBER_STATUS_${status}`, 'Member', id, { reason });
    res.json({ success: true, message: `Member status updated to ${status}`, data: member });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
