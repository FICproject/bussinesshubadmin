import React, { useEffect, useRef, useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Eye,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Save,
  Lock,
  History,
  Sparkles,
  Check,
  Landmark,
  Building2,
  Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { SkeletonTable } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const requestSeqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Pricing configuration state
  const [pricingConfig, setPricingConfig] = useState({
    firstYearMembershipFee: 99,
    renewalMembershipFee: 5999,
    referralRewardAmount: 500,
    referralProgramEnabled: true,
    minWithdrawalAmount: 500,
    pricingVersion: 1
  });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState('');
  const [pricingErrorMsg, setPricingErrorMsg] = useState('');
  const [pricingAuditLogs, setPricingAuditLogs] = useState<any[]>([]);
  const [showPricingLogsModal, setShowPricingLogsModal] = useState(false);

  // FIC Receiving Bank Account configuration state
  const [receivingBank, setReceivingBank] = useState<any | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showBankLogsModal, setShowBankLogsModal] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    accountNumberConfirm: '',
    ifscCode: '',
    branchName: '',
    accountType: 'CURRENT',
    upiId: '',
    status: 'ACTIVE',
    notes: ''
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankErrorMsg, setBankErrorMsg] = useState('');
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  useEffect(() => {
    loadPricing();
    loadReceivingBank();
  }, []);

  const loadPricing = async () => {
    setPricingLoading(true);
    try {
      const res = await apiFetch('/api/admin/config/pricing');
      const cfg = res?.config || res?.data?.config || (res?.firstYearMembershipFee !== undefined ? res : null);
      if (cfg) {
        setPricingConfig({
          firstYearMembershipFee: Number(cfg.firstYearMembershipFee || 99),
          renewalMembershipFee: Number(cfg.renewalMembershipFee || 5999),
          referralRewardAmount: Number(cfg.referralRewardAmount || 500),
          referralProgramEnabled: Boolean(cfg.referralProgramEnabled !== false),
          minWithdrawalAmount: Number(cfg.minWithdrawalAmount || 500),
          pricingVersion: Number(cfg.pricingVersion || 1)
        });
      }
      const logs = res?.auditLogs || res?.data?.auditLogs;
      if (Array.isArray(logs)) {
        setPricingAuditLogs(logs);
      }
    } catch (err: any) {
      console.error('Failed to load pricing config', err);
    } finally {
      setPricingLoading(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    const fy = Number(pricingConfig.firstYearMembershipFee);
    const rn = Number(pricingConfig.renewalMembershipFee);
    if (!fy || fy <= 0) {
      setPricingErrorMsg('First Year Membership amount must be a positive number greater than 0.');
      return;
    }
    if (!rn || rn <= 0) {
      setPricingErrorMsg('Renewal Membership amount must be a positive number greater than 0.');
      return;
    }

    setPricingSaving(true);
    setPricingSuccessMsg('');
    setPricingErrorMsg('');
    try {
      const res = await apiFetch('/api/admin/config/pricing', {
        method: 'PUT',
        body: JSON.stringify(pricingConfig)
      });
      // apiFetch returns data.data (the updated config object directly)
      const updatedConfig = res?.data || res;
      if (updatedConfig && (updatedConfig._id || updatedConfig.firstYearMembershipFee !== undefined || res?.success)) {
        setPricingSuccessMsg('Membership pricing updated successfully.');
        setPricingConfig({
          firstYearMembershipFee: Number(updatedConfig.firstYearMembershipFee || fy),
          renewalMembershipFee: Number(updatedConfig.renewalMembershipFee || rn),
          referralRewardAmount: Number(updatedConfig.referralRewardAmount || pricingConfig.referralRewardAmount),
          referralProgramEnabled: Boolean(updatedConfig.referralProgramEnabled !== false),
          minWithdrawalAmount: Number(updatedConfig.minWithdrawalAmount || pricingConfig.minWithdrawalAmount),
          pricingVersion: Number(updatedConfig.pricingVersion || pricingConfig.pricingVersion || 1)
        });
        await loadPricing();
        setTimeout(() => setPricingSuccessMsg(''), 5000);
      } else {
        setPricingErrorMsg(res?.error || 'Failed to update pricing configuration');
      }
    } catch (err: any) {
      setPricingErrorMsg(err.message || 'Failed to update pricing configuration');
    } finally {
      setPricingSaving(false);
    }
  };

  const loadReceivingBank = async () => {
    setBankLoading(true);
    try {
      const res = await apiFetch('/api/admin/funding/receiving-bank');
      const data = res?.data || res;
      if (data && (data.bankName || data.accountNumberMasked)) {
        setReceivingBank(data);
        setBankFormData({
          accountHolderName: data.accountHolderName || '',
          bankName: data.bankName || '',
          accountNumber: '',
          accountNumberConfirm: '',
          ifscCode: data.ifscCode || '',
          branchName: data.branchName || '',
          accountType: data.accountType || 'CURRENT',
          upiId: data.upiId || '',
          status: data.status || 'ACTIVE',
          notes: data.notes || ''
        });
      }
    } catch (err: any) {
      console.error('Failed to load receiving bank', err);
    } finally {
      setBankLoading(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankErrorMsg('');
    setBankSuccessMsg('');

    if (!bankFormData.bankName.trim() || !bankFormData.accountHolderName.trim() || !bankFormData.ifscCode.trim()) {
      setBankErrorMsg('Please fill in Bank Name, Account Holder Name, and IFSC Code.');
      return;
    }

    if (bankFormData.accountNumber) {
      if (bankFormData.accountNumber !== bankFormData.accountNumberConfirm) {
        setBankErrorMsg('Account numbers do not match.');
        return;
      }
      if (bankFormData.accountNumber.length < 8) {
        setBankErrorMsg('Account number must be at least 8 digits.');
        return;
      }
    }

    setBankSaving(true);
    try {
      const payload: any = {
        bankName: bankFormData.bankName.trim(),
        accountHolderName: bankFormData.accountHolderName.trim(),
        ifscCode: bankFormData.ifscCode.trim().toUpperCase(),
        branchName: bankFormData.branchName.trim(),
        accountType: bankFormData.accountType,
        upiId: bankFormData.upiId.trim(),
        status: bankFormData.status,
        notes: bankFormData.notes.trim()
      };
      if (bankFormData.accountNumber) {
        payload.accountNumber = bankFormData.accountNumber.trim();
        payload.accountNumberConfirm = bankFormData.accountNumberConfirm.trim();
      }

      const res = await apiFetch('/api/admin/funding/receiving-bank', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res?.success || res?.data) {
        setBankSuccessMsg('FIC Receiving Bank Account updated successfully.');
        setShowEditBankModal(false);
        await loadReceivingBank();
        setTimeout(() => setBankSuccessMsg(''), 5000);
      } else {
        setBankErrorMsg(res?.message || 'Failed to update receiving bank account.');
      }
    } catch (err: any) {
      setBankErrorMsg(err.message || 'Failed to update receiving bank account.');
    } finally {
      setBankSaving(false);
    }
  };

  // Debounce live search and reset to first page when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadPayments(page, statusFilter, debouncedSearch);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [statusFilter, page, debouncedSearch]);

  const loadPayments = async (targetPage = page, targetStatus = statusFilter, targetSearch = debouncedSearch) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const seq = ++requestSeqRef.current;
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.set('paginated', 'true');
      params.set('status', targetStatus);
      params.set('page', String(targetPage));
      params.set('limit', '20');
      if (targetSearch.trim()) {
        params.set('search', targetSearch.trim());
      }

      const res = await apiFetch(`/api/admin/payments?${params.toString()}`, {
        signal: controller.signal
      });
      if (seq !== requestSeqRef.current) return; // Ignore stale out-of-order response

      if (Array.isArray(res)) {
        setPayments(res);
        setPagination({
          page: 1,
          limit: 20,
          total: res.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        setPayments(Array.isArray(res?.items) ? res.items : []);
        if (res?.pagination) setPagination(res.pagination);
        if (res?.statusCounts) setStatusCounts(res.statusCounts);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (seq === requestSeqRef.current) {
        console.error('Failed to load payments', err);
        setErrorMsg(err?.message || 'Failed to load payment records.');
      }
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = (nextStatus: string) => {
    setPage(1);
    setStatusFilter(nextStatus);
  };

  const getReceiptLookupId = (p: any): string =>
    String(p.paymentId || p.razorpayPaymentId || p.razorpayOrderId || p.internalOrderId || p._id || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </span>
            <span>Payments & Subscriptions</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit Razorpay Test Mode orders, dynamic membership fees, renewals, wallet top-ups, HMAC signatures, and webhook confirmations.
          </p>
        </div>
      </div>

      {/* Dynamic Membership Pricing & Referral Reward Configuration Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>Dynamic Membership Pricing & Referral Configuration</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-mono font-medium">
                  v{pricingConfig.pricingVersion || 1}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authoritative platform pricing stored in MongoDB. Updates apply instantly to new registrations and renewals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono">
                <Lock className="w-3.5 h-3.5" />
                View Only: Only authorized Admin can update pricing.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Write Mode
              </span>
            )}

            {pricingAuditLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPricingLogsModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Audit Logs ({pricingAuditLogs.length})</span>
              </button>
            )}
          </div>
        </div>

        {pricingSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pricingSuccessMsg}</span>
          </div>
        )}

        {pricingErrorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{pricingErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSavePricing} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Field A: First Year Membership Fee */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                1st Year Membership Fee *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  disabled={pricingSaving}
                  value={pricingConfig.firstYearMembershipFee}
                  onChange={(e) =>
                    setPricingConfig({ ...pricingConfig, firstYearMembershipFee: Number(e.target.value) })
                  }
                  required
                  className={`w-full pl-8 pr-3 py-2 text-sm font-black rounded-lg border text-slate-900 dark:text-slate-100 ${
                    'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none'
                  }`}
                />
              </div>
              <span className="text-[10.5px] text-slate-400 block font-sans">
                Default: ₹99. Charged during registration checkout.
              </span>
            </div>

            {/* Field B: Second Year Onwards Renewal Fee */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                Year 2+ Renewal Fee *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  disabled={pricingSaving}
                  value={pricingConfig.renewalMembershipFee}
                  onChange={(e) =>
                    setPricingConfig({ ...pricingConfig, renewalMembershipFee: Number(e.target.value) })
                  }
                  required
                  className={`w-full pl-8 pr-3 py-2 text-sm font-black rounded-lg border text-slate-900 dark:text-slate-100 ${
                    'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none'
                  }`}
                />
              </div>
              <span className="text-[10.5px] text-slate-400 block font-sans">
                Default: ₹5,999. Deducted for wallet or gateway renewals.
              </span>
            </div>

            {/* Field C: Referral Reward Amount */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                Referral Reward (per Member) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="25"
                  disabled={pricingSaving}
                  value={pricingConfig.referralRewardAmount}
                  onChange={(e) =>
                    setPricingConfig({ ...pricingConfig, referralRewardAmount: Number(e.target.value) })
                  }
                  required
                  className={`w-full pl-8 pr-3 py-2 text-sm font-black rounded-lg border text-slate-900 dark:text-slate-100 ${
                    'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none'
                  }`}
                />
              </div>
              <span className="text-[10.5px] text-slate-400 block font-sans">
                Default: ₹500. Credited upon Admin reward approval.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Audit Safety Guarantee:</strong> Price updates do not alter past transactions, receipts, or historical ledger entries. Only future registrations and renewals will use updated values.
            </div>

            <div className="flex items-center gap-2">
              {isSuperAdmin ? (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed flex items-center gap-2 border border-slate-300 dark:border-slate-700"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Save Disabled (Super Admin View Only)</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={pricingSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{pricingSaving ? 'Saving Configuration...' : 'Save Pricing Configuration'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Pricing Audit Logs Modal */}
      {showPricingLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Membership Pricing Audit Trail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPricingLogsModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {pricingAuditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 font-mono">
                  No pricing changes recorded yet. Initial defaults are active.
                </p>
              ) : (
                pricingAuditLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {log.adminName || 'Admin'} ({log.adminRole || 'ADMIN'})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Recently'}
                      </span>
                    </div>
                    {log.details && (
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[9.5px]">1st Year Fee:</span>
                          <span>
                            ₹{log.details.previous?.firstYearMembershipFee ?? '99'} &rarr;{' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              ₹{log.details.updated?.firstYearMembershipFee}
                            </strong>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9.5px]">Renewal Fee:</span>
                          <span>
                            ₹{log.details.previous?.renewalMembershipFee ?? '5999'} &rarr;{' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              ₹{log.details.updated?.renewalMembershipFee}
                            </strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowPricingLogsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIC Official Receiving Bank Account Configuration Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>FIC Official Receiving Bank Account</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Treasury Settlement
                </span>
                {receivingBank?.status === 'ACTIVE' ? (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Active & Receiving
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Inactive
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official centralized banking destination for member investment collections, funding disbursements, and return settlements.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {receivingBank?.auditLogs && receivingBank.auditLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBankLogsModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-blue-500" />
                <span>Audit Logs ({receivingBank.auditLogs.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setBankErrorMsg('');
                setShowEditBankModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Configure Receiving Bank</span>
            </button>
          </div>
        </div>

        {bankSuccessMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bankSuccessMsg}</span>
          </div>
        )}

        {bankLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">
            Loading receiving bank specifications...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Bank Card 1: Account Holder & Bank */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                Bank & Entity Name
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{receivingBank?.bankName || 'Forge India Connect Treasury'}</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {receivingBank?.accountHolderName || 'Forge India Connect Pvt. Ltd.'}
              </p>
              <span className="text-[10px] text-slate-400 block pt-1 font-mono">
                Type: {receivingBank?.accountType || 'CURRENT'} ACCOUNT
              </span>
            </div>

            {/* Bank Card 2: Masked Account Number */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                Settlement Account Number
              </span>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>{receivingBank?.accountNumberMasked || '•••• •••• •••• 5678'}</span>
              </p>
              <div className="pt-1 flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Masked & Audit Safe</span>
              </div>
            </div>

            {/* Bank Card 3: IFSC & Branch */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                IFSC Code & Branch
              </span>
              <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {receivingBank?.ifscCode || 'HDFC0001234'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {receivingBank?.branchName || 'Central Treasury, Bangalore'}
              </p>
            </div>

            {/* Bank Card 4: UPI ID & Notes */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                Treasury UPI ID
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {receivingBank?.upiId || 'fic.treasury@hdfcbank'}
              </p>
              <p className="text-[10.5px] text-slate-400 leading-snug pt-1 truncate">
                {receivingBank?.notes || 'Default centralized payout & collection ledger'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Receiving Bank Account Modal */}
      {showEditBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Configure FIC Receiving Bank Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBankModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bankErrorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bankErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBank} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankFormData.bankName}
                    onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Account Type *
                  </label>
                  <select
                    value={bankFormData.accountType}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CURRENT">CURRENT</option>
                    <option value="SAVINGS">SAVINGS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={bankFormData.accountHolderName}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
                  placeholder="e.g. Forge India Connect Private Limited"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    New Account Number (leave blank to keep {receivingBank?.accountNumberMasked || 'current'})
                  </label>
                  <input
                    type="password"
                    value={bankFormData.accountNumber}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                    placeholder="Enter new account number"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Confirm Account Number
                  </label>
                  <input
                    type="text"
                    value={bankFormData.accountNumberConfirm}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountNumberConfirm: e.target.value })}
                    placeholder="Re-enter to confirm"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankFormData.ifscCode}
                    onChange={(e) => setBankFormData({ ...bankFormData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankFormData.branchName}
                    onChange={(e) => setBankFormData({ ...bankFormData, branchName: e.target.value })}
                    placeholder="e.g. Koramangala Branch, Bangalore"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Treasury UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={bankFormData.upiId}
                    onChange={(e) => setBankFormData({ ...bankFormData, upiId: e.target.value })}
                    placeholder="e.g. fic.treasury@hdfcbank"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={bankFormData.status}
                    onChange={(e) => setBankFormData({ ...bankFormData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Internal Treasury Notes
                </label>
                <textarea
                  rows={2}
                  value={bankFormData.notes}
                  onChange={(e) => setBankFormData({ ...bankFormData, notes: e.target.value })}
                  placeholder="Add any administrative notes regarding this account..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{bankSaving ? 'Saving...' : 'Save Bank Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Audit Logs Modal */}
      {showBankLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  FIC Receiving Bank Audit Trail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBankLogsModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(!receivingBank?.auditLogs || receivingBank.auditLogs.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-6 font-mono">
                  No bank changes recorded yet. Initial configuration active.
                </p>
              ) : (
                receivingBank.auditLogs.map((log: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {log.adminName || 'Admin'} &bull;{' '}
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                          {log.action}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Recently'}
                      </span>
                    </div>
                    {log.changes && (
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 pt-1">
                        <pre className="text-[10px] bg-slate-100 dark:bg-slate-900 p-2 rounded-lg overflow-x-auto">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowBankLogsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setDebouncedSearch(search);
                loadPayments(1, statusFilter, search);
              }
            }}
            placeholder="Search member, pay_*, order_*, ref..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status:</span>
          <select
            aria-label="Filter payments by status"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">
              All Payments{typeof statusCounts.ALL === 'number' ? ` (${statusCounts.ALL})` : ''}
            </option>
            <option value="SUCCESS">
              Success{typeof statusCounts.SUCCESS === 'number' ? ` (${statusCounts.SUCCESS})` : ''}
            </option>
            <option value="PENDING">
              Pending{typeof statusCounts.PENDING === 'number' ? ` (${statusCounts.PENDING})` : ''}
            </option>
            <option value="FAILED">
              Failed{typeof statusCounts.FAILED === 'number' ? ` (${statusCounts.FAILED})` : ''}
            </option>
            <option value="CANCELLED">
              Cancelled{typeof statusCounts.CANCELLED === 'number' ? ` (${statusCounts.CANCELLED})` : ''}
            </option>
            <option value="REFUNDED">
              Refunded{typeof statusCounts.REFUNDED === 'number' ? ` (${statusCounts.REFUNDED})` : ''}
            </option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => loadPayments(page, statusFilter, debouncedSearch)}
            className="font-bold underline ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">S.No</th>
                <th className="px-5 py-3.5">Member / Business</th>
                <th className="px-5 py-3.5">Amount & Purpose</th>
                <th className="px-5 py-3.5">Razorpay Refs & Order</th>
                <th className="px-5 py-3.5">Method & Verification</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <SkeletonTable rows={5} cols={8} />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center space-y-2">
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      No matching payment records found
                    </div>
                    <p className="text-xs text-slate-400">
                      {statusFilter !== 'ALL' || debouncedSearch.trim()
                        ? `No ${statusFilter === 'ALL' ? '' : statusFilter + ' '}transactions match your current filter${debouncedSearch.trim() ? ` for "${debouncedSearch.trim()}"` : ''}.`
                        : 'Verified and pending payment records will appear here.'}
                    </p>
                    {(statusFilter !== 'ALL' || search.trim() !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('ALL');
                          setSearch('');
                          setDebouncedSearch('');
                          setPage(1);
                        }}
                        className="mt-1 inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => (
                  <tr
                    key={p._id || p.paymentId || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                  >
                      <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.memberId?.name || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {p.memberId?.email}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                          {(p.purpose || p.paymentType || '').replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-mono text-slate-800 dark:text-slate-200">
                          {p.razorpayPaymentId || p.gatewayTransactionId}
                        </div>
                        {p.razorpayOrderId && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Order: {p.razorpayOrderId}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                            {p.paymentMethod || p.gatewayProvider || 'RAZORPAY'}
                          </span>
                          {p.signatureVerified && (
                            <span
                              title="HMAC-SHA256 signature verified"
                              className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>HMAC</span>
                            </span>
                          )}
                          {p.webhookVerified && (
                            <span
                              title="Razorpay Webhook Verified"
                              className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>WH</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : p.status === 'PENDING'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.status === 'FAILED' && p.failureReason && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-[180px] truncate" title={p.failureReason}>
                            {p.failureReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/payments/${encodeURIComponent(getReceiptLookupId(p))}/receipt`)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 font-semibold transition-colors"
                          >
                            <span>Receipt</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(p)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>
            {' - '}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-bold text-slate-900 dark:text-slate-100">{pagination.total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="font-mono font-semibold px-2">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Transaction Detail Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Razorpay Payment Audit Record
                </h3>
                <p className="text-xs text-slate-500">
                  Mode: {selectedPayment.mode || 'TEST'} · {selectedPayment.gatewayProvider}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Member</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedPayment.memberId?.name || 'Customer'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Amount</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₹{Number(selectedPayment.amount || 0).toLocaleString('en-IN')} ({selectedPayment.currency || 'INR'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Internal Order ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                  {selectedPayment.internalOrderId || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Razorpay Order ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                  {selectedPayment.razorpayOrderId || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Razorpay Payment ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                  {selectedPayment.razorpayPaymentId || selectedPayment.gatewayTransactionId || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Method</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase">
                  {selectedPayment.paymentMethod || selectedPayment.gatewayProvider}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Signature Verified</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPayment.signatureVerified ? 'Yes (HMAC-SHA256)' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Webhook Verified</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {selectedPayment.webhookVerified ? 'Yes (X-Razorpay-Signature)' : 'Not received / N/A'}
                </span>
              </div>
              {selectedPayment.failureReason && (
                <div className="col-span-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{selectedPayment.failureReason}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetId = getReceiptLookupId(selectedPayment);
                  setSelectedPayment(null);
                  navigate(`/payments/${encodeURIComponent(targetId)}/receipt`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
              >
                <span>Open Official Receipt</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
