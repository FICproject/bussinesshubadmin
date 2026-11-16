import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  Eye,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { SkeletonCards } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';

export type FundingDeskTab =
  | 'FUNDING_REQUESTS'
  | 'INVESTMENT_REQUESTS'
  | 'FUND_RELEASE'
  | 'RETURNS_MATURITY'
  | 'MATURITY_RELEASE'
  | 'POOLS';

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

export interface FundingDeskPageProps {
  defaultTab?: FundingDeskTab;
}

export const FundingDeskPage: React.FC<FundingDeskPageProps> = ({ defaultTab }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const getInitialTab = (): FundingDeskTab => {
    if (defaultTab) return defaultTab;
    if (location.pathname.includes('investment-requests') || searchParams.get('tab') === 'investment-requests') {
      return 'INVESTMENT_REQUESTS';
    }
    return 'FUNDING_REQUESTS';
  };

  // Active Main Desk Tab
  const [activeTab, setActiveTab] = useState<FundingDeskTab>(getInitialTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (location.pathname.includes('investment-requests') || searchParams.get('tab') === 'investment-requests') {
      setActiveTab('INVESTMENT_REQUESTS');
    } else if (location.pathname.includes('funding-requests') || searchParams.get('tab') === 'funding-requests') {
      setActiveTab('FUNDING_REQUESTS');
    }
  }, [defaultTab, location.pathname, searchParams]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ========================================================
  // TAB 1: FUNDING REQUESTS STATE (PHASE 2)
  // ========================================================
  const [fundingRequests, setFundingRequests] = useState<any[]>([]);
  const [fundingStatusFilter, setFundingStatusFilter] = useState<string>('ALL');
  const [fundingSearch, setFundingSearch] = useState<string>('');

  // Modals for Funding Requests
  const [reviewFundingTarget, setReviewFundingTarget] = useState<any | null>(null);

  // Changes Modal
  const [changesTarget, setChangesTarget] = useState<any | null>(null);
  const [changeMessage, setChangeMessage] = useState<string>('');
  const [requestedDocsList, setRequestedDocsList] = useState<{ id: string; name: string; instructions: string }[]>([]);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocInstructions, setNewDocInstructions] = useState<string>('');
  const [isSubmittingChanges, setIsSubmittingChanges] = useState<boolean>(false);

  // Approve Modal
  const [approveTarget, setApproveTarget] = useState<any | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isApprovingFunding, setIsApprovingFunding] = useState<boolean>(false);

  // ========================================================
  // TAB 2: INVESTMENT REQUESTS STATE (PHASE 5)
  // ========================================================
  const [investmentRequests, setInvestmentRequests] = useState<any[]>([]);
  const [investmentStatusFilter, setInvestmentStatusFilter] = useState<string>('ALL');
  const [investmentSearch, setInvestmentSearch] = useState<string>('');
  const [reviewInvestmentTarget, setReviewInvestmentTarget] = useState<any | null>(null);
  const [investApprovedAmount, setInvestApprovedAmount] = useState<string>('');
  const [investActionNotes, setInvestActionNotes] = useState<string>('');
  const [isProcessingInvestReview, setIsProcessingInvestReview] = useState<boolean>(false);

  // ========================================================
  // TAB 3: FUND RELEASE STATE (PHASE 7)
  // ========================================================
  const [fundReleases, setFundReleases] = useState<any[]>([]);
  const [disburseTarget, setDisburseTarget] = useState<any | null>(null);
  const [disburseAmountInput, setDisburseAmountInput] = useState<string>('');
  const [disburseReference, setDisburseReference] = useState<string>('');
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [isDisbursing, setIsDisbursing] = useState<boolean>(false);

  // ========================================================
  // TAB 4: RETURNS & MATURITY STATE (PHASE 8)
  // ========================================================
  const [returnsMaturityList, setReturnsMaturityList] = useState<any[]>([]);

  // ========================================================
  // TAB 5: MATURITY RELEASE STATE (PHASE 10)
  // ========================================================
  const [maturityReleases, setMaturityReleases] = useState<any[]>([]);
  const [maturityReleaseTarget, setMaturityReleaseTarget] = useState<any | null>(null);
  const [maturityPayoutRef, setMaturityPayoutRef] = useState<string>('');
  const [isReleasingMaturity, setIsReleasingMaturity] = useState<boolean>(false);

  // Preserved Community Pools
  const [pools, setPools] = useState<any[]>([]);

  // ========================================================
  // LOADERS
  // ========================================================
  useEffect(() => {
    loadTabData();
  }, [activeTab, fundingStatusFilter, investmentStatusFilter]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'FUNDING_REQUESTS') {
        const qs = fundingStatusFilter !== 'ALL' ? `?status=${fundingStatusFilter}` : '';
        const res = await apiFetch(`/api/admin/funding/requests${qs}`);
        setFundingRequests(res?.items || res?.data || []);
      } else if (activeTab === 'INVESTMENT_REQUESTS') {
        const qs = investmentStatusFilter !== 'ALL' ? `?status=${investmentStatusFilter}` : '';
        const res = await apiFetch(`/api/admin/funding/investment-requests${qs}`);
        setInvestmentRequests(res?.items || res?.data || []);
      } else if (activeTab === 'FUND_RELEASE') {
        const res = await apiFetch('/api/admin/funding/fund-releases');
        setFundReleases(res?.data || res?.items || []);
      } else if (activeTab === 'RETURNS_MATURITY') {
        const res = await apiFetch('/api/admin/funding/returns-maturity');
        setReturnsMaturityList(res?.data || res?.items || []);
      } else if (activeTab === 'MATURITY_RELEASE') {
        const res = await apiFetch('/api/admin/funding/maturity-releases');
        setMaturityReleases(res?.data || res?.items || []);
      } else if (activeTab === 'POOLS') {
        const res = await apiFetch('/api/admin/funding/pools');
        setPools(res?.pools || res?.data || []);
      }
    } catch (err: any) {
      console.warn('Failed to load admin funding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // ========================================================
  // PHASE 2 ACTIONS: FUNDING REQUEST REVIEW, CHANGES, APPROVE
  // ========================================================
  const handleOpenChangesModal = (reqItem: any) => {
    setChangesTarget(reqItem);
    setChangeMessage('');
    setRequestedDocsList([]);
    setNewDocName('');
    setNewDocInstructions('');
  };

  const handleAddRequestedDoc = () => {
    if (!newDocName.trim() || !newDocInstructions.trim()) {
      alert('Please enter both document name and instructions.');
      return;
    }
    setRequestedDocsList([
      ...requestedDocsList,
      {
        id: `DOC-REQ-${Date.now()}`,
        name: newDocName.trim(),
        instructions: newDocInstructions.trim()
      }
    ]);
    setNewDocName('');
    setNewDocInstructions('');
  };

  const handleConfirmChanges = async () => {
    if (!changesTarget || !changeMessage.trim()) {
      alert('Please enter a clear change request message.');
      return;
    }
    setIsSubmittingChanges(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/requests/${changesTarget.fundingRequestId || changesTarget._id}/request-changes`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message: changeMessage.trim(),
            requestedDocuments: requestedDocsList
          })
        }
      );
      if (res?.success) {
        setFeedbackMsg({ type: 'success', text: 'Change request and required documents sent to member!' });
        setChangesTarget(null);
        setReviewFundingTarget(null);
        loadTabData();
      } else {
        throw new Error(res?.error || 'Failed to submit changes');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingChanges(false);
    }
  };

  const handleOpenApproveModal = (reqItem: any) => {
    setApproveTarget(reqItem);
    setApprovalNotes('Proposal approved for network investment commitments.');
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setIsApprovingFunding(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/requests/${approveTarget.fundingRequestId || approveTarget._id}/approve`,
        {
          method: 'PUT',
          body: JSON.stringify({ approvalNotes: approvalNotes.trim() })
        }
      );
      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Proposal "${approveTarget.companyName}" approved! It is now live in the Need Funding section for investors.`
        });
        setApproveTarget(null);
        setReviewFundingTarget(null);
        loadTabData();
      } else {
        throw new Error(res?.error || 'Failed to approve funding request');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsApprovingFunding(false);
    }
  };

  // ========================================================
  // PHASE 5 ACTIONS: INVESTMENT REQUESTS REVIEW
  // ========================================================
  const handleOpenReviewInvestment = (inv: any) => {
    setReviewInvestmentTarget(inv);
    setInvestApprovedAmount(String(inv.approvedAmount || inv.requestedAmount));
    setInvestActionNotes('');
  };

  const handleProcessInvestmentReview = async (action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => {
    if (!reviewInvestmentTarget) return;
    setIsProcessingInvestReview(true);
    try {
      const payload: any = { action };
      if (action === 'APPROVE') {
        payload.approvedAmount = Number(investApprovedAmount);
        payload.notes = investActionNotes;
      } else if (action === 'REQUEST_CHANGES') {
        payload.notes = investActionNotes;
      } else if (action === 'REJECT') {
        payload.rejectionReason = investActionNotes || 'Does not meet current investment criteria.';
      }

      const res = await apiFetch(
        `/api/admin/funding/investment-requests/${reviewInvestmentTarget.investmentId || reviewInvestmentTarget._id}/review`,
        {
          method: 'PUT',
          body: JSON.stringify(payload)
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Investment action "${action}" completed successfully!`
        });
        setReviewInvestmentTarget(null);
        loadTabData();
      } else {
        throw new Error(res?.error || 'Failed to process investment review');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsProcessingInvestReview(false);
    }
  };

  // ========================================================
  // PHASE 7 ACTIONS: FUND RELEASE DISBURSEMENT
  // ========================================================
  const handleOpenDisburseModal = (inv: any) => {
    setDisburseTarget(inv);
    const eligible = inv.pendingReleaseAmount || inv.eligibleReleaseAmount || inv.paidAmount;
    setDisburseAmountInput(String(eligible));
    setDisburseReference(`FIC-DISB-${Date.now().toString().slice(-6)}`);
    setDisburseNotes(`Capital release for ${inv.projectName} (${inv.investmentId}).`);
  };

  const handleConfirmDisbursement = async () => {
    if (!disburseTarget) return;
    setIsDisbursing(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/fund-releases/${disburseTarget.investmentId || disburseTarget._id}/disburse`,
        {
          method: 'POST',
          body: JSON.stringify({
            disburseAmount: Number(disburseAmountInput),
            payoutReference: disburseReference.trim(),
            notes: disburseNotes.trim()
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Capital of ₹${Number(disburseAmountInput).toLocaleString('en-IN')} successfully disbursed to ${disburseTarget.fundingRequestorName}! Investment is now ACTIVE.`
        });
        setDisburseTarget(null);
        loadTabData();
      } else {
        throw new Error(res?.error || 'Failed to disburse funds');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsDisbursing(false);
    }
  };

  // ========================================================
  // PHASE 10 ACTIONS: MATURITY RELEASE TO INVESTOR
  // ========================================================
  const handleOpenMaturityReleaseModal = (inv: any) => {
    setMaturityReleaseTarget(inv);
    setMaturityPayoutRef(`FIC-MAT-REL-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmMaturityRelease = async () => {
    if (!maturityReleaseTarget) return;
    setIsReleasingMaturity(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/maturity-releases/${maturityReleaseTarget.investmentId || maturityReleaseTarget._id}/release`,
        {
          method: 'POST',
          body: JSON.stringify({
            releaseAmount: maturityReleaseTarget.maturityAmountReceived || maturityReleaseTarget.maturityAmountDue,
            payoutReference: maturityPayoutRef.trim()
          })
        }
      );

      if (res?.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Maturity settlement released to investor ${maturityReleaseTarget.investorName}! Investment cycle marked COMPLETED.`
        });
        setMaturityReleaseTarget(null);
        loadTabData();
      } else {
        throw new Error(res?.error || 'Failed to release maturity funds');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsReleasingMaturity(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
              <Building className="w-5 h-5" />
            </span>
            <span>FIC Funding & Investment Management Desk</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete lifecycle management: Funding proposals, investor approvals, escrow fund releases, and maturity settlements.
          </p>
        </div>
      </div>

      {/* Global Alert Notification */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-semibold border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="text-xs font-bold uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================
          5 OPERATIONAL DESK TABS
         ======================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('FUNDING_REQUESTS')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'FUNDING_REQUESTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Funding Requests</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono">
            {fundingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INVESTMENT_REQUESTS')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'INVESTMENT_REQUESTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Investment Requests</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono">
            {investmentRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FUND_RELEASE')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'FUND_RELEASE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Fund Release</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono">
            {fundReleases.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RETURNS_MATURITY')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'RETURNS_MATURITY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Returns & Maturity</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono">
            {returnsMaturityList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MATURITY_RELEASE')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'MATURITY_RELEASE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Maturity Release</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono">
            {maturityReleases.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('POOLS')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'POOLS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Community Pools</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1 CONTENT: FUNDING REQUESTS (PHASE 2)
         ======================================================== */}
      {activeTab === 'FUNDING_REQUESTS' && (
        <div className="space-y-4">
          {/* Controls: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {['ALL', 'SUBMITTED', 'CHANGES_REQUESTED', 'RESUBMITTED', 'APPROVED', 'ACTIVE', 'FUNDED', 'REJECTED'].map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFundingStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      fundingStatusFilter === st
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-purple-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={fundingSearch}
                onChange={(e) => setFundingSearch(e.target.value)}
                placeholder="Search requests..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Project / Company</th>
                  <th className="p-4">Requestor</th>
                  <th className="p-4">Required Amount</th>
                  <th className="p-4">Ticket Limits</th>
                  <th className="p-4">Duration & Returns</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fundingRequests
                  .filter((r) =>
                    fundingSearch.trim()
                      ? r.companyName?.toLowerCase().includes(fundingSearch.toLowerCase()) ||
                        r.fundingRequestId?.toLowerCase().includes(fundingSearch.toLowerCase()) ||
                        r.requestorName?.toLowerCase().includes(fundingSearch.toLowerCase())
                      : true
                  )
                  .map((r) => (
                    <tr key={r._id || r.fundingRequestId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {r.fundingRequestId || r.refNumber}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {r.companyName || r.businessName}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {r.requestorName || 'FIC Member'}
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyINR(r.requiredFundingAmount || r.fundingAmount)}
                      </td>
                      <td className="p-4 text-slate-500">
                        {formatCurrencyINR(r.minInvestmentAmount)} - {formatCurrencyINR(r.maxInvestmentAmount)}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {r.expectedReturns} • {r.fundingDuration}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'APPROVED' || r.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : r.status === 'CHANGES_REQUESTED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : r.status === 'RESUBMITTED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Review */}
                          <button
                            type="button"
                            onClick={() => setReviewFundingTarget(r)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[11px]"
                          >
                            Review
                          </button>

                          {/* 2. Changes */}
                          {r.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenChangesModal(r)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold text-[11px] hover:bg-amber-100"
                            >
                              Changes
                            </button>
                          )}

                          {/* 3. Approve */}
                          {r.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(r)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2 CONTENT: INVESTMENT REQUESTS (PHASE 5)
         ======================================================== */}
      {activeTab === 'INVESTMENT_REQUESTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {['ALL', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'PAID', 'ACTIVE', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInvestmentStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    investmentStatusFilter === st
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-purple-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={investmentSearch}
                onChange={(e) => setInvestmentSearch(e.target.value)}
                placeholder="Search investments..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-4">Investment ID</th>
                  <th className="p-4">Investor Name</th>
                  <th className="p-4">Funding Proposal</th>
                  <th className="p-4">Funding Requestor</th>
                  <th className="p-4">Committed Amount</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {investmentRequests
                  .filter((inv) =>
                    investmentSearch.trim()
                      ? inv.investmentId?.toLowerCase().includes(investmentSearch.toLowerCase()) ||
                        inv.investorName?.toLowerCase().includes(investmentSearch.toLowerCase()) ||
                        inv.projectName?.toLowerCase().includes(investmentSearch.toLowerCase())
                      : true
                  )
                  .map((inv) => (
                    <tr key={inv._id || inv.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {inv.investmentId}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {inv.investorName}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {inv.projectName} ({inv.fundingRequestRef})
                      </td>
                      <td className="p-4 text-slate-500">
                        {inv.fundingRequestorName}
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyINR(inv.requestedAmount)}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'APPROVED' || inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : inv.status === 'CHANGES_REQUESTED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReviewInvestment(inv)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs"
                        >
                          Review & Decide
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3 CONTENT: FUND RELEASE (PHASE 7)
         ======================================================== */}
      {activeTab === 'FUND_RELEASE' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Escrow Fund Release & Capital Disbursement
            </h3>
            <p className="text-xs text-slate-500">
              Disburse paid investor capital to verified funding requestors with audit trail.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-4">Investment ID</th>
                  <th className="p-4">Project / Company</th>
                  <th className="p-4">Investor</th>
                  <th className="p-4">Funding Requestor</th>
                  <th className="p-4">Investor Paid Amount</th>
                  <th className="p-4">Eligible Release</th>
                  <th className="p-4">Disbursed Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fundReleases.map((fr) => {
                  const eligible = fr.pendingReleaseAmount || fr.eligibleReleaseAmount || fr.paidAmount;
                  return (
                    <tr key={fr._id || fr.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {fr.investmentId}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {fr.projectName}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {fr.investorName}
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {fr.fundingRequestorName}
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyINR(fr.paidAmount)}
                      </td>
                      <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrencyINR(eligible)}
                      </td>
                      <td className="p-4 text-slate-500">
                        {formatCurrencyINR(fr.releasedAmount || 0)}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {fr.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {eligible > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDisburseModal(fr)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
                          >
                            Disburse Amount
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Fully Disbursed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4 CONTENT: RETURNS & MATURITY SCHEDULE (PHASE 8)
         ======================================================== */}
      {activeTab === 'RETURNS_MATURITY' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Yield Returns & Maturity Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Automated interest yields, payout schedules, and maturity countdowns for deployed capital.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-4">Investment ID</th>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Investor</th>
                  <th className="p-4">Principal Deployed</th>
                  <th className="p-4">Return Rate & Frequency</th>
                  <th className="p-4">Maturity Date</th>
                  <th className="p-4">Maturity Due</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {returnsMaturityList.map((rm) => (
                  <tr key={rm._id || rm.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">{rm.investmentId}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{rm.projectName}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{rm.investorName}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{formatCurrencyINR(rm.paidAmount)}</td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {rm.expectedReturns} ({rm.returnFrequency})
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                      {rm.maturityDate ? new Date(rm.maturityDate).toLocaleDateString() : 'Pending Deployment'}
                    </td>
                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrencyINR(rm.maturityAmountDue || Math.round(rm.paidAmount * 1.15))}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {rm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5 CONTENT: MATURITY RELEASE (PHASE 10)
         ======================================================== */}
      {activeTab === 'MATURITY_RELEASE' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Maturity Settlement Release to Investors
            </h3>
            <p className="text-xs text-slate-500">
              Release received maturity repayments from funding requestors directly to investors.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-4">Investment ID</th>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Investor</th>
                  <th className="p-4">Company Name</th>
                  <th className="p-4">Maturity Received</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {maturityReleases.map((mr) => (
                  <tr key={mr._id || mr.investmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">{mr.investmentId}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{mr.projectName}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{mr.investorName}</td>
                    <td className="p-4 text-slate-500">{mr.fundingRequestorName}</td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyINR(mr.maturityAmountReceived || mr.maturityAmountDue)}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {mr.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {mr.status !== 'COMPLETED' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenMaturityReleaseModal(mr)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
                        >
                          Release to Investor
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REVIEW FUNDING REQUEST (PHASE 2.1)
         ======================================================== */}
      {reviewFundingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {reviewFundingTarget.fundingRequestId || reviewFundingTarget.refNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Funding Application Review: {reviewFundingTarget.companyName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewFundingTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Company / Project Name</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {reviewFundingTarget.companyName || reviewFundingTarget.businessName}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Funding Duration</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {reviewFundingTarget.fundingDuration}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Required Capital</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrencyINR(reviewFundingTarget.requiredFundingAmount || reviewFundingTarget.fundingAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Permitted Ticket Size</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrencyINR(reviewFundingTarget.minInvestmentAmount)} - {formatCurrencyINR(reviewFundingTarget.maxInvestmentAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Expected Returns</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {reviewFundingTarget.expectedReturns} ({reviewFundingTarget.returnFrequency})
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Applicant Contact</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {reviewFundingTarget.requestorName} • {reviewFundingTarget.requestorEmail}
                </p>
              </div>
              <div className="col-span-full">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Funding Purpose</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {reviewFundingTarget.fundingPurpose}
                </p>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono">
                Uploaded Pitch Documents ({reviewFundingTarget.documents?.length || 0}):
              </span>
              <div className="mt-2 space-y-2">
                {reviewFundingTarget.documents?.map((doc: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{doc.name}</span>
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-semibold text-[11px] hover:bg-purple-200 flex items-center gap-1"
                      >
                        <span>Preview / Download</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewFundingTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenChangesModal(reviewFundingTarget);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenApproveModal(reviewFundingTarget);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REQUEST CHANGES (PHASE 2.2)
         ======================================================== */}
      {changesTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600">ACTION REQUIRED</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Request Changes: {changesTarget.companyName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChangesTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1.5">
                Change Request Message / Instructions *
              </label>
              <textarea
                rows={3}
                value={changeMessage}
                onChange={(e) => setChangeMessage(e.target.value)}
                placeholder="Specify what corrections or additional explanations are needed..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Dynamic + Add Document Requirements */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono">
                  Require Additional Documents ({requestedDocsList.length}):
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Document Name (e.g. Audited Balance Sheet 2025)"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={newDocInstructions}
                  onChange={(e) => setNewDocInstructions(e.target.value)}
                  placeholder="Instructions for the applicant"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={handleAddRequestedDoc}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document Requirement</span>
                </button>
              </div>

              {requestedDocsList.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold">{doc.name}</p>
                    <p className="text-[11px] text-indigo-700">{doc.instructions}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestedDocsList(requestedDocsList.filter((_, i) => i !== idx))}
                    className="text-rose-500 font-bold ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setChangesTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmChanges}
                disabled={isSubmittingChanges}
                className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
              >
                {isSubmittingChanges ? 'Submitting...' : 'Send Change Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: APPROVE FUNDING REQUEST (PHASE 2.3)
         ======================================================== */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Approve Funding Proposal
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Approving this proposal will publish it live to the <b>Need Funding</b> tab for all verified network investors.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Company:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{approveTarget.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyINR(approveTarget.requiredFundingAmount || approveTarget.fundingAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Returns:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {approveTarget.expectedReturns} ({approveTarget.returnFrequency})
                </span>
              </div>
            </div>

            <div>
              <label className="block text-left text-[11px] font-bold text-slate-400 uppercase font-mono mb-1">
                Approval Notes / Compliance Reference
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isApprovingFunding}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {isApprovingFunding ? 'Approving...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REVIEW INVESTMENT REQUEST (PHASE 5.2)
         ======================================================== */}
      {reviewInvestmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {reviewInvestmentTarget.investmentId}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Review Investment: {reviewInvestmentTarget.projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewInvestmentTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Investor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{reviewInvestmentTarget.investorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested Commitment:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyINR(reviewInvestmentTarget.requestedAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Returns:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {reviewInvestmentTarget.expectedReturns} ({reviewInvestmentTarget.returnFrequency})
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                Approved Investment Amount (₹)
              </label>
              <input
                type="number"
                value={investApprovedAmount}
                onChange={(e) => setInvestApprovedAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                Decision Notes / Rejection Reason
              </label>
              <textarea
                rows={2}
                value={investActionNotes}
                onChange={(e) => setInvestActionNotes(e.target.value)}
                placeholder="Enter notes or rejection reason..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleProcessInvestmentReview('REJECT')}
                disabled={isProcessingInvestReview}
                className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs"
              >
                Reject
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleProcessInvestmentReview('REQUEST_CHANGES')}
                  disabled={isProcessingInvestReview}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-xs"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessInvestmentReview('APPROVE')}
                  disabled={isProcessingInvestReview}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  {isProcessingInvestReview ? 'Processing...' : 'Approve & Enable Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DISBURSE AMOUNT (PHASE 7.2)
         ======================================================== */}
      {disburseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {disburseTarget.investmentId}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Disburse Capital to {disburseTarget.fundingRequestorName}
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

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Project Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{disburseTarget.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Investor Paid Capital:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyINR(disburseTarget.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Eligible Balance:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrencyINR(disburseTarget.pendingReleaseAmount || disburseTarget.eligibleReleaseAmount || disburseTarget.paidAmount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                Release Disbursement Amount (₹)
              </label>
              <input
                type="number"
                value={disburseAmountInput}
                onChange={(e) => setDisburseAmountInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                Payout Gateway / Bank Transfer Reference
              </label>
              <input
                type="text"
                value={disburseReference}
                onChange={(e) => setDisburseReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
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
                onClick={handleConfirmDisbursement}
                disabled={isDisbursing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {isDisbursing ? 'Processing...' : 'Confirm & Disburse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: MATURITY RELEASE TO INVESTOR (PHASE 10.2)
         ======================================================== */}
      {maturityReleaseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600">
                  {maturityReleaseTarget.investmentId}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Release Maturity Funds to Investor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMaturityReleaseTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Investor Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{maturityReleaseTarget.investorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project / Company:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{maturityReleaseTarget.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maturity Settlement Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrencyINR(maturityReleaseTarget.maturityAmountReceived || maturityReleaseTarget.maturityAmountDue)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                Payout Transfer Reference
              </label>
              <input
                type="text"
                value={maturityPayoutRef}
                onChange={(e) => setMaturityPayoutRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMaturityReleaseTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMaturityRelease}
                disabled={isReleasingMaturity}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {isReleasingMaturity ? 'Releasing...' : 'Release Payout to Investor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundingDeskPage;
