import React, { useEffect, useMemo, useState } from 'react';
import {
  UsersIcon,
  BuildingOfficeIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
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

  const planEntries = useMemo(() => {
    if (!stats?.planDistribution) return [];
    return Object.entries(stats.planDistribution).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ValueWatsLoader size={60} />
      </div>
    );
  }

  const statCards = [
    { name: 'Total Tenants', value: stats?.totalTenants || 0, icon: BuildingOfficeIcon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { name: 'Active Channels', value: stats?.activeInstances || 0, icon: BoltIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'Messages Sent (Today)', value: stats?.messagesToday || 0, icon: ChatBubbleLeftRightIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Total Users', value: stats?.totalUsers || 0, icon: UsersIcon, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { name: 'Active Notifications', value: stats?.activeNotifications || 0, icon: BellAlertIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-zinc-400 text-sm mt-1">Live platform health, plan adoption, and usage telemetry.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/plans" className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
            Manage Plans
          </Link>
          <Link to="/admin/logs" className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold">
            Broadcast Notifications
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CircleStackIcon className="w-5 h-5 text-indigo-300" />
            Plan Distribution
          </h3>
          {planEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">No plan data available.</p>
          ) : (
            <div className="space-y-3">
              {planEntries.map(([planName, count]) => (
                <div key={planName} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-sm text-zinc-300 capitalize">{planName}</span>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Infrastructure Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-zinc-300">BullMQ Service</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {stats?.bullMqStatus || 'Status Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-zinc-300">Redis Database</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {stats?.redisStatus || 'Status Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-zinc-300">PostgreSQL DB</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <div className="text-xs text-zinc-400">Active</div>
              <div className="text-lg font-bold text-emerald-300">{stats?.tenantsByStatus?.active || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <div className="text-xs text-zinc-400">Trial</div>
              <div className="text-lg font-bold text-blue-300">{stats?.tenantsByStatus?.trial || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <div className="text-xs text-zinc-400">Suspended</div>
              <div className="text-lg font-bold text-rose-300">{stats?.tenantsByStatus?.suspended || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
