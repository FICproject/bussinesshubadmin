import { Router, Response } from 'express';
import { FicRequestModel } from '../../database/FicRequest';
import { ServiceListingModel } from '../../database/ServiceListing';
import { MemberModel } from '../../database/Member';
import { MeetingModel } from '../../database/Meeting';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';

const router = Router();

// GET /api/admin/requests - List FIC-mediated requests
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter: any = {};
    if (type && type !== 'ALL') filter.type = type;
    if (status && status !== 'ALL') filter.status = status;

    const requests = await FicRequestModel.find(filter)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('assignedStaffId', 'name email')
      .populate('scheduledMeetingId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/requests/providers/list - Get active verified service providers with their listings
router.get('/providers/list', authenticateAdmin, async (req, res) => {
  try {
    const { categoryId, search } = req.query;

    const filter: any = {
      status: { $in: ['APPROVED', 'PENDING_APPROVAL'] },
    };
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    let listings = await ServiceListingModel.find(filter)
      .populate('providerId', 'name email phone primaryCategoryName status kycStatus')
      .sort({ createdAt: -1 });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      listings = listings.filter(
        (l: any) =>
          l.title.toLowerCase().includes(q) ||
          l.providerPrivateName?.toLowerCase().includes(q) ||
          l.categoryName?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: listings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/select-provider - Select/assign a service provider to this request
router.patch('/:id/select-provider', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { providerId, serviceListingId } = req.body;

    const ficReq = await FicRequestModel.findById(id);
    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    const provider = await MemberModel.findById(providerId);
    if (!provider) {
      res.status(404).json({ success: false, error: 'Selected provider not found' });
      return;
    }

    ficReq.targetProviderId = provider._id as any;
    if (serviceListingId) {
      ficReq.targetServiceId = serviceListingId;
    }
    ficReq.status = 'UNDER_REVIEW';
    // Reset notification & response status for the new provider assignment
    ficReq.providerNotifiedAt = undefined;
    ficReq.providerResponse = 'PENDING';
    ficReq.providerResponseAt = undefined;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';
    ficReq.internalNotes.push(`[${timestamp} by ${author}]: Matched and assigned service provider "${provider.name}" (${provider.email}).`);

    await ficReq.save();
    await logAdminAction(req, 'ASSIGN_PROVIDER_FIC_REQUEST', 'FicRequest', id, { providerId, serviceListingId });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'Service provider selected', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/requests/:id/unassign-provider - Clear assigned provider to choose a different one
router.patch('/:id/unassign-provider', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ficReq = await FicRequestModel.findById(id).populate('targetProviderId');
    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    const previousProviderName = (ficReq.targetProviderId as any)?.name || 'Previous Provider';
    ficReq.targetProviderId = undefined;
    ficReq.targetServiceId = undefined;
    ficReq.providerNotifiedAt = undefined;
    ficReq.providerResponse = 'PENDING';
    ficReq.providerResponseAt = undefined;
    ficReq.status = 'NEW';

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';
    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Unassigned provider "${previousProviderName}". ${reason ? `Reason: ${reason}` : 'Ready for admin to select a new qualified provider.'}`
    );

    await ficReq.save();
    await logAdminAction(req, 'UNASSIGN_PROVIDER_FIC_REQUEST', 'FicRequest', id, { previousProviderName, reason });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'Provider unassigned. You can now select a new provider.', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/notify-provider - Inform provider about the client inquiry
router.post('/:id/notify-provider', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dispatchChannel, customMessage } = req.body; // e.g. 'EMAIL_SMS', custom note

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('requesterId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    if (!ficReq.targetProviderId) {
      res.status(400).json({ success: false, error: 'Please select a service provider first before notifying.' });
      return;
    }

    const provider: any = ficReq.targetProviderId;
    const requester: any = ficReq.requesterId;

    // Simulate dispatch via email / SMS notification gateway with confidential client shielding
    console.log(
      `[CONFIDENTIAL PROJECT BRIEF DISPATCH] Sent project brief to provider ${provider.name} (${provider.email}): Project: "${ficReq.title}", Requirements: "${ficReq.description}". Note: Client identity is anonymized until meeting confirmation.`
    );

    ficReq.status = 'PROVIDER_CONTACTED';
    ficReq.providerNotifiedAt = new Date();
    ficReq.providerResponse = 'PENDING';

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';
    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Dispatched anonymous project brief to provider ${provider.name} via ${dispatchChannel || 'Email & WhatsApp'}. Client identity confidential. Awaiting provider acceptance.`
    );

    await ficReq.save();
    await logAdminAction(req, 'NOTIFY_PROVIDER_FIC_REQUEST', 'FicRequest', id, {
      providerId: provider._id,
      providerEmail: provider.email,
    });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: `Notification dispatched to ${provider.name}`, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/provider-response - Provider accepts or declines
router.post('/:id/provider-response', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { response } = req.body; // 'ACCEPTED' | 'DECLINED'

    if (!['ACCEPTED', 'DECLINED'].includes(response)) {
      res.status(400).json({ success: false, error: 'Invalid response. Must be ACCEPTED or DECLINED.' });
      return;
    }

    const ficReq = await FicRequestModel.findById(id).populate('targetProviderId');
    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    ficReq.providerResponse = response;
    ficReq.providerResponseAt = new Date();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';
    const providerName = (ficReq.targetProviderId as any)?.name || 'Provider';

    if (response === 'ACCEPTED') {
      ficReq.internalNotes.push(`[${timestamp}]: Provider ${providerName} ACCEPTED the client inquiry. Ready to schedule coordination meeting.`);
    } else {
      ficReq.status = 'UNDER_REVIEW';
      ficReq.internalNotes.push(`[${timestamp}]: Provider ${providerName} DECLINED the inquiry. Returning case to review for alternate provider selection.`);
    }

    await ficReq.save();
    await logAdminAction(req, `PROVIDER_RESPONSE_${response}`, 'FicRequest', id, { response });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: `Provider response recorded as ${response}`, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/requests/:id/schedule-meeting - Schedule a 3-way/coordination meeting for client and provider
router.post('/:id/schedule-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledAt, durationMinutes, title, description, meetingLink } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('requesterId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    if (!ficReq.targetProviderId) {
      res.status(400).json({ success: false, error: 'Cannot schedule meeting without an assigned provider.' });
      return;
    }

    if (!scheduledAt) {
      res.status(400).json({ success: false, error: 'Scheduled date & time is required.' });
      return;
    }

    const hostAdminId = req.admin!.id;
    const provider: any = ficReq.targetProviderId;
    const requester: any = ficReq.requesterId;

    const finalMeetingLink =
      meetingLink?.trim() || `https://meet.google.com/fic-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

    const meetingTitle = title || `FIC Intro: ${requester?.name || ficReq.requesterName} & ${provider.name}`;
    const meetingDescription =
      description || `Facilitated 1-on-1 meeting for request "${ficReq.title}". Client: ${requester?.name || ficReq.requesterName} (${requester?.email || ficReq.requesterEmail}), Provider: ${provider.name} (${provider.email}).`;

    // Participant IDs: client + provider
    const participantMemberIds = [ficReq.requesterId];
    if (provider._id) {
      participantMemberIds.push(provider._id);
    }

    const meeting = await MeetingModel.create({
      title: meetingTitle,
      description: meetingDescription,
      hostAdminId,
      participantMemberIds,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      meetingLink: finalMeetingLink,
      status: 'SCHEDULED',
      meetingType: 'CONSULTATION',
      notificationSent: true,
    });

    console.log(`[MEETING DISPATCH] Scheduled meeting "${meetingTitle}" between client (${ficReq.requesterEmail}) and provider (${provider.email}). Link: ${finalMeetingLink}`);

    ficReq.scheduledMeetingId = meeting._id as any;
    ficReq.status = 'MEETING_SCHEDULED';

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const author = req.admin ? req.admin.name : 'Admin';
    ficReq.internalNotes.push(
      `[${timestamp} by ${author}]: Scheduled consultation meeting for ${new Date(scheduledAt).toLocaleString()}. Meeting Link: ${finalMeetingLink}`
    );

    await ficReq.save();
    await logAdminAction(req, 'SCHEDULE_MEETING_FOR_FIC_REQUEST', 'FicRequest', id, {
      meetingId: meeting._id,
      meetingTitle,
      scheduledAt,
    });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'Meeting scheduled successfully', data: populated, meeting });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/requests/:id/reschedule-meeting - Edit/reschedule meeting time (Provider / Admin proposed availability)
router.patch('/:id/reschedule-meeting', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledAt, durationMinutes, updatedByRole, note } = req.body;

    const ficReq = await FicRequestModel.findById(id)
      .populate('targetProviderId')
      .populate('requesterId')
      .populate('scheduledMeetingId');

    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    if (!ficReq.scheduledMeetingId) {
      res.status(400).json({ success: false, error: 'No scheduled meeting exists to reschedule.' });
      return;
    }

    if (!scheduledAt) {
      res.status(400).json({ success: false, error: 'New scheduled date & time is required.' });
      return;
    }

    const meeting: any = await MeetingModel.findById(ficReq.scheduledMeetingId);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting record not found.' });
      return;
    }

    meeting.scheduledAt = new Date(scheduledAt);
    if (durationMinutes) meeting.durationMinutes = Number(durationMinutes);
    await meeting.save();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const actor = updatedByRole === 'PROVIDER' ? `Provider (${(ficReq.targetProviderId as any)?.name})` : (req.admin?.name || 'Admin');
    ficReq.internalNotes.push(
      `[${timestamp} by ${actor}]: Updated/Adjusted meeting slot to ${new Date(scheduledAt).toLocaleString()}.${note ? ` Reason: ${note}` : ''}`
    );

    await ficReq.save();
    await logAdminAction(req, 'RESCHEDULE_FIC_MEETING', 'Meeting', meeting._id.toString(), {
      scheduledAt,
      actor,
    });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'Meeting timing updated successfully', data: populated, meeting });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/requests/:id - Update status, assign staff, add internal note
router.patch('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, assignedStaffId, note } = req.body;

    const ficReq = await FicRequestModel.findById(id);
    if (!ficReq) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    if (status) ficReq.status = status;
    if (assignedStaffId) ficReq.assignedStaffId = assignedStaffId;
    if (note && note.trim()) {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const author = req.admin ? req.admin.name : 'Admin';
      ficReq.internalNotes.push(`[${timestamp} by ${author}]: ${note.trim()}`);
    }

    await ficReq.save();

    await logAdminAction(req, 'UPDATE_FIC_REQUEST', 'FicRequest', id, { status, assignedStaffId });

    const populated = await FicRequestModel.findById(id)
      .populate('requesterId', 'name email phone primaryCategoryName')
      .populate('targetServiceId', 'title categoryName pricingEstimate locationState')
      .populate('targetProviderId', 'name email phone primaryCategoryName')
      .populate('scheduledMeetingId');

    res.json({ success: true, message: 'FIC request updated', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
