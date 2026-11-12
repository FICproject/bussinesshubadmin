import React, { useState, useEffect, useRef } from 'react';
import { Bell, LifeBuoy, UserPlus, Video, Clock, Check, ExternalLink, X, ShieldCheck, Briefcase, GitPullRequest } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../services/api';

export interface NotificationItem {
  id: string;
  type: 'NEW_TICKET' | 'NEW_MEMBER' | 'MEETING_UPCOMING' | 'NEW_KYC' | 'NEW_SERVICE' | 'NEW_REQUEST';
  title: string;
  message: string;
  timestamp: string;
  link: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 4000); // Live poll every 4s for instant alerts
    return () => clearInterval(interval);
  }, []);

  // Dismiss on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await apiFetch('/api/admin/notifications');
      if (res) {
        const notifList = res.notifications || (Array.isArray(res) ? res : []);
        setNotifications(notifList);
        setUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : notifList.length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await apiFetch(`/api/admin/notifications/${item.id}/read`, { method: 'PATCH' });
      } catch {
        // Keep local optimistic state if transient network error
      }
    }
    setIsOpen(false);
    navigate(item.link);
  };

  const markAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiFetch('/api/admin/notifications/read-all', { method: 'PATCH' });
    } catch {
      // Ignore transient error
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Admin Notifications"
        className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all active:scale-95 shadow-2xs"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-wide">
                  Notifications & Alerts
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No new operational notifications at this time.
                </div>
              ) : (
                notifications.map((item) => {
                  let Icon = Bell;
                  let iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';

                  if (item.type === 'NEW_TICKET') {
                    Icon = LifeBuoy;
                    iconBg = 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400';
                  } else if (item.type === 'NEW_MEMBER') {
                    Icon = UserPlus;
                    iconBg = 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400';
                  } else if (item.type === 'MEETING_UPCOMING') {
                    Icon = Video;
                    iconBg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400';
                  } else if (item.type === 'NEW_KYC') {
                    Icon = ShieldCheck;
                    iconBg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400';
                  } else if (item.type === 'NEW_SERVICE') {
                    Icon = Briefcase;
                    iconBg = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400';
                  } else if (item.type === 'NEW_REQUEST') {
                    Icon = GitPullRequest;
                    iconBg = 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400';
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors duration-150 ${
                        item.priority === 'HIGH'
                          ? 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl flex-shrink-0 ${iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          {item.priority === 'HIGH' && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              Urgent
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-sky-600 dark:text-sky-400 font-medium">View &rarr;</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850 text-center">
              <span className="text-[10px] text-slate-400">
                Auto-syncs support queries, member signups, and meeting reminders
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

