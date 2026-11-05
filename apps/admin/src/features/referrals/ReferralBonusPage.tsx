import React, { useEffect, useState } from 'react';
import {
  Gift,
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Edit3,
  Save,
  X,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { containerVariants, itemVariants } from '../../utils/animations';
import { Skeleton, SkeletonCards } from '../../components/Skeleton';
import { CountUp } from '../../components/CountUp';

interface ReferralSummary {
  config: {
    bonusPerReferral: number;
    currency: string;
    minimumPayoutAmount: number;
    isActive: boolean;
    updatedBy?: string;
    updatedAt: string;
  };
  stats: {
    totalReferrals: number;
    totalPaidBonus: number;
    totalPendingBonus: number;
    currentBonusPerReferral: number;
    activeReferrersCount: number;
  };
  records: Array<{
    _id: string;
    referrerMemberId: string;
    referrerName: string;
    referrerEmail: string;
    referredMemberId: string;
    referredName: string;
    referredEmail: string;
    bonusAmount: number;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
    payoutDate?: string;
    payoutReference?: string;
    notes?: string;
    createdAt: string;
  }>;
  topReferrers: Array<{
    referrerName: string;
    referrerEmail: string;
    count: number;
    totalEarned: number;
    paidAmount: number;
  }>;
}

export const ReferralBonusPage: React.FC = () => {
  const [data, setData] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'APPROVED' | 'PENDING'>('ALL');

  // Edit config state
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editBonusAmount, setEditBonusAmount] = useState<number>(500);
  const [savingConfig, setSavingConfig] = useState(false);

  // Payout confirmation modal
  const [payoutTargetRecord, setPayoutTargetRecord] = useState<any | null>(null);
  const [payoutReference, setPayoutReference] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    loadReferralSummary();
  }, []);

  const loadReferralSummary = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/referrals/summary');
      setData(res);
      if (res?.config) {
        setEditBonusAmount(res.config.bonusPerReferral);
      }
    } catch (err) {
      console.error('Failed to load referral bonus data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await apiFetch('/api/admin/referrals/config', {
        method: 'PATCH',
        body: JSON.stringify({
          bonusPerReferral: Number(editBonusAmount),
        }),
      });
      setIsEditingConfig(false);
      await loadReferralSummary();
    } catch (err: any) {
      alert(`Failed to update referral bonus: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!payoutTargetRecord) return;
    try {
      setProcessingPayout(true);
      await apiFetch(`/api/admin/referrals/record/${payoutTargetRecord._id}/payout`, {
        method: 'PATCH',
        body: JSON.stringify({
          payoutReference: payoutReference.trim() || undefined,
        }),
      });
      setPayoutTargetRecord(null);
      setPayoutReference('');
      await loadReferralSummary();
    } catch (err: any) {
      alert(`Failed to process payout: ${err.message}`);
    } finally {
      setProcessingPayout(false);
    }
  };

  const filteredRecords = data?.records.filter((rec) => {
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.referrerName.toLowerCase().includes(q) ||
      rec.referrerEmail.toLowerCase().includes(q) ||
      rec.referredName.toLowerCase().includes(q) ||
      rec.referredEmail.toLowerCase().includes(q) ||
      (rec.payoutReference && rec.payoutReference.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <Gift className="w-5 h-5" />
            </span>
            <span>Referral Bonus & Rewards Program</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure referral incentives, track acquired members, and manage bonus payouts across the community.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards: Current Bonus Per Referral, Total Referrals Acquired, Total Money Given for Referral */}
      {loading ? (
        <SkeletonCards count={3} gridCols="grid-cols-1 sm:grid-cols-3" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Editable Referral Bonus Amount Per User */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-950 via-[#1e1b4b] to-[#0f172a] text-white border border-indigo-500/30 shadow-xl group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-violet-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 font-mono flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-indigo-400" />
                Referral Amount Per User
              </span>
              {!isEditingConfig && (
                <button
                  onClick={() => setIsEditingConfig(true)}
                  title="Edit Referral Bonus Amount"
                  className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 rounded-lg transition-all text-xs flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Edit</span>
                </button>
              )}
            </div>

            {isEditingConfig ? (
              <div className="mt-3 space-y-2 relative z-10">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-indigo-200">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={editBonusAmount}
                    onChange={(e) => setEditBonusAmount(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 rounded-lg bg-indigo-900/60 border border-indigo-400/50 text-white font-extrabold text-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm"
                    title="Save Amount"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditBonusAmount(data?.config.bonusPerReferral || 500);
                      setIsEditingConfig(false);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-indigo-300">Default reward granted per active referral</p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-3xl font-extrabold tracking-tight text-white flex items-center">
                  ₹<CountUp value={data?.config.bonusPerReferral ?? 500} />
                </p>
                <div className="mt-2.5 flex items-center space-x-2 text-[11px] text-indigo-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Instant bonus credited on verified onboarding</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Total Referrals Got */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-sky-50/70 via-white to-indigo-50/50 dark:from-[#081d2c] dark:via-[#0e1e2d] dark:to-[#141F33] border border-sky-300/60 dark:border-sky-500/30 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 font-mono flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Total Referrals Got
              </span>
              <div className="p-2.5 bg-sky-100/80 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 rounded-xl border border-sky-300/50 dark:border-sky-700/50 shadow-2xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-sky-950 dark:text-sky-100 tracking-tight mt-3">
              <CountUp value={data?.stats.totalReferrals ?? 0} />
              <span className="text-sm font-semibold text-slate-400 ml-1 font-mono">Members</span>
            </p>
            <div className="mt-2.5 flex items-center space-x-2 text-[11px] text-sky-700 dark:text-sky-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span>{data?.stats.activeReferrersCount ?? 0} active ambassadors participating</span>
            </div>
          </div>

          {/* Card 3: Total Money Given for Referral */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-[#062419] dark:via-[#092921] dark:to-[#0c1e24] border border-emerald-300/60 dark:border-emerald-600/30 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Total Referral Money Given
              </span>
              <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 rounded-xl border border-emerald-300/50 dark:border-emerald-700/50 shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight mt-3">
              ₹{(data?.stats.totalPaidBonus ?? 0).toLocaleString('en-IN')}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-300/40 dark:border-emerald-700/40">
                Disbursed to members
              </span>
              {(data?.stats.totalPendingBonus ?? 0) > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                  ₹{(data?.stats.totalPendingBonus ?? 0).toLocaleString('en-IN')} pending
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referrals Ledger & Activity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-primary)]">
              <Gift className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
              Referral Rewards Ledger
            </h3>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search referrer or referee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-primary)]/50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="APPROVED">Approved / Unpaid</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">S.No</th>
                <th className="px-5 py-3.5">Referrer (Ambassador)</th>
                <th className="px-5 py-3.5">Referred Member</th>
                <th className="px-5 py-3.5">Bonus Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Payout Reference / Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                    Loading referral audit records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-mono">
                    No referral entries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      {idx + 1}
                    </td>
                    {/* Referrer */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{rec.referrerName}</p>
                      <span className="text-[11px] text-slate-400 font-mono">{rec.referrerEmail}</span>
                    </td>

                    {/* Referred */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{rec.referredName}</p>
                      <span className="text-[11px] text-slate-400 font-mono">{rec.referredEmail}</span>
                    </td>

                    {/* Bonus Amount */}
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        ₹{rec.bonusAmount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          rec.status === 'PAID'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                            : rec.status === 'APPROVED'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {rec.status === 'PAID' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        )}
                        {rec.status}
                      </span>
                    </td>

                    {/* Payout Reference / Date */}
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {rec.status === 'PAID' ? (
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {rec.payoutReference || 'Completed'}
                          </p>
                          <span className="text-slate-400 text-[10px]">
                            {rec.payoutDate ? new Date(rec.payoutDate).toLocaleDateString('en-IN') : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending payout settlement</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      {rec.status !== 'PAID' ? (
                        <button
                          onClick={() => {
                            setPayoutTargetRecord(rec);
                            setPayoutReference(`REF-PAY-${Date.now().toString().slice(-6)}`);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95"
                        >
                          Disburse ₹{rec.bonusAmount}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                          ✓ Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Payout Modal */}
      <AnimatePresence>
        {payoutTargetRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setPayoutTargetRecord(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800"
            >
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Confirm Bonus Payout
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Disburse <strong className="text-emerald-600 dark:text-emerald-400">₹{payoutTargetRecord.bonusAmount}</strong> to{' '}
                <strong className="text-slate-800 dark:text-slate-200">{payoutTargetRecord.referrerName}</strong> ({payoutTargetRecord.referrerEmail}).
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                    Payment / Transfer Reference ID
                  </label>
                  <input
                    type="text"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder="e.g. UPI-REF-992384"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-5">
                <button
                  onClick={() => setPayoutTargetRecord(null)}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayout}
                  disabled={processingPayout}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {processingPayout ? 'Confirming...' : 'Mark as Paid'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

