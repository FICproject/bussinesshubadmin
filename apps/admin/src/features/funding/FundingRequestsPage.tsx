import React, { useEffect, useState, useCallback } from 'react';
import {
  Building,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ShieldCheck,
  FileText,
  AlertCircle,
  Eye,
  Plus,
  RefreshCw,
  Send,
  X,
  ArrowRight,
  TrendingUp,
  Percent,
  DollarSign
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { AuthenticatedDocumentPreview } from '../../components/AuthenticatedDocumentPreview';

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

export const FundingRequestsPage: React.FC = () => {
  const [fundingRequests, setFundingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewFundingTarget, setReviewFundingTarget] = useState<any | null>(null);

  // Request Changes Modal
  const [changesTarget, setChangesTarget] = useState<any | null>(null);
  const [changeMessage, setChangeMessage] = useState<string>('');
  const [requestedDocsList, setRequestedDocsList] = useState<{ id: string; name: string; instructions: string }[]>([]);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocInstructions, setNewDocInstructions] = useState<string>('');
  const [isSubmittingChanges, setIsSubmittingChanges] = useState<boolean>(false);

  // Approve Modal
  const [approveTarget, setApproveTarget] = useState<any | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // In-app Document Viewer
  const [viewingDocument, setViewingDocument] = useState<{ fileUrl: string; name: string; fileType?: string } | null>(null);

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/api/admin/funding/requests${qs}`);
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setFundingRequests(list);

      // Auto-sync open modal
      if (selectedRequest) {
        const fresh = list.find((r: any) => (r.fundingRequestId || r._id) === (selectedRequest.fundingRequestId || selectedRequest._id));
        if (fresh) setSelectedRequest(fresh);
      }
    } catch (err: any) {
      console.warn('Failed to load funding requests:', err);
      if (!silent) setLoadError(err.message || 'Failed to connect to backend server');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, selectedRequest]);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  // Real-time synchronization (6-second polling + window focus)
  useEffect(() => {
    const interval = setInterval(() => loadRequests(true), 6000);
    const onFocus = () => loadRequests(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadRequests]);

  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Mark Under Review
  const handleMarkReview = async (reqItem: any) => {
    try {
      const res = await apiFetch(
        `/api/admin/funding/requests/${reqItem.fundingRequestId || reqItem._id}/review`,
        {
          method: 'PUT',
          body: JSON.stringify({ notes: 'Review started by Admin.' })
        }
      );
      if (res?.success) {
        setFeedbackMsg({ type: 'success', text: `Proposal ${reqItem.companyName} marked as Under Review!` });
        loadRequests(true);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // Open Changes Modal
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
        setFeedbackMsg({ type: 'success', text: 'Change request sent to member successfully!' });
        setChangesTarget(null);
        setSelectedRequest(null);
        loadRequests(true);
      } else {
        throw new Error(res?.error || 'Failed to submit changes');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingChanges(false);
    }
  };

  // Open Approve Modal
  const handleOpenApproveModal = (reqItem: any) => {
    setApproveTarget(reqItem);
    setApprovalNotes('');
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
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
          text: `Proposal ${approveTarget.companyName} approved & published live to Need Funding!`
        });
        setApproveTarget(null);
        setSelectedRequest(null);
        loadRequests(true);
      } else {
        throw new Error(res?.error || 'Failed to approve request');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsApproving(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (reqItem: any) => {
    setRejectTarget(reqItem);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) {
      alert('Please provide a valid rejection reason.');
      return;
    }
    setIsRejecting(true);
    try {
      const res = await apiFetch(
        `/api/admin/funding/requests/${rejectTarget.fundingRequestId || rejectTarget._id}/reject`,
        {
          method: 'PUT',
          body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
        }
      );
      if (res?.success) {
        setFeedbackMsg({ type: 'success', text: `Proposal ${rejectTarget.companyName} rejected.` });
        setRejectTarget(null);
        setSelectedRequest(null);
        loadRequests(true);
      } else {
        throw new Error(res?.error || 'Failed to reject request');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredRequests = fundingRequests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.companyName || r.businessName || '').toLowerCase().includes(q) ||
      (r.fundingRequestId || r.refNumber || '').toLowerCase().includes(q) ||
      (r.requestorName || '').toLowerCase().includes(q) ||
      (r.industry || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
              <Building className="w-5 h-5" />
            </span>
            <span>Funding Requests</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review member business funding proposals, request compliance revisions, and approve opportunities for network investors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadRequests()}
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
          {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].map((st) => (
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
            placeholder="Search by company, ID, or member..."
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
                <th className="p-4">Request ID</th>
                <th className="p-4">Project / Company</th>
                <th className="p-4">Requesting Member</th>
                <th className="p-4">Category</th>
                <th className="p-4">Funding Required</th>
                <th className="p-4">Ticket Limits</th>
                <th className="p-4">Returns & Tenure</th>
                <th className="p-4">Docs</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Loading funding requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    No funding requests match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r._id || r.fundingRequestId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {r.fundingRequestId || r.refNumber}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {r.companyName || r.businessName}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                        {Array.isArray(r.fundingPurpose) ? r.fundingPurpose.join(', ') : r.fundingPurpose || 'General Business Expansion'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {r.requestorName || 'FIC Member'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {r.requestorPhone || r.requestorEmail || ''}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {r.industry || 'Business & Entrepreneurship'}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrencyINR(r.requiredFundingAmount || r.fundingAmount)}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {formatCurrencyINR(r.minInvestmentAmount)} - {formatCurrencyINR(r.maxInvestmentAmount)}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <span className="font-bold">{r.expectedReturns}</span>
                      <span className="text-slate-400 block text-[10px]">
                        {r.returnFrequency} • {r.fundingDuration}
                      </span>
                    </td>
                    <td className="p-4">
                      {r.documents && r.documents.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setViewingDocument({
                            fileUrl: r.documents[0].fileUrl,
                            name: r.documents[0].name || 'Supporting Document',
                            fileType: r.documents[0].originalMimeType
                          })}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{r.documents.length} File{r.documents.length > 1 ? 's' : ''}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED' || r.status === 'ACTIVE' || r.status === 'FUNDED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : r.status === 'CHANGES_REQUESTED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : r.status === 'UNDER_REVIEW'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* 1. View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(r)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors"
                        >
                          View Details
                        </button>

                        {/* 2. Review */}
                        {r.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            onClick={() => handleMarkReview(r)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px] hover:bg-purple-100"
                          >
                            Review
                          </button>
                        )}

                        {/* 3. Changes */}
                        {r.status !== 'APPROVED' && r.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenChangesModal(r)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[11px] hover:bg-amber-100"
                          >
                            Changes
                          </button>
                        )}

                        {/* 4. Approve */}
                        {r.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(r)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                          >
                            Approve
                          </button>
                        )}

                        {/* 5. Reject */}
                        {r.status !== 'APPROVED' && r.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(r)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px] hover:bg-rose-100"
                          >
                            Reject
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

      {/* ========================================================
          MODAL: VIEW DETAILS
         ======================================================== */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  {selectedRequest.fundingRequestId || selectedRequest.refNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedRequest.companyName || selectedRequest.businessName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Required Capital</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrencyINR(selectedRequest.requiredFundingAmount || selectedRequest.fundingAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Ticket Range</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrencyINR(selectedRequest.minInvestmentAmount)} - {formatCurrencyINR(selectedRequest.maxInvestmentAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Duration</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRequest.fundingDuration || '12 Months'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Expected Returns</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedRequest.expectedReturns} ({selectedRequest.returnFrequency})
                </span>
              </div>
            </div>

            {/* Submitter Credentials */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                Submitter Credentials
              </h4>
              <p className="text-slate-600 dark:text-slate-300">
                <b>Name:</b> {selectedRequest.requestorName || 'FIC Member'} &bull; <b>Email:</b> {selectedRequest.requestorEmail || 'N/A'} &bull; <b>Phone:</b> {selectedRequest.requestorPhone || 'N/A'}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <b>Industry Sector:</b> {selectedRequest.industry || 'Business & Entrepreneurship'} &bull; <b>Stage:</b> {selectedRequest.businessStage || 'Growing Business'}
              </p>
            </div>

            {/* Purpose & Description */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                Funding Purpose & Capital Utilization
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {Array.isArray(selectedRequest.fundingPurpose)
                  ? selectedRequest.fundingPurpose.join(', ')
                  : selectedRequest.fundingPurpose || selectedRequest.useOfFundsExplanation || 'General expansion.'}
              </p>
            </div>

            {/* Uploaded Supporting Documents */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                Supporting Documents ({selectedRequest.documents?.length || 0})
              </h4>
              {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedRequest.documents.map((doc: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{doc.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingDocument({
                          fileUrl: doc.fileUrl,
                          name: doc.name,
                          fileType: doc.originalMimeType
                        })}
                        className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100"
                      >
                        View Document
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No supporting documents attached.</p>
              )}
            </div>

            {/* Revision History */}
            {selectedRequest.changeRequests && selectedRequest.changeRequests.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                  Revision History & Compliance Feedback
                </h4>
                <div className="space-y-2">
                  {selectedRequest.changeRequests.map((cr: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-300">
                      <p className="font-bold">Requested by {cr.requestedBy} on {new Date(cr.date).toLocaleDateString()}:</p>
                      <p className="mt-1">{cr.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REQUEST CHANGES
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
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono">
                Require Additional Documents ({requestedDocsList.length}):
              </span>

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
          MODAL: APPROVE FUNDING REQUEST
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
                placeholder="Optional notes or compliance reference..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isApproving}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {isApproving ? 'Approving...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REJECT FUNDING REQUEST
         ======================================================== */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Decline Funding Proposal
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Provide a clear reason why <b>{rejectTarget.companyName}</b> cannot be approved at this time.
              </p>
            </div>

            <div className="text-left">
              <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State the reason for declining this request..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Document Preview Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Document Preview: {viewingDocument.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Type: {viewingDocument.fileType || 'Supporting Document'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <AuthenticatedDocumentPreview
                fileUrl={viewingDocument.fileUrl}
                fileName={viewingDocument.name}
                originalMimeType={viewingDocument.fileType}
                title={viewingDocument.name}
                maxHeightClass="max-h-[60vh]"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
