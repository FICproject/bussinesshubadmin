import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Video,
  MapPin,
  FileText,
  UserCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  Check,
  Send,
  AlertCircle,
  LayoutGrid,
  List,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { containerVariants, itemVariants } from '../../utils/animations';
import { SkeletonCards } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';

export const BusinessScalingManagementPage: React.FC = () => {
  const [scalingRequests, setScalingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get('status');
    return s ? s.toUpperCase() : 'ALL';
  });

  const [supportTypeFilter, setSupportTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Meeting Form State (Arrange / Reschedule)
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('11:00');
  const [meetingDuration, setMeetingDuration] = useState<number>(45);
  const [meetingMode, setMeetingMode] = useState<'VIRTUAL' | 'IN_PERSON'>('VIRTUAL');
  const [meetingLinkOrLocation, setMeetingLinkOrLocation] = useState<string>('');
  const [meetingNotes, setMeetingNotes] = useState<string>('');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState<boolean>(false);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);

  // Complete Meeting Form State
  const [completionSummary, setCompletionSummary] = useState<string>('');
  const [internalAdminNotes, setInternalAdminNotes] = useState<string>('');
  const [isCompletingMeeting, setIsCompletingMeeting] = useState<boolean>(false);

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
    loadScalingRequests();
  }, [statusFilter, supportTypeFilter]);

  const loadScalingRequests = async (keepSelectedId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (supportTypeFilter !== 'ALL') params.set('supportType', supportTypeFilter);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await apiFetch(`/api/admin/scaling${qs}`);
      const list = res?.items || (Array.isArray(res) ? res : []);
      setScalingRequests(list);

      if (keepSelectedId) {
        fetchRequestDetails(keepSelectedId);
      }
    } catch (err: any) {
      console.error('Failed to load scaling requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await apiFetch(`/api/admin/scaling/${id}`);
      setSelectedRequest(res);
      setInternalAdminNotes(res?.adminNotes || '');
      setCompletionSummary(res?.completionSummary || '');
      setIsRescheduling(false);

      if (res?.meetingDetails) {
        setMeetingDate(res.meetingDetails.date || '');
        setMeetingTime(res.meetingDetails.time || '11:00');
        setMeetingDuration(res.meetingDetails.durationMinutes || 45);
        setMeetingMode(res.meetingDetails.mode || 'VIRTUAL');
        setMeetingLinkOrLocation(res.meetingDetails.linkOrLocation || '');
        setMeetingNotes(res.meetingDetails.notes || '');
      } else {
        setMeetingDate('');
        setMeetingTime('11:00');
        setMeetingDuration(45);
        setMeetingMode('VIRTUAL');
        setMeetingLinkOrLocation('');
        setMeetingNotes('');
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to fetch scaling request details', { severity: 'danger' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return scalingRequests;
    const q = searchQuery.toLowerCase().trim();
    return scalingRequests.filter((item) => {
      const matchId = item.requestId?.toLowerCase().includes(q) || item.refNumber?.toLowerCase().includes(q);
      const matchBusiness = item.businessName?.toLowerCase().includes(q);
      const matchSubmitter = item.submitterName?.toLowerCase().includes(q);
      const matchEmail = item.submitterEmail?.toLowerCase().includes(q);
      const matchCategory = item.mainCategoryName?.toLowerCase().includes(q);
      const matchLocation = item.currentBusinessLocation?.toLowerCase().includes(q);
      return matchId || matchBusiness || matchSubmitter || matchEmail || matchCategory || matchLocation;
    });
  }, [scalingRequests, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = scalingRequests.length;
    const pending = scalingRequests.filter((i) => i.status === 'SUBMITTED').length;
    const underReview = scalingRequests.filter((i) => i.status === 'UNDER_REVIEW').length;
    const scheduled = scalingRequests.filter((i) => i.status === 'MEETING_SCHEDULED').length;
    const completed = scalingRequests.filter((i) => i.status === 'MEETING_COMPLETED').length;
    return { total, pending, underReview, scheduled, completed };
  }, [scalingRequests]);

  // Mark Request as Under Review
  const handleMarkUnderReview = async () => {
    if (!selectedRequest) return;
    try {
      await apiFetch(`/api/admin/scaling/${selectedRequest._id || selectedRequest.requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'UNDER_REVIEW',
          adminNotes: internalAdminNotes
        })
      });

      await showAlert('Request marked as Under Review and member has been notified.', { severity: 'success' });
      loadScalingRequests(selectedRequest._id || selectedRequest.requestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to update status', { severity: 'danger' });
    }
  };

  // Schedule or Reschedule Meeting
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!meetingDate || !meetingTime) {
      showAlert('Please enter both Meeting Date and Time.', { severity: 'warning' });
      return;
    }

    if (!meetingLinkOrLocation.trim()) {
      showAlert(
        meetingMode === 'VIRTUAL' ? 'Please enter a Google Meet / Zoom meeting link.' : 'Please enter the in-person meeting location.',
        { severity: 'warning' }
      );
      return;
    }

    setIsSubmittingMeeting(true);
    try {
      const endpoint = isRescheduling
        ? `/api/admin/scaling/${selectedRequest._id || selectedRequest.requestId}/reschedule-meeting`
        : `/api/admin/scaling/${selectedRequest._id || selectedRequest.requestId}/schedule-meeting`;

      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          date: meetingDate,
          time: meetingTime,
          durationMinutes: meetingDuration,
          mode: meetingMode,
          linkOrLocation: meetingLinkOrLocation.trim(),
          notes: meetingNotes.trim()
        })
      });

      await showAlert(
        isRescheduling ? 'Meeting rescheduled and member notified.' : 'Meeting arranged successfully and member notified!',
        { severity: 'success' }
      );

      setIsRescheduling(false);
      loadScalingRequests(selectedRequest._id || selectedRequest.requestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to schedule meeting', { severity: 'danger' });
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  // Cancel Meeting
  const handleCancelMeeting = async () => {
    if (!selectedRequest) return;

    const reason = await showPrompt('Please specify the cancellation reason (sent to member):', {
      title: 'Cancel Consultation Meeting',
      severity: 'warning',
      confirmText: 'Cancel Meeting',
      placeholder: 'e.g., Coordinator unavailable due to ecosystem summit. Re-coordinating date...',
      required: false
    });

    if (reason === null) return; // User cancelled prompt

    try {
      await apiFetch(`/api/admin/scaling/${selectedRequest._id || selectedRequest.requestId}/cancel-meeting`, {
        method: 'POST',
        body: JSON.stringify({ cancellationReason: reason })
      });

      await showAlert('Meeting cancelled. Scaling request reverted to Under Review.', { severity: 'info' });
      loadScalingRequests(selectedRequest._id || selectedRequest.requestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to cancel meeting', { severity: 'danger' });
    }
  };

  // Mark Meeting as Completed (Conclude Workflow)
  const handleCompleteMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const confirmed = await showConfirm(
      `Mark consultation for "${selectedRequest.businessName}" as Completed? This marks the final stage and concludes the Scaling Request workflow.`,
      {
        title: 'Complete Scaling Consultation',
        severity: 'success',
        confirmText: 'Mark as Completed'
      }
    );
    if (!confirmed) return;

    setIsCompletingMeeting(true);
    try {
      await apiFetch(`/api/admin/scaling/${selectedRequest._id || selectedRequest.requestId}/complete-meeting`, {
        method: 'POST',
        body: JSON.stringify({
          completionSummary: completionSummary.trim(),
          adminNotes: internalAdminNotes.trim()
        })
      });

      await showAlert('Scaling consultation marked as completed! The scaling advisory workflow is finished.', {
        severity: 'success'
      });
      loadScalingRequests(selectedRequest._id || selectedRequest.requestId);
    } catch (err: any) {
      showAlert(err.message || 'Failed to complete meeting', { severity: 'danger' });
    } finally {
      setIsCompletingMeeting(false);
    }
  };

  // Helper for Status Badge Styling
  const getStatusBadge = (status: string) => {
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
      case 'MEETING_SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Calendar className="w-3.5 h-3.5" />
            Meeting Scheduled
          </span>
        );
      case 'MEETING_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Meeting Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
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
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-[var(--text-primary)]">
            <TrendingUp className="w-7 h-7 text-indigo-400" />
            Business Scaling Requests & Advisory Desk
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Review member enterprise scaling requirements, coordinate exploratory strategic consultations, arrange meetings, and conclude scaling workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadScalingRequests(selectedRequest?._id)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-hover)] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Total Scaling Requests
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Pending Initial Review
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Meetings Scheduled
          </div>
          <div className="text-2xl font-bold text-purple-400">{stats.scheduled}</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Completed Consultations
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by business name, request ID, member, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Support Type Filter Dropdown & View Mode */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <select
              value={supportTypeFilter}
              onChange={(e) => setSupportTypeFilter(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Support Types</option>
              <option value="Business Growth & Expansion Support">Business Growth & Expansion</option>
              <option value="Marketing & Customer Acquisition Support">Marketing & Customer Acquisition</option>
              <option value="Funding Support">Funding Support</option>
              <option value="Mentorship & Expert Guidance Support">Mentorship & Expert Guidance</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
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
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'MEETING_SCHEDULED', label: 'Meeting Scheduled' },
            { id: 'MEETING_COMPLETED', label: 'Completed' },
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

      {/* 4. Requests List or Grid View */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredRequests.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-12 text-center space-y-3">
          <TrendingUp className="w-12 h-12 text-[var(--text-secondary)] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Scaling Requests Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            No scaling requests match the selected filters or search terms. Try clearing search or status filters.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* Table View */
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Category & Subcategory</th>
                  <th className="py-3 px-4">Scaling Support Type</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredRequests.map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-[var(--bg-secondary)]/50 transition-colors group cursor-pointer"
                    onClick={() => fetchRequestDetails(req._id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {req.requestId || req.refNumber}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {req.businessName}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                        {req.currentBusinessLocation}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {req.submitterName || 'Member'}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {req.submitterEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {req.mainCategoryName?.split('&')[0]}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {req.subcategoryName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {req.scalingSupportType || req.supportType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                      {new Date(req.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchRequestDetails(req._id);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        Inspect
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
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              onClick={() => fetchRequestDetails(req._id)}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-indigo-500/50 rounded-2xl p-4 shadow-sm transition-all duration-200 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {req.requestId || req.refNumber}
                  </span>
                  {getStatusBadge(req.status)}
                </div>

                <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors mb-1 line-clamp-1">
                  {req.businessName}
                </h3>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
                  {req.mainChallenge || req.currentChallenges}
                </p>

                <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Support:</span>
                    <span className="font-bold text-indigo-400 truncate max-w-[160px]">
                      {req.scalingSupportType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Category:</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[160px]">
                      {req.mainCategoryName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Submitter:</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[160px]">
                      {req.submitterName}
                    </span>
                  </div>
                </div>

                {req.meetingDetails && req.meetingDetails.date && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {req.meetingDetails.date} at {req.meetingDetails.time}
                    </span>
                    <span className="text-[10px] font-bold uppercase">{req.meetingDetails.mode}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">
                  {new Date(req.createdAt).toLocaleDateString('en-GB')}
                </span>
                <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Arrange Meeting &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Comprehensive Request Detail & Meeting Coordination Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Sticky Modal Header */}
              <div className="p-4 sm:p-5 border-b border-indigo-500/20 flex items-center justify-between bg-gradient-to-r from-[#1A1646] via-[#1E1B4B] to-[#0F172A] text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {selectedRequest.requestId || selectedRequest.refNumber}
                      </span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                      {selectedRequest.businessName}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-white dark:bg-slate-900">
                {/* Section A: Submitter Credentials */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    Submitter Credentials (FIC Verified Member)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Member Name</div>
                      <div className="font-bold text-[var(--text-primary)] text-sm">
                        {selectedRequest.submitterDetails?.name || selectedRequest.submitterName || 'FIC Member'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Email Address</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedRequest.submitterDetails?.email || selectedRequest.submitterEmail}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Contact Phone</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedRequest.submitterDetails?.phone || selectedRequest.submitterPhone || 'Verified Contact'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Registered Category</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedRequest.mainCategoryName}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">Subcategory</div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {selectedRequest.subcategoryName}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] font-medium">KYC Verification</div>
                      <div className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {selectedRequest.submitterDetails?.kycStatus || 'APPROVED'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Business Scaling Specifications */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                    Scaling Specifications & Business Requirements
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[var(--text-secondary)] font-semibold">Scaling Support Type</div>
                        <div className="font-bold text-indigo-400 text-sm">
                          {selectedRequest.scalingSupportType}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)] font-semibold">Current Business Stage</div>
                        <div className="font-bold text-[var(--text-primary)]">
                          {selectedRequest.currentBusinessStage}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)] font-semibold">Locations</div>
                        <div className="font-bold text-[var(--text-primary)]">
                          {selectedRequest.currentBusinessLocation}
                          {selectedRequest.targetExpansionLocation
                            ? ` → ${selectedRequest.targetExpansionLocation}`
                            : ''}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)]">
                      <div className="text-[var(--text-secondary)] font-semibold mb-1">
                        Main Challenge Facing Business:
                      </div>
                      <div className="text-[var(--text-primary)] leading-relaxed bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-color)]">
                        {selectedRequest.mainChallenge || selectedRequest.currentChallenges}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)]">
                      <div className="text-[var(--text-secondary)] font-semibold mb-1">
                        Required Support Area:
                      </div>
                      <div className="text-sm font-bold text-indigo-400">
                        {selectedRequest.supportRequired}
                      </div>
                      {selectedRequest.customSupportRequired && (
                        <div className="mt-1 p-2 rounded-lg bg-[var(--card-bg)] text-[var(--text-primary)] font-mono text-[11px]">
                          Specification: "{selectedRequest.customSupportRequired}"
                        </div>
                      )}
                    </div>

                    {selectedRequest.businessDescription && (
                      <div className="pt-2 border-t border-[var(--border-color)]">
                        <div className="text-[var(--text-secondary)] font-semibold mb-1">
                          Business Description:
                        </div>
                        <div className="text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                          {selectedRequest.businessDescription}
                        </div>
                      </div>
                    )}

                    {selectedRequest.additionalDetails && (
                      <div className="pt-2 border-t border-[var(--border-color)]">
                        <div className="text-[var(--text-secondary)] font-semibold mb-1">
                          Additional Details from Submitter:
                        </div>
                        <div className="italic text-[var(--text-primary)]">
                          "{selectedRequest.additionalDetails}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section C: Supporting Documents */}
                {selectedRequest.supportingDocuments && selectedRequest.supportingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      Uploaded Documents ({selectedRequest.supportingDocuments.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedRequest.supportingDocuments.map((doc: any, idx: number) => (
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

                {/* Section D: Admin Review & Under Review Action */}
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Admin Review & Notes
                    </div>

                    {selectedRequest.status === 'SUBMITTED' && (
                      <button
                        onClick={handleMarkUnderReview}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Mark Under Review
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                      Internal Administrative Notes (Private to Admin):
                    </label>
                    <textarea
                      rows={2}
                      value={internalAdminNotes}
                      onChange={(e) => setInternalAdminNotes(e.target.value)}
                      placeholder="Add private evaluation notes or coordinator instructions..."
                      className="w-full text-xs p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Section E: Meeting Scheduling Form or Scheduled Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Consultation Meeting Management
                    </div>

                    {selectedRequest.meetingDetails?.date && !isRescheduling && (
                      <div className="flex items-center gap-2">
                        {selectedRequest.status !== 'MEETING_COMPLETED' && (
                          <>
                            <button
                              onClick={() => setIsRescheduling(true)}
                              className="px-3 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={handleCancelMeeting}
                              className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer"
                            >
                              Cancel Meeting
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scheduled meeting box display */}
                  {selectedRequest.meetingDetails?.date && !isRescheduling ? (
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                          {selectedRequest.meetingDetails.mode === 'IN_PERSON' ? (
                            <MapPin className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Video className="w-4 h-4 text-purple-400" />
                          )}
                          {selectedRequest.meetingDetails.mode === 'IN_PERSON'
                            ? 'In-Person Consultation'
                            : 'Virtual Consultation'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-200">
                          {selectedRequest.meetingDetails.isCompleted ? 'COMPLETED' : 'SCHEDULED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 font-semibold text-[var(--text-primary)]">
                        <div>
                          <span className="text-[var(--text-secondary)] font-normal">Date & Time: </span>
                          {selectedRequest.meetingDetails.date} at {selectedRequest.meetingDetails.time} (
                          {selectedRequest.meetingDetails.durationMinutes || 45} mins)
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] font-normal">
                            {selectedRequest.meetingDetails.mode === 'IN_PERSON' ? 'Location: ' : 'Link: '}
                          </span>
                          {selectedRequest.meetingDetails.mode === 'VIRTUAL' ? (
                            <a
                              href={
                                selectedRequest.meetingDetails.linkOrLocation?.startsWith('http')
                                  ? selectedRequest.meetingDetails.linkOrLocation
                                  : `https://${selectedRequest.meetingDetails.linkOrLocation}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 underline hover:text-indigo-300 inline-flex items-center gap-1"
                            >
                              {selectedRequest.meetingDetails.linkOrLocation}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span>{selectedRequest.meetingDetails.linkOrLocation}</span>
                          )}
                        </div>
                      </div>

                      {selectedRequest.meetingDetails.notes && (
                        <div className="text-[11px] text-[var(--text-secondary)] italic border-t border-purple-500/20 pt-1.5">
                          Notes: "{selectedRequest.meetingDetails.notes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Arrange / Reschedule Meeting Form */
                    <form onSubmit={handleScheduleMeeting} className="space-y-3.5">
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {isRescheduling
                          ? 'Select new timing or location parameters to reschedule this consultation. The member will be notified immediately.'
                          : 'Arrange an advisory meeting with the member to diagnose scaling challenges and provide strategic guidance.'}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[var(--text-secondary)] font-semibold block">Meeting Date *</label>
                          <input
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            required
                            className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[var(--text-secondary)] font-semibold block">Meeting Time *</label>
                          <input
                            type="time"
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            required
                            className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[var(--text-secondary)] font-semibold block">Duration</label>
                          <select
                            value={meetingDuration}
                            onChange={(e) => setMeetingDuration(Number(e.target.value))}
                            className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value={30}>30 Minutes</option>
                            <option value={45}>45 Minutes</option>
                            <option value={60}>60 Minutes</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[var(--text-secondary)] font-semibold block">Meeting Mode *</label>
                          <select
                            value={meetingMode}
                            onChange={(e: any) => setMeetingMode(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="VIRTUAL">Virtual (Online Video Call)</option>
                            <option value="IN_PERSON">In-Person (Hub / Office Venue)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[var(--text-secondary)] font-semibold block">
                            {meetingMode === 'VIRTUAL' ? 'Meeting Link (Google Meet / Zoom) *' : 'In-Person Venue Address *'}
                          </label>
                          <input
                            type="text"
                            placeholder={
                              meetingMode === 'VIRTUAL'
                                ? 'https://meet.google.com/xyz-abcd-efg'
                                : 'FIC Coimbatore Regional Hub, Floor 4...'
                            }
                            value={meetingLinkOrLocation}
                            onChange={(e) => setMeetingLinkOrLocation(e.target.value)}
                            required
                            className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[var(--text-secondary)] font-semibold block">
                          Meeting Agenda & Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Diagnostic review of distributor channel onboarding and working capital..."
                          value={meetingNotes}
                          onChange={(e) => setMeetingNotes(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isRescheduling && (
                          <button
                            type="button"
                            onClick={() => setIsRescheduling(false)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] cursor-pointer"
                          >
                            Cancel Edit
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmittingMeeting}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {isRescheduling ? 'Confirm Reschedule' : 'Arrange Meeting & Notify Member'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Section F: Complete Meeting (Final Stage) */}
                {selectedRequest.status !== 'SUBMITTED' && (
                  <form
                    onSubmit={handleCompleteMeeting}
                    className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Conclude Workflow: Mark Meeting as Completed
                      </div>

                      {selectedRequest.status === 'MEETING_COMPLETED' && (
                        <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Workflow Finished
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)]">
                      After attending the consultation meeting with the member, mark the meeting as completed. This is the final stage of the scaling request workflow.
                    </p>

                    <div className="space-y-1">
                      <label className="text-[var(--text-secondary)] font-semibold block">
                        Meeting Summary & Outcomes (Shared with member):
                      </label>
                      <textarea
                        rows={2}
                        value={completionSummary}
                        onChange={(e) => setCompletionSummary(e.target.value)}
                        placeholder="e.g. Completed initial scaling diagnosis. Recommended regional distributor partnerships. Scaling workflow concluded..."
                        className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {selectedRequest.status !== 'MEETING_COMPLETED' && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isCompletingMeeting}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Meeting as Completed
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* Section G: Activity & Governance Timeline */}
                {selectedRequest.activityTimeline && selectedRequest.activityTimeline.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Activity & Governance Timeline ({selectedRequest.activityTimeline.length})
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3">
                      {selectedRequest.activityTimeline.map((item: any, idx: number) => (
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
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessScalingManagementPage;

