import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Check,
  ShieldCheck,
  Bell,
  Sliders,
  Volume2,
  FileCheck2,
  Briefcase,
  Calendar,
  Layers,
  CreditCard,
  Headphones,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'settings';
}

interface NotificationPreferences {
  newKycSubmissions: boolean;
  fundingApplications: boolean;
  customerMeetingReminders: boolean;
  serviceModerationAlerts: boolean;
  paymentReceivedPush: boolean;
  supportTicketAlerts: boolean;
  soundAlerts: boolean;
}

interface SystemGovernancePreferences {
  twoFactorEnforced: boolean;
  auditTrailLogging: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  newKycSubmissions: true,
  fundingApplications: true,
  customerMeetingReminders: true,
  serviceModerationAlerts: false,
  paymentReceivedPush: true,
  supportTicketAlerts: true,
  soundAlerts: true,
};

const DEFAULT_GOVERNANCE: SystemGovernancePreferences = {
  twoFactorEnforced: true,
  auditTrailLogging: true,
};

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialTab);

  // Sync tab if initialTab changes when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [countryCode, setCountryCode] = useState(user?.countryCode || '+91');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settings State: Notification Toggles & Administrative System Preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('fic_admin_notif_prefs');
      return saved ? { ...DEFAULT_NOTIFICATIONS, ...JSON.parse(saved) } : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [govPrefs, setGovPrefs] = useState<SystemGovernancePreferences>(() => {
    try {
      const saved = localStorage.getItem('fic_admin_system_prefs');
      return saved ? { ...DEFAULT_GOVERNANCE, ...JSON.parse(saved) } : DEFAULT_GOVERNANCE;
    } catch {
      return DEFAULT_GOVERNANCE;
    }
  });

  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name,
        phone,
        countryCode,
        avatarUrl,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await apiFetch('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.user) {
        updateUser(res.user);
      }
      setSuccessMsg('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotif = (key: keyof NotificationPreferences) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('fic_admin_notif_prefs', JSON.stringify(next));
      return next;
    });
    setSettingsSavedMsg('Notification preference updated');
    setTimeout(() => setSettingsSavedMsg(''), 2500);
  };

  const handleToggleGov = (key: keyof SystemGovernancePreferences) => {
    setGovPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('fic_admin_system_prefs', JSON.stringify(next));
      return next;
    });
    setSettingsSavedMsg('Administrative governance updated');
    setTimeout(() => setSettingsSavedMsg(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header with Tabs */}
        <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-elevated)]/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center font-bold">
                {activeTab === 'profile' ? <User className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {activeTab === 'profile' ? 'My Profile & Credentials' : 'Portal Settings & Alerts'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {activeTab === 'profile'
                    ? 'Manage your personal administrative contact details and credentials'
                    : 'Configure global real-time notifications, alert triggers, and administrative guardrails'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center space-x-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-primary)]">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Portal Settings & Alerts</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ================= TAB 1: PROFILE ================= */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-medium">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-medium flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Avatar Section */}
              <div className="flex items-center space-x-5 p-4 rounded-xl bg-[var(--bg-elevated)]/30 border border-[var(--border-primary)]">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full border-2 border-[var(--border-primary)] overflow-hidden bg-[var(--bg-card)] flex items-center justify-center text-2xl font-bold text-[var(--accent-primary)] shadow-inner">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{name.charAt(0).toUpperCase() || 'A'}</span>
                    )}
                  </div>
                  <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-medium">Change</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">{name || 'FIC Admin'}</h4>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{user.email}</p>
                  <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Full Legal / Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Registered Staff Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-muted)] cursor-not-allowed opacity-75 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Mobile Phone Number</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="+91"
                      className="w-20 px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] text-center font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-[var(--border-primary)] space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Change Security Password
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Leave blank if you do not want to change your current password.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-4 pr-10 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full px-4 pr-10 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 rounded-xl shadow-md disabled:opacity-50 transition-opacity flex items-center space-x-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 2: SETTINGS & NOTIFICATIONS ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {settingsSavedMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settingsSavedMsg}</span>
                </div>
              )}

              {/* Notification Toggles Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>Admin Portal Notification Events</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Configure which alerts ping your admin top bar bell and desktop notifications in real time.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border-primary)] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
                  {/* Item 1: KYC */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 mt-0.5">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">New KYC Submissions</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Notify immediately when a registered member uploads their GST / Aadhaar / PAN for review.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif('newKycSubmissions')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifPrefs.newKycSubmissions ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifPrefs.newKycSubmissions ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 2: Funding */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 mt-0.5">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">FIC Funding & Capital Requests</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Pings when high-ticket investment applications or credit facilitation tickets are filed.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif('fundingApplications')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifPrefs.fundingApplications ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifPrefs.fundingApplications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 3: Meetings */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">Customer Meeting Reminders</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Broadcast 15-minute advance alerts for scheduled video calls and investor consultations.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif('customerMeetingReminders')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifPrefs.customerMeetingReminders ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifPrefs.customerMeetingReminders ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 4: Marketplace Moderation */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">Service Marketplace Queue</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Alert when providers submit new service cards or edit listed offerings needing review.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif('serviceModerationAlerts')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifPrefs.serviceModerationAlerts ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifPrefs.serviceModerationAlerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 5: Payments */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">Payment & Inflow Alerts</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Notify when membership subscription fees, renewal dues, or marketplace commissions clear.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif('paymentReceivedPush')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifPrefs.paymentReceivedPush ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifPrefs.paymentReceivedPush ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 6: Support Helpdesk */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 mt-0.5">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">Support Helpdesk Escalations</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          High priority alerts when members log critical grievance or dispute tickets.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif('supportTicketAlerts')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifPrefs.supportTicketAlerts ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifPrefs.supportTicketAlerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 7: Sound */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors bg-[var(--bg-elevated)]/20">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 mt-0.5">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">Audible Chime / Sound Alerts</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Play an audio ping in your browser when a high-priority system action occurs.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotif('soundAlerts')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifPrefs.soundAlerts ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          notifPrefs.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Administrative Governance & System Controls */}
              <div className="pt-2 border-t border-[var(--border-primary)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Administrative Security & System Governance</span>
                </h4>

                <div className="divide-y divide-[var(--border-primary)] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Enforce Two-Factor Authentication (2FA)</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Require OTP authentication via mobile / email for all staff accounts during portal access.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleGov('twoFactorEnforced')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        govPrefs.twoFactorEnforced ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          govPrefs.twoFactorEnforced ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Immutable Administrative Audit Trail</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Stream and permanently record all staff moderation actions and KYC verification decisions to the system ledger.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleGov('auditTrailLogging')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        govPrefs.auditTrailLogging ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          govPrefs.auditTrailLogging ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Close / Done Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 rounded-xl shadow-md transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
