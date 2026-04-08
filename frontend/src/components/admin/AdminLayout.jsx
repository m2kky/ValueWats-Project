import { Link, useLocation } from 'react-router-dom';
import {
  RectangleGroupIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  BoltIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { getStoredUser } from '../../utils/authUser';

export default function AdminLayout({ children }) {
  const [user] = useState(() => getStoredUser());
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Overview', path: '/admin', icon: RectangleGroupIcon, exact: true },
    { name: 'Tenants', path: '/admin/tenants', icon: BuildingOfficeIcon },
    { name: 'Plans', path: '/admin/plans', icon: ArchiveBoxIcon },
    { name: 'Users', path: '/admin/users', icon: UsersIcon },
    { name: 'Notifications', path: '/admin/logs', icon: BoltIcon }
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 overflow-hidden">
      {/* Super Admin Sidebar - Distinct Red Dark Hue */}
      <aside className="w-64 border-r border-red-500/10 bg-[#0a0505] flex flex-col z-50">
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-red-500" />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                Super Admin
              </span>
              <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Value chat</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4 mt-4">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 gap-3 rounded-xl transition-all group ${
                  active 
                    ? 'bg-red-500/10 text-red-400 font-bold border border-red-500/20' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium border border-transparent'
                }`}
              >
                <item.icon className={`transition-colors w-5 h-5 ${active ? 'text-red-400' : 'group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-red-500/10 p-4 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">System God</p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all mb-2"
          >
            &larr; Exit Admin Mode
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogoutIcon className="w-4 h-4" />
            Sign Out Completely
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative selection:bg-red-500/30">
        <header className="h-16 border-b border-red-500/10 bg-[#0a0505]/50 backdrop-blur-md flex items-center justify-between px-8 z-40 shrink-0">
          <h1 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
            {navItems.find(item => isActive(item.path, item.exact))?.name || 'Admin Panel'}
          </h1>
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
               System Operational
             </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto w-full bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
