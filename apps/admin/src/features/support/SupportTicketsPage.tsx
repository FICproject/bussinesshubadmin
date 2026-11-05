import React, { useEffect, useState } from 'react';
import { LifeBuoy, Search, MessageSquare, Send, CheckCircle2, Clock, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { rowVariants } from '../../utils/animations';
import { SkeletonList } from '../../components/Skeleton';

export const SupportTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Selected Ticket Drawer / Chat Thread
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/support/tickets?status=${statusFilter}&priority=${priorityFilter}`;
      const data = await apiFetch(url);
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find((t: any) => t._id === selectedTicket._id);
        setSelectedTicket(updated || null);
      }
    } catch (err) {
      console.error('Failed to load support tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSending(true);
    try {
      await apiFetch(`/api/admin/support/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyMessage,
          status: updateStatus || undefined,
        }),
      });
      setReplyMessage('');
      loadTickets();
    } catch (err: any) {
      alert(`Reply failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
            <LifeBuoy className="w-5 h-5" />
          </span>
          <span>Member Support & Helpdesk</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review member assistance queries, dispute tickets, KYC clarifications, and reply in real-time.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Ticket Queue + Conversation Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tickets Queue ({tickets.length})
            </span>
          </div>

          {loading ? (
            <div className="p-4">
              <SkeletonList count={4} />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No support tickets match filters.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((t, idx) => {
                const isSelected = selectedTicket?._id === t._id;
                return (
                  <motion.div
                    key={t._id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setUpdateStatus(t.status);
                    }}
                    whileHover={{ x: 2, transition: { duration: 0.1 } }}
                    className={`p-4 cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-l-4 border-sky-600'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          {t.ticketNumber}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'URGENT' || t.priority === 'HIGH'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-1.5">
                      {t.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {t.messages?.[t.messages.length - 1]?.message || 'No messages'}
                    </p>

                    <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t.memberId?.name || 'Customer'}</span>
                      <span>{new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversation Thread & Reply Panel */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-400">• Category: {selectedTicket.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    From: {selectedTicket.memberId?.name} ({selectedTicket.memberId?.email})
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl max-h-72 border border-slate-200 dark:border-slate-800">
                {selectedTicket.messages?.map((msg: any, i: number) => {
                  const isAdmin = msg.sender === 'ADMIN';
                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5">
                        {isAdmin ? 'FIC Support Team' : selectedTicket.memberId?.name} •{' '}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`p-3 rounded-xl text-xs max-w-[85%] ${
                          isAdmin
                            ? 'bg-sky-600 text-white rounded-tr-none shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleReplySubmit} className="pt-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Ticket Status:</span>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="relative">
                  <textarea
                    required
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type an official resolution reply to customer..."
                    className="w-full text-xs p-3 pr-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="absolute right-2.5 bottom-3.5 p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <LifeBuoy className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Select a ticket</p>
              <p className="text-xs text-slate-400 mt-1">
                Pick a query from the helpdesk queue to read conversation history and send replies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

