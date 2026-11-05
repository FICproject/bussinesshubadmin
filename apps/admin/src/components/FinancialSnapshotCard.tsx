import React from 'react';
import { IndianRupee, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FinancialSnapshotProps {
  data: {
    totalRevenue: number;
    mrr: number;
    pendingPaymentsCount: number;
    pendingAmount: number;
  } | null;
}

export const FinancialSnapshotCard: React.FC<FinancialSnapshotProps> = ({ data }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {/* 1. Total Revenue Card - Soft Indigo / Violet matching other light cards */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/payments')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/payments');
          }
        }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-[#1e1b4b]/60 dark:via-[#1a1744] dark:to-[#141b30] border border-indigo-200/80 dark:border-indigo-600/30 shadow-sm group hover:shadow-md hover:border-indigo-400/70 transition-all cursor-pointer select-none"
      >
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-mono">
            Total Collected Revenue
          </span>
          <div className="p-2.5 bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-300/50 dark:border-indigo-700/50 rounded-xl shadow-2xs group-hover:scale-110 transition-transform">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-extrabold tracking-tight mt-3 text-indigo-950 dark:text-indigo-100">
          ₹{(data?.totalRevenue ?? 65980).toLocaleString('en-IN')}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-100/60 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-300/40 dark:border-indigo-700/40 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ₹99 Intro + ₹5,999 Renewals
          </span>
          <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
            View ledger &rarr;
          </span>
        </div>
      </div>

      {/* 2. MRR Card - Emerald / Mint Growth Theme */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/payments')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/payments');
          }
        }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-[#062419] dark:via-[#092921] dark:to-[#0c1e24] border border-emerald-300/60 dark:border-emerald-600/30 shadow-sm group hover:shadow-md hover:border-emerald-400/70 transition-all cursor-pointer select-none"
      >
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            Monthly Recurring (MRR)
          </span>
          <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 rounded-xl border border-emerald-300/50 dark:border-emerald-700/50 shadow-2xs group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight mt-3">
          ₹{(data?.mrr ?? 12400).toLocaleString('en-IN')}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300/40 dark:border-emerald-700/40 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            +18.4% from last billing cycle
          </span>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity">
            Details &rarr;
          </span>
        </div>
      </div>

      {/* 3. Pending Dues Card - Amber / Sunset Caution Theme */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/payments')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/payments');
          }
        }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 dark:from-[#2a1705] dark:via-[#261608] dark:to-[#1a1309] border border-amber-300/60 dark:border-amber-600/30 shadow-sm group hover:shadow-md hover:border-amber-400/70 transition-all cursor-pointer select-none"
      >
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
            Pending Dues / Receivables
          </span>
          <div className="p-2.5 bg-amber-100/80 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 rounded-xl border border-amber-300/50 dark:border-amber-700/50 shadow-2xs group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 tracking-tight mt-3">
          ₹{(data?.pendingAmount ?? 297).toLocaleString('en-IN')}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-100/60 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300/40 dark:border-amber-700/40 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {data?.pendingPaymentsCount ?? 3} members pending renewal
          </span>
          <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
            Review dues &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};

