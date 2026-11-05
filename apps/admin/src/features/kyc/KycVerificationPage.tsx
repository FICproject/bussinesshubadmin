import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
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
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED'>('APPROVED');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document modal preview state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const { showAlert } = useDialog();

  const tabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Resubmit', value: 'RESUBMISSION_REQUESTED' },
    { label: 'Rejected', value: 'REJECTED' },
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
    setSelectedSubmission(sub);
    setDecision(sub.status === 'REJECTED' || sub.status === 'RESUBMISSION_REQUESTED' ? sub.status : 'APPROVED');
    setReviewerNotes(sub.adminNotes || '');
    setRejectionReason(sub.rejectionReason || '');
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/admin/kyc/${selectedSubmission._id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, reviewerNotes, rejectionReason }),
      });
      // Close modal tab immediately and reset inputs
      setSelectedSubmission(null);
      setReviewerNotes('');
      setRejectionReason('');
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
                {/* Candidate Information Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Applicant Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSubmission.memberEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Enrolled Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSubmission.categoryName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Submission Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Uploaded Documents</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedSubmission.documents?.length || 0} Files
                    </span>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      Uploaded Verification Documents
                    </h4>
                    <span className="text-xs text-slate-400">
                      Click Inspect to view original document proof
                    </span>
                  </div>

                  {selectedSubmission.documents && selectedSubmission.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedSubmission.documents.map((doc: any, i: number) => (
                        <div
                          key={i}
                          className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs hover:border-sky-500/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 truncate pr-2">
                            <div className="p-2 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-lg shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {doc.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{doc.fileName}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center space-x-1 transition-all active:scale-95 shrink-0 shadow-2xs"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
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
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setDecision('APPROVED')}
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

                      <button
                        type="button"
                        onClick={() => setDecision('REJECTED')}
                        className={`py-3 px-3 text-xs font-bold rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-150 active:scale-95 ${
                          decision === 'REJECTED'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Application</span>
                      </button>
                    </div>
                  </div>

                  {decision !== 'APPROVED' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                        Reason for {decision === 'REJECTED' ? 'Rejection' : 'Resubmission'} *
                      </label>
                      <textarea
                        required
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Detail specific issues (e.g. blurred image, name mismatch on Udyam certificate)."
                        rows={3}
                        className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Internal Verification Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="e.g. Cross-verified with MCA registry."
                      className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

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
              className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{previewDoc.title}</h3>
                  <p className="text-xs text-slate-400">{previewDoc.fileName}</p>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950/60 rounded-xl p-4">
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[60vh] object-contain rounded-lg shadow-md transition-transform duration-200 hover:scale-105"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-all active:scale-95"
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
