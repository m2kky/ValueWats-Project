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
    messages: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
    campaigns: 0,
    contacts: 0,
    recentCampaigns: []
  });
  const [user, setUser] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
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
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Overview</h1>
          <p className="text-zinc-500 mt-2 text-lg">Welcome back, <span className="text-indigo-400 font-bold">{user?.name || 'User'}</span>. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-medium text-zinc-400">
            <ClockIcon className="w-4 h-4" />
            Last updated: Just now
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
          title="Campaigns"
          value={stats.campaigns}
          icon={MegaphoneIcon}
          color="from-purple-500 to-pink-500"
          trend="down"
          trendValue="-5%"
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
        <div className="lg:col-span-7 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white">Delivery Performance</h2>
            <div className="flex items-center gap-4 text-sm font-bold">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Sent</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Success</div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              { label: 'Sent', count: stats.messages.sent, color: 'bg-indigo-500', icon: '📤' },
              { label: 'Delivered', count: stats.messages.delivered, color: 'bg-emerald-500', icon: '✅' },
              { label: 'Read', count: stats.messages.read, color: 'bg-purple-500', icon: '👀' },
              { label: 'Failed', count: stats.messages.failed, color: 'bg-rose-500', icon: '❌' }
            ].map((item) => (
              <div key={item.label} className="group">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-lg font-black text-white">{item.count.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-[2px] border border-white/5">
                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${stats.messages.total > 0 ? (item.count / stats.messages.total * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity / Recent Campaigns */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-lg font-black text-white tracking-tight">Recent Activity</h2>
              <button onClick={() => navigate('/campaigns')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter">View Grid</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {stats.recentCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-600 grayscale opacity-50">
                  <MegaphoneIcon className="w-12 h-12 mb-4" />
                  <p className="font-bold">No active campaigns</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {stats.recentCampaigns.map(campaign => (
                    <div
                      key={campaign.id}
                      className="p-5 hover:bg-white/[0.03] active:bg-white/5 transition-all cursor-pointer group"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight italic">{campaign.name}</p>
                          <p className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-1">
                            <ClockIcon className="w-3 h-3" />
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`status-badge ${campaign.status === 'COMPLETED' ? 'status-online' :
                            campaign.status === 'FAILED' ? 'status-offline' :
                              'status-learning'
                          }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex -space-x-2 overflow-hidden">
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">WA</div>
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-zinc-900 bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">AI</div>
                        </div>
                        <span className="text-xs font-bold text-zinc-400">{campaign.messageCount.toLocaleString()} targets</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Connect CTA */}
          <div className="glass-card bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/20 p-6">
            <h3 className="text-white font-black mb-1">New WhatsApp Instance?</h3>
            <p className="text-indigo-200/60 text-sm mb-4">Connect a new number to start your next campaign instantly.</p>
            <button onClick={() => navigate('/instances/new')} className="w-full bg-white text-indigo-900 font-black py-2.5 rounded-xl hover:bg-zinc-100 active:scale-95 transition-all">
              Connect Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
