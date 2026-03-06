import React, { useEffect, useState } from 'react';
import {
  UsersIcon,
  BuildingOfficeIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../api/client';
import ValueWatsLoader from '../../components/ValueWatsLoader';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ValueWatsLoader size={60} />
      </div>
    );
  }

  const statCards = [
    { name: 'Total Tenants', value: stats?.totalTenants || 0, icon: BuildingOfficeIcon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { name: 'Active WhatsApp Instances', value: stats?.activeInstances || 0, icon: BoltIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'Messages Sent (Today)', value: stats?.messagesToday || 0, icon: ChatBubbleLeftRightIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Total Users', value: stats?.totalUsers || 0, icon: UsersIcon, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-zinc-400 text-sm mt-1">High-level telemetry of the entire platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
             <div className={`absolute -right-6 -top-6 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
             <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="flex items-center justify-between mb-4">
                 <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                 </div>
               </div>
               <div>
                  <h3 className="text-zinc-400 font-medium text-sm">{stat.name}</h3>
                  <div className="text-3xl font-black text-white mt-1 tracking-tight">{stat.value}</div>
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Database/Queue Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Infrastructure Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-zinc-300">BullMQ Service</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {stats?.bullMqStatus || 'Status Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-zinc-300">Redis Database</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {stats?.redisStatus || 'Status Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-zinc-300">PostgreSQL DB</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Operational
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Limits & Toggles</h3>
          <p className="text-sm text-zinc-400 mb-4">Access these from the global settings panel to immediately lock down or control feature flow on the platform.</p>
          <div className="space-y-3 opacity-50 pointer-events-none">
             {/* Phase 2 Feature: Toggle global signup, allow AI agents globally, etc */}
             <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Allow New Signups</span>
                <div className="w-10 h-5 bg-indigo-500 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Enable DeepSeek LLM Module</span>
                <div className="w-10 h-5 bg-indigo-500 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </div>
             </div>
          </div>
          <div className="mt-4 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg text-center">
            Global Toggles arriving in Phase 2
          </div>
        </div>
      </div>
    </div>
  );
}
