import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
  AlertCircle,
  X,
  Plus,
  Percent,
  Check,
  TrendingUp,
  CreditCard,
  FileText
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

export const ReturnsMaturityPage: React.FC = () => {
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [recordTarget, setRecordTarget] = useState<any | null>(null);
  const [repayAmountInput, setRepayAmountInput] = useState<string>('');
  const [repayReferenceInput, setRepayReferenceInput] = useState<string>('');
  const [repayNotesInput, setRepayNotesInput] = useState<string>('');
  const [isRecordingRepay, setIsRecordingRepay] = useState<boolean>(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/funding/returns-maturity${qs}`);
      const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
      setReturnsList(list);

      // Auto-sync open modal
      if (selectedProject) {
        const fresh = list.find((item: any) => (item.investmentId || item._id) === (selectedProject.investmentId || selectedProject._id));
        if (fresh) setSelectedProject(fresh);
      }
    } catch (err: any) {
      console.warn('Failed to load returns & maturity data:', err);
      if (!silent) setLoadError(err.message || 'Failed to connect to backend server');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, selectedProject]);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Real-time synchronization
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 6000);
    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadData]);

  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Open Record Repayment Modal
  const handleOpenRecordModal = (item: any) => {
    setRecordTarget(item);
    const estInstallment = Math.round((item.totalExpectedReturn || 0) / (item.durationMonths || 12));
    setRepayAmountInput(String(estInstallment || 10000));
    setRepayReferenceInput(`RET-NEFT-${Date.now().toString().slice(-6)}`);
    setRepayNotesInput(`Monthly/periodic return installment from ${item.fundingRequestorName}.`);
  };

  const handleConfirmRecordRepayment = async () => {
    if (!recordTarget) return;
    const numAmt = Number(repayAmountInput);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid positive repayment amount.');
      return;
    }
    if (!repayReferenceInput.trim()) {
      alert('Please enter a payment reference / UTR number.');
      return;
    }

    setIsRecordingRepay(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/returns-maturity/${recordTarget.investmentId || recordTarget._id}/record-repayment`,
        {
          method: 'POST',
          body: JSON.stringify({
            amount: numAmt,
            paymentReference: repayReferenceInput.trim(),
            notes: repayNotesInput.trim()
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Repayment of ₹${numAmt.toLocaleString('en-IN')} recorded & credited to return ledger!`
        });
        setRecordTarget(null);
        setSelectedProject(null);
        loadData(true);
      } else {
        throw new Error(res?.error || 'Failed to record repayment');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsRecordingRepay(false);
    }
  };

  const filteredItems = returnsList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.projectName || '').toLowerCase().includes(q) ||
      (item.fundingRequestRef || '').toLowerCase().includes(q) ||
      (item.investmentId || '').toLowerCase().includes(q) ||
      (item.fundingRequestorName || '').toLowerCase().includes(q) ||
      (item.investorName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </span>
            <span>Returns & Maturity</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor active funded enterprises, schedule return milestones, verify incoming repayments, and reconcile debt yields.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
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
          {['ALL', 'SCHEDULED', 'DUE', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'MATURITY_DUE'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
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
            placeholder="Search by project, borrower, or investor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-4">Project / Company</th>
                <th className="p-4">Borrower & Investor</th>
                <th className="p-4">Deployed Principal</th>
                <th className="p-4">Return Rate & Frequency</th>
                <th className="p-4">Total Expected Return</th>
                <th className="p-4">Returns Collected</th>
                <th className="p-4">Outstanding Return</th>
                <th className="p-4">Maturity Date</th>
                <th className="p-4">Repayment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Loading returns & maturity records...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    No active funded projects match current filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id || item.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.projectName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {item.fundingRequestRef} • {item.investmentId}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Borrower: {item.fundingRequestorName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Investor: {item.investorName}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                      {formatCurrencyINR(item.releasedPrincipalAmount || item.paidAmount)}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <span className="font-bold">{item.expectedReturnRate}</span>
                      <span className="text-slate-400 block text-[10px]">
                        {item.returnPayoutFrequency}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                      {formatCurrencyINR(item.totalExpectedReturn)}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {formatCurrencyINR(item.amountReceived)}
                    </td>
                    <td className="p-4 font-mono text-amber-600 dark:text-amber-400 text-sm font-bold">
                      {formatCurrencyINR(item.outstandingAmount)}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {item.maturityDate ? new Date(item.maturityDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.repaymentStatus === 'FULLY_RECEIVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.repaymentStatus === 'DUE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : item.repaymentStatus === 'MATURITY_DUE'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.repaymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* View Full Schedule & Ledger */}
                        <button
                          type="button"
                          onClick={() => setSelectedProject(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                        >
                          Schedule
                        </button>

                        {/* Record Repayment */}
                        <button
                          type="button"
                          onClick={() => handleOpenRecordModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs"
                        >
                          Record Payment
                        </button>
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
          MODAL: VIEW REPAYMENT SCHEDULE & LEDGER
         ======================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  REPAYMENT LEDGER & YIELD AUDIT
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedProject.projectName} ({selectedProject.fundingRequestRef})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Balances Card */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-center">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Total Return Due</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatCurrencyINR(selectedProject.totalExpectedReturn)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Amount Collected</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrencyINR(selectedProject.amountReceived)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Outstanding Return</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {formatCurrencyINR(selectedProject.outstandingAmount)}
                </span>
              </div>
            </div>

            {/* Repayments History */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                Recorded Repayments History ({selectedProject.repayments?.length || 0})
              </h4>
              {selectedProject.repayments && selectedProject.repayments.length > 0 ? (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {selectedProject.repayments.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Installment #{r.installmentNumber || idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Ref: {r.paymentReference || 'N/A'} • {r.paidAt ? new Date(r.paidAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrencyINR(r.amountPaid || r.amountDue)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No repayments recorded yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RECORD REPAYMENT
         ======================================================== */}
      {recordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  RECORD INCOMING REPAYMENT
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {recordTarget.projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRecordTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Record incoming return or principal installment received from borrower <b>{recordTarget.fundingRequestorName}</b> into the platform ledger.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Received Repayment Amount (₹) *
                </label>
                <input
                  type="number"
                  value={repayAmountInput}
                  onChange={(e) => setRepayAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Bank Reference / UTR Number *
                </label>
                <input
                  type="text"
                  value={repayReferenceInput}
                  onChange={(e) => setRepayReferenceInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Audit Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={repayNotesInput}
                  onChange={(e) => setRepayNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRecordTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRecordRepayment}
                disabled={isRecordingRepay}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
              >
                {isRecordingRepay ? 'Recording...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
