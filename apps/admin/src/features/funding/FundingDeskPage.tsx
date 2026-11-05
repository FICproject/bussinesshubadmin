import React, { useEffect, useState } from 'react';
import {
  Coins,
  IndianRupee,
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Percent,
  Sparkles,
  Building,
  Video,
  Eye,
  AlertCircle,
  Layers,
  Users,
  Wallet,
  PiggyBank,
  Check,
  Send,
  ShieldCheck,
  BadgePercent,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { CountUp } from '../../components/CountUp';
import { SkeletonCards } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';

export type FundingStage = 'USER_REQUEST' | 'REVIEW' | 'FUNDED' | 'REPAID' | 'REJECTED';
export type PoolStatus = 'ALL' | 'OPEN' | 'FUNDED' | 'DISBURSED' | 'REPAID' | 'CLOSED';

interface FundingApplication {
  _id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  industryCategory: string;
  businessPitch: string;
  pitchDeckUrl?: string;
  requestedAmount: number;
  approvedPrincipal?: number;
  interestRateAnnual: number;
  tenureMonths: number;
  expectedTotalInterest?: number;
  repaidAmount: number;
  accruedInterestCollected: number;
  stage: FundingStage;
  meetingScheduledAt?: string;
  meetingLink?: string;
  diligenceNotes?: string;
  disbursementDate?: string;
  disbursementReference?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface FundingSummary {
  metrics: {
    totalPrincipalFunded: number;
    totalExpectedInterest: number;
    totalInterestCollected: number;
    totalCapitalRepaid: number;
    totalPipelineRequested: number;
    userRequestCount: number;
    reviewCount: number;
    fundedCount: number;
    repaidCount: number;
    rejectedCount: number;
    totalApplications: number;
  };
  applications: FundingApplication[];
}

export interface PoolInvestor {
  _id?: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  investedAmount: number;
  investedAt: string;
  expectedInterest: number;
  totalMaturityAmount: number;
  repaidAmount?: number;
  interestPaid?: number;
  payoutStatus: 'PENDING' | 'DISBURSED' | 'COMPLETED';
  payoutDate?: string;
  transactionReference?: string;
}

export interface InvestmentPool {
  _id: string;
  poolCode: string;
  title: string;
  description: string;
  industryCategory: string;
  targetAmount: number;
  collectedAmount: number;
  minInvestmentPerUser: number;
  maxInvestmentPerUser?: number;
  investorAnnualYieldPercent: number;
  tenureMonths: number;
  status: 'OPEN' | 'FUNDED' | 'DISBURSED' | 'REPAID' | 'CLOSED';
  linkedProposalId?: string;
  borrowerName?: string;
  borrowerBusinessName?: string;
  borrowerInterestRateAnnual?: number;
  ficMarginPercent?: number;
  investors: PoolInvestor[];
  openedAt: string;
  closedAt?: string;
  disbursedToBorrowerAt?: string;
  borrowerRepaymentReceivedAt?: string;
  totalInvestorInterestPaid: number;
  totalInvestorPrincipalReturned: number;
  createdAt: string;
}

interface PoolSummaryResponse {
  metrics: {
    totalPoolsCount: number;
    openPoolsCount: number;
    fundedPoolsCount: number;
    disbursedPoolsCount: number;
    repaidPoolsCount: number;
    totalPoolsTarget: number;
    totalCollectedCapital: number;
    totalInvestorsCount: number;
    totalExpectedInvestorInterest: number;
    totalInvestorInterestPaid: number;
  };
  pools: InvestmentPool[];
}

interface MemberOption {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
}

export const FundingDeskPage: React.FC = () => {
  // Top-level Navigation Mode
  const [activeDeskMode, setActiveDeskMode] = useState<'PROPOSALS' | 'COLLECTION_POOLS'>('PROPOSALS');

  // Proposal State
  const [data, setData] = useState<FundingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | FundingStage>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state for proposals
  const [showNewProposalModal, setShowNewProposalModal] = useState(false);
  const [scheduleMeetingTarget, setScheduleMeetingTarget] = useState<FundingApplication | null>(null);
  const [disburseTarget, setDisburseTarget] = useState<FundingApplication | null>(null);
  const [repaymentTarget, setRepaymentTarget] = useState<FundingApplication | null>(null);
  const [detailTarget, setDetailTarget] = useState<FundingApplication | null>(null);

  // New Proposal Form
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industryCategory, setIndustryCategory] = useState('Agri-Tech');
  const [businessPitch, setBusinessPitch] = useState('');
  const [requestedAmount, setRequestedAmount] = useState<number>(1000000);
  const [interestRateAnnual, setInterestRateAnnual] = useState<number>(12);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Schedule Meeting Form
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  // Disburse Form
  const [disbursePrincipal, setDisbursePrincipal] = useState<number>(0);
  const [disburseInterestRate, setDisburseInterestRate] = useState<number>(12);
  const [disburseTenure, setDisburseTenure] = useState<number>(12);
  const [disburseReference, setDisburseReference] = useState('');
  const [disbursing, setDisbursing] = useState(false);

  // Repayment Form
  const [principalRepayAmount, setPrincipalRepayAmount] = useState<number>(0);
  const [interestRepayAmount, setInterestRepayAmount] = useState<number>(0);
  const [isFullySettled, setIsFullySettled] = useState(false);
  const [savingRepayment, setSavingRepayment] = useState(false);

  // ==========================================
  // COLLECTION POOLS STATE
  // ==========================================
  const [poolData, setPoolData] = useState<PoolSummaryResponse | null>(null);
  const [loadingPools, setLoadingPools] = useState(false);
  const [poolStatusFilter, setPoolStatusFilter] = useState<PoolStatus>('ALL');
  const [poolSearchQuery, setPoolSearchQuery] = useState('');

  // Pool Modals
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [activePoolDetail, setActivePoolDetail] = useState<InvestmentPool | null>(null);
  const [investTargetPool, setInvestTargetPool] = useState<InvestmentPool | null>(null);
  const [disbursePoolTarget, setDisbursePoolTarget] = useState<InvestmentPool | null>(null);
  const [settlePoolTarget, setSettlePoolTarget] = useState<InvestmentPool | null>(null);

  // Create Pool Form fields
  const [poolTitle, setPoolTitle] = useState('');
  const [poolDescription, setPoolDescription] = useState('');
  const [poolCategory, setPoolCategory] = useState('Agri-Tech');
  const [poolTargetAmount, setPoolTargetAmount] = useState<number>(1000000);
  const [poolMinInvestment, setPoolMinInvestment] = useState<number>(10000);
  const [poolMaxInvestment, setPoolMaxInvestment] = useState<number>(500000);
  const [poolYieldPercent, setPoolYieldPercent] = useState<number>(10);
  const [poolTenure, setPoolTenure] = useState<number>(12);
  const [poolBorrowerName, setPoolBorrowerName] = useState('');
  const [poolBorrowerBusiness, setPoolBorrowerBusiness] = useState('');
  const [poolBorrowerRate, setPoolBorrowerRate] = useState<number>(14);
  const [poolLinkedProposalId, setPoolLinkedProposalId] = useState('');
  const [submittingPool, setSubmittingPool] = useState(false);

  // Invest Form fields
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [investAmount, setInvestAmount] = useState<number>(50000);
  const [investTxRef, setInvestTxRef] = useState('');
  const [submittingInvest, setSubmittingInvest] = useState(false);

  // Pool Disburse Form fields
  const [poolDisburseRef, setPoolDisburseRef] = useState('');
  const [processingPoolDisburse, setProcessingPoolDisburse] = useState(false);

  // Pool Settle Form fields
  const [poolSettleRefPrefix, setPoolSettleRefPrefix] = useState('FIC-SETTLE');
  const [processingPoolSettle, setProcessingPoolSettle] = useState(false);

  const { showAlert, showPrompt } = useDialog();

  useEffect(() => {
    loadFundingData();
    loadPoolsData();
    loadMembers();
  }, []);

  const loadFundingData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/funding/summary');
      setData(res);
    } catch (err) {
      console.error('Failed to load funding data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPoolsData = async () => {
    try {
      setLoadingPools(true);
      const res = await apiFetch('/api/admin/funding/pools');
      if (res?.pools || res?.metrics) {
        setPoolData(res);
      } else if (res?.data) {
        setPoolData(res.data);
      }
    } catch (err) {
      console.error('Failed to load pools data:', err);
    } finally {
      setLoadingPools(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await apiFetch('/api/admin/members?status=ACTIVE');
      if (Array.isArray(res)) {
        setMembersList(res);
      }
    } catch (err) {
      console.error('Failed to load members for pool investing:', err);
    }
  };

  // Proposal Handlers
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingProposal(true);
      await apiFetch('/api/admin/funding/request', {
        method: 'POST',
        body: JSON.stringify({
          applicantName,
          applicantEmail,
          applicantPhone,
          businessName,
          industryCategory,
          businessPitch,
          requestedAmount: Number(requestedAmount),
          interestRateAnnual: Number(interestRateAnnual),
          tenureMonths: Number(tenureMonths),
        }),
      });
      setShowNewProposalModal(false);
      setApplicantName('');
      setApplicantEmail('');
      setApplicantPhone('');
      setBusinessName('');
      setBusinessPitch('');
      await loadFundingData();
    } catch (err: any) {
      alert(`Failed to submit proposal: ${err.message}`);
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleMeetingTarget) return;
    try {
      setSchedulingMeeting(true);
      await apiFetch(`/api/admin/funding/${scheduleMeetingTarget._id}/schedule-meeting`, {
        method: 'PATCH',
        body: JSON.stringify({
          meetingScheduledAt: meetingDate,
          meetingLink,
          diligenceNotes: meetingNotes,
        }),
      });
      setScheduleMeetingTarget(null);
      setMeetingDate('');
      setMeetingLink('');
      setMeetingNotes('');
      await loadFundingData();
    } catch (err: any) {
      alert(`Failed to schedule meeting: ${err.message}`);
    } finally {
      setSchedulingMeeting(false);
    }
  };

  const handleDisburseFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseTarget) return;
    try {
      setDisbursing(true);
      await apiFetch(`/api/admin/funding/${disburseTarget._id}/disburse`, {
        method: 'PATCH',
        body: JSON.stringify({
          approvedPrincipal: Number(disbursePrincipal),
          interestRateAnnual: Number(disburseInterestRate),
          tenureMonths: Number(disburseTenure),
          disbursementReference: disburseReference || `FIC-INV-${Date.now().toString().slice(-6)}`,
        }),
      });
      setDisburseTarget(null);
      await loadFundingData();
    } catch (err: any) {
      alert(`Failed to disburse funding: ${err.message}`);
    } finally {
      setDisbursing(false);
    }
  };

  const handleLogRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repaymentTarget) return;
    try {
      setSavingRepayment(true);
      await apiFetch(`/api/admin/funding/${repaymentTarget._id}/repayment`, {
        method: 'PATCH',
        body: JSON.stringify({
          principalRepaid: Number(principalRepayAmount),
          interestRepaid: Number(interestRepayAmount),
          isFullySettled,
          businessName: repaymentTarget.businessName,
          applicantEmail: repaymentTarget.applicantEmail,
        }),
      });
      setRepaymentTarget(null);
      setPrincipalRepayAmount(0);
      setInterestRepayAmount(0);
      setIsFullySettled(false);
      await loadFundingData();
      await showAlert('Principal and interest repayment successfully logged!', {
        title: 'Repayment Recorded',
        severity: 'success',
      });
    } catch (err: any) {
      await showAlert(`Failed to record repayment: ${err.message}`, {
        title: 'Error Logging Repayment',
        severity: 'danger',
      });
    } finally {
      setSavingRepayment(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = await showPrompt('Please enter the reason for declining this funding proposal:', {
      title: 'Decline Funding Proposal',
      severity: 'danger',
      confirmText: 'Confirm Decline',
      placeholder: 'e.g., Collateral requirements not met, credit assessment below threshold...',
    });
    if (!reason) return;
    try {
      await apiFetch(`/api/admin/funding/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason: reason }),
      });
      await loadFundingData();
    } catch (err: any) {
      await showAlert(`Failed to reject: ${err.message}`, {
        title: 'Error Declining Proposal',
        severity: 'danger',
      });
    }
  };

  // ==========================================
  // COLLECTION POOL HANDLERS
  // ==========================================
  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingPool(true);
      await apiFetch('/api/admin/funding/pools', {
        method: 'POST',
        body: JSON.stringify({
          title: poolTitle,
          description: poolDescription,
          industryCategory: poolCategory,
          targetAmount: Number(poolTargetAmount),
          minInvestmentPerUser: Number(poolMinInvestment),
          maxInvestmentPerUser: poolMaxInvestment ? Number(poolMaxInvestment) : undefined,
          investorAnnualYieldPercent: Number(poolYieldPercent),
          tenureMonths: Number(poolTenure),
          borrowerName: poolBorrowerName || undefined,
          borrowerBusinessName: poolBorrowerBusiness || undefined,
          borrowerInterestRateAnnual: poolBorrowerRate ? Number(poolBorrowerRate) : undefined,
          linkedProposalId: poolLinkedProposalId || undefined,
        }),
      });

      setShowCreatePoolModal(false);
      setPoolTitle('');
      setPoolDescription('');
      setPoolBorrowerName('');
      setPoolBorrowerBusiness('');
      await loadPoolsData();
      await showAlert('Investment Collection Pool created successfully and opened for community investors!', {
        title: 'Collection Pool Launched',
        severity: 'success',
      });
    } catch (err: any) {
      await showAlert(`Failed to create pool: ${err.message}`, {
        title: 'Error Creating Pool',
        severity: 'danger',
      });
    } finally {
      setSubmittingPool(false);
    }
  };

  const handleRecordPoolInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investTargetPool || !selectedMemberId) return;

    try {
      setSubmittingInvest(true);
      const res = await apiFetch(`/api/admin/funding/pools/${investTargetPool._id}/invest`, {
        method: 'POST',
        body: JSON.stringify({
          memberId: selectedMemberId,
          investedAmount: Number(investAmount),
          transactionReference: investTxRef || `TX-PLEDGE-${Date.now()}`,
        }),
      });

      setInvestTargetPool(null);
      setSelectedMemberId('');
      setInvestTxRef('');
      await loadPoolsData();
      await showAlert(res.message || 'Investment successfully credited to collection pool!', {
        title: 'Investment Recorded',
        severity: 'success',
      });
    } catch (err: any) {
      await showAlert(`Investment failed: ${err.message}`, {
        title: 'Error Logging Investment',
        severity: 'danger',
      });
    } finally {
      setSubmittingInvest(false);
    }
  };

  const handleDisbursePoolToBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursePoolTarget) return;

    try {
      setProcessingPoolDisburse(true);
      const res = await apiFetch(`/api/admin/funding/pools/${disbursePoolTarget._id}/disburse`, {
        method: 'PATCH',
        body: JSON.stringify({
          disbursementReference: poolDisburseRef || `FIC-POOL-DISB-${Date.now()}`,
        }),
      });

      setDisbursePoolTarget(null);
      setPoolDisburseRef('');
      await loadPoolsData();
      await loadFundingData();
      await showAlert(res.message || 'Capital disbursed to borrower!', {
        title: 'Capital Deployed',
        severity: 'success',
      });
    } catch (err: any) {
      await showAlert(`Disbursement failed: ${err.message}`, {
        title: 'Disbursement Error',
        severity: 'danger',
      });
    } finally {
      setProcessingPoolDisburse(false);
    }
  };

  const handleSettlePoolInvestors = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlePoolTarget) return;

    try {
      setProcessingPoolSettle(true);
      const res = await apiFetch(`/api/admin/funding/pools/${settlePoolTarget._id}/settle-investors`, {
        method: 'PATCH',
        body: JSON.stringify({
          transactionReferencePrefix: poolSettleRefPrefix || 'FIC-RET',
        }),
      });

      setSettlePoolTarget(null);
      await loadPoolsData();
      await showAlert(res.message || 'All participating investors received their principal + interest return!', {
        title: 'Investors Settled & Paid',
        severity: 'success',
      });
    } catch (err: any) {
      await showAlert(`Settlement failed: ${err.message}`, {
        title: 'Settlement Error',
        severity: 'danger',
      });
    } finally {
      setProcessingPoolSettle(false);
    }
  };

  const filteredApplications =
    data?.applications.filter((app) => {
      if (activeTab !== 'ALL' && app.stage !== activeTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        app.businessName.toLowerCase().includes(q) ||
        app.applicantName.toLowerCase().includes(q) ||
        app.applicantEmail.toLowerCase().includes(q) ||
        app.industryCategory.toLowerCase().includes(q)
      );
    }) || [];

  const filteredPools =
    poolData?.pools.filter((pool) => {
      if (poolStatusFilter !== 'ALL' && pool.status !== poolStatusFilter) return false;
      if (!poolSearchQuery.trim()) return true;
      const q = poolSearchQuery.toLowerCase();
      return (
        pool.title.toLowerCase().includes(q) ||
        pool.poolCode.toLowerCase().includes(q) ||
        pool.industryCategory.toLowerCase().includes(q) ||
        (pool.borrowerName && pool.borrowerName.toLowerCase().includes(q)) ||
        (pool.borrowerBusinessName && pool.borrowerBusinessName.toLowerCase().includes(q))
      );
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <Coins className="w-5 h-5" />
            </span>
            <span>FIC Venture Funding & Capital Desk</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete ecosystem financing: User Investment Pools, Startup Debt Financing & Interest Yield Distribution.
          </p>
        </div>

        {/* Top Segmented Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs self-stretch md:self-auto">
          <button
            onClick={() => setActiveDeskMode('PROPOSALS')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeDeskMode === 'PROPOSALS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-800'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Startup Proposals ({data?.metrics.totalApplications ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveDeskMode('COLLECTION_POOLS')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeDeskMode === 'COLLECTION_POOLS'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Community Collection Pools</span>
            {(poolData?.metrics.openPoolsCount ?? 0) > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-black rounded-full bg-amber-400 text-slate-950 ml-1">
                {poolData?.metrics.openPoolsCount} OPEN
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: STARTUP PROPOSALS & DIRECT LOANS (Existing 4-step workflow)      */}
      {/* ========================================================================= */}
      {activeDeskMode === 'PROPOSALS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Direct Startup Debt & Diligence Pipeline
            </span>
            <button
              onClick={() => setShowNewProposalModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Funding Proposal</span>
            </button>
          </div>

          {/* 4 Workflow Metric Cards (User Request -> Review -> Funding -> Interest Yield) */}
          {loading ? (
            <SkeletonCards count={4} gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: User Request Stage */}
              <div
                onClick={() => setActiveTab('USER_REQUEST')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group shadow-sm hover:shadow-md ${
                  activeTab === 'USER_REQUEST'
                    ? 'ring-2 ring-sky-500/60 bg-sky-50/50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono">
                    1. User Requests
                  </span>
                  <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-300/40">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2.5">
                  <CountUp value={data?.metrics.userRequestCount ?? 0} />
                  <span className="text-xs font-semibold text-slate-400 font-mono ml-1">Proposals</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Pipeline: ₹{((data?.metrics.totalPipelineRequested ?? 0) / 100000).toFixed(1)}L</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>

              {/* KPI 2: Review / Diligence Meeting Stage */}
              <div
                onClick={() => setActiveTab('REVIEW')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group shadow-sm hover:shadow-md ${
                  activeTab === 'REVIEW'
                    ? 'ring-2 ring-violet-500/60 bg-violet-50/50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">
                    2. Diligence Review
                  </span>
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 border border-violet-300/40">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2.5">
                  <CountUp value={data?.metrics.reviewCount ?? 0} />
                  <span className="text-xs font-semibold text-slate-400 font-mono ml-1">Pitches</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Meetings scheduled</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>

              {/* KPI 3: Funding Disbursed */}
              <div
                onClick={() => setActiveTab('FUNDED')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group shadow-sm hover:shadow-md ${
                  activeTab === 'FUNDED'
                    ? 'ring-2 ring-amber-500/60 bg-amber-50/50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                    3. Total Principal Funded
                  </span>
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-300/40">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2.5">
                  ₹{(data?.metrics.totalPrincipalFunded ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>{data?.metrics.fundedCount ?? 0} ventures deployed</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>

              {/* KPI 4: Interest Yield Amount */}
              <div
                onClick={() => setActiveTab('ALL')}
                className="p-5 rounded-2xl border bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-[#062419] dark:via-[#092921] dark:to-[#0c1e24] border-emerald-300/60 dark:border-emerald-600/30 shadow-sm hover:shadow-md transition-all cursor-pointer select-none group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    4. Interest Yield / Earned
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-700/50">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight mt-2.5">
                  ₹{(data?.metrics.totalInterestCollected ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-between font-semibold">
                  <span>Expected: ₹{(data?.metrics.totalExpectedInterest ?? 0).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-mono bg-emerald-100/80 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    Yield Realized
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Stage Tabs Navigation + Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: 'All Portfolios' },
                { key: 'USER_REQUEST', label: `1. Requests (${data?.metrics.userRequestCount ?? 0})` },
                { key: 'REVIEW', label: `2. Diligence (${data?.metrics.reviewCount ?? 0})` },
                { key: 'FUNDED', label: `3. Funded (${data?.metrics.fundedCount ?? 0})` },
                { key: 'REPAID', label: `4. Settled (${data?.metrics.repaidCount ?? 0})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search business, founder, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Proposals Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Applicant & Venture</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Principal Req/Approved</th>
                    <th className="py-3 px-4">Terms (Rate / Tenure)</th>
                    <th className="py-3 px-4">Expected / Realized Interest</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No funding applications found in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{app.businessName}</div>
                          <div className="text-[11px] text-slate-500">{app.applicantName} &bull; {app.applicantEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {app.industryCategory}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          ₹{(app.approvedPrincipal || app.requestedAmount).toLocaleString('en-IN')}
                          {app.approvedPrincipal && app.approvedPrincipal !== app.requestedAmount && (
                            <span className="block text-[10px] font-normal text-slate-400 line-through">
                              ₹{app.requestedAmount.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{app.interestRateAnnual}% p.a.</span>
                          <span className="text-slate-400 text-[11px] block">{app.tenureMonths} Months</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{(app.accruedInterestCollected || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-400 text-[11px] block">
                            / ₹{(app.expectedTotalInterest || 0).toLocaleString('en-IN')} exp
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {app.stage === 'USER_REQUEST' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300/40">
                              1. User Request
                            </span>
                          )}
                          {app.stage === 'REVIEW' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-300/40">
                              2. Diligence Review
                            </span>
                          )}
                          {app.stage === 'FUNDED' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                              3. Funded & Active
                            </span>
                          )}
                          {app.stage === 'REPAID' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                              4. Fully Settled
                            </span>
                          )}
                          {app.stage === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300/40">
                              Declined
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setDetailTarget(app)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                              title="View Application Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {app.stage === 'USER_REQUEST' && (
                              <>
                                <button
                                  onClick={() => {
                                    setScheduleMeetingTarget(app);
                                    setMeetingDate('');
                                    setMeetingLink('');
                                    setMeetingNotes('');
                                  }}
                                  className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>Diligence</span>
                                </button>
                                <button
                                  onClick={() => handleReject(app._id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/50"
                                  title="Decline"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {app.stage === 'REVIEW' && (
                              <button
                                onClick={() => {
                                  setDisburseTarget(app);
                                  setDisbursePrincipal(app.requestedAmount);
                                  setDisburseInterestRate(app.interestRateAnnual);
                                  setDisburseTenure(app.tenureMonths);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <IndianRupee className="w-3 h-3" />
                                <span>Disburse</span>
                              </button>
                            )}

                            {app.stage === 'FUNDED' && (
                              <button
                                onClick={() => {
                                  setRepaymentTarget(app);
                                  setPrincipalRepayAmount(0);
                                  setInterestRepayAmount(0);
                                  setIsFullySettled(false);
                                }}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <TrendingUp className="w-3 h-3" />
                                <span>Repayment</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: COMMUNITY COLLECTION POOLS (Crowdfunded user investments)       */}
      {/* ========================================================================= */}
      {activeDeskMode === 'COLLECTION_POOLS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                Community Capital Pools & Yield Distribution Engine
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Users pledge capital into active pools &rarr; FIC funds ventures &rarr; Principal & interest yield returns back to investors.
              </p>
            </div>
            <button
              onClick={() => setShowCreatePoolModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Collection Pool</span>
            </button>
          </div>

          {/* Pool KPI Cards */}
          {loadingPools ? (
            <SkeletonCards count={4} gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pool Card 1: Target Capital */}
              <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Total Target Capital
                  </span>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2.5">
                  ₹{(poolData?.metrics.totalPoolsTarget ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Across {poolData?.metrics.totalPoolsCount ?? 0} collection pools</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {poolData?.metrics.openPoolsCount ?? 0} Open
                  </span>
                </p>
              </div>

              {/* Pool Card 2: Collected Capital */}
              <div className="p-5 rounded-2xl border bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-[#062419] dark:to-[#092921] border-emerald-300/60 dark:border-emerald-600/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                    User Capital Collected
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight mt-2.5">
                  ₹{(poolData?.metrics.totalCollectedCapital ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-between font-semibold">
                  <span>
                    {poolData?.metrics.totalPoolsTarget
                      ? `${Math.round(
                          ((poolData.metrics.totalCollectedCapital || 0) /
                            (poolData.metrics.totalPoolsTarget || 1)) *
                            100
                        )}% of target pledged`
                      : '0%'}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </p>
              </div>

              {/* Pool Card 3: Active Investors */}
              <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">
                    Participating Investors
                  </span>
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2.5">
                  <CountUp value={poolData?.metrics.totalInvestorsCount ?? 0} />
                  <span className="text-xs font-semibold text-slate-400 font-mono ml-1">Members</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Community backers</span>
                  <span className="text-emerald-600 font-bold text-[10px] font-mono">Earns Interest</span>
                </p>
              </div>

              {/* Pool Card 4: Investor Interest Paid */}
              <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                    Investor Interest Settled
                  </span>
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
                    <BadgePercent className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2.5">
                  ₹{(poolData?.metrics.totalInvestorInterestPaid ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Exp: ₹{(poolData?.metrics.totalExpectedInvestorInterest ?? 0).toLocaleString('en-IN')}</span>
                  <span className="text-emerald-600 font-mono text-[10px] font-bold">Returned Yield</span>
                </p>
              </div>
            </div>
          )}

          {/* Filters & Search Bar for Pools */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: 'All Pools' },
                { key: 'OPEN', label: `Open for Investment (${poolData?.metrics.openPoolsCount ?? 0})` },
                { key: 'FUNDED', label: `Target Reached (${poolData?.metrics.fundedPoolsCount ?? 0})` },
                { key: 'DISBURSED', label: `Disbursed to Venture (${poolData?.metrics.disbursedPoolsCount ?? 0})` },
                { key: 'REPAID', label: `Settled & Repaid (${poolData?.metrics.repaidPoolsCount ?? 0})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPoolStatusFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    poolStatusFilter === tab.key
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pool code, title, borrower..."
                value={poolSearchQuery}
                onChange={(e) => setPoolSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          {/* Collection Pools Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredPools.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                <PiggyBank className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-bold text-sm">No collection pools found matching your filter</p>
                <p className="text-xs text-slate-400 mt-1">
                  Launch a new pool so community members can start investing their funds.
                </p>
              </div>
            ) : (
              filteredPools.map((pool) => {
                const percent = Math.min(100, Math.round(((pool.collectedAmount || 0) / pool.targetAmount) * 100));
                return (
                  <div
                    key={pool._id}
                    onClick={() => setActivePoolDetail(pool)}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Top Row: Code + Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-extrabold border border-indigo-200/50 dark:border-indigo-800/50">
                            {pool.poolCode}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {pool.industryCategory}
                          </span>
                        </div>

                        {pool.status === 'OPEN' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                            ● OPEN FOR INVESTORS
                          </span>
                        )}
                        {pool.status === 'FUNDED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300/40">
                            TARGET REACHED
                          </span>
                        )}
                        {pool.status === 'DISBURSED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40">
                            DISBURSED TO VENTURE
                          </span>
                        )}
                        {pool.status === 'REPAID' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300/40">
                            INVESTORS REPAID
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{pool.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {pool.description}
                      </p>

                      {/* Borrower Target Note */}
                      {pool.borrowerBusinessName && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                              Allocated Venture
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {pool.borrowerBusinessName}
                            </span>
                            {pool.borrowerName && (
                              <span className="text-slate-400 text-[11px] ml-1">({pool.borrowerName})</span>
                            )}
                          </div>
                          {pool.borrowerInterestRateAnnual && (
                            <div className="text-right">
                              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                                FIC Loan Rate
                              </span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {pool.borrowerInterestRateAnnual}% p.a.
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between items-baseline text-xs mb-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                            ₹{(pool.collectedAmount || 0).toLocaleString('en-IN')}
                            <span className="text-slate-400 font-normal text-xs ml-1">
                              collected of ₹{pool.targetAmount.toLocaleString('en-IN')}
                            </span>
                          </span>
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            {percent}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-full rounded-full ${
                              percent >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Terms Specs Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
                        <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase block font-bold">
                            User Return
                          </span>
                          <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                            {pool.investorAnnualYieldPercent}% p.a.
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                            Tenure
                          </span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {pool.tenureMonths} Months
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20">
                          <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 uppercase block font-bold">
                            Investors
                          </span>
                          <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                            {pool.investors?.length || 0} Backers
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <button
                        onClick={() => setActivePoolDetail(pool)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ledger ({pool.investors?.length || 0})</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {pool.status === 'OPEN' && (
                          <button
                            onClick={() => {
                              setInvestTargetPool(pool);
                              setInvestAmount(pool.minInvestmentPerUser || 10000);
                              setSelectedMemberId(membersList[0]?._id || '');
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pledge Investment</span>
                          </button>
                        )}

                        {(pool.status === 'OPEN' || pool.status === 'FUNDED') && (
                          <button
                            onClick={() => {
                              setDisbursePoolTarget(pool);
                              setPoolDisburseRef(`POOL-DISB-${pool.poolCode}`);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Disburse Capital</span>
                          </button>
                        )}

                        {pool.status === 'DISBURSED' && (
                          <button
                            onClick={() => {
                              setSettlePoolTarget(pool);
                              setPoolSettleRefPrefix(`RET-${pool.poolCode}`);
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Return Principal & Interest</span>
                          </button>
                        )}

                        {pool.status === 'REPAID' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Settled to Investors</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE COLLECTION POOL                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCreatePoolModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Create Community Collection Pool
                    </h3>
                    <p className="text-xs text-slate-400">
                      Set pool target amount, tenure, and investor yield return.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreatePoolModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePool} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Collection Pool Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agri-Tech Cold Storage Crowdfunded Yield Pool 2026"
                    value={poolTitle}
                    onChange={(e) => setPoolTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Purpose & Investment Overview
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detail how the capital will be deployed and borrower repayment security..."
                    value={poolDescription}
                    onChange={(e) => setPoolDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Industry Category
                    </label>
                    <select
                      value={poolCategory}
                      onChange={(e) => setPoolCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Agri-Tech">Agri-Tech & Farm Mechanization</option>
                      <option value="Solar Energy">Solar & Clean Energy</option>
                      <option value="Manufacturing">Smart Manufacturing & IoT</option>
                      <option value="Healthcare">Health & Diagnostic Tech</option>
                      <option value="FinTech">FinTech & Supply Chain Finance</option>
                      <option value="Retail & D2C">Retail & Consumer Brands</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Target Collection Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={50000}
                      step={10000}
                      value={poolTargetAmount}
                      onChange={(e) => setPoolTargetAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Investor Annual Yield (% p.a.) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={1}
                        max={30}
                        step={0.5}
                        value={poolYieldPercent}
                        onChange={(e) => setPoolYieldPercent(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-emerald-600 font-bold"
                      />
                      <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <span className="text-[10px] text-slate-400">Interest paid to participating users</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Investment Tenure (Months) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={60}
                      value={poolTenure}
                      onChange={(e) => setPoolTenure(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Duration until maturity</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Min Investment Per User (₹)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={poolMinInvestment}
                      onChange={(e) => setPoolMinInvestment(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                    />
                    <span className="text-[10px] text-slate-400">Minimum user pledge</span>
                  </div>
                </div>

                {/* Optional Borrower Section */}
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                      Target Borrower / Startup Details (Optional)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-bold mb-1">
                        Borrower Business Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. EcoWrap Sustainable Packaging Pvt Ltd"
                        value={poolBorrowerBusiness}
                        onChange={(e) => setPoolBorrowerBusiness(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-bold mb-1">
                        Borrower Lead / Contact Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Varma"
                        value={poolBorrowerName}
                        onChange={(e) => setPoolBorrowerName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-bold mb-1">
                        Borrower Loan Interest Rate (% p.a.)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={40}
                        step={0.5}
                        value={poolBorrowerRate}
                        onChange={(e) => setPoolBorrowerRate(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-amber-600 font-bold font-mono"
                      />
                      <span className="text-[10px] text-slate-400">
                        Platform Spread Margin: {Math.max(0, poolBorrowerRate - poolYieldPercent)}%
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-bold mb-1">
                        Link Existing Proposal
                      </label>
                      <select
                        value={poolLinkedProposalId}
                        onChange={(e) => setPoolLinkedProposalId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">-- No linked proposal --</option>
                        {data?.applications
                          ?.filter((a) => a.stage === 'REVIEW' || a.stage === 'USER_REQUEST')
                          .map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.businessName} (₹{a.requestedAmount.toLocaleString('en-IN')})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreatePoolModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPool}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {submittingPool ? (
                      <span>Launching...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Launch Collection Pool</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: PLEDGE / RECORD MEMBER INVESTMENT IN POOL                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {investTargetPool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Record Member Investment
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pool: <span className="font-mono font-bold text-emerald-600">{investTargetPool.poolCode}</span> &bull; {investTargetPool.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInvestTargetPool(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPoolInvestment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Select Investing Member / User *
                  </label>
                  <select
                    required
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Choose registered platform member --</option>
                    {membersList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.email}) {m.businessName ? `- ${m.businessName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Investment Principal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={investTargetPool.minInvestmentPerUser || 1000}
                    step={1000}
                    value={investAmount}
                    onChange={(e) => setInvestAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Min allowed for this pool: ₹{investTargetPool.minInvestmentPerUser?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Transaction Reference (Bank / UPI / Gateway)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-TXN-902348123"
                    value={investTxRef}
                    onChange={(e) => setInvestTxRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Calculation Preview */}
                {(() => {
                  const years = investTargetPool.tenureMonths / 12;
                  const expectedInterest = Math.round(
                    (investAmount * investTargetPool.investorAnnualYieldPercent * years) / 100
                  );
                  const totalMaturity = investAmount + expectedInterest;
                  return (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pledged Principal:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ₹{investAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-600">
                          Expected Interest Yield ({investTargetPool.investorAnnualYieldPercent}% &bull; {investTargetPool.tenureMonths}m):
                        </span>
                        <span className="font-bold text-emerald-600">
                          + ₹{expectedInterest.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-emerald-500/20 text-sm">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Total Return on Maturity:</span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                          ₹{totalMaturity.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInvestTargetPool(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInvest || !selectedMemberId}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {submittingInvest ? <span>Crediting...</span> : <span>Confirm Pledge</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: DISBURSE POOL CAPITAL TO BORROWER                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {disbursePoolTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Disburse Capital to Borrower
                    </h3>
                    <p className="text-xs text-slate-400">
                      Deploy crowdfunded capital of ₹{disbursePoolTarget.collectedAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDisbursePoolTarget(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDisbursePoolToBorrower} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 space-y-1">
                  <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 uppercase font-bold">
                    Borrower / Recipient Details
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {disbursePoolTarget.borrowerBusinessName || 'Direct Venture Partnership'}
                  </p>
                  <p className="text-slate-500">
                    Borrower Lead: {disbursePoolTarget.borrowerName || 'Business Owner'}
                  </p>
                  <p className="text-slate-500 font-mono">
                    Total Capital Pledged: ₹{disbursePoolTarget.collectedAmount.toLocaleString('en-IN')} across {disbursePoolTarget.investors?.length || 0} user investors
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Disbursement Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    required
                    value={poolDisburseRef}
                    onChange={(e) => setPoolDisburseRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDisbursePoolTarget(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingPoolDisburse}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {processingPoolDisburse ? <span>Deploying...</span> : <span>Confirm Capital Disbursement</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: SETTLE POOL - RETURN PRINCIPAL + INTEREST TO INVESTORS             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {settlePoolTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Settle & Return Funds to Investors
                    </h3>
                    <p className="text-xs text-slate-400">
                      Borrower repayment received. Distribute principal and yield back to all backers.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSettlePoolTarget(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSettlePoolInvestors} className="space-y-4 text-xs">
                {(() => {
                  const totalPrincipal = settlePoolTarget.investors.reduce((acc, i) => acc + i.investedAmount, 0);
                  const totalInterest = settlePoolTarget.investors.reduce((acc, i) => acc + i.expectedInterest, 0);
                  const grandTotal = totalPrincipal + totalInterest;

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-emerald-500/10 to-teal-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Total Investors to Pay:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {settlePoolTarget.investors.length} Members
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Total Principal to Return:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          ₹{totalPrincipal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-600">Total Interest Yield Payout:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          + ₹{totalInterest.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-purple-500/20 text-sm">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          Total Liquidation Outflow:
                        </span>
                        <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300">
                          ₹{grandTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Payout Reference Prefix (Auto-appended with ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={poolSettleRefPrefix}
                    onChange={(e) => setPoolSettleRefPrefix(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSettlePoolTarget(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingPoolSettle}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {processingPoolSettle ? (
                      <span>Settling Payouts...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Settle & Pay Back Investors</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: POOL DETAIL & INVESTOR LEDGER (CENTRALISED POPUP WINDOW)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activePoolDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-emerald-600 border border-emerald-500/20">
                    <PiggyBank className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                        {activePoolDetail.poolCode}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                        {activePoolDetail.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activePoolDetail.industryCategory} &bull; Community Crowdfunded Yield Distribution Hub
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePoolDetail(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Centralised Financial Overview Cards */}
              {(() => {
                const collected = activePoolDetail.collectedAmount || 0;
                const target = activePoolDetail.targetAmount;
                const remaining = Math.max(0, target - collected);
                const percent = Math.min(100, Math.round((collected / target) * 100));
                const totalExpectedInterest = (activePoolDetail.investors || []).reduce((sum, inv) => sum + (inv.expectedInterest || 0), 0);
                const totalPrincipalPledged = (activePoolDetail.investors || []).reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      {/* Target */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">1. Target Capital</span>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">
                          ₹{target.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Approved Pool Size</span>
                      </div>

                      {/* Current Collected */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase block font-bold">2. Current Amount Collected</span>
                        <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono mt-1">
                          ₹{collected.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                          {percent}% Pledged by Backers
                        </span>
                      </div>

                      {/* Remaining Amount Left */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase block font-bold">3. Amount Left to Collect</span>
                        <p className="text-xl font-extrabold text-amber-900 dark:text-amber-200 font-mono mt-1">
                          ₹{remaining.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 mt-0.5 block">
                          {remaining === 0 ? '✓ Target 100% Met' : `₹${remaining.toLocaleString('en-IN')} remaining`}
                        </span>
                      </div>

                      {/* Yield & Interest Return */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30">
                        <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400 uppercase block font-bold">4. Total Yield / Interest to Pay</span>
                        <p className="text-xl font-extrabold text-purple-900 dark:text-purple-200 font-mono mt-1">
                          + ₹{totalExpectedInterest.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 mt-0.5 block">
                          {activePoolDetail.investorAnnualYieldPercent}% p.a. &bull; {activePoolDetail.tenureMonths} Mo
                        </span>
                      </div>
                    </div>

                    {/* Progress Fill Meter */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex justify-between text-xs font-mono font-bold mb-1.5">
                        <span className="text-slate-600 dark:text-slate-400">
                          Funding Progress: ₹{collected.toLocaleString('en-IN')} of ₹{target.toLocaleString('en-IN')}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{percent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent >= 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* People Who Put Money (Investors Ledger) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>People Who Put Money In This Pool ({activePoolDetail.investors?.length || 0} Investors)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Auto-splits principal + interest yield into member wallets on collection
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4">S.No</th>
                        <th className="py-3 px-4">Investor Name & Contact</th>
                        <th className="py-3 px-4">Amount Pledged</th>
                        <th className="py-3 px-4">Interest Return Due</th>
                        <th className="py-3 px-4">Total Wallet Payout</th>
                        <th className="py-3 px-4">Wallet Payout Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {!activePoolDetail.investors || activePoolDetail.investors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            <Wallet className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                            No members have pledged capital into this collection pool yet.
                          </td>
                        </tr>
                      ) : (
                        activePoolDetail.investors.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">{inv.memberName}</span>
                              <span className="text-[11px] text-slate-400 block font-mono">{inv.memberEmail} {inv.memberPhone ? `• ${inv.memberPhone}` : ''}</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                              ₹{inv.investedAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                              + ₹{inv.expectedInterest.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 font-mono font-extrabold text-purple-700 dark:text-purple-300 text-sm">
                              ₹{inv.totalMaturityAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              {inv.payoutStatus === 'COMPLETED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  CREDITED TO WALLET
                                </span>
                              ) : inv.payoutStatus === 'DISBURSED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300/40">
                                  ● CAPITAL DEPLOYED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40">
                                  PLEDGE HELD IN POOL
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

              {/* Close Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActivePoolDetail(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODALS FOR PROPOSALS (PRESERVED WORKFLOW)                                  */}
      {/* ========================================================================= */}
      {/* New Proposal Modal */}
      <AnimatePresence>
        {showNewProposalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Submit Direct Proposal
                    </h3>
                    <p className="text-xs text-slate-400">
                      Stage 1: Record incoming venture funding application
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewProposalModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Applicant Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Kumar"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Applicant Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="founder@venture.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Applicant Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Business / Venture Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AgrowMart Technologies"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Industry Category *
                  </label>
                  <select
                    value={industryCategory}
                    onChange={(e) => setIndustryCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Agri-Tech">Agri-Tech & Farm Automation</option>
                    <option value="Textiles">Textile & Handloom Innovations</option>
                    <option value="FinTech">FinTech & Supply Chain</option>
                    <option value="CleanTech">CleanTech & Solar Mobility</option>
                    <option value="Healthcare">Health & Medical Robotics</option>
                    <option value="Manufacturing">Smart Manufacturing / IoT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Business Pitch / Thesis *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Brief description of the market opportunity and revenue model..."
                    value={businessPitch}
                    onChange={(e) => setBusinessPitch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Requested Principal (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={50000}
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Interest Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={40}
                      value={interestRateAnnual}
                      onChange={(e) => setInterestRateAnnual(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-amber-600 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Tenure (Months)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={60}
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewProposalModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProposal}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {submittingProposal ? <span>Saving...</span> : <span>Submit to Desk</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {scheduleMeetingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Schedule Diligence Meeting
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step 2: Setup investment review call with {scheduleMeetingTarget.applicantName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setScheduleMeetingTarget(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleMeeting} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Meeting Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Video Meeting Link (Google Meet / Zoom)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/abc-def-ghi"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Diligence & Evaluation Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key assessment areas, valuation sanity, unit economics..."
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setScheduleMeetingTarget(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={schedulingMeeting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {schedulingMeeting ? <span>Confirming...</span> : <span>Confirm & Advance to Diligence</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disburse Capital Modal */}
      <AnimatePresence>
        {disburseTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Disburse Direct Capital
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step 3: Transfer principal to {disburseTarget.businessName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDisburseTarget(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDisburseFunding} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Approved Principal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={disbursePrincipal}
                    onChange={(e) => setDisbursePrincipal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Annual Interest Rate (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={40}
                      value={disburseInterestRate}
                      onChange={(e) => setDisburseInterestRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-amber-600 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Tenure (Months) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={60}
                      value={disburseTenure}
                      onChange={(e) => setDisburseTenure(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Bank / Escrow Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-20261104-9842"
                    value={disburseReference}
                    onChange={(e) => setDisburseReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDisburseTarget(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disbursing}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {disbursing ? <span>Processing...</span> : <span>Confirm Capital Disbursement</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Repayment Modal */}
      <AnimatePresence>
        {repaymentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Record Principal & Interest Repayment
                    </h3>
                    <p className="text-xs text-slate-400">
                      Borrower: {repaymentTarget.businessName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRepaymentTarget(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLogRepayment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Principal Repaid This Installment (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={principalRepayAmount}
                    onChange={(e) => setPrincipalRepayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Current Repaid: ₹{(repaymentTarget.repaidAmount || 0).toLocaleString('en-IN')} / ₹{(repaymentTarget.approvedPrincipal || repaymentTarget.requestedAmount).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Interest Yield Realized This Installment (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={interestRepayAmount}
                    onChange={(e) => setInterestRepayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-emerald-600 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Total Collected So Far: ₹{(repaymentTarget.accruedInterestCollected || 0).toLocaleString('en-IN')} / Expected ₹{(repaymentTarget.expectedTotalInterest || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isFullySettled}
                    onChange={(e) => setIsFullySettled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Mark loan as 100% Fully Settled & Repaid
                  </span>
                </label>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRepaymentTarget(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingRepayment}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    {savingRepayment ? <span>Saving...</span> : <span>Save Repayment</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Application Detail Inspection Modal */}
      <AnimatePresence>
        {detailTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {detailTarget.businessName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {detailTarget.applicantName} &bull; {detailTarget.applicantEmail}
                  </p>
                </div>
                <button
                  onClick={() => setDetailTarget(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="font-bold text-slate-500 text-[10px] font-mono block uppercase mb-1">
                  Business Pitch
                </span>
                <p className="text-slate-800 dark:text-slate-200">{detailTarget.businessPitch}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 text-[10px] block">CATEGORY & STAGE</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{detailTarget.industryCategory}</p>
                  <p className="text-indigo-600 font-bold">{detailTarget.stage}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 text-[10px] block">LOAN TERMS</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Principal: ₹{(detailTarget.approvedPrincipal || detailTarget.requestedAmount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-slate-500">Rate: {detailTarget.interestRateAnnual}% annual</p>
                  <p className="text-slate-500">Tenure: {detailTarget.tenureMonths} Months</p>
                </div>
              </div>

              {detailTarget.diligenceNotes && (
                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40">
                  <span className="font-bold text-violet-700 dark:text-violet-300 text-[10px] font-mono block uppercase mb-1">
                    Superadmin Diligence Notes
                  </span>
                  <p className="text-violet-900 dark:text-violet-200">{detailTarget.diligenceNotes}</p>
                  {detailTarget.meetingLink && (
                    <a
                      href={detailTarget.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-bold hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Pitch Meeting Room &rarr;</span>
                    </a>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDetailTarget(null)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
