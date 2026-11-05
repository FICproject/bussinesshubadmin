import React, { useEffect, useState, useMemo } from 'react';
import { History, Download, Calendar, Search, Filter, RefreshCw, X, Shield, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { rowVariants } from '../../utils/animations';
import { SkeletonTable } from '../../components/Skeleton';
import { useDialog } from '../../context/DialogContext';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Project baseline start date (e.g. 2026-08-25 when FIC was initialized)
  const PROJECT_START_DATE = '2026-08-25';
  
  // Format today's date in local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Filter States
  const [startDate, setStartDate] = useState<string>(PROJECT_START_DATE);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  const { showAlert } = useDialog();

  useEffect(() => {
    loadLogs();
  }, [startDate, endDate, selectedAction, selectedEntity]);

  const validateDates = (start: string, end: string): boolean => {
    if (start && start < PROJECT_START_DATE) {
      setDateError(`Start date cannot precede project launch date (${PROJECT_START_DATE}).`);
      return false;
    }
    if (end && end > todayStr) {
      setDateError(`End date cannot be set in the future (today is ${todayStr}).`);
      return false;
    }
    if (start && end && start > end) {
      setDateError('Start date cannot be after end date.');
      return false;
    }
    setDateError(null);
    return true;
  };

  const handleStartDateChange = (val: string) => {
    if (val > todayStr) {
      setDateError(`Start date cannot be in the future.`);
      return;
    }
    if (val < PROJECT_START_DATE) {
      val = PROJECT_START_DATE;
    }
    setStartDate(val);
    validateDates(val, endDate);
  };

  const handleEndDateChange = (val: string) => {
    if (val > todayStr) {
      setDateError(`End date cannot be in the future (Max: ${todayStr}).`);
      return;
    }
    setEndDate(val);
    validateDates(startDate, val);
  };

  const loadLogs = async () => {
    if (!validateDates(startDate, endDate)) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedAction !== 'ALL') params.set('action', selectedAction);
      if (selectedEntity !== 'ALL') params.set('entityType', selectedEntity);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const data = await apiFetch(`/api/admin/dashboard/audit-logs?${params.toString()}`);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!validateDates(startDate, endDate)) {
      await showAlert(dateError || 'Please provide a valid date range.', {
        title: 'Invalid Date Selection',
        severity: 'warning',
      });
      return;
    }

    try {
      setDownloading(true);
      const token = localStorage.getItem('fic_admin_token') || sessionStorage.getItem('fic_admin_token');
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedAction !== 'ALL') params.set('action', selectedAction);
      if (selectedEntity !== 'ALL') params.set('entityType', selectedEntity);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const response = await fetch(`/api/admin/dashboard/export-audit-logs?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fic_security_audit_ledger_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      await showAlert(`Failed to download audit CSV: ${err.message}`, {
        title: 'Download Failed',
        severity: 'danger',
      });
    } finally {
      setDownloading(false);
    }
  };

  // Distinct actions and entities for quick filtering
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const availableEntities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.entityType) set.add(l.entityType);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Client-side quick search filter
  const displayedLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const matchActor = (log.adminName || '').toLowerCase().includes(q);
      const matchRole = (log.adminRole || '').toLowerCase().includes(q);
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchEntity = (log.entityType || '').toLowerCase().includes(q);
      const matchId = (log.entityId || '').toLowerCase().includes(q);
      const matchIp = (log.ipAddress || '').toLowerCase().includes(q);
      return matchActor || matchRole || matchAction || matchEntity || matchId || matchIp;
    });
  }, [logs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <History className="w-5 h-5" />
            </span>
            <span>Security & Audit Logs</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit record of all administrative actions, KYC decisions, status updates, and configuration changes.
          </p>
        </div>

        {/* CSV Download Button */}
        <button
          onClick={handleDownloadCsv}
          disabled={downloading || loading || !!dateError}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
          title="Download filtered audit logs as CSV spreadsheet"
        >
          <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
          <span>{downloading ? 'Generating CSV...' : 'Download CSV Report'}</span>
        </button>
      </div>

      {/* Date Range & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Start Date */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Start Date</span>
              <span className="text-[10px] font-normal text-slate-400">(Launch: {PROJECT_START_DATE})</span>
            </label>
            <input
              type="date"
              min={PROJECT_START_DATE}
              max={todayStr}
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* End Date */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>End Date</span>
              <span className="text-[10px] font-normal text-slate-400">(Max: Today)</span>
            </label>
            <input
              type="date"
              min={startDate || PROJECT_START_DATE}
              max={todayStr}
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Action Filter */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Action Type</span>
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 font-mono"
            >
              <option value="ALL">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Filter */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Entity</span>
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 font-mono"
            >
              <option value="ALL">All Entities</option>
              {availableEntities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Filter</span>
            </button>
            {(selectedAction !== 'ALL' || selectedEntity !== 'ALL' || startDate !== PROJECT_START_DATE || endDate !== todayStr || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate(PROJECT_START_DATE);
                  setEndDate(todayStr);
                  setSelectedAction('ALL');
                  setSelectedEntity('ALL');
                  setSearchQuery('');
                  setDateError(null);
                }}
                className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 dark:hover:bg-rose-950/40 transition-colors"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Search & Count Banner */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Instant search by actor, role, action, entity, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
            <span>
              Showing <strong className="text-slate-900 dark:text-slate-100">{displayedLogs.length}</strong> recorded administrative actions
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              ● Immutable
            </span>
          </div>
        </div>

        {/* Date Validation Error Alert */}
        {dateError && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <span>{dateError}</span>
            <button onClick={() => setDateError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">S.No</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Target Entity</th>
                <th className="px-6 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <SkeletonTable rows={6} cols={6} />
                  </td>
                </tr>
              ) : displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-slate-600 dark:text-slate-400">No audit logs found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try widening your date range or clearing your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {displayedLogs.map((log, idx) => (
                    <motion.tr
                      key={log._id || `${log.action}-${idx}`}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 font-mono text-xs transition-colors duration-150"
                    >
                      <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-sans">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.adminName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase">{log.adminRole}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <span className="font-sans font-medium text-slate-900 dark:text-slate-100">{log.entityType}</span>:{' '}
                        <span className="text-slate-400 text-[11px] font-mono">{log.entityId}</span>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1 font-mono truncate max-w-xs">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
