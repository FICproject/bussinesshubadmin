import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Lightbulb,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Calendar,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  LayoutGrid,
  List,
  X,
  ArrowRight,
  Check,
  Briefcase,
  Users,
  Share2,
  FileText,
  HelpCircle,
  RefreshCw,
  Coins,
  ChevronRight,
  UserCheck,
  Trash2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { containerVariants, itemVariants } from '../../utils/animations';
import { SkeletonCards } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';
import { AuthenticatedDocumentPreview } from '../../components/AuthenticatedDocumentPreview';

export const BusinessIdeasManagementPage: React.FC = () => {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get('status');
    return s ? s.toUpperCase() : 'ALL';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Document Preview Modal State
  const [viewingDocument, setViewingDocument] = useState<any | null>(null);

  // Admin Review State
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Submitter Update Message State
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState<'MATCHED' | 'COORDINATING_CALL'>('MATCHED');
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);

  // Contributor Selection Modal / State
  const [selectingInterest, setSelectingInterest] = useState<any | null>(null);
  const [selectionReason, setSelectionReason] = useState('');
  const [selectionPrivateNotes, setSelectionPrivateNotes] = useState('');
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);

  // Submitter Consultation Meeting Modal State
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const [showScheduleRequesterModal, setShowScheduleRequesterModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState(getTomorrowStr());
  const [meetingTime, setMeetingTime] = useState('11:00');
  const [meetingDuration, setMeetingDuration] = useState(45);
  const [meetingMode, setMeetingMode] = useState<'VIRTUAL' | 'IN_PERSON'>('VIRTUAL');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/fic-consultation');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  // Interested Member Collaboration Meeting Modal State
  const [schedulingInterest, setSchedulingInterest] = useState<any | null>(null);
  const [interestMeetingDate, setInterestMeetingDate] = useState(getTomorrowStr());
  const [interestMeetingTime, setInterestMeetingTime] = useState('15:00');
  const [interestMeetingDuration, setInterestMeetingDuration] = useState(45);
  const [interestMeetingMode, setInterestMeetingMode] = useState<'VIRTUAL' | 'IN_PERSON'>('VIRTUAL');
  const [interestMeetingLink, setInterestMeetingLink] = useState('https://meet.google.com/fic-collab');
  const [interestMeetingNotes, setInterestMeetingNotes] = useState('');
  const [isSubmittingInterestMeeting, setIsSubmittingInterestMeeting] = useState(false);

  const { showAlert, showConfirm, showPrompt } = useDialog();

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && s.toUpperCase() !== statusFilter) {
      setStatusFilter(s.toUpperCase());
    } else if (!s && statusFilter !== 'ALL') {
      setStatusFilter('ALL');
    }
  }, [searchParams]);

  useEffect(() => {
    loadIdeas();
  }, [statusFilter]);

  const loadIdeas = async (keepSelectedId?: string) => {
    setLoading(true);
    try {
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/business-ideas${qs}`);
      const list = res?.items || (Array.isArray(res) ? res : []);
      setIdeas(list);

      if (keepSelectedId) {
        fetchIdeaDetails(keepSelectedId);
      }
    } catch (err: any) {
      console.error('Failed to load business ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIdeaDetails = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await apiFetch(`/api/admin/business-ideas/${id}`);
      setSelectedIdea(res);
      setAdminNotes(res?.adminNotes || '');
    } catch (err: any) {
      showAlert(err.message || 'Failed to fetch business idea details', { severity: 'danger' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideas;
    const q = searchQuery.toLowerCase().trim();
    return ideas.filter((idea) => {
      const matchId = idea.ideaRequestId?.toLowerCase().includes(q) || idea.refNumber?.toLowerCase().includes(q);
      const matchTitle = idea.title?.toLowerCase().includes(q);
      const matchName = idea.submitterName?.toLowerCase().includes(q);
      const matchEmail = idea.submitterEmail?.toLowerCase().includes(q);
      const matchCategory = idea.mainCategoryName?.toLowerCase().includes(q) || idea.subcategoryName?.toLowerCase().includes(q);
      const matchLocation = idea.targetLocation?.toLowerCase().includes(q);
      return matchId || matchTitle || matchName || matchEmail || matchCategory || matchLocation;
    });
  }, [ideas, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = ideas.length;
    const pending = ideas.filter((i) => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW').length;
    const published = ideas.filter((i) => i.marketplacePublished || i.status === 'SHARED_ON_MARKETPLACE').length;
    const matched = ideas.filter((i) => i.status === 'MATCHED' || i.status === 'COORDINATING_CALL').length;
    return { total, pending, published, matched };
  }, [ideas]);

  // Handle Admin Review Action (Approve, Under Review, Reject, Request Info)
  const handleReviewAction = async (action: 'APPROVE' | 'UNDER_REVIEW' | 'REJECT' | 'REQUEST_INFO') => {
    if (!selectedIdea) return;

    let rejectionReason: string | undefined = undefined;
    let infoNotes: string | undefined = undefined;

    if (action === 'REJECT') {
      const reason = await showPrompt('Please enter the reason for rejecting this business idea:', {
        title: 'Reject Business Idea',
        severity: 'danger',
        confirmText: 'Confirm Rejection',
        placeholder: 'e.g., Duplicate proposal, lacks actionable commercial scope, or requires intellectual property verification...',
        required: true
      });
      if (!reason) return;
      rejectionReason = reason;
    } else if (action === 'REQUEST_INFO') {
      const notes = await showPrompt('Specify the additional details or clarifications required from the submitter:', {
        title: 'Request Additional Information',
        severity: 'warning',
        confirmText: 'Send Information Request',
        placeholder: 'e.g., Please provide your projected 12-month unit economics or target distribution partner criteria...',
        required: true
      });
      if (!notes) return;
      infoNotes = notes;
    } else if (action === 'APPROVE') {
      const confirmed = await showConfirm(
        `Are you sure you want to approve "${selectedIdea.title}"? Once approved, it can be published to the Universal Marketplace for network collaboration.`,
        {
          title: 'Approve Business Idea',
          severity: 'success',
          confirmText: 'Approve Idea'
        }
      );
      if (!confirmed) return;
    }

    setIsSubmittingReview(true);
    try {
      await apiFetch(`/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          action,
          adminNotes,
          rejectionReason,
          infoNotes
        })
      });

      await showAlert(
        action === 'APPROVE'
          ? 'Business idea approved successfully. You may now publish it to the Marketplace.'
          : action === 'REJECT'
          ? 'Business idea has been rejected and the submitter notified.'
          : action === 'REQUEST_INFO'
          ? 'Information request sent to submitter.'
          : 'Idea marked as Under Review.',
        { severity: 'success' }
      );

      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to update idea review status', { severity: 'danger' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Publish to Universal Marketplace
  const handlePublishToMarketplace = async () => {
    if (!selectedIdea) return;
    const confirmed = await showConfirm(
      `Publish "${selectedIdea.title}" to the Universal Marketplace? It will become discoverable to verified members across all sectors with submitter contact privacy protected.`,
      {
        title: 'Publish to Marketplace',
        severity: 'info',
        confirmText: 'Publish Now'
      }
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/publish`, {
        method: 'POST'
      });

      await showAlert('Business idea published to Universal Marketplace successfully!', { severity: 'success' });
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to publish idea to marketplace', { severity: 'danger' });
    }
  };

  // Schedule Consultation Meeting with Idea Submitter
  const handleScheduleRequesterMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea) return;
    setIsSubmittingMeeting(true);
    try {
      const res = await apiFetch(`/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/schedule-meeting`, {
        method: 'POST',
        body: JSON.stringify({
          date: meetingDate,
          time: meetingTime,
          durationMinutes: Number(meetingDuration) || 45,
          mode: meetingMode,
          linkOrLocation: meetingLink.trim(),
          notes: meetingNotes.trim()
        })
      });
      await showAlert(res?.message || 'Consultation meeting arranged successfully!', { severity: 'success' });
      setShowScheduleRequesterModal(false);
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to arrange consultation meeting', { severity: 'danger' });
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  // Complete Consultation Meeting and Automatically Publish to Marketplace
  const handleCompleteMeetingAndPublish = async () => {
    if (!selectedIdea) return;
    const confirmed = await showConfirm(
      'Are you sure the consultation meeting has been completed? This will mark the meeting completed and automatically publish the business idea to the Universal Marketplace so interested members can discover it.',
      {
        title: 'Complete Meeting & Publish to Marketplace',
        severity: 'success',
        confirmText: 'Complete & Publish'
      }
    );
    if (!confirmed) return;

    setIsSubmittingMeeting(true);
    try {
      const res = await apiFetch(`/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/complete-meeting-publish`, {
        method: 'POST',
        body: JSON.stringify({
          completionSummary: 'Consultation completed by FIC Admin. Validated and published for Universal Marketplace collaboration.'
        })
      });
      await showAlert(res?.message || 'Meeting marked completed & Business Idea is now LIVE on Marketplace!', { severity: 'success' });
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to complete meeting and publish', { severity: 'danger' });
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  // Schedule Collaboration Meeting with an Interested Member
  const handleScheduleInterestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea || !schedulingInterest) return;
    setIsSubmittingInterestMeeting(true);
    try {
      const res = await apiFetch(
        `/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/interests/${schedulingInterest._id}/schedule-meeting`,
        {
          method: 'POST',
          body: JSON.stringify({
            date: interestMeetingDate,
            time: interestMeetingTime,
            durationMinutes: Number(interestMeetingDuration) || 45,
            mode: interestMeetingMode,
            linkOrLocation: interestMeetingLink.trim(),
            notes: interestMeetingNotes.trim()
          })
        }
      );
      await showAlert(res?.message || `Collaboration meeting scheduled with ${schedulingInterest.interestedMemberName}!`, { severity: 'success' });
      setSchedulingInterest(null);
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to schedule collaboration meeting', { severity: 'danger' });
    } finally {
      setIsSubmittingInterestMeeting(false);
    }
  };

  // Conclude / Remove Business Idea
  const handleConcludeIdea = async () => {
    if (!selectedIdea) return;
    const confirmed = await showConfirm(
      'Are you sure you want to conclude and remove this business idea? It will be marked as COMPLETED and removed from the active Marketplace.',
      {
        title: 'Conclude & Remove Business Idea',
        severity: 'danger',
        confirmText: 'Remove Business Idea'
      }
    );
    if (!confirmed) return;

    setIsSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/conclude`, {
        method: 'POST',
        body: JSON.stringify({
          reason: adminNotes || 'Business idea concluded and completed by FIC Admin.'
        })
      });
      await showAlert(res?.message || 'Business idea marked as completed and removed from Marketplace.', { severity: 'success' });
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to conclude business idea', { severity: 'danger' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Enable Funding Inquiry Prompt
  const handleEnableFundingInquiry = async () => {
    if (!selectedIdea) return;
    try {
      await apiFetch(`/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/ask-funding`, {
        method: 'POST'
      });
      await showAlert('Funding inquiry prompt enabled. Submitter can now respond Yes/No on their dashboard.', {
        severity: 'success'
      });
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to enable funding inquiry', { severity: 'danger' });
    }
  };

  // Send Official Update Message to Submitter
  const handleSendSubmitterUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea || !updateMessage.trim()) return;

    setIsSendingUpdate(true);
    try {
      await apiFetch(`/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/update-submitter`, {
        method: 'POST',
        body: JSON.stringify({
          message: updateMessage.trim(),
          status: updateStatus
        })
      });

      await showAlert('Official update message sent to submitter. Status updated to ' + updateStatus, {
        severity: 'success'
      });
      setUpdateMessage('');
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to send update to submitter', { severity: 'danger' });
    } finally {
      setIsSendingUpdate(false);
    }
  };

  // Manage Interested Member Status (Shortlist, Select, Not Selected)
  const handleUpdateInterestStatus = async (
    interest: any,
    targetStatus: 'SHORTLISTED' | 'NOT_SELECTED'
  ) => {
    if (!selectedIdea) return;
    try {
      await apiFetch(
        `/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/interests/${interest._id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            reviewStatus: targetStatus,
            status: targetStatus
          })
        }
      );
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to update interested member status', { severity: 'danger' });
    }
  };

  // Submit Select Contributor with Reason
  const handleConfirmSelectContributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea || !selectingInterest) return;

    setIsSubmittingSelection(true);
    try {
      await apiFetch(
        `/api/admin/business-ideas/${selectedIdea._id || selectedIdea.ideaRequestId}/interests/${selectingInterest._id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            reviewStatus: 'SELECTED',
            status: 'SELECTED',
            selectionReason: selectionReason.trim(),
            adminNotes: selectionPrivateNotes.trim(),
            privateNotes: selectionPrivateNotes.trim()
          })
        }
      );

      await showAlert(
        `Selected ${selectingInterest.interestedMemberName} as collaborator! Next, send an official update to the idea submitter.`,
        { severity: 'success' }
      );

      // Pre-fill submitter update message with recommendation
      setUpdateMessage(
        `FIC has reviewed collaboration offers for your idea "${selectedIdea.title}" and selected ${selectingInterest.interestedMemberName} (${selectingInterest.interestedCategory || 'Partner Member'}) offering ${selectingInterest.contributionType}. Our coordinator will arrange an exploratory call.`
      );
      setUpdateStatus('MATCHED');

      setSelectingInterest(null);
      setSelectionReason('');
      setSelectionPrivateNotes('');
      loadIdeas(selectedIdea._id || selectedIdea.ideaRequestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to select contributor', { severity: 'danger' });
    } finally {
      setIsSubmittingSelection(false);
    }
  };

  // Helper for Status Badge Styling
  const getStatusBadge = (status: string, published: boolean) => {
    if (published || status === 'SHARED_ON_MARKETPLACE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Share2 className="w-3.5 h-3.5" />
          On Marketplace
        </span>
      );
    }

    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Submitted
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
      case 'INFORMATION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Info Requested
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'MATCHED':
      case 'COORDINATING_CALL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            {status === 'MATCHED' ? 'Matched' : 'Coordinating Call'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-[var(--text-primary)]">
            <Lightbulb className="w-7 h-7 text-indigo-400" />
            Business Ideas & Network Innovation
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Audit and review member business idea submissions, coordinate marketplace publishing, evaluate collaboration interests, and facilitate strategic connections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadIdeas(selectedIdea?._id)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-hover)] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Total Ideas Submitted
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Pending Admin Review
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Live on Marketplace
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.published}</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Matched Collaborations
          </div>
          <div className="text-2xl font-bold text-purple-400">{stats.matched}</div>
        </div>
      </div>

      {/* 3. Search and Status Tabs */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Idea ID, title, member, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 self-end sm:self-auto bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'ALL', label: 'All Ideas' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'INFORMATION_REQUESTED', label: 'Info Requested' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'SHARED_ON_MARKETPLACE', label: 'On Marketplace' },
            { id: 'MATCHED', label: 'Matched' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setSearchParams(tab.id === 'ALL' ? {} : { status: tab.id.toLowerCase() });
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Idea Listings Table or Grid */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-12 text-center space-y-3">
          <Lightbulb className="w-12 h-12 text-[var(--text-secondary)] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Business Ideas Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            No business ideas match the selected status filter or search query. Try clearing your filters.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* List / Table View */
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Idea ID</th>
                  <th className="py-3 px-4">Business Idea Title</th>
                  <th className="py-3 px-4">Submitter Profile</th>
                  <th className="py-3 px-4">Sector & Subcategory</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Responses</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredIdeas.map((idea) => (
                  <tr
                    key={idea._id}
                    className="hover:bg-[var(--bg-secondary)]/50 transition-colors group cursor-pointer"
                    onClick={() => fetchIdeaDetails(idea._id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {idea.ideaRequestId || idea.refNumber}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {idea.title}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                        {idea.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {idea.submitterName || 'FIC Member'}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {idea.submitterEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {idea.mainCategoryName?.split('&')[0]}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {idea.subcategoryName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[var(--text-secondary)]">
                      {idea.developmentStage}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(idea.status, idea.marketplacePublished)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Users className="w-3 h-3" />
                        {idea.interestedMembersCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchIdeaDetails(idea._id);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        Review
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <div
              key={idea._id}
              onClick={() => fetchIdeaDetails(idea._id)}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-indigo-500/50 rounded-2xl p-4 shadow-sm transition-all duration-200 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {idea.ideaRequestId || idea.refNumber}
                  </span>
                  {getStatusBadge(idea.status, idea.marketplacePublished)}
                </div>

                <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors mb-1 line-clamp-1">
                  {idea.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
                  {idea.description}
                </p>

                <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Category:</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[150px]">
                      {idea.mainCategoryName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Stage:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{idea.developmentStage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Submitter:</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[150px]">
                      {idea.submitterName}
                    </span>
                  </div>
                </div>

                {idea.supportRequirements && idea.supportRequirements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {idea.supportRequirements.slice(0, 3).map((req: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] flex items-center gap-1 font-semibold">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  {idea.interestedMembersCount || 0} Interested
                </span>
                <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Manage &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Comprehensive Idea Detail & Review Modal */}
      <AnimatePresence>
        {selectedIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Sticky Header */}
              <div className="p-4 sm:p-5 border-b border-indigo-500/20 flex items-center justify-between bg-gradient-to-r from-[#1A1646] via-[#1E1B4B] to-[#0F172A] text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {selectedIdea.ideaRequestId || selectedIdea.refNumber}
                      </span>
                      {getStatusBadge(selectedIdea.status, selectedIdea.marketplacePublished)}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                      {selectedIdea.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedIdea(null)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-white dark:bg-slate-900">
                {/* Section A: Submitter Profile & Contact Credentials */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    Submitter Credentials (FIC Verified)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Name</div>
                      <div className="font-bold text-[var(--text-primary)] text-sm">
                        {selectedIdea.submitterName || 'FIC Member'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Email Address</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedIdea.submitterEmail}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Phone Number</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedIdea.submitterPhone || 'Verified Contact'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Registered Category</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedIdea.mainCategoryName}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Registered Subcategory</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedIdea.subcategoryName}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">KYC Compliance</div>
                      <div className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        APPROVED MEMBER
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Idea Full Specifications */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                    Idea Specifications & Parameters
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] space-y-3">
                    <div>
                      <div className="text-[var(--text-secondary)] font-semibold mb-1">Detailed Description</div>
                      <div className="text-[var(--text-primary)] font-normal text-xs leading-relaxed whitespace-pre-line">
                        {selectedIdea.description}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-color)]">
                      <div>
                        <div className="text-[var(--text-secondary)] font-semibold">Development Stage</div>
                        <div className="font-bold text-[var(--text-primary)]">{selectedIdea.developmentStage}</div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)] font-semibold">Target Market</div>
                        <div className="font-bold text-[var(--text-primary)]">{selectedIdea.targetMarket || 'All India'}</div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)] font-semibold">Target Location</div>
                        <div className="font-bold text-[var(--text-primary)]">{selectedIdea.targetLocation || 'Pan-India'}</div>
                      </div>
                    </div>

                    {selectedIdea.supportRequirements && selectedIdea.supportRequirements.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-color)]">
                        <div className="text-[var(--text-secondary)] font-semibold mb-1.5">
                          Support Requirements Requested from Network:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedIdea.supportRequirements.map((req: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            >
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedIdea.customSupportRequirement && (
                      <div className="pt-2 border-t border-[var(--border-color)]">
                        <div className="text-[var(--text-secondary)] font-semibold mb-1">
                          Custom Support Specification:
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] font-mono text-[11px]">
                          {selectedIdea.customSupportRequirement}
                        </div>
                      </div>
                    )}

                    {selectedIdea.additionalMessage && (
                      <div className="pt-2 border-t border-[var(--border-color)]">
                        <div className="text-[var(--text-secondary)] font-semibold mb-1">
                          Submitter's Additional Notes to FIC:
                        </div>
                        <div className="italic text-[var(--text-primary)]">
                          "{selectedIdea.additionalMessage}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section C: Supporting Documents */}
                {selectedIdea.supportingDocuments && selectedIdea.supportingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      Supporting Documents ({selectedIdea.supportingDocuments.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedIdea.supportingDocuments.map((doc: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-[var(--text-primary)] truncate">{doc.name}</div>
                              <div className="text-[10px] text-[var(--text-secondary)]">{doc.fileType || 'Document'}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section D: Admin Review Actions & Internal Notes */}
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Admin Review & Platform Decisions
                  </div>

                  <div>
                    <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                      Internal Admin Notes (Private):
                    </label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add confidential evaluation notes, compliance checks, or review summary..."
                      className="w-full text-xs p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Consultation Meeting Scheduled / Completed Card */}
                  {selectedIdea.meetingDetails?.date && (
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                          <Calendar className="w-4 h-4" />
                          {selectedIdea.meetingDetails.isCompleted ? 'FIC Consultation Completed' : 'FIC Consultation Meeting Scheduled'}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {selectedIdea.meetingDetails.mode === 'IN_PERSON' ? 'In-Person Session' : 'Virtual Session'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--text-primary)]">
                        <div>
                          <span className="text-[var(--text-secondary)]">Date & Time: </span>
                          <strong>{selectedIdea.meetingDetails.date} at {selectedIdea.meetingDetails.time}</strong> ({selectedIdea.meetingDetails.durationMinutes || 45} mins)
                        </div>
                        {selectedIdea.meetingDetails.linkOrLocation && (
                          <div>
                            <span className="text-[var(--text-secondary)]">Access / Link: </span>
                            <a
                              href={selectedIdea.meetingDetails.linkOrLocation}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              Open Link <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      {selectedIdea.meetingDetails.notes && (
                        <p className="text-[11.5px] text-[var(--text-secondary)] bg-[var(--card-bg)] p-2.5 rounded-xl border border-[var(--border-color)]">
                          <strong className="text-[var(--text-primary)]">Meeting Agenda / Notes: </strong>
                          {selectedIdea.meetingDetails.notes}
                        </p>
                      )}

                      {/* Complete Meeting & Publish to Marketplace */}
                      {!selectedIdea.meetingDetails.isCompleted && (
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-500/20">
                          <span className="text-[11px] text-indigo-300">
                            Once consultation is done, complete meeting to automatically publish idea to Universal Marketplace:
                          </span>
                          <button
                            type="button"
                            onClick={handleCompleteMeetingAndPublish}
                            disabled={isSubmittingMeeting}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 ml-auto"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Complete Meeting & Publish to Marketplace
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Phase 7: State-Aware Action Buttons - Strict Status Validation */}
                  {(() => {
                    const st = (selectedIdea.status || selectedIdea.adminReviewStatus || '').toUpperCase();
                    const isCompleted = st === 'COMPLETED' || st === 'CLOSED';
                    const isApproved = st === 'APPROVED' || st === 'SHARED_ON_MARKETPLACE' || st === 'ON_MARKETPLACE' || Boolean(selectedIdea.marketplacePublished);
                    const isRejected = st === 'REJECTED';
                    const isUnderReview = st === 'UNDER_REVIEW';
                    const isMeetingScheduled = st === 'MEETING_SCHEDULED';
                    const isInfoRequested = st === 'INFORMATION_REQUESTED' || st === 'INFO_REQUESTED';
                    const isSubmitted = st === 'SUBMITTED' || st === 'PENDING' || !st;

                    if (isCompleted) {
                      return (
                        <div className="p-3.5 bg-slate-500/10 border border-slate-500/20 rounded-xl flex items-center justify-between text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              <strong>Business Idea Concluded & Completed</strong> &bull; Archived and removed from active marketplace.
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isApproved) {
                      return (
                        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-400">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              <strong>Idea Approved</strong> &bull; Validated for Universal Marketplace collaboration.
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            {!selectedIdea.marketplacePublished ? (
                              <button
                                onClick={handlePublishToMarketplace}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                Publish to Marketplace
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                                <Check className="w-3.5 h-3.5" />
                                Live on Marketplace
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowScheduleRequesterModal(true)}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {selectedIdea.meetingDetails?.date ? 'Reschedule Meeting' : 'Arrange Meeting'}
                            </button>
                            <button
                              type="button"
                              onClick={handleConcludeIdea}
                              disabled={isSubmittingReview}
                              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove Business Idea
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (isRejected) {
                      return (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-xs text-rose-400">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <strong>Business Idea Rejected</strong>
                          </div>
                          {selectedIdea.rejectionReason && (
                            <p className="text-[11.5px] text-rose-300 pl-6 leading-relaxed">
                              Feedback: "{selectedIdea.rejectionReason}"
                            </p>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* 7.1 Only show Mark Under Review if currently SUBMITTED */}
                        {isSubmitted && (
                          <button
                            onClick={() => handleReviewAction('UNDER_REVIEW')}
                            disabled={isSubmittingReview}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                            Mark Under Review
                          </button>
                        )}

                        {/* Arrange Consultation Meeting with Submitter */}
                        <button
                          type="button"
                          onClick={() => setShowScheduleRequesterModal(true)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {selectedIdea.meetingDetails?.date ? 'Reschedule Meeting' : 'Arrange Meeting'}
                        </button>

                        {/* Request Clarification (allowed in SUBMITTED or UNDER_REVIEW) */}
                        <button
                          onClick={() => handleReviewAction('REQUEST_INFO')}
                          disabled={isSubmittingReview}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Request Clarification
                        </button>

                        {/* Approve Idea */}
                        <button
                          onClick={() => handleReviewAction('APPROVE')}
                          disabled={isSubmittingReview}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Idea
                        </button>

                        {/* Reject Idea */}
                        <button
                          onClick={() => handleReviewAction('REJECT')}
                          disabled={isSubmittingReview}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Idea
                        </button>

                        {/* Remove Business Idea Button */}
                        <button
                          type="button"
                          onClick={handleConcludeIdea}
                          disabled={isSubmittingReview}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Business Idea
                        </button>

                        {isInfoRequested && (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            Awaiting member clarification
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Section E: Interested Members & Collaboration Responses */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Interested Members & Collaboration Responses ({selectedIdea.interestedMembers?.length || 0})
                    </div>
                  </div>

                  {!selectedIdea.interestedMembers || selectedIdea.interestedMembers.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] text-center text-[var(--text-secondary)]">
                      No members have expressed collaboration interest yet. Once published to the Universal Marketplace, interested members can submit offers here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedIdea.interestedMembers.map((interest: any) => (
                        <div
                          key={interest._id}
                          className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--text-primary)]">
                                  {interest.interestedMemberName}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {interest.contributionType}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)]">
                                {interest.interestedEmail} • {interest.interestedCategory || 'Member'}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  interest.status === 'SELECTED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : interest.status === 'SHORTLISTED'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                    : interest.status === 'NOT_SELECTED'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {interest.status || 'PENDING'}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-[var(--text-primary)] space-y-1 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-color)]">
                            <div>
                              <span className="font-semibold text-[var(--text-secondary)]">Why Interested: </span>
                              {interest.interestReason}
                            </div>
                            {interest.experience && (
                              <div>
                                <span className="font-semibold text-[var(--text-secondary)]">Relevant Experience: </span>
                                {interest.experience}
                              </div>
                            )}
                            {interest.additionalMessage && (
                              <div>
                                <span className="font-semibold text-[var(--text-secondary)]">Message: </span>
                                {interest.additionalMessage}
                              </div>
                            )}
                            {interest.selectionReason && (
                              <div className="pt-1 text-emerald-400 font-semibold border-t border-[var(--border-color)] mt-1">
                                <span>Selection Reason: </span>
                                {interest.selectionReason}
                              </div>
                            )}
                          </div>

                          {/* If meeting scheduled with this interested member */}
                          {interest.meetingDetails?.date && (
                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Collaboration Meeting: {interest.meetingDetails.date} at {interest.meetingDetails.time}</span>
                              </div>
                              {interest.meetingDetails.linkOrLocation && (
                                <a
                                  href={interest.meetingDetails.linkOrLocation}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-400 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                                >
                                  Meeting Link <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Action Buttons for this Interested Member */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSchedulingInterest(interest);
                                setInterestMeetingNotes(`Introductory collaboration meeting between ${selectedIdea.submitterName} and ${interest.interestedMemberName} regarding idea "${selectedIdea.title}"`);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {interest.meetingDetails?.date ? 'Reschedule Meeting' : 'Arrange Meeting'}
                            </button>

                            <button
                              onClick={() => handleUpdateInterestStatus(interest, 'SHORTLISTED')}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                            >
                              Shortlist
                            </button>

                            <button
                              onClick={() => handleUpdateInterestStatus(interest, 'NOT_SELECTED')}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                            >
                              Not Selected
                            </button>

                            <button
                              onClick={() => {
                                setSelectingInterest(interest);
                                setSelectionReason('');
                                setSelectionPrivateNotes('');
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Select Contributor
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section F: Update Idea Submitter Form */}
                <form
                  onSubmit={handleSendSubmitterUpdate}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3"
                >
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-4 h-4" />
                    Send Official Update to Submitter ({selectedIdea.submitterName})
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)]">
                    This message will be sent as an official in-app notification to the member and will appear on their Business Ideas dashboard.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-semibold block">Official Update Message:</label>
                    <textarea
                      rows={3}
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      placeholder="e.g., We have reviewed collaboration responses for your idea and matched you with a vetted manufacturing partner. Our team will schedule an introductory call..."
                      required
                      className="w-full text-xs p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)] font-semibold">Set Target Status:</span>
                      <select
                        value={updateStatus}
                        onChange={(e: any) => setUpdateStatus(e.target.value)}
                        className="text-xs p-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="MATCHED">MATCHED</option>
                        <option value="COORDINATING_CALL">COORDINATING_CALL</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingUpdate || !updateMessage.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Update & Notify Submitter
                    </button>
                  </div>
                </form>

                {/* Section G: Funding Requirement Inquiry Prompt */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      Funding Support Requirement
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {selectedIdea.fundingRequestRef || selectedIdea.fundingRequestId ? (
                        <span className="text-emerald-400 font-semibold">
                          Linked to Funding Application #{selectedIdea.fundingRequestRef || selectedIdea.fundingRequestId}
                        </span>
                      ) : selectedIdea.fundingRequired === true ? (
                        <span className="text-amber-400 font-semibold">
                          Submitter indicated funding is required (Application pending)
                        </span>
                      ) : selectedIdea.fundingRequired === false ? (
                        <span className="text-slate-400">
                          Submitter indicated funding is not required at this time
                        </span>
                      ) : (
                        <span>Prompt asking if funding support is needed has not been enabled yet.</span>
                      )}
                    </div>
                  </div>

                  {!selectedIdea.fundingAsked && !selectedIdea.fundingRequestId && (
                    <button
                      onClick={handleEnableFundingInquiry}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Enable Funding Inquiry Prompt
                    </button>
                  )}
                </div>

                {/* Section H: Activity & Audit Timeline */}
                {selectedIdea.activityTimeline && selectedIdea.activityTimeline.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Activity & Governance Timeline ({selectedIdea.activityTimeline.length})
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3">
                      {selectedIdea.activityTimeline.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[var(--text-primary)]">{item.action}</span>
                              <span className="text-[10px] text-[var(--text-secondary)]">
                                {new Date(item.timestamp).toLocaleString('en-GB')}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)]">
                              By {item.actorName || item.actorType}
                              {item.notes ? ` • "${item.notes}"` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Select Contributor Modal */}
      <AnimatePresence>
        {selectingInterest && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Select Collaboration Partner
                </h3>
                <button
                  onClick={() => setSelectingInterest(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-xs space-y-1">
                <div className="font-bold text-[var(--text-primary)]">
                  {selectingInterest.interestedMemberName}
                </div>
                <div className="text-[var(--text-secondary)]">
                  {selectingInterest.interestedCategory || 'Member'} • {selectingInterest.contributionType}
                </div>
              </div>

              <form onSubmit={handleConfirmSelectContributor} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-secondary)] block">
                    Selection Reason (will be shown in internal audit & update):
                  </label>
                  <textarea
                    rows={2}
                    value={selectionReason}
                    onChange={(e) => setSelectionReason(e.target.value)}
                    placeholder="e.g., Strongly aligned technical background, active capacity, and proven market connections..."
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-secondary)] block">
                    Private Coordination Notes (Admin only):
                  </label>
                  <input
                    type="text"
                    value={selectionPrivateNotes}
                    onChange={(e) => setSelectionPrivateNotes(e.target.value)}
                    placeholder="e.g., Contact person preferred on mornings..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectingInterest(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSelection || !selectionReason.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm Selection
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Schedule Consultation Meeting with Idea Submitter */}
        {showScheduleRequesterModal && selectedIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">
                      Arrange Meeting with Idea Submitter
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {selectedIdea.submitterName} ({selectedIdea.submitterEmail})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScheduleRequesterModal(false)}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleScheduleRequesterMeeting} className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-1">
                  <span className="font-bold text-sky-400 block">Consultation Coordination:</span>
                  <p className="text-[11px] text-sky-300 leading-relaxed">
                    Scheduling this consultation creates an official meeting entry in the Meetings Desk and sends an in-app notification to the idea submitter.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Date *</label>
                    <input
                      type="date"
                      required
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Time *</label>
                    <input
                      type="time"
                      required
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={meetingDuration}
                      onChange={(e) => setMeetingDuration(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Session Mode</label>
                    <select
                      value={meetingMode}
                      onChange={(e) => setMeetingMode(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="VIRTUAL">Virtual (Video Call)</option>
                      <option value="IN_PERSON">In-Person Office Meeting</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-secondary)] block">
                    {meetingMode === 'VIRTUAL' ? 'Meeting Link (Google Meet / Zoom) *' : 'Office Location Address *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder={meetingMode === 'VIRTUAL' ? 'https://meet.google.com/xyz...' : 'FIC Headquarters, Conference Hall A'}
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-secondary)] block">
                    Meeting Agenda / Confidential Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="e.g., Review unit economics, market viability, patent requirements, and team setup..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setShowScheduleRequesterModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMeeting || !meetingDate || !meetingTime || !meetingLink.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {isSubmittingMeeting ? 'Scheduling...' : 'Confirm & Schedule Call'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Schedule Collaboration Meeting with Interested Member */}
        {schedulingInterest && selectedIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">
                      Arrange Meeting with Interested Member
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {schedulingInterest.interestedMemberName} ({schedulingInterest.interestedEmail})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSchedulingInterest(null)}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleScheduleInterestMeeting} className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1">
                  <span className="font-bold text-purple-400 block">Tripartite Meeting Arrangement:</span>
                  <p className="text-[11px] text-purple-300 leading-relaxed">
                    This arranges a joint consultation between Idea Submitter ({selectedIdea.submitterName}), Interested Contributor ({schedulingInterest.interestedMemberName}), and FIC Admin.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Date *</label>
                    <input
                      type="date"
                      required
                      value={interestMeetingDate}
                      onChange={(e) => setInterestMeetingDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Time *</label>
                    <input
                      type="time"
                      required
                      value={interestMeetingTime}
                      onChange={(e) => setInterestMeetingTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={interestMeetingDuration}
                      onChange={(e) => setInterestMeetingDuration(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-secondary)] block">Session Mode</label>
                    <select
                      value={interestMeetingMode}
                      onChange={(e) => setInterestMeetingMode(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="VIRTUAL">Virtual (Video Call)</option>
                      <option value="IN_PERSON">In-Person Office Meeting</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-secondary)] block">
                    {interestMeetingMode === 'VIRTUAL' ? 'Meeting Link (Google Meet / Zoom) *' : 'Office Location Address *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={interestMeetingLink}
                    onChange={(e) => setInterestMeetingLink(e.target.value)}
                    placeholder={interestMeetingMode === 'VIRTUAL' ? 'https://meet.google.com/xyz...' : 'FIC Headquarters, Conference Hall A'}
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-secondary)] block">
                    Coordination Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={interestMeetingNotes}
                    onChange={(e) => setInterestMeetingNotes(e.target.value)}
                    placeholder="e.g., Joint collaboration discussion on manufacturing capability and commercial terms..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setSchedulingInterest(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInterestMeeting || !interestMeetingDate || !interestMeetingTime || !interestMeetingLink.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {isSubmittingInterestMeeting ? 'Scheduling...' : 'Confirm & Schedule Call'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* In-App Document Inspection / Preview Modal */}
        {viewingDocument && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/60 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
                      {viewingDocument.name || viewingDocument.fileName || 'Supporting Document'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span>{viewingDocument.fileType || 'Document'}</span>
                      {viewingDocument.fileSize && (
                        <span>&bull; {(viewingDocument.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingDocument(null)}
                    className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="p-5 flex-1 overflow-y-auto bg-[var(--card-bg)]">
                <AuthenticatedDocumentPreview
                  documentId={viewingDocument.documentId || viewingDocument.fileUrl?.match(/\/documents\/([A-Za-z0-9_-]+)/)?.[1]}
                  fileUrl={viewingDocument.fileUrl}
                  fileName={viewingDocument.name || viewingDocument.fileName}
                  originalMimeType={viewingDocument.fileType}
                  title={viewingDocument.name}
                  maxHeightClass="max-h-[68vh]"
                />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between gap-2 bg-[var(--bg-secondary)]/30 shrink-0">
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Confidential FIC Verification Asset &bull; Private Vault Protected
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDocument(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessIdeasManagementPage;
