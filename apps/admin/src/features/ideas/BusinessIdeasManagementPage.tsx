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
  UserCheck
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
                          {doc.fileUrl && doc.fileUrl !== '#' && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          )}
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

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handleReviewAction('UNDER_REVIEW')}
                      disabled={isSubmittingReview}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      Mark Under Review
                    </button>

                    <button
                      onClick={() => handleReviewAction('REQUEST_INFO')}
                      disabled={isSubmittingReview}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Request Clarification
                    </button>

                    <button
                      onClick={() => handleReviewAction('APPROVE')}
                      disabled={isSubmittingReview}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve Idea
                    </button>

                    <button
                      onClick={() => handleReviewAction('REJECT')}
                      disabled={isSubmittingReview}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Idea
                    </button>

                    {/* Publish to Marketplace Button (Available if Approved) */}
                    {(selectedIdea.status === 'APPROVED' || selectedIdea.adminReviewStatus === 'APPROVED') &&
                      !selectedIdea.marketplacePublished && (
                        <button
                          onClick={handlePublishToMarketplace}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 ml-auto"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Publish to Marketplace
                        </button>
                      )}

                    {selectedIdea.marketplacePublished && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 ml-auto">
                        <Check className="w-3.5 h-3.5" />
                        Live on Marketplace
                      </span>
                    )}
                  </div>
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

                          {/* Action Buttons for this Interested Member */}
                          <div className="flex items-center justify-end gap-2 pt-1">
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
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
      </AnimatePresence>
    </div>
  );
};

export default BusinessIdeasManagementPage;
