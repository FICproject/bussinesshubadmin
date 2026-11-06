import { Router, Response } from 'express';
import { PaymentModel } from '../../database/Payment';
import { MemberModel } from '../../database/Member';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';

const router = Router();

// GET /api/admin/payments - List all transaction history with filters
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;

    let payments = await PaymentModel.find(filter)
      .populate('memberId', 'name email phone primaryCategoryName')
      .sort({ createdAt: -1 });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      payments = payments.filter((p: any) => {
        const nameMatch = p.memberId?.name?.toLowerCase().includes(q);
        const emailMatch = p.memberId?.email?.toLowerCase().includes(q);
        const txnMatch = p.gatewayTransactionId?.toLowerCase().includes(q);
        return nameMatch || emailMatch || txnMatch;
      });
    }

    res.json({ success: true, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/webhooks/payment - Payment gateway webhook receiver
router.post('/webhook', async (req, res) => {
  console.log('[WEBHOOK RECEIVED] Payment Gateway Payload:', req.body);
  res.json({ received: true });
});

export default router;

