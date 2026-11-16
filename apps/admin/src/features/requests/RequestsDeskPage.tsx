import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GitPullRequest,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  Video,
  XCircle,
  Building,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  LayoutGrid,
  List,
  X,
  ArrowRight,
  Check,
  Briefcase,
  Lock,
  MapPin,
  RefreshCw,
  FileText,
  DollarSign
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { SkeletonCards } from '../../components/Skeleton';

export const RequestsDeskPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get('status');
    return s ? s.toUpperCase() : 'ALL';
  });

  // Action states
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [selectedMeetingParticipant, setSelectedMeetingParticipant] = useState<'PROVIDER' | 'REQUESTER'>('PROVIDER');

  // Stage 1 Meeting form
  const [stage1Date, setStage1Date] = useState('');
  const [stage1Time, setStage1Time] = useState('11:00');
  const [stage1Duration, setStage1Duration] = useState('45');
  const [stage1Mode, setStage1Mode] = useState<'GOOGLE_MEET' | 'IN_PERSON'>('GOOGLE_MEET');
  const [stage1LinkOrLocation, setStage1LinkOrLocation] = useState('');
  const [stage1Notes, setStage1Notes] = useState('');

  // Stage 2 Meeting form
  const [stage2Date, setStage2Date] = useState('');
  const [stage2Time, setStage2Time] = useState('11:00');
  const [stage2Duration, setStage2Duration] = useState('45');
  const [stage2Mode, setStage2Mode] = useState<'GOOGLE_MEET' | 'IN_PERSON'>('GOOGLE_MEET');
  const [stage2LinkOrLocation, setStage2LinkOrLocation] = useState('');
  const [stage2Notes, setStage2Notes] = useState('');

  // Internal admin note input
  const [internalNoteInput, setInternalNoteInput] = useState('');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && s.toUpperCase() !== statusFilter) {
      setStatusFilter(s.toUpperCase());
    } else if (!s && statusFilter !== 'ALL') {
      setStatusFilter('ALL');
    }
  }, [searchParams]);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async (keepSelectedId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`/api/admin/requests${qs}`);
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
      const targetId = keepSelectedId || selectedReq?._id;
      if (targetId) {
        const updated = list.find((r: any) => r._id === targetId || r.requestId === targetId);
        setSelectedReq(updated || null);
      }
    } catch (err) {
      console.error('Failed to load service requests', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessBanner = (msg: string) => {
    setActionSuccessMsg(msg);
    setActionErrorMsg('');
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  const showErrorBanner = (msg: string) => {
    setActionErrorMsg(msg);
    setActionSuccessMsg('');
    setTimeout(() => setActionErrorMsg(''), 6000);
  };

  // Helper when opening modal to initialize meeting fields
  const handleSelectRequest = (reqItem: any) => {
    setSelectedReq(reqItem);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    setInternalNoteInput('');

    if (reqItem.stage1Meeting?.status === 'COMPLETED' && reqItem.stage2Meeting?.status !== 'COMPLETED') {
      setSelectedMeetingParticipant('REQUESTER');
    } else {
      setSelectedMeetingParticipant('PROVIDER');
    }

    // Pre-fill Stage 1
    if (reqItem.stage1Meeting) {
      setStage1Date(reqItem.stage1Meeting.scheduledDate || '');
      setStage1Time(reqItem.stage1Meeting.scheduledTime || '11:00');
      setStage1Duration(String(reqItem.stage1Meeting.durationMinutes || 45));
      setStage1Mode(reqItem.stage1Meeting.meetingMode || 'GOOGLE_MEET');
      setStage1LinkOrLocation(reqItem.stage1Meeting.meetingLink || reqItem.stage1Meeting.location || '');
      setStage1Notes(reqItem.stage1Meeting.notes || '');
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStage1Date(tomorrow.toISOString().split('T')[0]);
      setStage1Time('11:00');
      setStage1Duration('45');
      setStage1Mode('GOOGLE_MEET');
      setStage1LinkOrLocation(`https://meet.google.com/fic-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`);
      setStage1Notes('');
    }

    // Pre-fill Stage 2
    if (reqItem.stage2Meeting) {
      setStage2Date(reqItem.stage2Meeting.scheduledDate || '');
      setStage2Time(reqItem.stage2Meeting.scheduledTime || '11:00');
      setStage2Duration(String(reqItem.stage2Meeting.durationMinutes || 45));
      setStage2Mode(reqItem.stage2Meeting.meetingMode || 'GOOGLE_MEET');
      setStage2LinkOrLocation(reqItem.stage2Meeting.meetingLink || reqItem.stage2Meeting.location || '');
      setStage2Notes(reqItem.stage2Meeting.notes || '');
    } else {
      const afterTomorrow = new Date();
      afterTomorrow.setDate(afterTomorrow.getDate() + 2);
      setStage2Date(afterTomorrow.toISOString().split('T')[0]);
      setStage2Time('11:00');
      setStage2Duration('45');
      setStage2Mode('GOOGLE_MEET');
      setStage2LinkOrLocation(`https://meet.google.com/fic-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`);
      setStage2Notes('');
    }
  };

  // Phase 3 Action: Send Project Information to Provider
  const handleSendToProvider = async () => {
    if (!selectedReq) return;
    setIsUpdating(true);
    setActionErrorMsg('');
    try {
      const targetId = selectedReq._id || selectedReq.requestId;
      const res = await apiFetch(`/api/admin/requests/${targetId}/send-to-provider`, {
        method: 'POST',
        body: JSON.stringify({ customMessage: 'Project specifications reviewed and dispatched by FIC Admin.' })
      });
      if (res?.success) {
        showSuccessBanner(res.message || 'Project information sent to provider! Status updated to SENT_TO_PROVIDER.');
        await loadRequests(targetId);
      } else {
        throw new Error(res?.error || 'Failed to dispatch project brief to provider');
      }
    } catch (err: any) {
      showErrorBanner(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Phase 5 Action: Schedule Stage 1 (Admin & Provider Meeting)
  const handleScheduleStage1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    if (!stage1Date || !stage1Time) {
      showErrorBanner('Please select meeting date and time.');
      return;
    }
    if (stage1Mode === 'IN_PERSON' && !stage1LinkOrLocation.trim()) {
      showErrorBanner('Please enter an In-Person meeting location or address.');
      return;
    }

    setIsUpdating(true);
    setActionErrorMsg('');
    try {
      const targetId = selectedReq._id || selectedReq.requestId;
      const res = await apiFetch(`/api/admin/requests/${targetId}/schedule-stage1-meeting`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledDate: stage1Date,
          scheduledTime: stage1Time,
          durationMinutes: Number(stage1Duration) || 45,
          meetingMode: stage1Mode,
          meetingLink: stage1Mode === 'GOOGLE_MEET' ? stage1LinkOrLocation.trim() : undefined,
          location: stage1Mode === 'IN_PERSON' ? stage1LinkOrLocation.trim() : undefined,
          notes: stage1Notes.trim()
        })
      });
      if (res?.success) {
        showSuccessBanner(res.message || 'Stage 1 Admin & Provider meeting scheduled successfully!');
        await loadRequests(targetId);
      } else {
        throw new Error(res?.error || 'Failed to schedule Stage 1 meeting');
      }
    } catch (err: any) {
      showErrorBanner(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Phase 5 Action: Mark Stage 1 Meeting Completed
  const handleCompleteStage1 = async () => {
    if (!selectedReq) return;
    if (!window.confirm('Confirm marking Stage 1 (Admin & Provider Meeting) as COMPLETED? This will unlock Stage 2 with the original service requestor.')) {
      return;
    }

    setIsUpdating(true);
    setActionErrorMsg('');
    try {
      const targetId = selectedReq._id || selectedReq.requestId;
      const res = await apiFetch(`/api/admin/requests/${targetId}/complete-stage1-meeting`, {
        method: 'POST',
        body: JSON.stringify({ completionNotes: 'Stage 1 consultation concluded. Provider aligned with project scope.' })
      });
      if (res?.success) {
        showSuccessBanner(res.message || 'Stage 1 meeting marked COMPLETED! Stage 2 is now unlocked.');
        setSelectedMeetingParticipant('REQUESTER');
        await loadRequests(targetId);
      } else {
        throw new Error(res?.error || 'Failed to complete Stage 1 meeting');
      }
    } catch (err: any) {
      showErrorBanner(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Phase 5 Action: Schedule Stage 2 (Admin & Requestor Meeting)
  const handleScheduleStage2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    if (!stage2Date || !stage2Time) {
      showErrorBanner('Please select meeting date and time.');
      return;
    }
    if (stage2Mode === 'IN_PERSON' && !stage2LinkOrLocation.trim()) {
      showErrorBanner('Please enter an In-Person meeting location or address.');
      return;
    }

    setIsUpdating(true);
    setActionErrorMsg('');
    try {
      const targetId = selectedReq._id || selectedReq.requestId;
      const res = await apiFetch(`/api/admin/requests/${targetId}/schedule-stage2-meeting`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledDate: stage2Date,
          scheduledTime: stage2Time,
          durationMinutes: Number(stage2Duration) || 45,
          meetingMode: stage2Mode,
          meetingLink: stage2Mode === 'GOOGLE_MEET' ? stage2LinkOrLocation.trim() : undefined,
          location: stage2Mode === 'IN_PERSON' ? stage2LinkOrLocation.trim() : undefined,
          notes: stage2Notes.trim()
        })
      });
      if (res?.success) {
        showSuccessBanner(res.message || 'Stage 2 Admin & Requestor meeting scheduled successfully!');
        await loadRequests(targetId);
      } else {
        throw new Error(res?.error || 'Failed to schedule Stage 2 meeting');
      }
    } catch (err: any) {
      showErrorBanner(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Phase 5 Action: Mark Stage 2 Meeting Completed & Close Request
  const handleCompleteStage2 = async () => {
    if (!selectedReq) return;
    if (!window.confirm('Confirm marking Stage 2 meeting as COMPLETED? This will close the entire Service Request workflow and mark it COMPLETED.')) {
      return;
    }

    setIsUpdating(true);
    setActionErrorMsg('');
    try {
      const targetId = selectedReq._id || selectedReq.requestId;
      const res = await apiFetch(`/api/admin/requests/${targetId}/complete-stage2-meeting`, {
        method: 'POST',
        body: JSON.stringify({ completionNotes: 'Stage 2 debrief completed with client. Service request fulfilled.' })
      });
      if (res?.success) {
        showSuccessBanner(res.message || 'Service request workflow concluded and marked COMPLETED!');
        await loadRequests(targetId);
      } else {
        throw new Error(res?.error || 'Failed to complete Stage 2 meeting');
      }
    } catch (err: any) {
      showErrorBanner(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Add Internal Admin Note
  const handleAddInternalNote = async () => {
    if (!selectedReq || !internalNoteInput.trim()) return;
    setIsUpdating(true);
    try {
      const targetId = selectedReq._id || selectedReq.requestId;
      const res = await apiFetch(`/api/admin/requests/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: internalNoteInput.trim() })
      });
      if (res?.success) {
        showSuccessBanner('Note saved to request audit log.');
        setInternalNoteInput('');
        await loadRequests(targetId);
      }
    } catch (err: any) {
      showErrorBanner(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    let list = requests;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) =>
        r.title?.toLowerCase().includes(q) ||
        r.requestId?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.requesterName?.toLowerCase().includes(q) ||
        r.requesterEmail?.toLowerCase().includes(q) ||
        (r.targetProviderId as any)?.name?.toLowerCase().includes(q) ||
        (r.targetServiceId as any)?.title?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, searchQuery]);

  // Counts for pills
  const counts = useMemo(() => {
    const res: Record<string, number> = { ALL: requests.length };
    requests.forEach((r) => {
      const st = r.status || 'SUBMITTED';
      res[st] = (res[st] || 0) + 1;
    });
    return res;
  }, [requests]);

  // Helper for status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'NEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Submitted
          </span>
        );
      case 'SENT_TO_PROVIDER':
      case 'AWAITING_PROVIDER_RESPONSE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Sent to Provider
          </span>
        );
      case 'PROVIDER_ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            Provider Accepted
          </span>
        );
      case 'PROVIDER_REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Provider Declined
          </span>
        );
      case 'ADMIN_PROVIDER_MEETING_SCHEDULED':
      case 'MEETING_CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Stage 1 Call Scheduled
          </span>
        );
      case 'ADMIN_PROVIDER_MEETING_COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Stage 1 Completed
          </span>
        );
      case 'ADMIN_REQUESTOR_MEETING_SCHEDULED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Stage 2 Call Scheduled
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Completed
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Context */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>Service Requests</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                  {requests.length} Requests
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage member service inquiries, review client specifications, coordinate with identified service providers, and host 2-stage introductory consultations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadRequests()}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Global Feedback Banner */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}
      {actionErrorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search request ID, service title, member, provider..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'SUBMITTED', label: 'New Submitted' },
            { id: 'SENT_TO_PROVIDER', label: 'Sent to Provider' },
            { id: 'PROVIDER_ACCEPTED', label: 'Provider Accepted' },
            { id: 'ADMIN_PROVIDER_MEETING_SCHEDULED', label: 'Stage 1 Meeting' },
            { id: 'ADMIN_REQUESTOR_MEETING_SCHEDULED', label: 'Stage 2 Meeting' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'PROVIDER_REJECTED', label: 'Provider Declined' },
          ].map((pill) => {
            const count = counts[pill.id] || 0;
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setStatusFilter(pill.id);
                  setSearchParams(pill.id === 'ALL' ? {} : { status: pill.id });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{pill.label}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Requests List / Table */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Service Requests Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No requests matched your search term.'
              : 'There are no service inquiries in this filter state.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Requested Service</th>
                  <th className="py-3 px-4">Requestor (Client)</th>
                  <th className="py-3 px-4">Assigned Service Provider</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredRequests.map((req) => {
                  const sListing = req.targetServiceId;
                  const pMember = req.targetProviderId;
                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {req.requestId || `SR-${req._id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                          {sListing?.title || req.title}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sListing?.categoryName || req.requesterCategory || 'Marketplace'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {req.requesterName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          <span>Confidential Client</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {pMember?.name || sListing?.providerName || 'Identified Provider'}
                        </div>
                        <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Auto-bound Listing Owner
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {renderStatusBadge(req.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : 'Recently'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectRequest(req)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer text-[11px] inline-flex items-center gap-1"
                        >
                          <span>Inspect & Coordinate</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const sListing = req.targetServiceId;
            const pMember = req.targetProviderId;
            return (
              <div
                key={req._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {req.requestId || `SR-${req._id.slice(-6).toUpperCase()}`}
                    </span>
                    {renderStatusBadge(req.status)}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {sListing?.title || req.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {sListing?.categoryName || 'Marketplace Service'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {req.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Client:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{req.requesterName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Service Provider:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {pMember?.name || sListing?.providerName || 'Identified Provider'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : 'Recently'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectRequest(req)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-2xs text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Service Request Inspection & 2-Stage Coordination Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-[#1A1646] via-[#1E1B4B] to-[#0F172A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-white border border-white/20">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base tracking-tight text-white">
                      {selectedReq.title || (selectedReq.targetServiceId as any)?.title || 'Service Request Coordination'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white font-bold">
                      {selectedReq.requestId || `SR-${selectedReq._id.slice(-6).toUpperCase()}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-200">
                    FIC Intermediary Coordination &bull; Two-Stage Consultation Governance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {renderStatusBadge(selectedReq.status)}
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Feedback messages inside modal */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}
              {actionErrorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionErrorMsg}</span>
                </div>
              )}

              {/* 3-Part Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Original Service Requestor (Client) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                    1. Original Requestor (Client)
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{selectedReq.requesterName}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {selectedReq.requesterEmail}
                    </p>
                    <div className="pt-1 flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Private Client (Hidden from Provider)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Selected Marketplace Service */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                    2. Selected Service
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{(selectedReq.targetServiceId as any)?.title || selectedReq.title}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {(selectedReq.targetServiceId as any)?.categoryName || 'Marketplace Capability'}
                    </p>
                    {(selectedReq.targetServiceId as any)?.pricingEstimate && (
                      <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-mono block">
                        Estimate: {(selectedReq.targetServiceId as any)?.pricingEstimate}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Automatically Identified Service Provider (Phase 3) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                    3. Service Provider (Auto-Identified)
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {(selectedReq.targetProviderId as any)?.name ||
                          (selectedReq.targetServiceId as any)?.providerName ||
                          'Listing Owner'}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {(selectedReq.targetProviderId as any)?.primaryCategoryName ||
                        (selectedReq.targetServiceId as any)?.categoryName ||
                        'Verified Provider'}
                    </p>
                    <div className="pt-1 flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Bound to Service Listing Owner</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Requirements & Scope */}
              <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Project / Requirement Specifications</span>
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {selectedReq.description || selectedReq.projectRequirements || 'No additional requirements provided.'}
                </p>
              </div>

              {/* ========================================================
                  PHASE 3 & 4: PROVIDER RESPONSE & DISPATCH WORKFLOW
                 ======================================================== */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Step 1: Provider Coordination & Decision</span>
                      {selectedReq.providerDecision === 'ACCEPTED' || selectedReq.status === 'PROVIDER_ACCEPTED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 font-bold">
                          Accepted by Provider
                        </span>
                      ) : selectedReq.providerDecision === 'REJECTED' || selectedReq.status === 'PROVIDER_REJECTED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 font-bold">
                          Declined by Provider
                        </span>
                      ) : selectedReq.status === 'SENT_TO_PROVIDER' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 font-bold">
                          Awaiting Provider Response
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 font-bold">
                          Ready to Send
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      The service listing owner evaluates project requirements from their Member Website.
                    </p>
                  </div>

                  {/* Dispatch Action - Phase 6: Strictly hidden if provider already decided */}
                  {(() => {
                    const hasProviderDecided = Boolean(
                      selectedReq.providerDecision === 'ACCEPTED' ||
                      selectedReq.providerDecision === 'REJECTED' ||
                      selectedReq.status === 'PROVIDER_ACCEPTED' ||
                      selectedReq.status === 'PROVIDER_REJECTED' ||
                      selectedReq.stage1Meeting?.status ||
                      selectedReq.stage2Meeting?.status
                    );

                    if (hasProviderDecided) {
                      return null; // Never display send or re-send buttons once provider decided
                    }

                    if (selectedReq.status === 'SUBMITTED' || selectedReq.status === 'NEW' || selectedReq.status === 'UNDER_ADMIN_REVIEW') {
                      return (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={handleSendToProvider}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Project Information to Provider</span>
                        </button>
                      );
                    }

                    if (selectedReq.status === 'SENT_TO_PROVIDER') {
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                            Brief Sent &bull; Awaiting Reply
                          </span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={handleSendToProvider}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold hover:bg-slate-300 transition-colors"
                            title="Re-send project brief notification"
                          >
                            Re-send Brief
                          </button>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>

                {/* Provider Outcome Banner */}
                {selectedReq.providerDecision === 'ACCEPTED' || selectedReq.status === 'PROVIDER_ACCEPTED' ? (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Accepted by Provider: {selectedReq.providerName || 'Provider'}</strong> &bull; Decision: ACCEPTED. Proceed to Stage 1 Meeting scheduling below.
                      </span>
                    </div>
                    {selectedReq.providerRespondedAt && (
                      <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400">
                        {new Date(selectedReq.providerRespondedAt).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                ) : selectedReq.providerDecision === 'REJECTED' || selectedReq.status === 'PROVIDER_REJECTED' ? (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1 text-xs text-rose-800 dark:text-rose-200">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <strong>Provider Declined This Project</strong>
                    </div>
                    <p className="text-[11.5px] text-rose-700 dark:text-rose-300 pl-6">
                      Reason: "{selectedReq.providerRejectionReason || 'Provider is currently at capacity or unable to fulfill specifications.'}"
                    </p>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                    Once project information is sent, the provider will review scope and click Accept or Decline in their Member Dashboard.
                  </p>
                )}
              </div>

              {/* ========================================================
                  PHASE 3 & 5: TWO-STAGE BOOK INTRODUCTION CALL
                 ======================================================== */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                      3. BOOK INTRODUCTION CALL
                    </h4>
                  </div>

                  {/* Participant Selection Dropdown */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="meeting-participant-select" className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      Schedule Meeting With:
                    </label>
                    <select
                      id="meeting-participant-select"
                      value={selectedMeetingParticipant}
                      onChange={(e) => setSelectedMeetingParticipant(e.target.value as any)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="PROVIDER">
                        1. Service Provider (Stage 1) - {selectedReq.providerName || 'Provider'}
                      </option>
                      <option
                        value="REQUESTER"
                        disabled={selectedReq.stage1Meeting?.status !== 'COMPLETED'}
                      >
                        2. Original Service Requestor (Stage 2) - {selectedReq.requesterName || 'Client'}{selectedReq.stage1Meeting?.status !== 'COMPLETED' ? ' (Locked - Complete Stage 1 First)' : ''}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Quick Stage Tabs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMeetingParticipant('PROVIDER')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedMeetingParticipant === 'PROVIDER'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">1</span>
                    <span>Stage 1: Service Provider ({selectedReq.providerName || 'Provider'})</span>
                    {selectedReq.stage1Meeting?.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-1" />
                    ) : selectedReq.stage1Meeting?.status === 'SCHEDULED' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-300 ml-1" />
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMeetingParticipant('REQUESTER')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedMeetingParticipant === 'REQUESTER'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">2</span>
                    <span>Stage 2: Original Requestor ({selectedReq.requesterName || 'Client'})</span>
                    {selectedReq.stage1Meeting?.status !== 'COMPLETED' ? (
                      <Lock className="w-3 h-3 text-slate-400 ml-1" />
                    ) : selectedReq.stage2Meeting?.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-1" />
                    ) : selectedReq.stage2Meeting?.status === 'SCHEDULED' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-300 ml-1" />
                    ) : null}
                  </button>
                </div>

                {/* STAGE 1 VIEW */}
                {selectedMeetingParticipant === 'PROVIDER' && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                            1
                          </span>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Stage 1: Admin & Service Provider Alignment Meeting
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-8">
                          <strong>Participants:</strong> FIC Admin + Service Provider only ({selectedReq.providerName || 'Provider'}). Original client is excluded from this stage.
                        </p>
                      </div>

                      {selectedReq.stage1Meeting?.status === 'COMPLETED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Stage 1 Completed</span>
                        </span>
                      ) : selectedReq.stage1Meeting?.status === 'SCHEDULED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Call Scheduled</span>
                        </span>
                      ) : selectedReq.providerDecision === 'ACCEPTED' || selectedReq.status === 'PROVIDER_ACCEPTED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          Ready to Schedule
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Awaiting Provider Acceptance</span>
                        </span>
                      )}
                    </div>

                    {/* Stage 1 Content */}
                    {selectedReq.stage1Meeting?.status === 'COMPLETED' ? (
                      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-200">
                            Alignment Call Concluded
                          </span>
                          <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400">
                            {selectedReq.stage1Meeting.completedAt ? new Date(selectedReq.stage1Meeting.completedAt).toLocaleString('en-IN') : 'Completed'}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 space-y-0.5">
                          <p>Scheduled: {selectedReq.stage1Meeting.scheduledDate} at {selectedReq.stage1Meeting.scheduledTime} ({selectedReq.stage1Meeting.durationMinutes} mins)</p>
                          <p>Conducted by: {selectedReq.stage1Meeting.completedByAdminName || 'Admin'}</p>
                          {selectedReq.stage1Meeting.notes && <p className="italic">Notes: "{selectedReq.stage1Meeting.notes}"</p>}
                        </div>
                      </div>
                    ) : selectedReq.stage1Meeting?.status === 'SCHEDULED' ? (
                      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{selectedReq.stage1Meeting.scheduledDate} at {selectedReq.stage1Meeting.scheduledTime}</span>
                              <span className="text-[10px] font-mono text-slate-500">({selectedReq.stage1Meeting.durationMinutes} mins)</span>
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Mode: {selectedReq.stage1Meeting.meetingMode || 'GOOGLE_MEET'} &bull; Provider: {selectedReq.providerName}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedReq.stage1Meeting.meetingLink && (
                              <a
                                href={selectedReq.stage1Meeting.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <span>Join Google Meet</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={handleCompleteStage1}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Meeting Completed</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : selectedReq.providerDecision === 'ACCEPTED' || selectedReq.status === 'PROVIDER_ACCEPTED' ? (
                      /* Stage 1 Schedule Form */
                      <form onSubmit={handleScheduleStage1} className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Select Date *
                            </label>
                            <input
                              type="date"
                              required
                              min={new Date().toISOString().split('T')[0]}
                              value={stage1Date}
                              onChange={(e) => setStage1Date(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Select Time *
                            </label>
                            <input
                              type="time"
                              required
                              value={stage1Time}
                              onChange={(e) => setStage1Time(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Duration
                            </label>
                            <select
                              value={stage1Duration}
                              onChange={(e) => setStage1Duration(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="15">15 minutes</option>
                              <option value="30">30 minutes</option>
                              <option value="45">45 minutes</option>
                              <option value="60">60 minutes</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Meeting Mode
                            </label>
                            <select
                              value={stage1Mode}
                              onChange={(e) => setStage1Mode(e.target.value as any)}
                              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="GOOGLE_MEET">Google Meet (Virtual)</option>
                              <option value="IN_PERSON">In-Person Meeting</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              {stage1Mode === 'GOOGLE_MEET' ? 'Google Meet Link' : 'Meeting Location / Address *'}
                            </label>
                            <input
                              type="text"
                              required={stage1Mode === 'IN_PERSON'}
                              value={stage1LinkOrLocation}
                              onChange={(e) => setStage1LinkOrLocation(e.target.value)}
                              placeholder={stage1Mode === 'GOOGLE_MEET' ? 'https://meet.google.com/fic-...' : 'FIC Regional Hub, Chennai'}
                              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule Admin & Provider Meeting</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Stage 1 scheduling is locked until the provider reviews and accepts the project requirements.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* STAGE 2 VIEW */}
                {selectedMeetingParticipant === 'REQUESTER' && (
                  <div
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      selectedReq.stage1Meeting?.status === 'COMPLETED'
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60'
                    }`}
                  >
                    {selectedReq.stage1Meeting?.status !== 'COMPLETED' ? (
                      /* Phase 3.2 Prominent Lock Banner */
                      <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span>Stage 2 Meeting Locked</span>
                        </div>
                        <p className="text-[11.5px] text-amber-700 dark:text-amber-300 leading-relaxed">
                          Stage 2 is locked. Complete the Stage 1 alignment call with Service Provider (<strong>{selectedReq.providerName || 'Provider'}</strong>) first before scheduling consultation with original requestor <strong>{selectedReq.requesterName || 'Client'}</strong>.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                                2
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Stage 2: Admin & Original Service Requestor Meeting
                              </h5>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-8">
                              <strong>Participants:</strong> FIC Admin + Original Requestor ({selectedReq.requesterName || 'Client'}). Service provider is excluded from this stage.
                            </p>
                          </div>

                          {selectedReq.stage2Meeting?.status === 'COMPLETED' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Stage 2 Completed & Closed</span>
                            </span>
                          ) : selectedReq.stage2Meeting?.status === 'SCHEDULED' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Client Meeting Scheduled</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              Ready to Schedule Client
                            </span>
                          )}
                        </div>

                        {/* Stage 2 Content */}
                        {selectedReq.stage2Meeting?.status === 'COMPLETED' ? (
                          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-emerald-800 dark:text-emerald-200">
                                Client Consultation Concluded &bull; Request Marked Completed
                              </span>
                              <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400">
                                {selectedReq.stage2Meeting.completedAt ? new Date(selectedReq.stage2Meeting.completedAt).toLocaleString('en-IN') : 'Completed'}
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 space-y-0.5">
                              <p>Scheduled: {selectedReq.stage2Meeting.scheduledDate} at {selectedReq.stage2Meeting.scheduledTime} ({selectedReq.stage2Meeting.durationMinutes} mins)</p>
                              <p>Conducted by: {selectedReq.stage2Meeting.completedByAdminName || 'Admin'}</p>
                            </div>
                          </div>
                        ) : selectedReq.stage2Meeting?.status === 'SCHEDULED' ? (
                          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{selectedReq.stage2Meeting.scheduledDate} at {selectedReq.stage2Meeting.scheduledTime}</span>
                                  <span className="text-[10px] font-mono text-slate-500">({selectedReq.stage2Meeting.durationMinutes} mins)</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Client: {selectedReq.requesterName} ({selectedReq.requesterEmail})
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {selectedReq.stage2Meeting.meetingLink && (
                                  <a
                                    href={selectedReq.stage2Meeting.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                                  >
                                    <span>Join Google Meet</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={handleCompleteStage2}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Completed & Close Request</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Stage 2 Schedule Form */
                          <form onSubmit={handleScheduleStage2} className="space-y-3 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Select Date *
                                </label>
                                <input
                                  type="date"
                                  required
                                  min={new Date().toISOString().split('T')[0]}
                                  value={stage2Date}
                                  onChange={(e) => setStage2Date(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Select Time *
                                </label>
                                <input
                                  type="time"
                                  required
                                  value={stage2Time}
                                  onChange={(e) => setStage2Time(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Duration
                                </label>
                                <select
                                  value={stage2Duration}
                                  onChange={(e) => setStage2Duration(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="15">15 minutes</option>
                                  <option value="30">30 minutes</option>
                                  <option value="45">45 minutes</option>
                                  <option value="60">60 minutes</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Meeting Mode
                                </label>
                                <select
                                  value={stage2Mode}
                                  onChange={(e) => setStage2Mode(e.target.value as any)}
                                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="GOOGLE_MEET">Google Meet (Virtual)</option>
                                  <option value="IN_PERSON">In-Person Meeting</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  {stage2Mode === 'GOOGLE_MEET' ? 'Google Meet Link' : 'Meeting Location / Address *'}
                                </label>
                                <input
                                  type="text"
                                  required={stage2Mode === 'IN_PERSON'}
                                  value={stage2LinkOrLocation}
                                  onChange={(e) => setStage2LinkOrLocation(e.target.value)}
                                  placeholder={stage2Mode === 'GOOGLE_MEET' ? 'https://meet.google.com/fic-...' : 'FIC Regional Hub'}
                                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end pt-1">
                              <button
                                type="submit"
                                disabled={isUpdating}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Schedule Admin & Requestor Meeting</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Internal Admin Note & Audit Log */}
              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Coordinator Audit Trail & Internal Notes
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    placeholder="Add an internal coordinator note..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddInternalNote}
                    disabled={!internalNoteInput.trim() || isUpdating}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>

                {selectedReq.internalNotes && selectedReq.internalNotes.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pt-2">
                    {selectedReq.internalNotes.map((note: string, idx: number) => (
                      <div
                        key={idx}
                        className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RequestsDeskPage;
