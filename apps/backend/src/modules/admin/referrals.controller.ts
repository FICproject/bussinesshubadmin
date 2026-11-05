import { Router, Response } from 'express';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';
import { ReferralConfigModel, ReferralRecordModel } from '../../database/Referral';
import { MemberModel } from '../../database/Member';

const router = Router();

// Ensure initial config & sample referrals exist if empty
const ensureReferralInit = async () => {
  let config = await ReferralConfigModel.findOne({ key: 'DEFAULT_CONFIG' });
  if (!config) {
    config = await ReferralConfigModel.create({
      key: 'DEFAULT_CONFIG',
      bonusPerReferral: 500,
      currency: 'INR',
      minimumPayoutAmount: 1000,
      isActive: true,
      updatedBy: 'System',
    });
  }

  const recordCount = await ReferralRecordModel.countDocuments();
  if (recordCount === 0) {
    const members = await MemberModel.find().limit(3);
    if (members.length >= 2) {
      await ReferralRecordModel.create([
        {
          referrerMemberId: members[0]._id,
          referrerName: members[0].name,
          referrerEmail: members[0].email,
          referredMemberId: members[1]._id,
          referredName: members[1].name,
          referredEmail: members[1].email,
          bonusAmount: config.bonusPerReferral,
          status: 'PAID',
          payoutDate: new Date(),
          payoutReference: 'REF-TXN-88231',
          notes: 'Standard onboarding referral bonus paid via UPI',
        },
      ]);
    }
  }
  return config;
};

// GET /api/admin/referrals/summary
// Returns config, stats (total referrals, total amount paid, pending amount, etc.), and recent referrals list
router.get('/summary', authenticateAdmin, async (_req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const config = await ensureReferralInit();
    const records = await ReferralRecordModel.find().sort({ createdAt: -1 });

    const totalReferrals = records.length;
    const paidRecords = records.filter((r) => r.status === 'PAID');
    const totalPaidBonus = paidRecords.reduce((sum, r) => sum + (r.bonusAmount || 0), 0);

    const approvedRecords = records.filter((r) => r.status === 'APPROVED');
    const totalPendingBonus = approvedRecords.reduce((sum, r) => sum + (r.bonusAmount || 0), 0);

    // Group referrals by referrer
    const referrerMap: Record<
      string,
      {
        referrerName: string;
        referrerEmail: string;
        count: number;
        totalEarned: number;
        paidAmount: number;
      }
    > = {};

    records.forEach((r) => {
      const email = r.referrerEmail;
      if (!referrerMap[email]) {
        referrerMap[email] = {
          referrerName: r.referrerName,
          referrerEmail: r.referrerEmail,
          count: 0,
          totalEarned: 0,
          paidAmount: 0,
        };
      }
      referrerMap[email].count += 1;
      referrerMap[email].totalEarned += r.bonusAmount || 0;
      if (r.status === 'PAID') {
        referrerMap[email].paidAmount += r.bonusAmount || 0;
      }
    });

    const topReferrers = Object.values(referrerMap).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        config,
        stats: {
          totalReferrals,
          totalPaidBonus,
          totalPendingBonus,
          currentBonusPerReferral: config.bonusPerReferral,
          activeReferrersCount: Object.keys(referrerMap).length,
        },
        records,
        topReferrers,
      },
    });
  } catch (err: any) {
    console.error('Failed to get referral summary:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch referral data', details: err.message });
  }
});

// PATCH /api/admin/referrals/config
// Update the referral bonus configuration
router.patch('/config', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { bonusPerReferral, minimumPayoutAmount, isActive } = req.body;

    let config = await ReferralConfigModel.findOne({ key: 'DEFAULT_CONFIG' });
    if (!config) {
      config = new ReferralConfigModel({ key: 'DEFAULT_CONFIG' });
    }

    if (typeof bonusPerReferral === 'number' && bonusPerReferral >= 0) {
      config.bonusPerReferral = bonusPerReferral;
    }
    if (typeof minimumPayoutAmount === 'number' && minimumPayoutAmount >= 0) {
      config.minimumPayoutAmount = minimumPayoutAmount;
    }
    if (typeof isActive === 'boolean') {
      config.isActive = isActive;
    }
    config.updatedBy = req.admin?.name || 'Admin';

    await config.save();

    await logAdminAction(
      req,
      'UPDATE',
      'ReferralConfig',
      config._id.toString(),
      { message: `Updated referral bonus to ₹${config.bonusPerReferral}` }
    );

    res.json({ message: 'Referral configuration updated successfully', config });
  } catch (err: any) {
    console.error('Failed to update referral config:', err);
    res.status(500).json({ error: 'Failed to update referral configuration' });
  }
});

// POST /api/admin/referrals/record
// Admin can log or assign a new referral record manually
router.post('/record', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { referrerEmail, referredEmail, bonusAmount, notes } = req.body;

    const [referrer, referred] = await Promise.all([
      MemberModel.findOne({ email: referrerEmail.toLowerCase().trim() }),
      MemberModel.findOne({ email: referredEmail.toLowerCase().trim() }),
    ]);

    if (!referrer) {
      return res.status(404).json({ error: 'Referrer member not found by that email' });
    }
    if (!referred) {
      return res.status(404).json({ error: 'Referred member not found by that email' });
    }

    const config = await ReferralConfigModel.findOne({ key: 'DEFAULT_CONFIG' });
    const amount = typeof bonusAmount === 'number' ? bonusAmount : config?.bonusPerReferral || 500;

    const record = await ReferralRecordModel.create({
      referrerMemberId: referrer._id,
      referrerName: referrer.name,
      referrerEmail: referrer.email,
      referredMemberId: referred._id,
      referredName: referred.name,
      referredEmail: referred.email,
      bonusAmount: amount,
      status: 'APPROVED',
      notes: notes || 'Manual entry by operations team',
    });

    await logAdminAction(
      req,
      'CREATE',
      'ReferralRecord',
      record._id.toString(),
      { message: `Created referral for referrer ${referrer.email}`, referredEmail: referred.email }
    );

    res.status(201).json({ message: 'Referral created successfully', record });
  } catch (err: any) {
    console.error('Failed to create referral record:', err);
    res.status(500).json({ error: 'Failed to record referral', details: err.message });
  }
});

// PATCH /api/admin/referrals/record/:id/payout
// Mark referral as PAID
router.patch('/record/:id/payout', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { payoutReference, notes } = req.body;
    const record = await ReferralRecordModel.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Referral record not found' });
    }

    record.status = 'PAID';
    record.payoutDate = new Date();
    record.payoutReference = payoutReference || `PAYOUT-${Date.now().toString().slice(-6)}`;
    if (notes) record.notes = notes;

    await record.save();

    await logAdminAction(
      req,
      'UPDATE',
      'ReferralRecord',
      record._id.toString(),
      { message: `Marked referral bonus payout of ₹${record.bonusAmount} as PAID`, payoutReference: record.payoutReference }
    );

    res.json({ message: 'Payout marked as completed', record });
  } catch (err: any) {
    console.error('Failed to update payout:', err);
    res.status(500).json({ error: 'Failed to complete payout' });
  }
});

export default router;
