import { Router, Response } from 'express';
import { ServiceListingModel } from '../../database/ServiceListing';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';

const router = Router();

// GET /api/admin/services - List service listings with admin moderation data
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, categoryId } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (categoryId) filter.categoryId = categoryId;

    const listings = await ServiceListingModel.find(filter)
      .populate('providerId', 'name email phone status')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: listings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/services/:id/moderate - Approve or Reject listing
router.patch('/:id/moderate', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // 'APPROVED' | 'REJECTED' | 'SUSPENDED'

    const listing = await ServiceListingModel.findById(id);
    if (!listing) {
      res.status(404).json({ success: false, error: 'Service listing not found' });
      return;
    }

    listing.status = status;
    if (status === 'APPROVED') {
      listing.approvedAt = new Date();
      listing.rejectionReason = undefined;
    } else {
      listing.rejectionReason = rejectionReason;
    }
    await listing.save();

    await logAdminAction(req, `SERVICE_LISTING_${status}`, 'ServiceListing', id, { rejectionReason });
    res.json({ success: true, message: `Service listing status updated to ${status}`, data: listing });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

