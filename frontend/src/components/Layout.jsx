import { Link, useLocation } from 'react-router-dom';
import {
  RectangleGroupIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  CpuChipIcon,
  Squares2X2Icon,
  BoltIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { getSocketUrl } from '../utils/socketUtils';
import GlobalProgressBar from './GlobalProgressBar';

export default function Layout({ children }) {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [socket, setSocket] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user && user.tenantId) {
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
  }, [user]);

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
      {/* Premium Sidebar */}
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
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isInboxRoute ? item.name : undefined}
                className={`flex items-center rounded-xl transition-all group relative ${isInboxRoute
                  ? `w-10 h-10 justify-center ${active ? 'bg-[#e2f300]/15 text-[#e2f300]' : 'text-[#fffed9]/45 hover:bg-[#fffed9]/5 hover:text-[#fffed9]'}`
                  : `px-3 py-2.5 gap-3 ${active ? 'bg-[#e2f300]/15 text-[#e2f300] font-bold' : 'text-[#fffed9]/70 hover:bg-[#fffed9]/5 hover:text-[#fffed9] font-medium'}`
                  }`}
              >
                <item.icon className={`transition-colors ${isFullWidth ? 'w-[22px] h-[22px]' : 'w-5 h-5'} ${active ? 'text-[#e2f300]' : 'group-hover:text-[#fffed9]'}`} />
                {!isFullWidth && <span>{item.name}</span>}
              </Link>
            )
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
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Enterprise</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#e2f300] to-[#7a7839] flex items-center justify-center font-bold text-[#232318] text-xs shadow-[0_0_15px_rgba(226,243,0,0.2)]">
              {user?.email?.[0].toUpperCase()}
            </div>
          )}

          <button
            onClick={handleLogout}
            title={isFullWidth ? "Sign Out" : undefined}
            className={`flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-all ${isFullWidth ? 'w-10 h-10 rounded-xl hover:bg-rose-500/10' : 'w-full gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'}`}
          >
            <LogoutIcon className={isFullWidth ? "w-5 h-5 ml-1" : "w-4 h-4"} />
            {!isFullWidth && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top bar (Hidden in Inbox/Connect Mode for Full Screen Immersion) */}
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
              <button className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all relative">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#e2f300] rounded-full ring-2 ring-[#232318]"></span>
              </button>
              <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
              <button className="text-xs font-bold bg-[#e2f300] hover:bg-[#f0ff4e] text-[#232318] px-4 py-1.5 rounded-full uppercase tracking-wider transition-all">
                Upgrade
              </button>
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

