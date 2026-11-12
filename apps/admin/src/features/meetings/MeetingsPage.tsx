import React, { useEffect, useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Plus,
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  X,
  BellRing,
  CalendarClock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { rowVariants } from '../../utils/animations';
import { SkeletonTable } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';

export const MeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [meetingLink, setMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Participants View Modal State
  const [viewMembersMeeting, setViewMembersMeeting] = useState<any | null>(null);

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('11:00');
  const [newDuration, setNewDuration] = useState(30);
  const [newMeetingLink, setNewMeetingLink] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const { showAlert } = useDialog();

  useEffect(() => {
    loadMeetings();
  }, [statusFilter]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/meetings?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await apiFetch(url);
      setMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings', err);
    } finally {
      setLoading(false);
    }
  };

  const openScheduleModal = async () => {
    setShowScheduleModal(true);
    setMemberSearchQuery('');
    if (membersList.length === 0) {
      setMembersLoading(true);
      try {
        const data = await apiFetch('/api/admin/members');
        setMembersList(data);
      } catch (err) {
        console.error('Failed to load member candidates', err);
      } finally {
        setMembersLoading(false);
      }
    }
  };

  const handleMemberSelectToggle = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt || selectedMemberIds.length === 0) {
      await showAlert('Please fill out the meeting title, date/time, and pick at least one customer.', {
        title: 'Missing Required Fields',
        severity: 'warning',
      });
      return;
    }

    const trimmedUrl = meetingLink.trim();
    if (!trimmedUrl) {
      await showAlert('Meeting URL is mandatory. Please provide a valid video call URL.', {
        title: 'Meeting URL Required',
        severity: 'warning',
      });
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      await showAlert('Please enter a valid Meeting URL starting with http:// or https://.', {
        title: 'Invalid Meeting URL',
        severity: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/admin/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description,
          participantMemberIds: selectedMemberIds,
          scheduledAt,
          durationMinutes: Number(durationMinutes),
          meetingLink: trimmedUrl,
        }),
      });

      setShowScheduleModal(false);
      setTitle('');
      setDescription('');
      setSelectedMemberIds([]);
      setScheduledAt('');
      setMeetingLink('');
      loadMeetings();
    } catch (err: any) {
      await showAlert(`Error scheduling meeting: ${err.message}`, {
        title: 'Meeting Scheduling Failed',
        severity: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRescheduleModal = (meeting: any) => {
    setRescheduleTarget(meeting);
    const dateObj = new Date(meeting.scheduledAt);
    const dateStr = dateObj.toISOString().split('T')[0];
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    setNewMeetingDate(dateStr);
    setNewMeetingTime(`${hours}:${minutes}`);
    setNewDuration(meeting.durationMinutes || 30);
    setNewMeetingLink(meeting.meetingLink || '');
    setRescheduleNote('');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newMeetingDate || !newMeetingTime) {
      await showAlert('Please provide both new date and time for the meeting.', {
        title: 'Missing Required Timing',
        severity: 'warning',
      });
      return;
    }

    setIsRescheduling(true);
    try {
      const combinedDateTime = new Date(`${newMeetingDate}T${newMeetingTime}:00`);
      await apiFetch(`/api/admin/meetings/${rescheduleTarget._id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          scheduledAt: combinedDateTime.toISOString(),
          durationMinutes: Number(newDuration),
          meetingLink: newMeetingLink || undefined,
          note: rescheduleNote || 'Meeting rescheduled by admin',
        }),
      });

      setRescheduleTarget(null);
      await loadMeetings();
    } catch (err: any) {
      await showAlert(`Failed to reschedule meeting: ${err.message}`, {
        title: 'Reschedule Error',
        severity: 'danger',
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleStatusChange = async (meetingId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/admin/meetings/${meetingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadMeetings();
    } catch (err: any) {
      await showAlert(`Error updating meeting status: ${err.message}`, {
        title: 'Status Update Error',
        severity: 'danger',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <Video className="w-5 h-5" />
            </span>
            <span>Customer Meetings Desk</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule 1-on-1 consultations, multi-party FIC intermediary calls, and dispatch automated customer notifications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openScheduleModal}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Meeting</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadMeetings()}
            placeholder="Search by title, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Meetings</option>
            <option value="PENDING_COORDINATION">Pending Coordination</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">S.No</th>
                <th className="px-6 py-3.5">Meeting Details</th>
                <th className="px-6 py-3.5">Customers / Members</th>
                <th className="px-6 py-3.5">Host Admin</th>
                <th className="px-6 py-3.5">Scheduled Date & Time</th>
                <th className="px-6 py-3.5">Status & Invite</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <SkeletonTable rows={5} cols={7} />
                  </td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No meetings found. Click "Schedule New Meeting" to invite members.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {meetings.map((m, idx) => (
                    <motion.tr
                      key={m._id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</span>
                          {m.meetingType === 'FUNDING_PITCH' && (
                            <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/50">
                              FIC Capital Pitch
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {m.description}
                          </div>
                        )}
                        {m.meetingLink && (
                          <a
                            href={m.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-sky-600 dark:text-sky-400 text-[11px] font-medium hover:underline mt-1"
                          >
                            <span>Open Meeting Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {(() => {
                          const totalParticipants =
                            (m.participantMemberIds?.length || 0) + (m.externalParticipants?.length || 0);
                          if (totalParticipants === 0) {
                            return <span className="text-xs text-slate-400">No participants</span>;
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => setViewMembersMeeting(m)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 text-xs font-semibold transition-all active:scale-95 shadow-2xs"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>View Members ({totalParticipants})</span>
                            </button>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {m.hostAdminId?.name || 'Admin'}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(m.scheduledAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                            {m.durationMinutes} min)
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit transition-transform hover:scale-105 ${
                              m.status === 'COMPLETED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : m.status === 'IN_PROGRESS'
                                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 animate-pulse'
                                : m.status === 'CANCELLED'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {m.status.replace('_', ' ')}
                          </span>

                          <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <BellRing className="w-3 h-3" />
                            <span>Invites Dispatched</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          {m.status === 'PENDING_COORDINATION' && (
                            <button
                              onClick={() => handleStatusChange(m._id, 'SCHEDULED')}
                              title="Confirm & Schedule Session"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Slot</span>
                            </button>
                          )}

                          {m.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Meeting Completed</span>
                            </span>
                          ) : m.status === 'CANCELLED' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 text-xs font-semibold whitespace-nowrap">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelled</span>
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStatusChange(m._id, 'COMPLETED')}
                                title="Mark Completed"
                                className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-all active:scale-95 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openRescheduleModal(m)}
                                title="Reschedule Meeting"
                                className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition-all active:scale-95 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs flex items-center space-x-1"
                              >
                                <CalendarClock className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                      Schedule & Dispatch Customer Call
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Auto-triggers notification invites to selected participants.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. FIC Ecosystem Intro: Textiles & Cloud Architecture Consultation"
                    className="w-full text-sm p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Description & Agenda
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objectives, topics to cover, and intermediary expectations."
                    rows={2}
                    className="w-full text-sm p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Member / Customer Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                      Select Participant Member(s) *
                    </label>
                    <div className="flex items-center space-x-2">
                      {membersList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const filteredIds = membersList
                              .filter((m) => {
                                const q = memberSearchQuery.toLowerCase();
                                return (
                                  m.name?.toLowerCase().includes(q) ||
                                  m.email?.toLowerCase().includes(q) ||
                                  m.phone?.toLowerCase().includes(q)
                                );
                              })
                              .map((m) => m._id);
                            const allSelected = filteredIds.every((id) => selectedMemberIds.includes(id));
                            if (allSelected) {
                              setSelectedMemberIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
                            } else {
                              setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
                            }
                          }}
                          className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline"
                        >
                          Select All
                        </button>
                      )}
                      <span className="text-sky-600 dark:text-sky-400 font-mono text-xs font-bold">
                        {selectedMemberIds.length} selected
                      </span>
                    </div>
                  </div>

                  {/* Search bar inside member selector */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Search member by name, email, or phone..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-400"
                    />
                  </div>

                  {/* Scrollable list with checkboxes */}
                  <div className="border border-slate-300 dark:border-slate-700 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 p-1">
                    {membersLoading ? (
                      <p className="p-3 text-xs text-slate-400 text-center animate-pulse">
                        Loading member directory...
                      </p>
                    ) : membersList.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400 text-center">No registered members found.</p>
                    ) : (
                      (() => {
                        const filtered = membersList.filter((mem) => {
                          if (!memberSearchQuery.trim()) return true;
                          const q = memberSearchQuery.toLowerCase().trim();
                          return (
                            mem.name?.toLowerCase().includes(q) ||
                            mem.email?.toLowerCase().includes(q) ||
                            mem.phone?.toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <p className="p-3 text-xs text-slate-400 text-center">
                              No members match "{memberSearchQuery}".
                            </p>
                          );
                        }

                        return filtered.map((mem) => {
                          const isChecked = selectedMemberIds.includes(mem._id);
                          return (
                            <div
                              key={mem._id}
                              onClick={() => handleMemberSelectToggle(mem._id)}
                              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                                isChecked
                                  ? 'bg-sky-100/70 dark:bg-sky-950/80 font-medium'
                                  : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="pr-2 truncate">
                                <p className="text-slate-900 dark:text-slate-100 font-semibold truncate">{mem.name}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {mem.email} • {mem.phone}
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleMemberSelectToggle(mem._id)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4 shrink-0 cursor-pointer"
                              />
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>

                {/* Date, Time, Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Duration
                    </label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Meeting URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abc-def"
                    className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-[11px]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Scheduling...' : 'Schedule & Notify Customer'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Centralized Reschedule Meeting Details Modal */}
      <AnimatePresence>
        {rescheduleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setRescheduleTarget(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-2xl">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      Reschedule Customer Meeting
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update the meeting date and time. Participants will receive updated invites.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRescheduleTarget(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {/* Meeting Context Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Current Meeting</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {rescheduleTarget.title}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Currently set for: {new Date(rescheduleTarget.scheduledAt).toLocaleString()}</span>
                  </div>
                  {rescheduleTarget.participantMemberIds?.length > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Participants: {rescheduleTarget.participantMemberIds.map((p: any) => p.name).join(', ')}
                    </div>
                  )}
                </div>

                {/* Date & Time Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      New Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newMeetingDate}
                      onChange={(e) => setNewMeetingDate(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      New Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={newMeetingTime}
                      onChange={(e) => setNewMeetingTime(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Call Duration
                  </label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Video Meeting URL
                  </label>
                  <input
                    type="url"
                    value={newMeetingLink}
                    onChange={(e) => setNewMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abc"
                    className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-[11px]"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Reason / Reschedule Note
                  </label>
                  <input
                    type="text"
                    value={rescheduleNote}
                    onChange={(e) => setRescheduleNote(e.target.value)}
                    placeholder="e.g. Moved to afternoon per client request"
                    className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRescheduleTarget(null)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRescheduling}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-amber-600/20"
                  >
                    {isRescheduling ? 'Rescheduling...' : 'Save & Update Meeting Time'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Members Modal */}
      <AnimatePresence>
        {viewMembersMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewMembersMeeting(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      Meeting Participants
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {viewMembersMeeting.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMembersMeeting(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
                {viewMembersMeeting.participantMemberIds?.map((p: any, idx: number) => (
                  <div
                    key={p._id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {p.name || 'Member'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {p.email} {p.phone ? `• ${p.phone}` : ''}
                        </div>
                      </div>
                    </div>
                    {p.primaryCategory && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 ml-2">
                        {p.primaryCategory}
                      </span>
                    )}
                  </div>
                ))}

                {viewMembersMeeting.externalParticipants?.map((e: any, idx: number) => (
                  <div
                    key={`ext-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {(viewMembersMeeting.participantMemberIds?.length || 0) + idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {e.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {e.email} {e.phone ? `• ${e.phone}` : ''}
                        </div>
                      </div>
                    </div>
                    {e.roleOrCompany && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 ml-2">
                        {e.roleOrCompany}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewMembersMeeting(null)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold transition-all active:scale-95"
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

