import React from 'react';
import { Video, UserPlus, Download, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStoredAuth } from '../services/api';

interface QuickActionToolbarProps {
  onScheduleMeeting: () => void;
  onAddStaff: () => void;
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  onScheduleMeeting,
  onAddStaff,
}) => {
  const { hasRole } = useAuth();

  const handleExportAuditLog = () => {
    const { token } = getStoredAuth();
    const downloadUrl = `/api/admin/dashboard/export-audit-logs`;

    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fic_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert(`Export failed: ${err.message}`));
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-[var(--bg-card)]/90 backdrop-blur-md rounded-2xl border border-[var(--border-primary)] shadow-xs">
      <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center space-x-1.5 pl-2 pr-1 font-mono">
        <Zap className="w-3.5 h-3.5 text-[var(--accent-highlight)] fill-[var(--accent-highlight)]/20" />
        <span>Quick Actions</span>
      </span>

      {/* Shortcut 1: Schedule Meeting */}
      <button
        onClick={onScheduleMeeting}
        className="flex items-center space-x-1.5 px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 border border-[var(--border-primary)] shadow-2xs hover:shadow-xs"
      >
        <Video className="w-3.5 h-3.5" />
        <span>+ Schedule Meeting</span>
      </button>

      {/* Shortcut 2: Add Staff (Super Admin only) */}
      {hasRole('SUPER_ADMIN') && (
        <button
          onClick={onAddStaff}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 border border-[var(--border-primary)] shadow-2xs hover:shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add Staff</span>
        </button>
      )}

      {/* Shortcut 3: Export Audit Log */}
      <button
        onClick={handleExportAuditLog}
        className="flex items-center space-x-1.5 px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)] rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 border border-[var(--border-primary)] shadow-2xs hover:shadow-xs"
      >
        <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span>Export Audit CSV</span>
      </button>
    </div>
  );
};

