import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  X,
  CheckCheck,
  Briefcase,
  GitPullRequest,
  Lightbulb,
  TrendingUp,
  IndianRupee,
  Video,
  ShieldCheck,
  CreditCard,
  LifeBuoy,
  Clock,
  Inbox,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { NotificationItem } from './NotificationBell';

interface AdminNotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (item: NotificationItem) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

type AdminNotificationCategory =
  | 'ALL'
  | 'UNREAD'
  | 'SERVICES'
  | 'IDEAS_SCALING'
  | 'FUNDING'
  | 'MEETINGS'
  | 'KYC'
  | 'PAYMENTS_SUPPORT';

export const resolveAdminNotificationCategory = (item: NotificationItem): AdminNotificationCategory => {
  const type = (item.type || '').toUpperCase();
  const text = `${item.title || ''} ${item.message || ''}`.toLowerCase();

  if (type === 'NEW_SERVICE' || type === 'NEW_REQUEST' || text.includes('service') || text.includes('provider accepted') || text.includes('provider rejected') || text.includes('request desk')) {
    return 'SERVICES';
  }
  if (type.includes('IDEA') || type.includes('SCALING') || text.includes('business idea') || text.includes('scaling')) {
    return 'IDEAS_SCALING';
  }
  if (type.includes('FUNDING') || type.includes('INVESTMENT') || text.includes('funding') || text.includes('investment') || text.includes('pitch')) {
    return 'FUNDING';
  }
  if (type === 'MEETING_UPCOMING' || type.includes('MEET') || text.includes('meeting') || text.includes('call') || text.includes('consultation')) {
    return 'MEETINGS';
  }
  if (type === 'NEW_KYC' || text.includes('kyc') || text.includes('verification')) {
    return 'KYC';
  }
  if (type.includes('PAYMENT') || type === 'NEW_TICKET' || text.includes('payment') || text.includes('ticket') || text.includes('support')) {
    return 'PAYMENTS_SUPPORT';
  }

  return 'SERVICES';
};

export const resolveAdminNotificationDestination = (item: NotificationItem): string => {
  if (item.link && item.link.startsWith('/')) {
    return item.link;
  }

  const type = (item.type || '').toUpperCase();
  const text = `${item.title || ''} ${item.message || ''}`.toLowerCase();

  if (type === 'NEW_SERVICE' || type === 'NEW_REQUEST' || text.includes('service') || text.includes('provider accepted') || text.includes('provider rejected')) {
    return '/requests';
  }
  if (type.includes('IDEA') || text.includes('business idea')) {
    return '/business-ideas';
  }
  if (type.includes('SCALING') || text.includes('scaling')) {
    return '/scaling';
  }
  if (type.includes('FUNDING') || type.includes('INVESTMENT') || text.includes('funding') || text.includes('investment')) {
    return '/funding-desk';
  }
  if (type === 'MEETING_UPCOMING' || text.includes('meeting')) {
    return '/meetings';
  }
  if (type === 'NEW_KYC' || text.includes('kyc')) {
    return '/kyc';
  }
  if (type.includes('PAYMENT') || text.includes('payment')) {
    return '/payments';
  }
  if (type === 'NEW_TICKET' || text.includes('ticket') || text.includes('support')) {
    return '/support';
  }
  if (type === 'NEW_MEMBER' || text.includes('member')) {
    return '/members';
  }

  return '/requests';
};

export const AdminNotificationCenterModal: React.FC<AdminNotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminNotificationCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Tab counts
  const counts = useMemo(() => {
    let unread = 0;
    let services = 0;
    let ideasScaling = 0;
    let funding = 0;
    let meetings = 0;
    let kyc = 0;
    let paymentsSupport = 0;

    notifications.forEach((n) => {
      if (!n.isRead) unread++;
      const cat = resolveAdminNotificationCategory(n);
      if (cat === 'SERVICES') services++;
      else if (cat === 'IDEAS_SCALING') ideasScaling++;
      else if (cat === 'FUNDING') funding++;
      else if (cat === 'MEETINGS') meetings++;
      else if (cat === 'KYC') kyc++;
      else if (cat === 'PAYMENTS_SUPPORT') paymentsSupport++;
    });

    return {
      all: notifications.length,
      unread,
      services,
      ideasScaling,
      funding,
      meetings,
      kyc,
      paymentsSupport
    };
  }, [notifications]);

  // Filtered notifications
  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'UNREAD' && item.isRead) return false;
      if (activeTab !== 'ALL' && activeTab !== 'UNREAD') {
        const cat = resolveAdminNotificationCategory(item);
        if (cat !== activeTab) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchMsg = (item.message || '').toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await onMarkRead(item);
    }
    onClose();
    const destination = resolveAdminNotificationDestination(item);
    navigate(destination);
  };

  const handleMarkAll = async () => {
    setIsMarkingAll(true);
    try {
      await onMarkAllRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderIcon = (item: NotificationItem) => {
    const cat = resolveAdminNotificationCategory(item);
    switch (cat) {
      case 'SERVICES':
        return (
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        );
      case 'IDEAS_SCALING':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
        );
      case 'FUNDING':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
        );
      case 'MEETINGS':
        return (
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
        );
      case 'KYC':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
      case 'PAYMENTS_SUPPORT':
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-4 h-4" />
          </div>
        );
    }
  };

  const renderBadge = (item: NotificationItem) => {
    const cat = resolveAdminNotificationCategory(item);
    switch (cat) {
      case 'SERVICES':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Service Request
          </span>
        );
      case 'IDEAS_SCALING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Ideas & Scaling
          </span>
        );
      case 'FUNDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Capital & Funding
          </span>
        );
      case 'MEETINGS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Meeting
          </span>
        );
      case 'KYC':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            KYC Verification
          </span>
        );
      case 'PAYMENTS_SUPPORT':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Support & Payments
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Full Viewport Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] z-10"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Admin Notification Center
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-300/40">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete operational log of service inquiries, ideas, KYC reviews, and system alerts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={isMarkingAll}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar & Tabs */}
          <div className="p-3 sm:px-5 sm:pt-3 sm:pb-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications by title or message..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={isMarkingAll}
                  className="sm:hidden flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-sky-600"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('UNREAD')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'UNREAD'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>Unread</span>
                {counts.unread > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === 'UNREAD' ? 'bg-white/25 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}>
                    {counts.unread}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SERVICES')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'SERVICES'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Service Requests</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'SERVICES' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {counts.services}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('IDEAS_SCALING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'IDEAS_SCALING'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Ideas & Scaling</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'IDEAS_SCALING' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {counts.ideasScaling}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('FUNDING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'FUNDING'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Funding</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'FUNDING' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {counts.funding}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('MEETINGS')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MEETINGS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Meetings</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'MEETINGS' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {counts.meetings}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('KYC')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'KYC'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>KYC</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'KYC' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {counts.kyc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PAYMENTS_SUPPORT')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'PAYMENTS_SUPPORT'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payments & Support</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'PAYMENTS_SUPPORT' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {counts.paymentsSupport}
                </span>
              </button>
            </div>
          </div>

          {/* Notifications Scroll Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
            {filtered.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Inbox className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No notifications found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? `No notifications match "${searchQuery}". Try a different keyword.`
                      : activeTab === 'UNREAD'
                      ? 'All operational alerts are marked as read.'
                      : 'There are no notifications in this category.'}
                  </p>
                </div>
                {(searchQuery || activeTab !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('ALL');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer flex items-start gap-3.5 group ${
                    item.isRead
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 opacity-80'
                      : 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 border-l-4 border-indigo-600'
                  }`}
                >
                  {renderIcon(item)}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {renderBadge(item)}
                      {item.priority === 'HIGH' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          Urgent
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Unread" />
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 self-center">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(item);
                        }}
                        className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                        title="Mark as read"
                      >
                        Mark Read
                      </button>
                    )}
                    <span className="text-xs text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">
                      &rarr;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filtered.length} of {notifications.length} notification{notifications.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

