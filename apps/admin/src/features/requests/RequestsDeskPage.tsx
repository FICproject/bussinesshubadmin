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
  Mail,
  Phone,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Tag,
  LayoutGrid,
  List,
  X,
  ArrowRight,
  Check,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { SkeletonCards } from '../../components/Skeleton';
import { containerVariants, itemVariants, pageVariants } from '../../utils/animations';

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

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && s.toUpperCase() !== statusFilter) {
      setStatusFilter(s.toUpperCase());
    } else if (!s && statusFilter !== 'ALL') {
      setStatusFilter('ALL');
    }
  }, [searchParams]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [memberResponseInput, setMemberResponseInput] = useState('');
  const [responseStatus, setResponseStatus] = useState('RESPONDED');

  // Available service providers
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');

  // Meeting schedule form
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('11:00');
  const [meetingDuration, setMeetingDuration] = useState('45');
  const [meetingLink, setMeetingLink] = useState('');

  // Meeting Reschedule / Provider Availability Timing Edit Form
  const [isEditingMeetingTime, setIsEditingMeetingTime] = useState(false);
  const [editMeetingDate, setEditMeetingDate] = useState('');
  const [editMeetingTime, setEditMeetingTime] = useState('11:00');
  const [editMeetingDuration, setEditMeetingDuration] = useState('45');
  const [editTimingRole, setEditTimingRole] = useState<'PROVIDER' | 'ADMIN'>('PROVIDER');
  const [editTimingNote, setEditTimingNote] = useState('');

  // Coordinator Note & Status
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    loadRequests();
    loadProviders();
  }, [statusFilter, typeFilter]);

  const loadRequests = async (keepSelectedId?: string) => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const url = `/api/admin/requests${qs}`;
      const data = await apiFetch(url);
      setRequests(data);
      const targetId = keepSelectedId || selectedReq?._id;
      if (targetId) {
        const updated = data.find((r: any) => r._id === targetId);
        setSelectedReq(updated || null);
      }
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const data = await apiFetch('/api/admin/requests/providers/list');
      setProviders(data);
    } catch (err) {
      console.error('Failed to load service providers', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const showSuccessBanner = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // 1. SELECT PROVIDER
  const handleSelectProvider = async (listing: any) => {
    if (!selectedReq) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}/select-provider`, {
        method: 'PATCH',
        body: JSON.stringify({
          providerId: listing.providerId?._id || listing.providerId,
          serviceListingId: listing._id,
        }),
      });
      setSelectedReq(res.data);
      showSuccessBanner(`Assigned "${listing.providerPrivateName}" to this project. You can now send project info.`);
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Error assigning provider: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // 1.1 UNASSIGN / CHANGE PROVIDER
  const handleUnassignProvider = async () => {
    if (!selectedReq) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}/unassign-provider`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason: 'Admin changed provider selection',
        }),
      });
      setSelectedReq(res.data);
      showSuccessBanner('Provider unassigned. You can now choose a new service provider.');
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Error clearing provider: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. INFORM PROVIDER (ANONYMIZED PROJECT BRIEF)
  const handleInformProvider = async () => {
    if (!selectedReq || !selectedReq.targetProviderId) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}/notify-provider`, {
        method: 'POST',
        body: JSON.stringify({
          dispatchChannel: 'Email, WhatsApp & Portal Notification',
        }),
      });
      setSelectedReq(res.data);
      showSuccessBanner(`Project details sent to "${selectedReq.targetProviderId.name}". Client name is kept private.`);
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Error notifying provider: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. SIMULATE PROVIDER RESPONSE (Accept / Decline)
  const handleProviderResponse = async (response: 'ACCEPTED' | 'DECLINED') => {
    if (!selectedReq) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}/provider-response`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
      setSelectedReq(res.data);
      if (response === 'ACCEPTED') {
        showSuccessBanner(`Provider accepted! You can now book the introduction call.`);
        setIsSchedulingMeeting(true);
      } else {
        showSuccessBanner(`Provider declined. Please pick another provider above.`);
      }
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Error saving provider response: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. SCHEDULE MEETING
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !meetingDate) {
      alert('Please pick a date for the meeting');
      return;
    }

    const scheduledAt = new Date(`${meetingDate}T${meetingTime}:00`);
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}/schedule-meeting`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: parseInt(meetingDuration, 10) || 45,
          meetingLink: meetingLink.trim() || undefined,
        }),
      });
      setSelectedReq(res.data);
      setIsSchedulingMeeting(false);
      showSuccessBanner(`Meeting booked! Google Meet invites sent to both member & provider.`);
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Failed to schedule meeting: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // 5. RESCHEDULE / EDIT TIMING (Provider Availability Adjustment)
  const handleRescheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !editMeetingDate) {
      alert('Please select the adjusted meeting date');
      return;
    }

    const scheduledAt = new Date(`${editMeetingDate}T${editMeetingTime}:00`);
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}/reschedule-meeting`, {
        method: 'PATCH',
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: parseInt(editMeetingDuration, 10) || 45,
          updatedByRole: editTimingRole,
          note: editTimingNote.trim() || undefined,
        }),
      });
      setSelectedReq(res.data);
      setIsEditingMeetingTime(false);
      setEditTimingNote('');
      showSuccessBanner(`Meeting time updated based on ${editTimingRole === 'PROVIDER' ? 'provider' : 'admin'} availability!`);
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Failed to adjust meeting timing: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Append Coordinator Note
  const handleAppendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !newNote.trim()) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          note: newNote.trim(),
        }),
      });
      setSelectedReq(res.data);
      setNewNote('');
      showSuccessBanner('Note saved to history.');
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Note update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendAdminResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !memberResponseInput.trim()) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/requests/${selectedReq._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          adminResponse: memberResponseInput.trim(),
          status: responseStatus,
        }),
      });
      setSelectedReq(res.data);
      setMemberResponseInput('');
      showSuccessBanner('Response sent and notified to member.');
      loadRequests(selectedReq._id);
    } catch (err: any) {
      alert(`Failed to send response: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchRequester = r.requesterName?.toLowerCase().includes(q);
      const matchEmail = r.requesterEmail?.toLowerCase().includes(q);
      const matchType = r.type?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchRequester || matchEmail || matchType;
    });
  }, [requests, searchQuery]);

  const filteredProviders = providers.filter((p) => {
    if (!providerSearch) return true;
    const q = providerSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.providerPrivateName?.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <GitPullRequest className="w-5 h-5" />
            </span>
            <span>FIC Client Service Desk</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect members with expert service providers: Select a provider, share the project requirements, and set up a call once accepted.
          </p>
        </div>

        {/* View Mode Toggle (Grid / List) */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mr-1">
            View:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-[var(--accent-primary)] shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-[var(--accent-primary)] shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Success Banner */}
      {actionSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2 shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </motion.div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, description, or member..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[var(--accent-primary)] shadow-2xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[var(--accent-primary)] shadow-2xs font-medium"
        >
          <option value="ALL">All Categories</option>
          <option value="SERVICE_INQUIRY">Marketplace Services</option>
          <option value="BUSINESS_IDEAS">Business Ideas</option>
          <option value="SCALING_SUPPORT">Scaling Support</option>
          <option value="INVESTMENT_INTEREST">Investment Interest</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            const next = e.target.value;
            setStatusFilter(next);
            const newParams = new URLSearchParams(searchParams);
            if (next === 'ALL') {
              newParams.delete('status');
            } else {
              newParams.set('status', next);
            }
            setSearchParams(newParams, { replace: true });
          }}
          className="text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[var(--accent-primary)] shadow-2xs font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Requests (Pending Action)</option>
          <option value="NEW">New Requests</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="INFORMATION_REQUIRED">Information Required</option>
          <option value="RESPONDED">Responded</option>
          <option value="PROVIDER_CONTACTED">Provider Contacted</option>
          <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* MAIN CONTENT AREA: LIST VIEW OR GRID VIEW */}
      {loading ? (
        <SkeletonCards count={6} gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <GitPullRequest className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No requests found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? `No requests match "${searchQuery}".` : 'No member requests in the queue.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* ================= LIST VIEW (DEFAULT) ================= */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs"
        >
          {filteredRequests.map((r, idx) => (
            <motion.div
              key={r._id}
              variants={itemVariants}
              onClick={() => setSelectedReq(r)}
              className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 w-6 pt-1 shrink-0">
                  #{idx + 1}
                </span>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <span className="text-[11px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
                      {r.type?.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'MEETING_SCHEDULED'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : r.status === 'PROVIDER_CONTACTED'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : r.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {r.status === 'PROVIDER_CONTACTED'
                        ? 'Brief Sent'
                        : r.status === 'MEETING_SCHEDULED'
                        ? 'Call Booked'
                        : r.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-[var(--accent-primary)] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{r.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 md:w-5/12 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[11px] text-slate-400">Requesting Member</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                    {r.requesterName}
                  </p>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <p className="text-[11px] text-slate-400">Matched Provider</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                    {r.targetProviderId?.name || 'Not yet assigned'}
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white font-semibold text-xs hover:opacity-90 transition-opacity shadow-2xs"
                  >
                    Open
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* ================= GRID VIEW ================= */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredRequests.map((r, idx) => (
            <motion.div
              key={r._id}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              onClick={() => setSelectedReq(r)}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-md hover:border-[var(--accent-primary)]/50 cursor-pointer transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2.5 py-0.5 rounded-full">
                      {r.type?.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'MEETING_SCHEDULED'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : r.status === 'PROVIDER_CONTACTED'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : r.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {r.status === 'PROVIDER_CONTACTED'
                      ? 'Brief Sent'
                      : r.status === 'MEETING_SCHEDULED'
                      ? 'Call Booked'
                      : r.status?.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Requesting Member:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                    {r.requesterName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Matched Provider:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[160px]">
                    {r.targetProviderId?.name || 'Not yet assigned'}
                  </span>
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  <span className="text-[var(--accent-primary)] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Connect & Schedule <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ================= CENTRALIZED SEPARATE WORKFLOW TAB / MODAL ================= */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Smooth animated backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReq(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />

            {/* Centralized Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center font-bold shadow-2xs">
                    <GitPullRequest className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                        Service Request Management
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          selectedReq.status === 'MEETING_SCHEDULED'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : selectedReq.status === 'PROVIDER_CONTACTED'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                        }`}
                      >
                        {selectedReq.status === 'PROVIDER_CONTACTED'
                          ? 'Brief Sent'
                          : selectedReq.status === 'MEETING_SCHEDULED'
                          ? 'Call Booked'
                          : selectedReq.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedReq.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Requesting Member Card (Private/Confidential) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold text-sm flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedReq.requesterName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedReq.requesterEmail} • {selectedReq.requesterId?.phone || '+91 Verified Member'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Private Client (Hidden from Provider)</span>
                  </span>
                </div>

                {/* Project Requirements & Scope */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Project Requirements
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                    {selectedReq.description}
                  </p>
                </div>

                {/* 4-Step Visual Progress Bar */}
                <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>4-Step Coordination Process</span>
                  </span>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {/* Step 1 */}
                    <div
                      className={`p-2.5 rounded-xl border font-semibold transition-all ${
                        selectedReq.targetProviderId
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-[var(--accent-primary)]'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-slate-400">Step 1</div>
                      <div className="truncate">Choose Provider</div>
                    </div>

                    {/* Step 2 */}
                    <div
                      className={`p-2.5 rounded-xl border font-semibold transition-all ${
                        selectedReq.providerNotifiedAt
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : selectedReq.targetProviderId
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-slate-400">Step 2</div>
                      <div className="truncate">Send Project Info</div>
                    </div>

                    {/* Step 3 */}
                    <div
                      className={`p-2.5 rounded-xl border font-semibold transition-all ${
                        selectedReq.providerResponse === 'ACCEPTED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : selectedReq.providerResponse === 'DECLINED'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                          : selectedReq.providerNotifiedAt
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-slate-400">Step 3</div>
                      <div className="truncate">
                        {selectedReq.providerResponse === 'ACCEPTED'
                          ? 'Accepted'
                          : selectedReq.providerResponse === 'DECLINED'
                          ? 'Declined (Change)'
                          : 'Waiting for Reply'}
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div
                      className={`p-2.5 rounded-xl border font-semibold transition-all ${
                        selectedReq.status === 'MEETING_SCHEDULED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : selectedReq.providerResponse === 'ACCEPTED'
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-slate-400">Step 4</div>
                      <div className="truncate">Book Meeting</div>
                    </div>
                  </div>
                </div>

                {/* STEP 1: SERVICE PROVIDER SELECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>1. Qualified Service Providers</span>
                      <span className="text-[10px] text-slate-400 font-normal">({filteredProviders.length} available)</span>
                    </h4>
                    {selectedReq.targetProviderId && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                      </span>
                    )}
                  </div>

                  {selectedReq.targetProviderId ? (
                    <div className="p-4 rounded-2xl border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                            {selectedReq.targetProviderId.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                            Assigned to Project
                          </span>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                          {selectedReq.targetProviderId.email} • {selectedReq.targetProviderId.phone || '+91 Verified Provider'}
                        </p>
                        {selectedReq.targetServiceId && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Listing: <span className="font-semibold">{selectedReq.targetServiceId.title}</span> ({selectedReq.targetServiceId.categoryName})
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleUnassignProvider}
                        disabled={isUpdating}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold underline px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        Change Provider
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={providerSearch}
                          onChange={(e) => setProviderSearch(e.target.value)}
                          placeholder="Search providers by skill, business name, or specialty..."
                          className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-52 overflow-y-auto">
                        {filteredProviders.map((prov) => (
                          <div
                            key={prov._id}
                            className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{prov.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Provider:{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {prov.providerPrivateName || prov.providerId?.name}
                                </span>{' '}
                                ({prov.categoryName})
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Typical Pricing: {prov.pricingEstimate || 'Direct Quote'} • {prov.locationState || 'All India'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectProvider(prov)}
                              disabled={isUpdating}
                              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-xs hover:opacity-90 transition-opacity shadow-2xs"
                            >
                              Assign Provider
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2: INFORM PROVIDER WITH ANONYMIZED PROJECT BRIEF */}
                {selectedReq.targetProviderId && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>2. Send Project Overview to Provider</span>
                      </h4>
                      {selectedReq.providerNotifiedAt && (
                        <span className="text-xs text-slate-400 font-mono">
                          Sent at {new Date(selectedReq.providerNotifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                      <div className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            Client identity is strictly protected.
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            We only share the project title and work requirements with <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReq.targetProviderId.name}</span>. The member's name and phone number will not be disclosed.
                          </p>
                        </div>
                      </div>

                      {/* Preview of what provider actually receives */}
                      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs space-y-1 shadow-2xs">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                          What the provider will see:
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{selectedReq.title}</p>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">{selectedReq.description}</p>
                        <div className="flex items-center space-x-3 pt-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                          <span>• Client Name: [Hidden by FIC]</span>
                          <span>• Contact Info: [Hidden by FIC]</span>
                        </div>
                      </div>

                      {/* Action & Feedback Controls */}
                      {selectedReq.providerResponse === 'ACCEPTED' ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Provider accepted the request! Book your introduction call below.</span>
                            </div>
                            <span className="font-mono text-[10px] text-emerald-600/80">
                              Accepted {selectedReq.providerResponseAt ? new Date(selectedReq.providerResponseAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                            </span>
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleUnassignProvider}
                              disabled={isUpdating}
                              className="text-xs text-slate-500 hover:text-rose-600 font-semibold underline transition-colors"
                            >
                              Choose a different provider instead
                            </button>
                          </div>
                        </div>
                      ) : selectedReq.providerResponse === 'DECLINED' ? (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Provider {selectedReq.targetProviderId.name} has DECLINED this project inquiry.</span>
                            </div>
                            <span className="text-[10px] text-rose-500 font-mono">
                              {selectedReq.providerResponseAt ? new Date(selectedReq.providerResponseAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Declined'}
                            </span>
                          </div>

                          <p className="text-xs text-rose-600/90 dark:text-rose-400">
                            The provider is currently unavailable or unable to take on this scope. Please click below to select an alternate qualified service provider.
                          </p>

                          <div className="flex items-center space-x-3 pt-1">
                            <button
                              type="button"
                              onClick={handleUnassignProvider}
                              disabled={isUpdating}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-xs"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Change & Select Alternate Provider</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleInformProvider}
                              disabled={isUpdating}
                              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                            >
                              Retry / Re-send to Same Provider
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleInformProvider}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center space-x-2 transition-all shadow-xs active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {selectedReq.providerNotifiedAt ? 'Re-send Project Info' : 'Send Project Info to Provider'}
                            </span>
                          </button>

                          {selectedReq.providerNotifiedAt ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Provider Decision:</span>
                              <button
                                type="button"
                                onClick={() => handleProviderResponse('ACCEPTED')}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                              >
                                Mark Accepted
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProviderResponse('DECLINED')}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors shadow-2xs"
                              >
                                Mark Declined
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleUnassignProvider}
                              disabled={isUpdating}
                              className="text-xs text-slate-400 hover:text-rose-500 font-semibold underline"
                            >
                              Select another provider
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3 & 4: SCHEDULE MEETING (IF ACCEPTED) */}
                {selectedReq.targetProviderId && selectedReq.providerResponse === 'ACCEPTED' && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>3. Book Introduction Call</span>
                      </h4>
                      {selectedReq.scheduledMeetingId && (
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full">
                          Meeting Confirmed
                        </span>
                      )}
                    </div>

                    {selectedReq.scheduledMeetingId ? (
                      <div className="p-4 rounded-2xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                            {selectedReq.scheduledMeetingId.title || 'Client & Provider Introduction Call'}
                          </span>
                          <span className="text-xs font-mono font-semibold text-purple-700 dark:text-purple-300">
                            {new Date(selectedReq.scheduledMeetingId.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {selectedReq.scheduledMeetingId.description}
                        </p>

                        <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-purple-200 dark:border-purple-900/60">
                          {selectedReq.scheduledMeetingId.meetingLink ? (
                            <a
                              href={selectedReq.scheduledMeetingId.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Google Meet Call</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Meeting link generated</span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(selectedReq.scheduledMeetingId.scheduledAt);
                              const yyyy = d.getFullYear();
                              const mm = String(d.getMonth() + 1).padStart(2, '0');
                              const dd = String(d.getDate()).padStart(2, '0');
                              const hh = String(d.getHours()).padStart(2, '0');
                              const min = String(d.getMinutes()).padStart(2, '0');
                              setEditMeetingDate(`${yyyy}-${mm}-${dd}`);
                              setEditMeetingTime(`${hh}:${min}`);
                              setEditMeetingDuration(String(selectedReq.scheduledMeetingId.durationMinutes || 45));
                              setIsEditingMeetingTime(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-2xs flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Change Meeting Time / Check Availability</span>
                          </button>
                        </div>

                        {/* Inline Reschedule / Provider Availability Timing Editor */}
                        {isEditingMeetingTime && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleRescheduleMeeting}
                            className="mt-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 space-y-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-purple-600" />
                                <span>Select a New Date & Time Slot</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEditingMeetingTime(false)}
                                className="text-xs text-slate-400 hover:text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Choose a time that works best for provider <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReq.targetProviderId.name}</span>.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Meeting Date
                                </label>
                                <input
                                  type="date"
                                  value={editMeetingDate}
                                  onChange={(e) => setEditMeetingDate(e.target.value)}
                                  required
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Meeting Time
                                </label>
                                <input
                                  type="time"
                                  value={editMeetingTime}
                                  onChange={(e) => setEditMeetingTime(e.target.value)}
                                  required
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Call Duration
                                </label>
                                <select
                                  value={editMeetingDuration}
                                  onChange={(e) => setEditMeetingDuration(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                >
                                  <option value="30">30 minutes</option>
                                  <option value="45">45 minutes</option>
                                  <option value="60">60 minutes</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Requested By
                                </label>
                                <select
                                  value={editTimingRole}
                                  onChange={(e: any) => setEditTimingRole(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                >
                                  <option value="PROVIDER">Provider Availability ({selectedReq.targetProviderId.name})</option>
                                  <option value="ADMIN">FIC Desk Admin</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Optional Note
                                </label>
                                <input
                                  type="text"
                                  value={editTimingNote}
                                  onChange={(e) => setEditTimingNote(e.target.value)}
                                  placeholder="e.g., Provider is available after 2 PM..."
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setIsEditingMeetingTime(false)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isUpdating}
                                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-xs"
                              >
                                Save New Time
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleScheduleMeeting} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Both <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedReq.requesterName}</span> and provider <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedReq.targetProviderId.name}</span> will receive automatic calendar invites and the Google Meet video link.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Select Date
                            </label>
                            <input
                              type="date"
                              value={meetingDate}
                              onChange={(e) => setMeetingDate(e.target.value)}
                              required
                              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Select Time
                            </label>
                            <input
                              type="time"
                              value={meetingTime}
                              onChange={(e) => setMeetingTime(e.target.value)}
                              required
                              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Duration
                            </label>
                            <select
                              value={meetingDuration}
                              onChange={(e) => setMeetingDuration(e.target.value)}
                              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            >
                              <option value="30">30 minutes</option>
                              <option value="45">45 minutes</option>
                              <option value="60">60 minutes</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Google Meet Link (Optional — auto-generated if left blank)
                          </label>
                          <input
                            type="url"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder="https://meet.google.com/fic-..."
                            className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book & Send Calendar Invites</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Direct Response to Member */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase block font-mono">
                      Direct Response to Member
                    </span>
                    {selectedReq.adminRespondedAt && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Responded {new Date(selectedReq.adminRespondedAt).toLocaleDateString('en-GB')} by {selectedReq.adminRespondedByName || 'Admin'}
                      </span>
                    )}
                  </div>

                  {selectedReq.adminResponse && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs text-purple-900 dark:text-purple-200 font-medium">
                      <span className="font-bold block text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                        Active Response to Member:
                      </span>
                      {selectedReq.adminResponse}
                    </div>
                  )}

                  <form onSubmit={handleSendAdminResponse} className="space-y-2">
                    <textarea
                      value={memberResponseInput}
                      onChange={(e) => setMemberResponseInput(e.target.value)}
                      placeholder="Write a clear response or status update directly to the member (visible in Member My Requests)..."
                      rows={2}
                      className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Set Status:</label>
                        <select
                          value={responseStatus}
                          onChange={(e) => setResponseStatus(e.target.value)}
                          className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
                        >
                          <option value="RESPONDED">Responded</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="INFORMATION_REQUIRED">Information Required</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isUpdating || !memberResponseInput.trim()}
                        className="px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Response & Notify Member</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Case Coordinator Timeline & Internal Notes */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase block font-mono">
                    Activity Log & Coordinator Notes
                  </span>

                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 max-h-44 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700/60 text-xs font-mono">
                    {selectedReq.internalNotes && selectedReq.internalNotes.length > 0 ? (
                      selectedReq.internalNotes.map((n: string, i: number) => (
                        <div
                          key={i}
                          className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs font-sans text-xs"
                        >
                          {n}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic font-sans">No notes recorded yet.</p>
                    )}
                  </div>

                  <form onSubmit={handleAppendNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal note or update about this case..."
                      className="flex-1 text-xs px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                    <button
                      type="submit"
                      disabled={isUpdating || !newNote.trim()}
                      className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white disabled:opacity-50 rounded-xl text-xs font-semibold transition-all shadow-2xs"
                    >
                      Add Note
                    </button>
                  </form>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-2xs"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
