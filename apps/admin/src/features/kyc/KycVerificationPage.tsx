import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  X,
  Search,
  LayoutGrid,
  List,
  Eye,
  Building,
  User,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  History,
  ChevronDown,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, downloadAdminOriginalDocument } from '../../services/api';
import { AuthenticatedDocumentPreview } from '../../components/AuthenticatedDocumentPreview';
import { containerVariants, itemVariants } from '../../utils/animations';
import { SkeletonList, SkeletonCards } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';

export const KycVerificationPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Review decision states
  const [decision, setDecision] = useState<'APPROVED' | 'RESUBMISSION_REQUESTED'>('APPROVED');
  const [reuploadDocKeys, setReuploadDocKeys] = useState<string[]>([]);
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document modal preview state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [expandedHistoryKeys, setExpandedHistoryKeys] = useState<Record<string, boolean>>({});

  const getDocIdentifier = (doc: any, idx?: number) =>
    String(doc?.docKey || doc?.documentId || (idx !== undefined ? idx : ''));

  const getDocStatusBadge = (status?: string) => {
    const s = String(status || 'PENDING_REVIEW').toUpperCase();
    if (s === 'APPROVED' || s === 'VERIFIED') {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">APPROVED</span>;
    }
    if (s === 'REUPLOAD_REQUIRED') {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">REUPLOAD REQUIRED</span>;
    }
    if (s === 'REJECTED') {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">REJECTED</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">PENDING REVIEW</span>;
  };

  const { showAlert } = useDialog();

  const tabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Resubmit', value: 'RESUBMISSION_REQUESTED' },
  ];

  useEffect(() => {
    loadSubmissions();
  }, [filterStatus]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/kyc?status=${filterStatus}`);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load KYC list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (sub: any) => {
    setExpandedHistoryKeys({});
    setIsDocDropdownOpen(false);
    setSelectedSubmission(sub);
    setDecision(sub.status === 'RESUBMISSION_REQUESTED' ? 'RESUBMISSION_REQUESTED' : 'APPROVED');
    const preselectedReupload = Array.isArray(sub.documents)
      ? sub.documents
          .map((d: any, idx: number) => ({ id: getDocIdentifier(d, idx), status: String(d.status || '').toUpperCase() }))
          .filter((item: { id: string; status: string }) => item.status === 'REUPLOAD_REQUIRED' && item.id)
          .map((item: { id: string }) => item.id)
      : [];
    setReuploadDocKeys(preselectedReupload);
    setRejectionReason(sub.rejectionReason || '');
  };

  const toggleReuploadDoc = (docId: string) => {
    if (!docId) return;
    setReuploadDocKeys((prev) =>
      prev.includes(docId) ? prev.filter((k) => k !== docId) : [...prev, docId]
    );
  };

  const toggleSelectAllReuploadDocs = (docs: any[]) => {
    const allIds = docs.map((d, idx) => getDocIdentifier(d, idx)).filter(Boolean);
    const allSelected = allIds.length > 0 && allIds.every((id) => reuploadDocKeys.includes(id));
    setReuploadDocKeys(allSelected ? [] : allIds);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const uploadedDocs = Array.isArray(selectedSubmission.documents) ? selectedSubmission.documents : [];
    if (decision === 'RESUBMISSION_REQUESTED') {
      if (uploadedDocs.length > 0 && reuploadDocKeys.length === 0) {
        await showAlert('Please select at least one document requiring reupload from the dropdown.', {
          title: 'Select Documents to Reupload',
          severity: 'warning',
        });
        return;
      }
      if (!rejectionReason.trim()) {
        await showAlert('Please enter a clear reason for resubmission.', {
          title: 'Resubmission Reason Required',
          severity: 'warning',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/admin/kyc/${selectedSubmission._id}/review`, {
        method: 'PATCH',
        body: JSON.stringify(
          decision === 'APPROVED'
            ? { decision: 'APPROVED' }
            : {
                decision: 'RESUBMISSION_REQUESTED',
                rejectionReason: rejectionReason.trim(),
                reuploadDocKeys,
              }
        ),
      });
      setSelectedSubmission(null);
      setRejectionReason('');
      setReuploadDocKeys([]);
      setIsDocDropdownOpen(false);
      await loadSubmissions();
    } catch (err: any) {
      await showAlert(`Error updating KYC: ${err.message}`, {
        title: 'KYC Decision Failed',
        severity: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase().trim();
    return submissions.filter((sub) => {
      const matchName = sub.memberName?.toLowerCase().includes(q);
      const matchEmail = sub.memberEmail?.toLowerCase().includes(q);
      const matchCategory = sub.categoryName?.toLowerCase().includes(q);
      return matchName || matchEmail || matchCategory;
    });
  }, [submissions, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
            REJECTED
          </span>
        );
      case 'RESUBMISSION_REQUESTED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            RESUBMISSION
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
            UNDER REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
            {status?.replace('_', ' ') || 'SUBMITTED'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span>KYC Verification Desk</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review identity, business registrations, and category-specific proofs.
          </p>
        </div>

        {/* Animated Filter Tabs with layoutId pill */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = filterStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors z-10 whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 bg-sky-600 rounded-lg shadow-sm -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Grid / List View Toggle Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, email, or category..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* View Mode Toggle (Grid / List) on top right */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mr-1">
            View:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-[var(--accent-primary)] shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-[var(--accent-primary)] shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: List View or Grid View */}
      {loading ? (
        viewMode === 'list' ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <SkeletonList count={5} />
          </div>
        ) : (
          <SkeletonCards count={6} />
        )
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No applications in this view</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? `No candidates match "${searchQuery}".` : 'There are no pending KYC requests in this category.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* ================= LIST VIEW (DEFAULT) ================= */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs"
        >
          {filteredSubmissions.map((sub, idx) => (
            <motion.div
              key={sub._id}
              variants={itemVariants}
              onClick={() => handleOpenDetails(sub)}
              className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 w-6 pt-1 shrink-0">
                  #{idx + 1}
                </span>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-[var(--accent-primary)] transition-colors truncate">
                      {sub.memberName}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {sub.categoryName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {sub.memberEmail}
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-center space-x-3 pt-0.5">
                    <span>Docs: <strong className="text-slate-600 dark:text-slate-300">{sub.documents?.length || 0}</strong> attached</span>
                    {sub.docSummary?.reuploadRequired > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {sub.docSummary.reuploadRequired} Reupload Req
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>Submitted {new Date(sub.submittedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 self-end md:self-center">
                {getStatusBadge(sub.status)}

                <button
                  type="button"
                  className="px-3.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect & Decide</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* ================= GRID VIEW ================= */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredSubmissions.map((sub, idx) => (
            <motion.div
              key={sub._id}
              variants={itemVariants}
              onClick={() => handleOpenDetails(sub)}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-500/50 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                    #{idx + 1}
                  </span>
                  {getStatusBadge(sub.status)}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                  {sub.memberName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {sub.memberEmail}
                </p>

                <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="text-[11px] text-slate-400 uppercase font-mono">Category</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {sub.categoryName}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {sub.documents?.length || 0} Docs Attached
                </span>
                <span className="text-sky-600 dark:text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Inspect <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ================= CENTRALIZED DETAILS TAB / MODAL ================= */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Animated Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />

            {/* Centralized Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 flex items-center justify-center font-bold shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                        KYC Compliance Inspection
                      </span>
                      {getStatusBadge(selectedSubmission.status)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {selectedSubmission.memberName}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Candidate Detailed Information Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Applicant Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">{selectedSubmission.memberEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedSubmission.memberPhone || selectedSubmission.memberId?.phone || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date of Birth (Age)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedSubmission.memberDob || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Enrolled Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSubmission.categoryName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Subcategory / Primary Role</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {selectedSubmission.subCategory || selectedSubmission.memberId?.subcategories?.[0] || 'Member'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Submission Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">Residential / Business Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedSubmission.address
                        ? `${selectedSubmission.address.addressLine1 || ''} ${selectedSubmission.address.addressLine2 || ''}, ${selectedSubmission.address.city || ''}, ${selectedSubmission.address.district || ''}, ${selectedSubmission.address.state || ''} - ${selectedSubmission.address.pinCode || ''}`
                        : (selectedSubmission.memberId?.address
                            ? `${selectedSubmission.memberId.address.addressLine1 || ''}, ${selectedSubmission.memberId.address.city || ''}, ${selectedSubmission.memberId.address.state || ''} - ${selectedSubmission.memberId.address.pinCode || ''}`
                            : 'Address details on file')}
                    </span>
                  </div>

                  {/* Payment Gateway Transaction Proof */}
                  <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                        ₹{selectedSubmission.paymentDetails?.amount || 99}.00 Membership Fee Received via Razorpay
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                        Payment ID: {selectedSubmission.paymentDetails?.paymentId || selectedSubmission.memberId?.paymentId || '—'} • Order: {selectedSubmission.paymentDetails?.orderId || '—'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 uppercase font-mono">
                      {selectedSubmission.paymentDetails?.status || 'CAPTURED'}
                    </span>
                  </div>
                </div>

                {/* Uploaded Documents with Embedded Inline Inspection Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      Uploaded Verification Documents ({selectedSubmission.documents?.length || 0})
                    </h4>
                    <span className="text-xs text-slate-400">
                      Embedded preview within inspection tab
                    </span>
                  </div>

                  {selectedSubmission.documents && selectedSubmission.documents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSubmission.documents.map((doc: any, i: number) => {
                        const isImage = doc.fileUrl && (doc.fileUrl.startsWith('data:image/') || doc.fileUrl.match(/\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i) || doc.fileName?.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i));
                        const isPdf = doc.fileUrl && (doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.endsWith('.pdf') || doc.fileName?.endsWith('.pdf'));

                        return (
                          <div
                            key={i}
                            className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:border-indigo-400/50 transition-colors"
                          >
                            {/* Document Title Header */}
                            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80">
                              <div className="flex items-center space-x-3 truncate">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-[var(--accent-primary)] rounded-lg shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {doc.title || doc.documentType || `Verification Document #${i + 1}`}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {doc.fileName || 'Uploaded attachment'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                {doc.documentNumber && (
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md">
                                    ID: {doc.documentNumber}
                                  </span>
                                )}
                                {doc.documentId ? (
                                  <button
                                    type="button"
                                    onClick={() => downloadAdminOriginalDocument(doc.documentId, doc.fileName)}
                                    className="px-2 py-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100"
                                    title="Download exact original file"
                                  >
                                    Download Original
                                  </button>
                                ) : doc.fileUrl ? (
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    title="Open raw file in new tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : null}
                              </div>
                            </div>

                            {/* Inline Inspection Preview Box (Authenticated Optimized Preview / Exact Original) */}
                            <div className="p-3 bg-slate-100/60 dark:bg-slate-950/40 flex items-center justify-center min-h-[160px] max-h-[420px] overflow-auto">
                              <AuthenticatedDocumentPreview
                                documentId={doc.documentId}
                                fileUrl={doc.fileUrl}
                                fileName={doc.fileName}
                                originalMimeType={doc.originalMimeType}
                                originalFileSize={doc.originalFileSize}
                                checksum={doc.checksum}
                                title={doc.title || doc.documentType}
                              />
                            </div>

                            {/* Individual Document Verification Bar */}
                            <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {getDocStatusBadge(doc.status)}
                                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                    v{doc.version || 1}
                                  </span>
                                  {Number(doc.version || 1) > 1 && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                                      New Resubmitted Version
                                    </span>
                                  )}
                                </div>

                                {Array.isArray(doc.versionHistory) && doc.versionHistory.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedHistoryKeys((prev) => ({
                                        ...prev,
                                        [doc.docKey || String(i)]: !prev[doc.docKey || String(i)],
                                      }))
                                    }
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1"
                                  >
                                    <History className="w-3 h-3" />
                                    <span>History ({doc.versionHistory.length})</span>
                                  </button>
                                )}
                              </div>

                              {(doc.adminReviewReason || doc.rejectionReason) && doc.status !== 'APPROVED' && (
                                <div className="text-[11px] p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
                                  <strong>Admin Remark:</strong> {doc.adminReviewReason || doc.rejectionReason}
                                </div>
                              )}

                              {expandedHistoryKeys[doc.docKey || String(i)] && Array.isArray(doc.versionHistory) && doc.versionHistory.length > 0 && (
                                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Archived Version History (Read-Only)
                                  </div>
                                  {doc.versionHistory.map((hv: any, hIdx: number) => (
                                    <div key={hIdx} className="text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-slate-300 border-t border-slate-200/70 dark:border-slate-800 pt-1">
                                      <span>
                                        <strong>v{hv.version}</strong> ? {hv.fileName} ({hv.status})
                                        {hv.reason ? ` ? Reason: ${hv.reason}` : ''}
                                      </span>
                                      {hv.documentId && (
                                        <button
                                          type="button"
                                          onClick={() => downloadAdminOriginalDocument(hv.documentId, hv.fileName)}
                                          className="text-[10px] text-indigo-600 hover:underline font-semibold"
                                        >
                                          Download v{hv.version}
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-slate-400 text-xs">
                      No document proofs attached.
                    </div>
                  )}
                </div>

                {/* Compliance Decision Panel */}
                <form onSubmit={handleDecisionSubmit} className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-2">
                      Record Verification Decision
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDecision('APPROVED');
                          setIsDocDropdownOpen(false);
                        }}
                        className={`py-3 px-3 text-xs font-bold rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-150 active:scale-95 ${
                          decision === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve KYC</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecision('RESUBMISSION_REQUESTED')}
                        className={`py-3 px-3 text-xs font-bold rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-150 active:scale-95 ${
                          decision === 'RESUBMISSION_REQUESTED'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Request Resubmit</span>
                      </button>
                    </div>
                  </div>

                  {decision === 'RESUBMISSION_REQUESTED' && (() => {
                    const uploadedDocs = Array.isArray(selectedSubmission.documents)
                      ? selectedSubmission.documents
                      : [];
                    return (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                            Documents to Reupload ({uploadedDocs.length} Uploaded) *
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsDocDropdownOpen((prev) => !prev)}
                              className="w-full flex items-center justify-between text-xs p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl hover:border-amber-500 transition-colors"
                            >
                              <span className="truncate font-medium">
                                {uploadedDocs.length === 0
                                  ? 'No documents uploaded'
                                  : reuploadDocKeys.length === 0
                                  ? `Select documents to reupload (${uploadedDocs.length} uploaded)`
                                  : `${reuploadDocKeys.length} of ${uploadedDocs.length} uploaded document${reuploadDocKeys.length > 1 ? 's' : ''} selected`}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-slate-400 transition-transform ${isDocDropdownOpen ? 'rotate-180' : ''}`}
                              />
                            </button>

                            {isDocDropdownOpen && uploadedDocs.length > 0 && (
                              <div className="mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                                    {uploadedDocs.length} Document{uploadedDocs.length === 1 ? '' : 's'} Uploaded
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectAllReuploadDocs(uploadedDocs)}
                                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                  >
                                    {reuploadDocKeys.length === uploadedDocs.length ? 'Clear All' : 'Select All'}
                                  </button>
                                </div>
                                {uploadedDocs.map((doc: any, idx: number) => {
                                  const docId = getDocIdentifier(doc, idx);
                                  const isChecked = reuploadDocKeys.includes(docId);
                                  return (
                                    <button
                                      key={docId || idx}
                                      type="button"
                                      onClick={() => toggleReuploadDoc(docId)}
                                      className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-amber-50/60 dark:hover:bg-slate-800/60 transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                            isChecked
                                              ? 'bg-amber-600 border-amber-600 text-white'
                                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                          }`}
                                        >
                                          {isChecked && <Check className="w-3 h-3" />}
                                        </span>
                                        <div className="min-w-0">
                                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {doc.title || doc.documentType || `Document #${idx + 1}`}
                                          </div>
                                          <div className="text-[10px] text-slate-400 truncate">
                                            {doc.fileName || 'Uploaded file'} • v{doc.version || 1}
                                          </div>
                                        </div>
                                      </div>
                                      {getDocStatusBadge(doc.status)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {reuploadDocKeys.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {uploadedDocs
                                .map((doc: any, idx: number) => ({ doc, docId: getDocIdentifier(doc, idx) }))
                                .filter(({ docId }: { docId: string }) => reuploadDocKeys.includes(docId))
                                .map(({ doc, docId }: { doc: any; docId: string }) => (
                                  <span
                                    key={docId}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                  >
                                    <span>{doc.title || doc.documentType || docId}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleReuploadDoc(docId)}
                                      className="hover:text-amber-950 dark:hover:text-white"
                                      aria-label="Remove document selection"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                            Reason for Resubmission *
                          </label>
                          <textarea
                            required
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Detail specific issues (e.g. blurred image, name mismatch on Udyam certificate)."
                            rows={3}
                            className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </motion.div>
                    );
                  })()}

                  <div className="pt-3 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSubmission(null)}
                      className="px-4 py-2.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                    >
                      {isSubmitting ? 'Recording Decision...' : 'Commit Verification Decision'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-in Document Inspection Drawer / Zoom Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDoc(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{previewDoc.title}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                    <span>{previewDoc.fileName}</span>
                    {previewDoc.documentNumber && (
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                        ID: {previewDoc.documentNumber}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950/60 rounded-xl p-4 min-h-[300px]">
                {previewDoc.fileUrl && (previewDoc.fileUrl.startsWith('data:image/') || previewDoc.fileUrl.match(/\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i) || previewDoc.fileName?.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i)) ? (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                  />
                ) : previewDoc.fileUrl && (previewDoc.fileUrl.startsWith('data:application/pdf') || previewDoc.fileUrl.endsWith('.pdf') || previewDoc.fileName?.endsWith('.pdf')) ? (
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.title}
                    className="w-full h-[65vh] rounded-lg border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Document attachment proof</p>
                    {previewDoc.fileUrl && (
                      <a
                        href={previewDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <span>Open Document in New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
                <div className="img-fallback hidden flex-col items-center justify-center p-6 text-center text-slate-400">
                  <FileText className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
                  <p className="text-xs font-medium">Unable to load direct image preview</p>
                  <p className="text-[11px] text-slate-500 mt-1">Please inspect using the new tab link or verify original upload.</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {previewDoc.fileUrl && (
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={previewDoc.fileName || 'kyc-doc'}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1"
                  >
                    <span>Open in new window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-all active:scale-95 ml-auto"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
