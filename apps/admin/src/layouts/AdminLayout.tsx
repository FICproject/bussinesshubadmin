import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import {
  LayoutDashboard,
  ShieldCheck,
  FolderTree,
  Users,
  Briefcase,
  GitPullRequest,
  Video,
  CreditCard,
  LifeBuoy,
  UserCog,
  History,
  Gift,
  Coins,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationBell } from '../components/NotificationBell';
import { AdminProfileModal } from '../components/AdminProfileModal';

export const AdminLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'settings'>('profile');
  
  // Explicit sidebar open / close toggle state (persisted in localStorage or default false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('fic_admin_sidebar_open');
    return saved !== null ? saved === 'true' : false; // initially closed as per user preference
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('fic_admin_sidebar_open', String(next));
      return next;
    });
  };

  const isExpanded = isSidebarOpen;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    // 1. Core Overview
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },

    // 2. Members & Onboarding
    { name: 'Members Directory', path: '/members', icon: Users, show: hasRole('SUPER_ADMIN', 'ADMIN') },
    { name: 'KYC Verification', path: '/kyc', icon: ShieldCheck, show: true },

    // 3. Ecosystem Marketplace & Catalog
    { name: 'Categories & Config', path: '/categories', icon: FolderTree, show: hasRole('SUPER_ADMIN', 'ADMIN') },
    { name: 'Service Moderation', path: '/services', icon: Briefcase, show: hasRole('SUPER_ADMIN', 'ADMIN') },

    // 4. Commercials & Capital Desk
    { name: 'Payments & Fees', path: '/payments', icon: CreditCard, show: hasRole('SUPER_ADMIN', 'ADMIN') },
    { name: 'FIC Funding Desk', path: '/funding', icon: Coins, show: hasRole('SUPER_ADMIN', 'ADMIN') },
    { name: 'Referral Bonus', path: '/referrals', icon: Gift, show: hasRole('SUPER_ADMIN', 'ADMIN') },

    // 5. Operations & Engagement
    { name: 'Meetings & Calls', path: '/meetings', icon: Video, show: hasRole('SUPER_ADMIN', 'ADMIN') },
    { name: 'FIC Request Desk', path: '/requests', icon: GitPullRequest, show: hasRole('SUPER_ADMIN', 'ADMIN') },
    { name: 'Support Helpdesk', path: '/support', icon: LifeBuoy, show: hasRole('SUPER_ADMIN', 'ADMIN') },

    // 6. Administration & Governance
    { name: 'Staff Management', path: '/staff', icon: UserCog, show: hasRole('SUPER_ADMIN', 'ADMIN') },
    { name: 'Audit Logs', path: '/audit-logs', icon: History, show: hasRole('SUPER_ADMIN', 'ADMIN') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-200">
      {/* Top Universal Header spanning full screen with Royal Midnight Gradient & Violet Bloom */}
      <header className="h-16 relative bg-gradient-to-r from-[#1A1646] via-[#1E1B4B] to-[#0F172A] text-white border-b border-indigo-500/25 px-6 flex items-center justify-between shadow-lg sticky top-0 z-30 transition-colors duration-200">
        {/* Violet Bloom / Overlay Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-28 bg-[rgba(139,92,246,0.2)] rounded-full blur-3xl pointer-events-none -translate-y-10" />
        <div className="absolute top-0 right-10 w-72 h-24 bg-[rgba(139,92,246,0.15)] rounded-full blur-2xl pointer-events-none -translate-y-6" />

        {/* Left: Sidebar Toggle Button & Brand Identity in Top Header */}
        <div className="flex items-center space-x-3 relative z-10">
          {/* Dedicated Open/Close Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            aria-label={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 shadow-2xs backdrop-blur-xs cursor-pointer flex items-center justify-center group"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
            )}
          </button>

          <div className="relative shrink-0">
            <img
              src="/logo.jpg"
              alt="Forge India Connect"
              className="h-9 w-9 rounded-xl object-cover shadow-md border border-white/20 bg-white"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1E1B4B]" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wide leading-tight drop-shadow-xs">
              FIC BUSINESS HUB
            </h1>
            <p className="text-[10px] text-amber-300 font-medium tracking-tight">Forge India Connect</p>
          </div>
        </div>

        {/* Right Controls: Notification, Theme Toggle, and Profile Dropdown */}
        <div className="flex items-center space-x-4 relative z-10">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Icon-Only Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all duration-150 active:scale-95 shadow-2xs backdrop-blur-xs"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-300" />
            )}
          </button>

          {/* Profile Dropdown at Top-Right Corner */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2.5 p-1.5 pl-2.5 pr-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 shadow-2xs backdrop-blur-xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-violet-500/25 text-violet-200 border border-violet-400/30 flex items-center justify-center font-bold text-xs overflow-hidden shadow-inner">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="text-left hidden sm:block pr-1">
                <p className="text-xs font-bold text-white leading-tight">{user?.name || 'Admin User'}</p>
                <span className="text-[10px] text-indigo-200/80 font-mono font-medium block">
                  {user?.role?.replace('_', ' ') || 'STAFF'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-300/70" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showProfileDropdown && (
                <>
                  <div
                    onClick={() => setShowProfileDropdown(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-2xl p-2 z-50 text-xs"
                  >
                    <div className="px-3 py-2.5 border-b border-[var(--border-primary)] mb-1">
                      <p className="font-bold text-[var(--text-primary)] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setProfileModalInitialTab('profile');
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors font-medium text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setProfileModalInitialTab('settings');
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors font-medium text-left cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-sky-500" />
                      <span>Portal Settings & Alerts</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-medium text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Body with Fixed/Collapsible Sidebar + Content */}
      <div className="flex flex-1 min-h-[calc(100vh-4rem)] relative">
        {/* Fixed Sidebar with Glowing White Glass Backdrop, Controlled Exclusively via Toggle Button */}
        <aside
          className={`fixed top-16 bottom-0 left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-[var(--text-secondary)] flex flex-col justify-between shadow-[0_10px_40px_-10px_rgba(112,71,215,0.12),0_4px_20px_0_rgba(255,255,255,0.8)] border-r border-indigo-100/70 dark:border-slate-800 z-20 transition-all duration-300 ease-in-out ${
            isExpanded ? 'w-64' : 'w-20'
          }`}
        >
          {/* Navigation Items (clean start directly below top header) */}
          <nav className="p-3 space-y-1 overflow-y-auto overflow-x-hidden flex-1 pt-4">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    title={!isExpanded ? item.name : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center ${
                        isExpanded ? 'space-x-3 px-3' : 'justify-center px-0'
                      } py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] ${
                        isActive
                          ? 'text-white shadow-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="activeSidebarNavPill"
                            className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-xl shadow-md -z-0"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <Icon className="w-4 h-4 flex-shrink-0 relative z-10" />
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                            className="relative z-10 whitespace-nowrap overflow-hidden"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
          </nav>

          {/* Sidebar bottom: User profile pill with Logout & version */}
          <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-sidebar)] shrink-0 space-y-2">
            <button
              onClick={handleLogout}
              title={!isExpanded ? `Sign Out (${user?.name})` : 'Click to sign out'}
              className={`w-full flex items-center ${
                isExpanded ? 'justify-between p-2' : 'justify-center p-2'
              } rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--text-primary)] hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-150 group active:scale-[0.98] shadow-2xs`}
            >
              <div className={`flex items-center ${isExpanded ? 'space-x-2.5 min-w-0 pr-2' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                  )}
                </div>
                {isExpanded && (
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold truncate leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {user?.name || 'Admin User'}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono block truncate">
                      {user?.role?.replace('_', ' ') || 'STAFF'}
                    </span>
                  </div>
                )}
              </div>
              {isExpanded && (
                <div className="p-1.5 rounded-lg text-[var(--text-muted)] group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:bg-rose-500/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
              )}
            </button>

            {isExpanded && (
              <div className="text-center text-[10px] font-mono text-[var(--text-muted)]">
                FIC Hub Admin v2.4 • Secure
              </div>
            )}
          </div>
        </aside>

        {/* Main content pane: dynamic margin-left matching expanded (64 = 256px) or collapsed (20 = 80px), full viewport height */}
        <main
          className={`flex-1 flex flex-col min-h-[calc(100vh-4rem)] ${
            isExpanded ? 'ml-64' : 'ml-20'
          } p-4 sm:p-5 lg:p-6 overflow-x-hidden min-w-0 transition-all duration-300 ease-in-out`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="w-full flex-1 flex flex-col admin-content-container"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Admin Profile & Settings Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <AdminProfileModal
            isOpen={showProfileModal}
            initialTab={profileModalInitialTab}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
