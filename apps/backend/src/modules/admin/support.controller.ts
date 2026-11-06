import { Router, Response } from 'express';
import { SupportTicketModel } from '../../database/SupportTicket';
import { MemberModel } from '../../database/Member';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../../common/middleware/auth';

const router = Router();

// GET /api/admin/support/tickets - List all tickets with filtering options
router.get('/tickets', authenticateAdmin, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (category && category !== 'ALL') filter.category = category;

    let tickets = await SupportTicketModel.find(filter)
      .populate('memberId', 'name email phone primaryCategoryName')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/support/tickets/:id - Fetch full ticket conversation
router.get('/tickets/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const ticket = await SupportTicketModel.findById(req.params.id).populate('memberId');
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Support ticket not found' });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/support/tickets/:id/reply - Append admin reply and update status
router.post('/tickets/:id/reply', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: 'Message content is required.' });
      return;
    }

    const ticket = await SupportTicketModel.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Support ticket not found' });
      return;
    }

    ticket.messages.push({
      sender: 'ADMIN',
      senderId: req.admin?.id as any,
      message: message.trim(),
      timestamp: new Date(),
    });

    if (status) {
      ticket.status = status;
    }

    await ticket.save();

    await logAdminAction(req, 'SUPPORT_TICKET_REPLY', 'SupportTicket', id, {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
    });

    const populated = await SupportTicketModel.findById(id).populate('memberId');
    res.json({ success: true, message: 'Reply sent successfully', data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

