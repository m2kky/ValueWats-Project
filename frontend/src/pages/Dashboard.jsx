import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  SignalIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import ActivityFeed from '../components/ActivityFeed';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
  <div className="glass-card p-6 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 ${color}`}></div>
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm font-semibold text-zinc-500 mb-1 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {trend === 'up' ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
              {trendValue}
            </div>
            <span className="text-zinc-500">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-2xl bg-gradient-to-tr shadow-lg group-hover:scale-110 transition-transform duration-300 ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    instances: 0,
    messages: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0, deliveryRate: 0, readRate: 0 },
    campaigns: 0,
    contacts: 0,
    ai: { messagesHandled: 0, escalationRate: 0, activeSessions: 0 }
  });
  const [user, setUser] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const data = response.data || {};
      setStats({
        instances: data.instances || 0,
        messages: {
          total: data.messages?.total || 0,
          sent: data.messages?.sent || 0,
          delivered: data.messages?.delivered || 0,
          read: data.messages?.read || 0,
          failed: data.messages?.failed || 0,
          deliveryRate: data.messages?.deliveryRate || 0,
          readRate: data.messages?.readRate || 0
        },
        campaigns: data.campaigns || 0,
        contacts: data.contacts || 0,
        ai: {
          messagesHandled: data.ai?.messagesHandled || 0,
          escalationRate: data.ai?.escalationRate || 0,
          activeSessions: data.ai?.activeSessions || 0
        }
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchStats();

    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Overview</h1>
          <p className="text-zinc-500 mt-2 text-lg">Welcome back, <span className="text-indigo-400 font-bold">{user?.name || 'User'}</span>. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-medium text-zinc-400">
            <ClockIcon className="w-4 h-4" />
            Live Updates Enabled
          </div>
          <button onClick={() => navigate('/campaigns/new')} className="btn-premium">
            Launch Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Channels"
          value={stats.instances}
          icon={SignalIcon}
          color="from-emerald-500 to-teal-500"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Messages Sent"
          value={stats.messages.sent.toLocaleString()}
          icon={ChatBubbleLeftRightIcon}
          color="from-indigo-500 to-blue-500"
          trend="up"
          trendValue="+24%"
        />
        <StatCard
          title="AI Automation"
          value={`${stats.ai.messagesHandled}`}
          icon={UserGroupIcon}
          color="from-purple-500 to-pink-500"
          trend="up"
          trendValue={`${stats.ai.activeSessions} active`}
        />
        <StatCard
          title="Reach"
          value={stats.contacts.toLocaleString()}
          icon={UserGroupIcon}
          color="from-orange-500 to-amber-500"
          trend="up"
          trendValue="+40%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Breakdown */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-8">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Delivery Performance</h2>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Sent</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Success</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                {[
                  { label: 'Sent', count: stats.messages.sent, color: 'bg-indigo-500', icon: '📤' },
                  { label: 'Delivered', count: stats.messages.delivered, color: 'bg-emerald-500', icon: '✅' },
                  { label: 'Read', count: stats.messages.read, color: 'bg-purple-500', icon: '👀' },
                  { label: 'Failed', count: stats.messages.failed, color: 'bg-rose-500', icon: '❌' }
                ].map((item) => (
                  <div key={item.label} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-black text-white">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-1000`}
                        style={{ width: `${stats.messages.total > 0 ? (item.count / stats.messages.total * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col justify-center gap-6 border-l border-white/5 pl-10">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Delivery Rate</p>
                  <p className="text-3xl font-black text-emerald-400">{stats.messages.deliveryRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Read Rate</p>
                  <p className="text-3xl font-black text-purple-400">{stats.messages.readRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">AI Escalation Rate</p>
                  <p className="text-3xl font-black text-rose-400">{stats.ai.escalationRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Activity Feed */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
          <div className="glass-card flex-1 flex flex-col overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Live Feed</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Real-time</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
