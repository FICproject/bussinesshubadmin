import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  Building,
  RefreshCw,
  AlertCircle,
  X,
  Eye,
  Check,
  Percent
} from 'lucide-react';
import { apiFetch } from '../../services/api';

export const formatCurrencyINR = (amount: number): string => {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Crore${Number(cr) > 1 ? 's' : ''}`;
  }
  if (amount >= 100000) {
    const lk = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lk} Lakh${Number(lk) > 1 ? 's' : ''}`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const InvestmentRequestsPage: React.FC = () => {
  const [investmentRequests, setInvestmentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [selectedInvestment, setSelectedInvestment] = useState<any | null>(null);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [approvedAmountInput, setApprovedAmountInput] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessingReview, setIsProcessingReview] = useState<boolean>(false);

  const loadInvestments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/funding/investment-requests${qs}`);
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setInvestmentRequests(list);

      // Auto-sync open details modal
      if (selectedInvestment) {
        const fresh = list.find((inv: any) => (inv.investmentId || inv._id) === (selectedInvestment.investmentId || selectedInvestment._id));
        if (fresh) setSelectedInvestment(fresh);
      }
    } catch (err: any) {
      console.warn('Failed to load investment requests:', err);
      if (!silent) setLoadError(err.message || 'Failed to connect to backend server');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, selectedInvestment]);

  useEffect(() => {
    loadInvestments();
  }, [statusFilter]);

  // Real-time synchronization
  useEffect(() => {
    const interval = setInterval(() => loadInvestments(true), 6000);
    const onFocus = () => loadInvestments(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadInvestments]);

  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  const handleOpenReviewModal = (inv: any) => {
    setReviewTarget(inv);
    setReviewAction('APPROVE');
    setApprovedAmountInput(String(inv.approvedAmount || inv.requestedAmount || ''));
    setReviewNotes('');
    setRejectionReason('');
  };

  const handleConfirmReview = async () => {
    if (!reviewTarget) return;

    if (reviewAction === 'APPROVE') {
      const amt = Number(approvedAmountInput);
      if (!amt || amt <= 0) {
        alert('Please enter a valid positive approved investment amount.');
        return;
      }
    } else if (reviewAction === 'REQUEST_CHANGES') {
      if (!reviewNotes.trim()) {
        alert('Please provide instructions for the requested revisions.');
        return;
      }
    } else if (reviewAction === 'REJECT') {
      if (!rejectionReason.trim()) {
        alert('Please state the reason for rejecting this investment proposal.');
        return;
      }
    }

    setIsProcessingReview(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/investment-requests/${reviewTarget.investmentId || reviewTarget._id}/review`,
        {
          method: 'PUT',
          body: JSON.stringify({
            action: reviewAction,
            approvedAmount: Number(approvedAmountInput) || reviewTarget.requestedAmount,
            notes: reviewNotes.trim(),
            rejectionReason: rejectionReason.trim()
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Investment ${reviewTarget.investmentId} updated to ${reviewAction === 'APPROVE' ? 'APPROVED / PAYMENT_PENDING' : reviewAction}!`
        });
        setReviewTarget(null);
        setSelectedInvestment(null);
        loadInvestments(true);
      } else {
        throw new Error(res?.error || 'Failed to update investment proposal');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsProcessingReview(false);
    }
  };

  const filteredInvestments = investmentRequests.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (inv.investmentId || '').toLowerCase().includes(q) ||
      (inv.fundingRequestRef || '').toLowerCase().includes(q) ||
      (inv.projectName || '').toLowerCase().includes(q) ||
      (inv.investorName || '').toLowerCase().includes(q) ||
      (inv.fundingRequestorName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span>Investment Requests</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and moderate investment proposals submitted by verified network investors against approved funding opportunities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadInvestments()}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="text-xs uppercase hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {['ALL', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'PAYMENT_PENDING', 'PAID', 'ACTIVE', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by investment ID, project, or investor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-4">Investment ID</th>
                <th className="p-4">Investor Name</th>
                <th className="p-4">Linked Funding Ref</th>
                <th className="p-4">Project / Company</th>
                <th className="p-4">Funding Requester</th>
                <th className="p-4">Proposed Capital</th>
                <th className="p-4">Expected Returns</th>
                <th className="p-4">Submission Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Loading investment requests...
                  </td>
                </tr>
              ) : filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    No investment proposals match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((inv) => (
                  <tr key={inv._id || inv.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {inv.investmentId}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {inv.investorName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {inv.investorEmail || ''}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {inv.fundingRequestRef}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {inv.projectName}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {inv.fundingRequestorName}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                      {formatCurrencyINR(inv.approvedAmount || inv.requestedAmount)}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <span className="font-bold">{inv.expectedReturns}</span>
                      <span className="text-slate-400 block text-[10px]">
                        {inv.fundingDuration}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID' || inv.status === 'ACTIVE' || inv.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : inv.status === 'APPROVED' || inv.status === 'PAYMENT_PENDING'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : inv.status === 'CHANGES_REQUESTED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : inv.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvestment(inv)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                        >
                          View Details
                        </button>

                        {/* Review Action (Only if pending review or changes) */}
                        {inv.status !== 'PAID' && inv.status !== 'ACTIVE' && inv.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-2xs"
                          >
                            Review Proposal
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL: VIEW DETAILS
         ======================================================== */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">
                  {selectedInvestment.investmentId}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Investment Proposal: {selectedInvestment.projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvestment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terms Summary Cards */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Proposed Amount</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  {formatCurrencyINR(selectedInvestment.requestedAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Approved Amount</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  {formatCurrencyINR(selectedInvestment.approvedAmount || selectedInvestment.requestedAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Verified Paid Amount</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-base">
                  {formatCurrencyINR(selectedInvestment.paidAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Return Terms</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-base">
                  {selectedInvestment.expectedReturns} ({selectedInvestment.fundingDuration})
                </span>
              </div>
            </div>

            {/* Investor & Borrower Identity */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 uppercase font-mono text-[10px] block">Investor Profile</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedInvestment.investorName}</span>
                <span className="text-slate-500 block">{selectedInvestment.investorEmail} • {selectedInvestment.investorPhone || '+91 Verified Member'}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 uppercase font-mono text-[10px] block">Funding Requester (Borrower)</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedInvestment.fundingRequestorName}</span>
                <span className="text-slate-500 block">Project: {selectedInvestment.projectName} ({selectedInvestment.fundingRequestRef})</span>
              </div>
            </div>

            {/* Activity Timeline */}
            {selectedInvestment.activityTimeline && selectedInvestment.activityTimeline.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                  Proposal Audit Trail
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedInvestment.activityTimeline.map((item: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px]">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{item.action}</span>
                        <span className="text-slate-400 text-[10px]">{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      {item.notes && <p className="text-slate-500 mt-0.5">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedInvestment(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REVIEW INVESTMENT PROPOSAL
         ======================================================== */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-600">ACTION REQUIRED</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Review Investment Proposal: {reviewTarget.investmentId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Proposal Context */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Investor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{reviewTarget.investorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Opportunity:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{reviewTarget.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Proposed Commitment:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyINR(reviewTarget.requestedAmount)}
                </span>
              </div>
            </div>

            {/* Action Selector: APPROVE vs REQUEST_CHANGES vs REJECT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-2">
                Select Admin Action:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVE')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all text-center ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Approve Proposal
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REQUEST_CHANGES')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all text-center ${
                    reviewAction === 'REQUEST_CHANGES'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REJECT')}
                  className={`py-2 px-3 rounded-xl font-bold transition-all text-center ${
                    reviewAction === 'REJECT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Decline Proposal
                </button>
              </div>
            </div>

            {/* Dynamic Action Fields */}
            {reviewAction === 'APPROVE' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Approved Investment Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={approvedAmountInput}
                    onChange={(e) => setApprovedAmountInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Approving creates a <b>PAYMENT_PENDING</b> obligation and notifies the investor with payment instructions.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Approval Notes
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Optional notes for investor..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            )}

            {reviewAction === 'REQUEST_CHANGES' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Change Request Instructions *
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Specify why the commitment needs adjustment (e.g. ticket limit or term constraints)..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}

            {reviewAction === 'REJECT' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State reason for declining this proposal..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={isProcessingReview}
                className={`px-6 py-2 rounded-xl text-white font-bold text-xs shadow-md ${
                  reviewAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : reviewAction === 'REQUEST_CHANGES'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessingReview ? 'Processing...' : `Confirm ${reviewAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

