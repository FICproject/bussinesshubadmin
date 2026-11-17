import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, CheckCircle2, XCircle, Eye, Search, X, LayoutGrid, List, FileText, ExternalLink, ShieldCheck, Tag, MapPin, Clock, DollarSign, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { containerVariants, itemVariants } from '../../utils/animations';
import { SkeletonCards } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';

export const ServicesModerationPage: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedServiceForView, setSelectedServiceForView] = useState<any | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState(() => {
    const s = searchParams.get('status');
    return s ? s.toUpperCase() : 'ALL';
  });

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && s.toUpperCase() !== filterStatus) {
      setFilterStatus(s.toUpperCase());
    } else if (!s && filterStatus !== 'ALL') {
      setFilterStatus('ALL');
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { showAlert, showPrompt } = useDialog();

  useEffect(() => {
    loadListings();
  }, [filterStatus]);

  const loadListings = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch(`/api/admin/services?status=${filterStatus}`);
      const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
      const nonDeleted = list.filter(
        (item: any) => item.status !== 'DELETED' && item.status !== 'ARCHIVED'
      );
      setListings(nonDeleted);
    } catch (err: any) {
      console.error('Failed to load listings', err);
      setLoadError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase().trim();
    return listings.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCategory = item.categoryName?.toLowerCase().includes(q);
      const matchProvider = item.providerPrivateName?.toLowerCase().includes(q);
      const matchEmail = item.providerEmail?.toLowerCase().includes(q);
      const matchPricing = item.pricingEstimate?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCategory || matchProvider || matchEmail || matchPricing;
    });
  }, [listings, searchQuery]);

  const handleModerate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    let rejectionReason: string | undefined = undefined;
    if (status === 'REJECTED') {
      const reason = await showPrompt('Please enter the reason for rejecting this service listing:', {
        title: 'Reject Service Listing',
        severity: 'danger',
        confirmText: 'Confirm Rejection',
        placeholder: 'e.g., Description lacks required compliance details or violates platform terms...',
      });
      if (!reason) return;
      rejectionReason = reason;
    }

    try {
      await apiFetch(`/api/admin/services/${id}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      loadListings();
    } catch (err: any) {
      await showAlert(`Moderation failed: ${err.message}`, {
        title: 'Moderation Error',
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
              <Briefcase className="w-5 h-5" />
            </span>
            <span>Services Moderation Desk</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review service offerings before cross-category publishing. Verify provider identity privacy rules.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => {
            const next = e.target.value;
            setFilterStatus(next);
            const newParams = new URLSearchParams(searchParams);
            if (next === 'ALL') {
              newParams.delete('status');
            } else {
              newParams.set('status', next);
            }
            setSearchParams(newParams, { replace: true });
          }}
          className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Search & View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service title, category, provider, description..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mr-1">
            View:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
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
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={4} gridCols="grid-cols-1 md:grid-cols-2" />
      ) : filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No service listings found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? `No listing matches "${searchQuery}".` : 'No services currently submitted for moderation.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredListings.map((item, idx) => (
            <motion.div
              key={item._id}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                      {item.categoryName}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'APPROVED'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : item.status === 'REJECTED'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-2.5">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">{item.description}</p>

                {/* Identity Privacy Box */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] font-mono">
                    <span>Provider Identity (FIC Internal Only)</span>
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{item.providerPrivateName}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{item.providerEmail}</p>
                  {item.pricingEstimate && (
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] font-medium pt-1">
                      Estimate: <span className="font-bold text-slate-900 dark:text-slate-100">{item.pricingEstimate}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                {item.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleModerate(item._id, 'APPROVED')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Listing</span>
                  </button>
                )}
                {item.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleModerate(item._id, 'REJECTED')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold transition-all active:scale-95 border border-rose-200/60 dark:border-rose-900/40"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* LIST VIEW */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs"
        >
          {filteredListings.map((item, idx) => (
            <motion.div
              key={item._id}
              variants={itemVariants}
              className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 w-6 pt-2 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl shrink-0 mt-0.5">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                        {item.categoryName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:w-5/12 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Provider Info */}
                  <div className="text-xs space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[10px] font-mono uppercase">
                      <Eye className="w-3 h-3" />
                      <span>Provider Identity</span>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.providerPrivateName}</p>
                    <p className="text-slate-400 text-[11px] font-mono truncate">{item.providerEmail}</p>
                    {item.pricingEstimate && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block pt-0.5">
                        {item.pricingEstimate}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {item.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleModerate(item._id, 'APPROVED')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {item.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleModerate(item._id, 'REJECTED')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold transition-all active:scale-95 border border-rose-200/60 dark:border-rose-900/40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    
      {/* Service Details Modal */}
      <AnimatePresence>
        {selectedServiceForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-indigo-500/20 flex items-center justify-between bg-gradient-to-r from-[#1A1646] via-[#1E1B4B] to-[#0F172A] text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        SERVICE ID: {selectedServiceForView._id?.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedServiceForView.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : selectedServiceForView.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {selectedServiceForView.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                      {selectedServiceForView.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedServiceForView(null)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {/* Provider Identity Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Provider Identity & Credentials (FIC Internal Audit)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Provider Full Name</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {selectedServiceForView.providerPrivateName || 'FIC Member'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Email Address</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                        {selectedServiceForView.providerEmail}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Category / Sector</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {selectedServiceForView.categoryName}
                        {selectedServiceForView.subcategoryName ? ` • ${selectedServiceForView.subcategoryName}` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Specifications */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Service Specifications & Scope
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedServiceForView.pricingEstimate && (
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 font-semibold">Pricing Estimate</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {selectedServiceForView.pricingEstimate}
                          </div>
                        </div>
                      )}
                      {selectedServiceForView.deliveryMode && (
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 font-semibold">Delivery Mode</div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {selectedServiceForView.deliveryMode}
                          </div>
                        </div>
                      )}
                      {selectedServiceForView.coverageArea && (
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 font-semibold">Coverage Area</div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {selectedServiceForView.coverageArea}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        Full Description:
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        {selectedServiceForView.description}
                      </p>
                    </div>

                    {selectedServiceForView.servicesOffered && selectedServiceForView.servicesOffered.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
                          Key Capabilities & Deliverables:
                        </div>
                        <ul className="space-y-1.5">
                          {selectedServiceForView.servicesOffered.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedServiceForView.tags && selectedServiceForView.tags.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-slate-500 dark:text-slate-400 font-semibold mb-1.5">Tags:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedServiceForView.tags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  onClick={() => setSelectedServiceForView(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  {selectedServiceForView.status !== 'APPROVED' && (
                    <button
                      onClick={async () => {
                        const id = selectedServiceForView._id;
                        await handleModerate(id, 'APPROVED');
                        setSelectedServiceForView(null);
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Listing</span>
                    </button>
                  )}
                  {selectedServiceForView.status !== 'REJECTED' && (
                    <button
                      onClick={async () => {
                        const id = selectedServiceForView._id;
                        await handleModerate(id, 'REJECTED');
                        setSelectedServiceForView(null);
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-all active:scale-95 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
</div>
  );
};
