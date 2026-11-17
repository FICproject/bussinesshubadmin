import React, { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ShieldCheck,
  FileText,
  AlertCircle,
  Eye,
  RefreshCw,
  Send,
  X,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building,
  Check
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

export const FundReleasePage: React.FC = () => {
  const [fundReleases, setFundReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Disburse Modal
  const [disburseTarget, setDisburseTarget] = useState<any | null>(null);
  const [disburseAmountInput, setDisburseAmountInput] = useState<string>('');
  const [disburseReference, setDisburseReference] = useState<string>('');
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [isDisbursing, setIsDisbursing] = useState<boolean>(false);

  // Manual Verify Payment Modal
  const [verifyTarget, setVerifyTarget] = useState<any | null>(null);
  const [verifyRefInput, setVerifyRefInput] = useState<string>('');
  const [verifyAmountInput, setVerifyAmountInput] = useState<string>('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);

  // Release Receipt Modal
  const [receiptTarget, setReceiptTarget] = useState<any | null>(null);

  const loadReleases = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/funding/fund-releases${qs}`);
      const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
      setFundReleases(list);

      // Auto-sync open modals
      if (selectedRecord) {
        const fresh = list.find((r: any) => (r.investmentId || r._id) === (selectedRecord.investmentId || selectedRecord._id));
        if (fresh) setSelectedRecord(fresh);
      }
    } catch (err: any) {
      console.warn('Failed to load fund releases:', err);
      if (!silent) setLoadError(err.message || 'Failed to connect to backend server');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, selectedRecord]);

  useEffect(() => {
    loadReleases();
  }, [statusFilter]);

  // Real-time synchronization
  useEffect(() => {
    const interval = setInterval(() => loadReleases(true), 6000);
    const onFocus = () => loadReleases(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadReleases]);

  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Open Disburse Modal
  const handleOpenDisburseModal = (item: any) => {
    setDisburseTarget(item);
    const eligibleAmt = item.pendingReleaseAmount || item.eligibleReleaseAmount || item.paidAmount || 0;
    setDisburseAmountInput(String(eligibleAmt));
    setDisburseReference(`BANK-DISB-${Date.now().toString().slice(-6)}`);
    setDisburseNotes(`Capital disbursement to ${item.fundingRequestorName} for ${item.projectName}.`);
  };

  const handleConfirmDisburse = async () => {
    if (!disburseTarget) return;
    const numAmt = Number(disburseAmountInput);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid positive disbursement amount.');
      return;
    }
    if (!disburseReference.trim()) {
      alert('Please provide a banking payout reference / UTR number.');
      return;
    }

    setIsDisbursing(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/fund-releases/${disburseTarget.investmentId || disburseTarget._id}/disburse`,
        {
          method: 'POST',
          body: JSON.stringify({
            disburseAmount: numAmt,
            payoutReference: disburseReference.trim(),
            notes: disburseNotes.trim()
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Capital of ₹${numAmt.toLocaleString('en-IN')} disbursed successfully to ${disburseTarget.fundingRequestorName}!`
        });
        setDisburseTarget(null);
        setSelectedRecord(null);
        loadReleases(true);
      } else {
        throw new Error(res?.error || 'Failed to disburse funds');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsDisbursing(false);
    }
  };

  // Open Verify Payment Modal
  const handleOpenVerifyModal = (item: any) => {
    setVerifyTarget(item);
    setVerifyAmountInput(String(item.approvedAmount || item.requestedAmount || ''));
    setVerifyRefInput(`NEFT-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmVerifyPayment = async () => {
    if (!verifyTarget) return;
    const numAmt = Number(verifyAmountInput);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!verifyRefInput.trim()) {
      alert('Please enter a valid bank transaction reference.');
      return;
    }

    setIsVerifyingPayment(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/fund-releases/${verifyTarget.investmentId || verifyTarget._id}/verify-payment`,
        {
          method: 'POST',
          body: JSON.stringify({
            amountPaid: numAmt,
            paymentReference: verifyRefInput.trim(),
            notes: 'Verified via Admin banking reconciliation.'
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Investor payment of ₹${numAmt.toLocaleString('en-IN')} verified! Now READY FOR RELEASE.`
        });
        setVerifyTarget(null);
        loadReleases(true);
      } else {
        throw new Error(res?.error || 'Failed to verify payment');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const filteredReleases = fundReleases.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.investmentId || '').toLowerCase().includes(q) ||
      (item.fundingRequestRef || '').toLowerCase().includes(q) ||
      (item.projectName || '').toLowerCase().includes(q) ||
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
              <DollarSign className="w-5 h-5" />
            </span>
            <span>Fund Release</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Authorize and execute capital disbursements to verified business borrowers once investor payments have been verified.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReleases()}
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
          {['ALL', 'READY_FOR_RELEASE', 'PAYMENT_PENDING', 'RELEASED'].map((st) => (
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
            placeholder="Search by ID, borrower, investor, or project..."
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
                <th className="p-4">Funding Ref & Project</th>
                <th className="p-4">Investor (Payer)</th>
                <th className="p-4">Borrower (Beneficiary)</th>
                <th className="p-4">Verified Capital</th>
                <th className="p-4">Disbursed Capital</th>
                <th className="p-4">Disbursement Date</th>
                <th className="p-4">Release Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Loading fund releases...
                  </td>
                </tr>
              ) : filteredReleases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    No verified investments pending fund release under current filter.
                  </td>
                </tr>
              ) : (
                filteredReleases.map((item) => {
                  const paid = item.paidAmount || 0;
                  const released = item.releasedAmount || 0;
                  const isReady = paid > 0 && released < paid;
                  const isReleased = released > 0 && released >= paid;
                  const isPendingPay = paid === 0;

                  return (
                    <tr key={item._id || item.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.investmentId}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.projectName}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px] block">
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
                      <td className="p-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {item.fundingRequestorName}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                        {formatCurrencyINR(paid)}
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300 text-sm font-mono">
                        {formatCurrencyINR(released)}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {item.disbursedAt ? new Date(item.disbursedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4">
                        {isReleased ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" />
                            <span>RELEASED</span>
                          </span>
                        ) : isReady ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" />
                            <span>READY FOR RELEASE</span>
                          </span>
                        ) : isPendingPay ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 w-max block">
                            PAYMENT PENDING
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 w-max block">
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View Payment Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                          >
                            Details
                          </button>

                          {/* Verify Payment (if offline bank transfer or unverified) */}
                          {isPendingPay && (
                            <button
                              type="button"
                              onClick={() => handleOpenVerifyModal(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px] hover:bg-indigo-100"
                            >
                              Verify Payment
                            </button>
                          )}

                          {/* Initiate Fund Release (only if verified and not yet released) */}
                          {isReady && (
                            <button
                              type="button"
                              onClick={() => handleOpenDisburseModal(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                            >
                              Disburse Funds
                            </button>
                          )}

                          {/* View Release Receipt */}
                          {isReleased && (
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
          MODAL: VIEW DETAILS
         ======================================================== */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                  FUND DISBURSEMENT AUDIT
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedRecord.projectName} ({selectedRecord.investmentId})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Investor (Payer)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.investorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Borrower (Beneficiary)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.fundingRequestorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Verified Paid Amount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrencyINR(selectedRecord.paidAmount || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Released to Borrower</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {formatCurrencyINR(selectedRecord.releasedAmount || 0)}
                  </span>
                </div>
              </div>

              {selectedRecord.disbursementTxnId && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-300">
                  <span className="text-[10px] font-mono uppercase block font-bold">Disbursement Transaction</span>
                  <span>Txn ID: {selectedRecord.disbursementTxnId}</span>
                  <span className="block text-[11px] text-emerald-700 mt-0.5">
                    Authorized by: {selectedRecord.disbursedBy || 'FIC Admin'} on {new Date(selectedRecord.disbursedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INITIATE FUND RELEASE (DISBURSE)
         ======================================================== */}
      {disburseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                  AUTHORIZE DISBURSEMENT
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Disburse to {disburseTarget.fundingRequestorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDisburseTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Verified Escrow Capital:</span>
                <span className="font-bold">{formatCurrencyINR(disburseTarget.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Beneficiary:</span>
                <span className="font-bold">{disburseTarget.fundingRequestorName}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Disbursement Amount (₹) *
                </label>
                <input
                  type="number"
                  value={disburseAmountInput}
                  onChange={(e) => setDisburseAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Bank Payout Reference / UTR Number *
                </label>
                <input
                  type="text"
                  value={disburseReference}
                  onChange={(e) => setDisburseReference(e.target.value)}
                  placeholder="e.g. UTR1234567890 or IMPS Ref"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Internal Notes / Banking Audit
                </label>
                <textarea
                  rows={2}
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDisburseTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisburse}
                disabled={isDisbursing}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {isDisbursing ? 'Processing...' : 'Confirm & Disburse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: MANUAL VERIFY PAYMENT
         ======================================================== */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  BANK PAYMENT RECONCILIATION
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Verify Investor Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Confirm that investor <b>{verifyTarget.investorName}</b> has successfully transferred funds to the FIC Platform Escrow account via bank transfer.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Received Amount (₹) *
                </label>
                <input
                  type="number"
                  value={verifyAmountInput}
                  onChange={(e) => setVerifyAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Payment Reference / UTR Number *
                </label>
                <input
                  type="text"
                  value={verifyRefInput}
                  onChange={(e) => setVerifyRefInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerifyPayment}
                disabled={isVerifyingPayment}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
              >
                {isVerifyingPayment ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RELEASE RECEIPT
         ======================================================== */}
      {receiptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Disbursement Confirmation Receipt
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {receiptTarget.disbursementTxnId || 'OFFICIAL FIC RECEIPT'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Beneficiary:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{receiptTarget.fundingRequestorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{receiptTarget.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Disbursed Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrencyINR(receiptTarget.releasedAmount || receiptTarget.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Disbursement Date:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {receiptTarget.disbursedAt ? new Date(receiptTarget.disbursedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Authorized By:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{receiptTarget.disbursedBy || 'FIC Platform'}</span>
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
