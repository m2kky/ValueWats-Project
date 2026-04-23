import { Link, useLocation } from 'react-router-dom';
import {
  RectangleGroupIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  BoltIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getSocketUrl } from '../utils/socketUtils';
import GlobalProgressBar from './GlobalProgressBar';
import apiClient from '../api/client';
import { getStoredUser } from '../utils/authUser';
import { useNavFilter } from '../hooks/usePermission';

const typeColors = {
  info: 'border-blue-400/20 bg-blue-400/10 text-blue-200',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  error: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
};

export default function Layout({ children }) {
  const [user] = useState(() => getStoredUser());
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const notificationRef = useRef(null);
  const location = useLocation();
  const canShowNav = useNavFilter();

  const dismissedStorageKey = `dismissedGlobalNotifications:${user?.id || user?.email || 'anonymous'}`;

  const loadDismissedIds = () => {
    try {
      const raw = localStorage.getItem(dismissedStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  };

  const saveDismissedIds = (idsSet) => {
    localStorage.setItem(dismissedStorageKey, JSON.stringify(Array.from(idsSet)));
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const res = await apiClient.get('/api/notifications');
      const dismissed = loadDismissedIds();
      const incoming = (res.data || []).filter((notification) => !dismissed.has(notification.id));
      setNotifications(incoming);
    } catch (error) {
      console.error('Failed to fetch global notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const dismissNotification = (id) => {
    const dismissed = loadDismissedIds();
    dismissed.add(id);
    saveDismissedIds(dismissed);
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  useEffect(() => {
    if (user?.tenantId) {
      const socketUrl = getSocketUrl();
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000
      });

      newSocket.on('connect', () => {
        newSocket.emit('join_tenant', user.tenantId);
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
    return undefined;
  }, [user]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return undefined;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: RectangleGroupIcon },
    { name: 'Inbox', path: '/inbox', icon: ChatBubbleLeftRightIcon },
    { name: 'Contacts', path: '/contacts', icon: UsersIcon },
    { name: 'Campaigns', path: '/campaigns', icon: MegaphoneIcon },
    { name: 'Templates', path: '/templates', icon: DocumentTextIcon },
    { name: 'AI Agents', path: '/agents', icon: SparklesIcon },
    { name: 'Channels', path: '/channels', icon: Squares2X2Icon },
    { name: 'Automations', path: '/automations', icon: BoltIcon },
    { name: 'Workflows', path: '/workflows', icon: ArrowPathIcon },  // Fix 4.7: Distinct icon from Automations
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
    { name: 'Help Center', path: '/help', icon: QuestionMarkCircleIcon },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const isInboxRoute = location.pathname.startsWith('/inbox');
  const isConnectRoute = location.pathname.startsWith('/channels/connect');
  const isManageRoute = location.pathname.startsWith('/channels/manage');
  const isFullWidth = isInboxRoute || isConnectRoute || isManageRoute;

  return (
    <div className="flex h-screen bg-[#232318] text-[#fffed9] overflow-hidden">
      <aside className={`border-r border-[#fffed9]/10 bg-[#1d1d14] flex flex-col z-50 transition-all duration-300 ${isFullWidth ? 'w-[60px] items-center py-4' : 'w-64'}`}>
        <div className={`p-4 ${isFullWidth ? 'px-0 pb-6' : 'p-6'}`}>
          <Link to="/dashboard" className={`flex items-center ${isFullWidth ? 'justify-center' : 'gap-3'}`}>
            <img src="/main-logo.svg" alt="Value chat" className={`${isFullWidth ? 'w-8 h-8' : 'w-9 h-9'}`} />
            {!isFullWidth && (
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-[#fffed9] to-[#7a7839] bg-clip-text text-transparent">
                Value chat
              </span>
            )}
          </Link>
        </div>

        <nav className={`flex-1 space-y-2 ${isInboxRoute ? 'px-2 flex flex-col items-center' : 'px-4'}`}>
          {navItems.filter(canShowNav).map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                aria-label={item.name}
                title={isInboxRoute ? item.name : undefined}
                className={`flex items-center rounded-xl transition-all group relative ${isInboxRoute
                  ? `w-10 h-10 justify-center ${active ? 'bg-[#e2f300]/15 text-[#e2f300]' : 'text-[#fffed9]/45 hover:bg-[#fffed9]/5 hover:text-[#fffed9]'}`
                  : `px-3 py-2.5 gap-3 ${active ? 'bg-[#e2f300]/15 text-[#e2f300] font-bold' : 'text-[#fffed9]/70 hover:bg-[#fffed9]/5 hover:text-[#fffed9] font-medium'}`
                }`}
              >
                <item.icon className={`transition-colors ${isFullWidth ? 'w-[22px] h-[22px]' : 'w-5 h-5'} ${active ? 'text-[#e2f300]' : 'group-hover:text-[#fffed9]'}`} />
                {!isFullWidth && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-white/5 mt-auto flex flex-col ${isFullWidth ? 'p-2 items-center gap-4 py-4' : 'p-4'}`}>
          {!isFullWidth ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#e2f300] to-[#7a7839] flex items-center justify-center font-bold text-[#232318] shadow-lg">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{user?.role || 'member'} * {user?.subscriptionPlan || 'Workspace'}</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#e2f300] to-[#7a7839] flex items-center justify-center font-bold text-[#232318] text-xs shadow-[0_0_15px_rgba(226,243,0,0.2)]">
              {user?.email?.[0].toUpperCase()}
            </div>
          )}

          <button
            onClick={handleLogout}
            title={isFullWidth ? 'Sign Out' : undefined}
            className={`flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-all ${isFullWidth ? 'w-10 h-10 rounded-xl hover:bg-rose-500/10' : 'w-full gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'}`}
          >
            <LogoutIcon className={isFullWidth ? 'w-5 h-5 ml-1' : 'w-4 h-4'} />
            {!isFullWidth && 'Sign Out'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {!isFullWidth && (
          <header className="h-16 border-b border-[#fffed9]/8 bg-[#1f1f15]/70 backdrop-blur-md flex items-center justify-between px-8 z-40 shrink-0">
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fffed9]/45 group-focus-within:text-[#e2f300] transition-colors" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full bg-[#fffed9]/5 border border-[#fffed9]/10 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-[#e2f300]/35 focus:ring-4 focus:ring-[#e2f300]/10 transition-all text-[#fffed9]"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all relative"
                >
                  <BellIcon className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#e2f300] rounded-full ring-2 ring-[#232318]" />
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-[360px] max-h-[420px] overflow-y-auto rounded-2xl border border-[#fffed9]/10 bg-[#1b1b13] shadow-2xl z-50">
                    <div className="px-4 py-3 border-b border-[#fffed9]/10 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#fffed9]">Notifications</h3>
                      <button onClick={fetchNotifications} className="text-xs text-[#e2f300] hover:text-[#f5ff68]">
                        Refresh
                      </button>
                    </div>

                    {notificationsLoading ? (
                      <div className="px-4 py-6 text-sm text-zinc-400">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-zinc-500">No active notifications.</div>
                    ) : (
                      <div className="divide-y divide-[#fffed9]/10">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${typeColors[notification.type] || typeColors.info}`}>
                                    {notification.type}
                                  </span>
                                  <h4 className="text-sm font-semibold text-white truncate">{notification.title}</h4>
                                </div>
                                <p className="text-xs text-zinc-300 whitespace-pre-wrap">{notification.message}</p>
                                <p className="text-[10px] text-zinc-500 mt-2">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>

                              <button
                                onClick={() => dismissNotification(notification.id)}
                                className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white"
                                title="Dismiss"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-6 w-[1px] bg-white/10 mx-2" />
              <Link to="/pricing" className="text-xs font-bold bg-[#e2f300] hover:bg-[#f0ff4e] text-[#232318] px-4 py-1.5 rounded-full uppercase tracking-wider transition-all">
                Upgrade
              </Link>
            </div>
          </header>
        )}

        {isFullWidth ? (
          <main className="flex-1 h-full overflow-hidden bg-[#232318]">
            {children}
          </main>
        ) : (
          <main className="flex-1 p-8 overflow-y-auto w-full bg-[#232318]">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        )}
      </div>

      <GlobalProgressBar socket={socket} />
    </div>
  );
}
