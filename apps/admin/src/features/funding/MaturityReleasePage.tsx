import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
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
  DollarSign,
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

export const MaturityReleasePage: React.FC = () => {
  const [maturityReleases, setMaturityReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);

  // Verify Incoming Maturity Repayment Modal
  const [verifyIncomingTarget, setVerifyIncomingTarget] = useState<any | null>(null);
  const [incomingAmountInput, setIncomingAmountInput] = useState<string>('');
  const [incomingRefInput, setIncomingRefInput] = useState<string>('');
  const [incomingNotesInput, setIncomingNotesInput] = useState<string>('');
  const [isVerifyingIncoming, setIsVerifyingIncoming] = useState<boolean>(false);

  // Release Maturity Payout to Investor Modal
  const [releaseTarget, setReleaseTarget] = useState<any | null>(null);
  const [payoutAmountInput, setPayoutAmountInput] = useState<string>('');
  const [payoutRefInput, setPayoutRefInput] = useState<string>('');
  const [payoutNotesInput, setPayoutNotesInput] = useState<string>('');
  const [isReleasingPayout, setIsReleasingPayout] = useState<boolean>(false);

  // Payout Receipt Modal
  const [receiptTarget, setReceiptTarget] = useState<any | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/funding/maturity-releases${qs}`);
      const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
      setMaturityReleases(list);

      // Auto-sync open modal
      if (selectedSettlement) {
        const fresh = list.find((item: any) => (item.investmentId || item._id) === (selectedSettlement.investmentId || selectedSettlement._id));
        if (fresh) setSelectedSettlement(fresh);
      }
    } catch (err: any) {
      console.warn('Failed to load maturity releases:', err);
      if (!silent) setLoadError(err.message || 'Failed to connect to backend server');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, selectedSettlement]);

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

  // Open Verify Incoming Modal
  const handleOpenVerifyIncoming = (item: any) => {
    setVerifyIncomingTarget(item);
    setIncomingAmountInput(String(item.totalSettlementAmount || item.paidAmount || ''));
    setIncomingRefInput(`MAT-IN-${Date.now().toString().slice(-6)}`);
    setIncomingNotesInput(`Final maturity repayment received from ${item.fundingRequestorName}.`);
  };

  const handleConfirmVerifyIncoming = async () => {
    if (!verifyIncomingTarget) return;
    const numAmt = Number(incomingAmountInput);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid positive repayment amount.');
      return;
    }
    if (!incomingRefInput.trim()) {
      alert('Please provide the incoming bank transaction reference.');
      return;
    }

    setIsVerifyingIncoming(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/maturity-releases/${verifyIncomingTarget.investmentId || verifyIncomingTarget._id}/verify-incoming`,
        {
          method: 'POST',
          body: JSON.stringify({
            amountReceived: numAmt,
            paymentReference: incomingRefInput.trim(),
            notes: incomingNotesInput.trim()
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Maturity repayment of ₹${numAmt.toLocaleString('en-IN')} confirmed! Now eligible for Maturity Release.`
        });
        setVerifyIncomingTarget(null);
        setSelectedSettlement(null);
        loadData(true);
      } else {
        throw new Error(res?.error || 'Failed to verify incoming maturity repayment');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsVerifyingIncoming(false);
    }
  };

  // Open Payout Release Modal
  const handleOpenReleaseModal = (item: any) => {
    setReleaseTarget(item);
    const amt = item.totalSettlementAmount || item.amountReceivedFromRequester || item.paidAmount || 0;
    setPayoutAmountInput(String(amt));
    setPayoutRefInput(`MAT-PAYOUT-${Date.now().toString().slice(-6)}`);
    setPayoutNotesInput(`Maturity settlement released to investor ${item.investorName}.`);
  };

  const handleConfirmReleasePayout = async () => {
    if (!releaseTarget) return;
    const numAmt = Number(payoutAmountInput);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid positive payout amount.');
      return;
    }
    if (!payoutRefInput.trim()) {
      alert('Please provide a payout transaction reference / UTR.');
      return;
    }

    setIsReleasingPayout(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/maturity-releases/${releaseTarget.investmentId || releaseTarget._id}/release`,
        {
          method: 'POST',
          body: JSON.stringify({
            releaseAmount: numAmt,
            payoutReference: payoutRefInput.trim(),
            notes: payoutNotesInput.trim()
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Maturity payout of ₹${numAmt.toLocaleString('en-IN')} disbursed to ${releaseTarget.investorName}! Cycle COMPLETED.`
        });
        setReleaseTarget(null);
        setSelectedSettlement(null);
        loadData(true);
      } else {
        throw new Error(res?.error || 'Failed to release maturity payout');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsReleasingPayout(false);
    }
  };

  const filteredItems = maturityReleases.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.projectName || '').toLowerCase().includes(q) ||
      (item.fundingRequestRef || '').toLowerCase().includes(q) ||
      (item.investmentId || '').toLowerCase().includes(q) ||
      (item.investorName || '').toLowerCase().includes(q) ||
      (item.fundingRequestorName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span>Maturity Release</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reconcile final borrower repayments, audit principal and yield settlements, and disburse verified maturity capital to investors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
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
          {['ALL', 'READY_FOR_MATURITY_RELEASE', 'REPAYMENT_AWAITING', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
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
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <th className="p-4">Project / Company</th>
                <th className="p-4">Investor (Beneficiary)</th>
                <th className="p-4">Borrower (Payer)</th>
                <th className="p-4">Principal Amount</th>
                <th className="p-4">Total Settlement Due</th>
                <th className="p-4">Borrower Paid</th>
                <th className="p-4">Released to Investor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Loading maturity releases...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    No maturity settlements match the current filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isCompleted = item.status === 'COMPLETED';
                  const isReady = item.status === 'MATURITY_PAYMENT_RECEIVED' || item.releaseStatus === 'READY_FOR_MATURITY_RELEASE';
                  const isAwaiting = item.status === 'MATURITY_PENDING' || item.status === 'ACTIVE';

                  return (
                    <tr key={item._id || item.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.investmentId}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.projectName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {item.fundingRequestRef}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {item.investorName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {item.investorEmail || ''}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {item.fundingRequestorName}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {formatCurrencyINR(item.originalInvestmentPrincipal || item.paidAmount)}
                      </td>
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatCurrencyINR(item.totalSettlementAmount || (item.paidAmount + (item.paidAmount * 0.15)))}
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrencyINR(item.amountReceivedFromRequester || item.maturityAmountReceived || 0)}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {formatCurrencyINR(item.amountReleasedToInvestor || item.maturityAmountReleased || 0)}
                      </td>
                      <td className="p-4">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" />
                            <span>COMPLETED</span>
                          </span>
                        ) : isReady ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" />
                            <span>READY FOR RELEASE</span>
                          </span>
                        ) : isAwaiting ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 w-max block">
                            REPAYMENT AWAITING
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 w-max block">
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View Settlement Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedSettlement(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                          >
                            Details
                          </button>

                          {/* Verify Incoming Repayment from Borrower */}
                          {!isCompleted && !isReady && (
                            <button
                              type="button"
                              onClick={() => handleOpenVerifyIncoming(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px] hover:bg-indigo-100"
                            >
                              Verify Repayment
                            </button>
                          )}

                          {/* Release Maturity Payout to Investor */}
                          {isReady && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleOpenReleaseModal(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                            >
                              Release Payout
                            </button>
                          )}

                          {/* Receipt */}
                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => setReceiptTarget(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] hover:bg-emerald-100"
                            >
                              Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL: VIEW SETTLEMENT DETAILS & RECONCILIATION
         ======================================================== */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                  MATURITY SETTLEMENT AUDIT
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedSettlement.projectName} ({selectedSettlement.investmentId})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSettlement(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Original Principal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {formatCurrencyINR(selectedSettlement.originalInvestmentPrincipal || selectedSettlement.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Return Payable</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {formatCurrencyINR(selectedSettlement.returnPayable || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Total Settlement Due</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrencyINR(selectedSettlement.totalSettlementAmount || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Amount Received from Borrower</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {formatCurrencyINR(selectedSettlement.amountReceivedFromRequester || selectedSettlement.maturityAmountReceived || 0)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 uppercase font-mono text-[10px] block font-bold">Party Details</span>
                <p><b>Investor (Beneficiary):</b> {selectedSettlement.investorName} ({selectedSettlement.investorEmail})</p>
                <p><b>Borrower (Payer):</b> {selectedSettlement.fundingRequestorName}</p>
                <p><b>Maturity Date:</b> {selectedSettlement.maturityDate ? new Date(selectedSettlement.maturityDate).toLocaleDateString() : 'N/A'}</p>
              </div>

              {selectedSettlement.maturityReleaseTxnId && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-300">
                  <span className="text-[10px] font-mono uppercase block font-bold">Payout Transaction Confirmed</span>
                  <span>Txn Ref: {selectedSettlement.maturityReleaseTxnId}</span>
                  <span className="block text-[11px] text-emerald-700 mt-0.5">
                    Settled on: {new Date(selectedSettlement.maturityReleasedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSettlement(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VERIFY INCOMING MATURITY REPAYMENT
         ======================================================== */}
      {verifyIncomingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  CONFIRM BORROWER MATURITY
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Verify Incoming Settlement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyIncomingTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Confirm that borrower <b>{verifyIncomingTarget.fundingRequestorName}</b> has transferred the full maturity capital and returns to the platform escrow account.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Received Amount (₹) *
                </label>
                <input
                  type="number"
                  value={incomingAmountInput}
                  onChange={(e) => setIncomingAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Incoming Bank Reference / UTR *
                </label>
                <input
                  type="text"
                  value={incomingRefInput}
                  onChange={(e) => setIncomingRefInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Audit Remarks
                </label>
                <textarea
                  rows={2}
                  value={incomingNotesInput}
                  onChange={(e) => setIncomingNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setVerifyIncomingTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerifyIncoming}
                disabled={isVerifyingIncoming}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
              >
                {isVerifyingIncoming ? 'Verifying...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INITIATE MATURITY RELEASE PAYOUT TO INVESTOR
         ======================================================== */}
      {releaseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                  AUTHORIZE INVESTOR PAYOUT
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Disburse Maturity to {releaseTarget.investorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReleaseTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Verified Borrower Settlement:</span>
                <span className="font-bold">{formatCurrencyINR(releaseTarget.amountReceivedFromRequester || releaseTarget.totalSettlementAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Beneficiary Investor:</span>
                <span className="font-bold">{releaseTarget.investorName}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  value={payoutAmountInput}
                  onChange={(e) => setPayoutAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Bank Payout Reference / UTR Number *
                </label>
                <input
                  type="text"
                  value={payoutRefInput}
                  onChange={(e) => setPayoutRefInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Settlement Notes
                </label>
                <textarea
                  rows={2}
                  value={payoutNotesInput}
                  onChange={(e) => setPayoutNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReleaseTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReleasePayout}
                disabled={isReleasingPayout}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {isReleasingPayout ? 'Processing...' : 'Confirm & Complete Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PAYOUT RECEIPT
         ======================================================== */}
      {receiptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Maturity Settlement Completed
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {receiptTarget.maturityReleaseTxnId || 'OFFICIAL FIC SETTLEMENT'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Beneficiary Investor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{receiptTarget.investorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{receiptTarget.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settlement Amount Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrencyINR(receiptTarget.maturityAmountReleased || receiptTarget.totalSettlementAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settled On:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {receiptTarget.maturityReleasedAt ? new Date(receiptTarget.maturityReleasedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReceiptTarget(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

