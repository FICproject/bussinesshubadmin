import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Search, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { rowVariants } from '../../utils/animations';
import { MemberDetailModal } from '../../components/MemberDetailModal';
import { SkeletonTable } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';

export const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  // Member Detail Modal
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { showAlert, showConfirm } = useDialog();

  useEffect(() => {
    loadMembers();
  }, [statusFilter]);

  const loadMembers = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      let url = `/api/admin/members?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await apiFetch(url);
      const approvedOnly = Array.isArray(data) ? data.filter((m: any) => m.kycStatus === 'APPROVED') : [];
      setMembers(approvedOnly);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const handleStatusToggle = async (member: any) => {
    const isEligible = member.kycStatus === 'APPROVED' && member.paymentStatus === 'PAID';
    if (member.status !== 'ACTIVE' && !isEligible) {
      await showAlert(
        'Cannot grant Active Privilege. Member KYC must be approved in KYC Verification first before activating the account.',
        {
          title: 'KYC Approval Required',
          severity: 'warning'
        }
      );
      return;
    }

    const currentStatus = member.status;
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const memberId = member._id;
    
    // Optimistic local update so toggle switch moves instantaneously without skeleton flash
    setMembers((prev) =>
      prev.map((m) => (m._id === memberId ? { ...m, status: nextStatus } : m))
    );

    try {
      await apiFetch(`/api/admin/members/${memberId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, reason: 'Quick toggle by admin' }),
      });
      // Silent background refresh without triggering the full table loading skeleton
      loadMembers(false);
    } catch (err: any) {
      // Rollback on failure
      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, status: currentStatus } : m))
      );
      await showAlert(`Error toggling member: ${err.message}`, {
        title: 'Status Update Error',
        severity: 'danger',
      });
    }
  };

  const handleBlock = async (memberId: string) => {
    const confirmed = await showConfirm(
      'Are you sure you want to block this member? Their account access and listings will be revoked.',
      {
        title: 'Block Member Access',
        severity: 'danger',
        confirmText: 'Block Member',
        cancelText: 'Cancel',
      }
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/api/admin/members/${memberId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'BLOCKED', reason: 'Blocked by admin' }),
      });
      loadMembers();
    } catch (err: any) {
      await showAlert(`Error blocking member: ${err.message}`, {
        title: 'Block Member Failed',
        severity: 'danger',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <Users className="w-5 h-5" />
            </span>
            <span>Members Directory</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track enrolled members, membership fees, KYC compliance, and account privileges.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMembers()}
              placeholder="Search member, email..."
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 w-52 transition-all"
            />
          </div>

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
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Approved Members</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">S.No</th>
                <th className="px-6 py-3.5">Member / Business</th>
                <th className="px-6 py-3.5">Primary Category</th>
                <th className="px-6 py-3.5">Membership Fee</th>
                <th className="px-6 py-3.5">KYC Status</th>
                <th className="px-6 py-3.5">Active Privilege</th>
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
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No members found matching filter criteria.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {members.map((m, idx) => (
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
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {m.email} • {m.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {m.primaryCategoryName || m.primaryCategory?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          ₹{m.membershipFeePaid} ({m.paymentStatus})
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-transform hover:scale-105 inline-block ${
                            m.kycStatus === 'APPROVED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : m.kycStatus === 'REJECTED'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {m.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {/* iOS-Style Smooth Physics Toggle Switch */}
                        {(() => {
                          const isEligible = m.kycStatus === 'APPROVED' && m.paymentStatus === 'PAID';
                          const isPrivilegeActive = m.status === 'ACTIVE' && isEligible;
                          const displayLabel =
                            m.status === 'SUSPENDED'
                              ? 'SUSPENDED'
                              : m.status === 'BLOCKED'
                              ? 'BLOCKED'
                              : isPrivilegeActive
                              ? 'ACTIVE'
                              : m.kycStatus === 'SUBMITTED'
                              ? 'UNDER REVIEW'
                              : m.kycStatus === 'RESUBMISSION_REQUESTED'
                              ? 'RESUBMISSION'
                              : 'PENDING KYC';

                          return (
                            <div className="flex items-center space-x-2.5">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isPrivilegeActive}
                                onClick={() => handleStatusToggle(m)}
                                disabled={!isEligible && m.status !== 'SUSPENDED' && m.status !== 'BLOCKED'}
                                title={
                                  !isEligible
                                    ? 'Member KYC must be approved in KYC Verification before activating account'
                                    : isPrivilegeActive
                                    ? 'Click to suspend member'
                                    : 'Click to activate member'
                                }
                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 shadow-inner ${
                                  !isEligible && m.status !== 'SUSPENDED' && m.status !== 'BLOCKED'
                                    ? 'opacity-60 cursor-not-allowed bg-[#E9E9EB] dark:bg-[#2A2A2E]'
                                    : isPrivilegeActive
                                    ? 'bg-[#34C759]' // Apple iOS Switch Active Green
                                    : 'bg-[#E9E9EB] dark:bg-[#39393D]' // Apple iOS Switch Inactive Off-Gray
                                }`}
                              >
                                <motion.span
                                  animate={{
                                    x: isPrivilegeActive ? 20 : 0,
                                  }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 600,
                                    damping: 35,
                                    mass: 0.8,
                                  }}
                                  className="pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_1px_1px_rgba(0,0,0,0.1)] ring-0 will-change-transform"
                                />
                              </button>
                              <span
                                className={`text-[11px] font-semibold transition-colors duration-200 ${
                                  isPrivilegeActive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : m.status === 'SUSPENDED' || m.status === 'BLOCKED'
                                    ? 'text-rose-500 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {displayLabel}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* View Action Button */}
                        <button
                          onClick={() => setSelectedMemberId(m._id)}
                          title="View Full Profile, Services & KYC"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/80 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-2xs hover:shadow-xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      <AnimatePresence>
        {selectedMemberId && (
          <MemberDetailModal
            memberId={selectedMemberId}
            onClose={() => setSelectedMemberId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
