import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  MegaphoneIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  UserGroupIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
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
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const baseUrl = socketUrl.replace('/api', '');
      const newSocket = io(baseUrl);

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
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Inbox', path: '/inbox', icon: ChatBubbleLeftRightIcon },
    { name: 'Contacts', path: '/contacts', icon: UsersIcon },
    { name: 'Campaigns', path: '/campaigns', icon: MegaphoneIcon },
    { name: 'Templates', path: '/templates', icon: DocumentDuplicateIcon },
    { name: 'AI Agents', path: '/agents', icon: CpuChipIcon },
    { name: 'Instances', path: '/instances', icon: DevicePhoneMobileIcon },
    { name: 'Automations', path: '/automations', icon: BoltIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const isInboxRoute = location.pathname.startsWith('/inbox');

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* Premium Sidebar */}
      <aside className={`border-r border-white/5 bg-[#0f0f11] flex flex-col z-50 transition-all duration-300 ${isInboxRoute ? 'w-[60px] items-center py-4' : 'w-64'}`}>
        <div className={`p-4 ${isInboxRoute ? 'px-0 pb-6' : 'p-6'}`}>
          <Link to="/dashboard" className={`flex items-center ${isInboxRoute ? 'justify-center' : 'gap-3'}`}>
            <div className={`bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(71,37,244,0.4)] flex items-center justify-center text-white font-bold tracking-tighter ${isInboxRoute ? 'w-8 h-8 text-[10px]' : 'p-2'}`}>
              {!isInboxRoute ? <ChatBubbleLeftRightIcon className="w-6 h-6" /> : "VW"}
            </div>
            {!isInboxRoute && (
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                ValueWats
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
                  ? `w-10 h-10 justify-center ${active ? 'bg-indigo-600/10 text-indigo-400' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`
                  : `px-3 py-2.5 gap-3 ${active ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`
                  }`}
              >
                <item.icon className={`transition-colors ${isInboxRoute ? 'w-[22px] h-[22px]' : 'w-5 h-5'} ${active ? 'text-indigo-400' : 'group-hover:text-white'}`} />
                {!isInboxRoute && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className={`border-t border-white/5 mt-auto flex flex-col ${isInboxRoute ? 'p-2 items-center gap-4 py-4' : 'p-4'}`}>
          {!isInboxRoute ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Enterprise</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              {user?.email?.[0].toUpperCase()}
            </div>
          )}

          <button
            onClick={handleLogout}
            title={isInboxRoute ? "Sign Out" : undefined}
            className={`flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-all ${isInboxRoute ? 'w-10 h-10 rounded-xl hover:bg-rose-500/10' : 'w-full gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'}`}
          >
            <LogoutIcon className={isInboxRoute ? "w-5 h-5 ml-1" : "w-4 h-4"} />
            {!isInboxRoute && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top bar (Hidden in Inbox Mode for Full Screen Immersion) */}
        {!isInboxRoute && (
          <header className="h-16 border-b border-white/5 bg-zinc-950/30 backdrop-blur-md flex items-center justify-between px-8 z-40 shrink-0">
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all relative">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#09090b]"></span>
              </button>
              <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
              <button className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full uppercase tracking-wider transition-all">
                Upgrade
              </button>
            </div>
          </header>
        )}

        {isInboxRoute ? (
          <main className="flex-1 h-full overflow-hidden bg-[#000000]">
            {children}
          </main>
        ) : (
          <main className="flex-1 p-8 overflow-y-auto w-full">
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
