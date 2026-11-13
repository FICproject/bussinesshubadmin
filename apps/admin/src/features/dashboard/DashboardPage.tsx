import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ShieldCheck, Users, Briefcase, GitPullRequest, ArrowUpRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { containerVariants, itemVariants } from '../../utils/animations';
import { CountUp } from '../../components/CountUp';
import { GlobalSearch } from '../../components/GlobalSearch';
import { FinancialSnapshotCard } from '../../components/FinancialSnapshotCard';
import { QuickActionToolbar } from '../../components/QuickActionToolbar';
import { SystemHealthCard } from '../../components/SystemHealthCard';
import { useNavigate } from 'react-router-dom';
import { Skeleton, SkeletonCards } from '../../components/Skeleton';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    try {
      const [statsData, finData] = await Promise.all([
        apiFetch('/api/admin/dashboard/stats'),
        apiFetch('/api/admin/dashboard/financial-stats'),
      ]);
      setStats(statsData);
      setFinancials(finData);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <SkeletonCards count={3} gridCols="grid-cols-1 sm:grid-cols-3" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <SkeletonCards count={4} gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-8">
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Pending KYC Review',
      numericValue: stats?.pendingKyc ?? 0,
      icon: ShieldCheck,
      cardGradient: 'bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 dark:from-[#211604] dark:via-[#19150f] dark:to-[#141F33] border-amber-200/70 dark:border-amber-500/30',
      iconBox: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50',
      description: 'Awaiting compliance check',
      path: '/kyc?status=SUBMITTED',
    },
    {
      title: 'Service Listings in Queue',
      numericValue: stats?.pendingServices ?? 0,
      icon: Briefcase,
      cardGradient: 'bg-gradient-to-br from-sky-50/60 via-white to-sky-50/20 dark:from-[#081d2c] dark:via-[#0e1e2d] dark:to-[#141F33] border-sky-200/70 dark:border-sky-500/30',
      iconBox: 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-300/60 dark:border-sky-700/50',
      description: 'Moderate provider details',
      path: '/services?status=PENDING_APPROVAL',
    },
    {
      title: 'Active FIC Requests',
      numericValue: stats?.pendingRequests ?? 0,
      icon: GitPullRequest,
      cardGradient: 'bg-gradient-to-br from-violet-50/60 via-white to-purple-50/20 dark:from-[#1b1035] dark:via-[#19150b] dark:to-[#141F33] border-violet-200/70 dark:border-violet-500/30',
      iconBox: 'bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 border border-violet-300/60 dark:border-violet-700/50',
      description: 'Intermediary leads & inquiries',
      path: '/requests?status=ACTIVE',
    },
    {
      title: 'Total Enrolled Members',
      numericValue: stats?.activeMembers ?? 0,
      totalContext: ` / ${stats?.totalMembers ?? 0}`,
      icon: Users,
      cardGradient: 'bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/20 dark:from-[#062419] dark:via-[#0d221c] dark:to-[#141F33] border-emerald-200/70 dark:border-emerald-500/30',
      iconBox: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/50',
      description: 'Active vs Registered Total',
      path: '/members?status=ALL',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4. Global Search Bar & Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <LayoutDashboard className="w-5 h-5" />
            </span>
            <span>Executive Operations Overview</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time management console, multi-category workflows, and financial metrics.
          </p>
        </div>

        {/* Global Search Component */}
        <GlobalSearch />
      </div>

      {/* 1. Revenue & Financial Snapshot Card */}
      <FinancialSnapshotCard data={financials} />

      {/* 2. Quick Action Toolbar */}
      <QuickActionToolbar
        onScheduleMeeting={() => navigate('/meetings')}
        onAddStaff={() => navigate('/staff')}
      />

      {/* Operational KPI Metric Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(card.path);
                }
              }}
              className={`rounded-2xl p-5 border shadow-sm hover:shadow-lg transition-all group cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-primary)]/50 ${card.cardGradient}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl transition-all ${card.iconBox} shadow-2xs group-hover:scale-110`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  <CountUp value={card.numericValue} />
                  {card.totalContext && (
                    <span className="text-sm text-slate-400 font-semibold font-mono">{card.totalContext}</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                  <span className="flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-slate-400 group-hover:text-[var(--accent-secondary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    {card.description}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    View &rarr;
                  </span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. System Health & Infrastructure Card + Activity Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: System Diagnostic Card */}
        <div className="lg:col-span-4 space-y-4">
          <SystemHealthCard />
        </div>

        {/* Right Column: Live Audit Stream */}
        <div className="lg:col-span-8 panel-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-primary)]">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider font-mono">
                Live Administrative Audit Stream
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Real-time ledger</span>
          </div>

          <div className="divide-y divide-[var(--border-primary)]">
            <AnimatePresence initial={false}>
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.slice(0, 6).map((log: any) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
                        {log.action}
                      </span>
                      <span className="text-[var(--text-primary)] font-semibold">{log.entityType}</span>
                      <span className="text-[var(--text-muted)] font-mono text-[11px]">
                        ({log.entityId?.substring(0, 8)}...)
                      </span>
                    </div>
                    <div className="text-right text-[var(--text-muted)] text-[11px] font-mono">
                      <span className="font-semibold text-[var(--text-secondary)]">{log.adminName}</span>
                      <span className="mx-2 text-[var(--border-primary)]">•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] font-mono">No recent actions logged.</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
