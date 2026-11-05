import React, { useEffect, useState } from 'react';
import {
  UserCog,
  Plus,
  X,
  Phone,
  Building,
  MapPin,
  KeyRound,
  ShieldAlert,
  Check,
  Eye,
  EyeOff,
  User,
  Mail,
  Shield,
  Clock,
  Calendar,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { rowVariants } from '../../utils/animations';
import { SkeletonTable } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';

export const StaffManagementPage: React.FC = () => {
  const { user: currentLoggedInUser } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState<any | null>(null);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('ADMIN');
  const [regionScope, setRegionScope] = useState('All Regions');
  const [requirePasswordReset, setRequirePasswordReset] = useState(true);
  const [initialActiveStatus, setInitialActiveStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const data = await apiFetch('/api/admin/auth/staff');
      setStaff(data);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCountryCode('+91');
    setPassword('');
    setRole('ADMIN');
    setRegionScope('All Regions');
    setRequirePasswordReset(true);
    setInitialActiveStatus(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/api/admin/auth/staff', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          countryCode,
          password,
          role,
          department: 'OPERATIONS',
          regionScope,
          requirePasswordReset,
          isActive: initialActiveStatus,
        }),
      });
      setShowAddModal(false);
      resetForm();
      loadStaff();
    } catch (err: any) {
      alert(`Error creating staff member: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await apiFetch(`/api/admin/auth/staff/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive }),
      });
      loadStaff();
    } catch (err: any) {
      alert(`Error updating staff: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <UserCog className="w-5 h-5" />
            </span>
            <span>Staff & Roles Administration</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage administrative personnel, verification desks, operational scoping, and RBAC privileges.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Staff User</span>
        </button>
      </div>

      <div className="panel-card overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider font-mono">
            <tr>
              <th className="px-4 py-3.5 text-center w-12">S.No</th>
              <th className="px-6 py-3.5">Personnel / Contact</th>
              <th className="px-6 py-3.5">Assigned Role & Scope</th>
              <th className="px-6 py-3.5">Operational Region</th>
              <th className="px-6 py-3.5">Status & Security</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <SkeletonTable rows={4} cols={6} />
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {staff.map((u, idx) => (
                  <motion.tr
                    key={u._id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                  >
                    <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{u.email}</div>
                      {u.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{u.countryCode || '+91'} {u.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {u.role === 'SUPER_ADMIN' ? 'Full Authority' : 'All Desks & Operations'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.regionScope || 'All Regions'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                        {u.requirePasswordReset && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            <span>Reset on next login</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Details Button for Super Admin */}
                        {currentLoggedInUser?.role === 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => setSelectedStaffUser(u)}
                            title="View Admin Details"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all active:scale-95 flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 border ${
                            u.isActive
                              ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                              : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Disable Access' : 'Enable Access'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded Create Staff User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Create Staff User</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Provision administrative account with desk scoping and credentials.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-5 space-y-4">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>

                {/* 2. Work Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@ficapp.in"
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-mono"
                  />
                </div>

                {/* 3. Phone Number / WhatsApp */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                    Phone / WhatsApp Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="text-xs font-semibold px-2.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+65">+65 (SG)</option>
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Used for urgent escalation alerts and 2FA authentication.</span>
                </div>

                {/* 4. Role Selection (Admin manages all platform workflows; Super Admin has full governance) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                    Role & Authority Level
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  >
                    <option value="ADMIN">ADMIN (Operations Manager - Full Operational Access)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Authority & Governance)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Admin role is granted operational authority across all desks (KYC, Members, Requests, Meetings, Services & Moderation).
                  </span>
                </div>

                {/* 5. Region Scope & Account Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                      Operational Region Scope
                    </label>
                    <select
                      value={regionScope}
                      onChange={(e) => setRegionScope(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    >
                      <option value="All Regions">All Regions (Global)</option>
                      <option value="Bangalore Zone">Bangalore Zone</option>
                      <option value="Karnataka State">Karnataka State</option>
                      <option value="South India Region">South India Region</option>
                      <option value="North India Region">North India Region</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                      Initial Account Status
                    </label>
                    <select
                      value={initialActiveStatus ? 'ACTIVE' : 'DISABLED'}
                      onChange={(e) => setInitialActiveStatus(e.target.value === 'ACTIVE')}
                      className="w-full text-xs font-medium px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    >
                      <option value="ACTIVE">Active (Immediate Login)</option>
                      <option value="DISABLED">Disabled (Onboarding Pending)</option>
                    </select>
                  </div>
                </div>

                {/* 6. Temporary Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm pl-3.5 pr-11 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 7. Security Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requirePasswordReset}
                      onChange={(e) => setRequirePasswordReset(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Require password change on first login
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Forces the staff member to configure their private password upon their initial sign-in.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm shadow-sky-600/30"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Centralized Staff / Admin Detail Modal for Super Admin */}
      <AnimatePresence>
        {selectedStaffUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaffUser(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 flex items-center justify-center font-bold text-base shadow-2xs">
                    {selectedStaffUser.avatarUrl ? (
                      <img src={selectedStaffUser.avatarUrl} alt={selectedStaffUser.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <span>{selectedStaffUser.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                        Admin Profile & Privileges
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedStaffUser.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {selectedStaffUser.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {selectedStaffUser.name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStaffUser(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Contact & Identity Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[11px] font-mono uppercase font-bold">
                      Staff Email
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedStaffUser.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[11px] font-mono uppercase font-bold">
                      Phone Number
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedStaffUser.phone
                        ? `${selectedStaffUser.countryCode || '+91'} ${selectedStaffUser.phone}`
                        : 'Not configured'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[11px] font-mono uppercase font-bold">
                      Role & Tier
                    </span>
                    <span className="font-semibold text-[var(--accent-primary)] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      {selectedStaffUser.role?.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[11px] font-mono uppercase font-bold">
                      Operational Scope
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {selectedStaffUser.role === 'SUPER_ADMIN' ? 'All Desks & Governance' : 'All Operational Desks'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[11px] font-mono uppercase font-bold">
                      Operational Region
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedStaffUser.regionScope || 'All Regions'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[11px] font-mono uppercase font-bold">
                      Account Created
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(selectedStaffUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Security & Access Status */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Security & Credentials State
                  </h4>
                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        First Login Password Reset
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          selectedStaffUser.requirePasswordReset
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {selectedStaffUser.requirePasswordReset ? 'Required' : 'Completed'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Last Active / Signed In
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {selectedStaffUser.lastLoginAt
                          ? new Date(selectedStaffUser.lastLoginAt).toLocaleString()
                          : 'No login recorded yet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Permissions Preview */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    RBAC Scoping & Privileges
                  </h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedStaffUser.role === 'SUPER_ADMIN' ? (
                      <p className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                        <Shield className="w-4 h-4" /> Full unrestricted platform access: financial disbursements, KYC compliance review, RBAC user provisioning, and audit logs.
                      </p>
                    ) : (
                      <p>
                        Standard administrator access scoped to {selectedStaffUser.department?.replace('_', ' ') || 'General Operations'} across {selectedStaffUser.regionScope || 'All Regions'}.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedStaffUser(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
