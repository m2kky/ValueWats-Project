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
  ClockIcon,
  InboxIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
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
    conversations: 0,
    openConversations: 0,
    pendingConversations: 0,
    ai: { messagesHandled: 0, escalationRate: 0, activeSessions: 0 },
    teamInsights: [],
    teamTotal: 0,
    leadsByStage: [],
    totalLeads: 0,
    recentCampaigns: [],
    recentFailed: [],
    topKeywords: [],
    avgResponseTime: 0,
    disconnectedInstances: [],
    timeline: []
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
        conversations: data.conversations || 0,
        openConversations: data.openConversations || 0,
        pendingConversations: data.pendingConversations || 0,
        ai: {
          messagesHandled: data.ai?.messagesHandled || 0,
          escalationRate: data.ai?.escalationRate || 0,
          activeSessions: data.ai?.activeSessions || 0
        },
        teamInsights: data.teamInsights || [],
        teamTotal: data.teamTotal || 0,
        leadsByStage: data.leadsByStage || [],
        totalLeads: data.totalLeads || 0,
        recentCampaigns: data.recentCampaigns || [],
        recentFailed: data.recentFailed || [],
        topKeywords: data.topKeywords || [],
        avgResponseTime: data.avgResponseTime || 0,
        disconnectedInstances: data.disconnectedInstances || [],
        timeline: data.timeline || []
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
          title="Campaigns"
          value={stats.campaigns}
          icon={MegaphoneIcon}
          color="from-purple-500 to-pink-500"
          trend="up"
          trendValue={`${stats.ai.messagesHandled} AI msgs`}
        />
        <StatCard
          title="Reach"
          value={stats.contacts.toLocaleString()}
          icon={UserGroupIcon}
          color="from-orange-500 to-amber-500"
          trend="up"
          trendValue={`${stats.conversations} convos`}
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

          {/* Team Insights */}
          {stats.teamInsights && stats.teamInsights.length > 0 && (
            <div className="glass-card p-8 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Team</h2>
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{stats.teamTotal} member{stats.teamTotal !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-5">
                {stats.teamInsights.map(member => {
                  const max = stats.teamInsights[0]?.messagesReplied || 1;
                  const pct = max > 0 ? Math.round((member.messagesReplied / max) * 100) : 0;
                  return (
                    <div key={member.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-white">{member.name}</span>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-wider">{member.role}</span>
                        </div>
                        <span className="text-sm font-black text-emerald-400">{member.messagesReplied.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leads by Stage */}
          {stats.leadsByStage && stats.leadsByStage.length > 0 && (
            <div className="glass-card p-8 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Leads Pipeline</h2>
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{stats.totalLeads.toLocaleString()} total</span>
              </div>
              <div className="space-y-4">
                {stats.leadsByStage.map(stage => (
                  <div key={stage.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white">
                        {stage.emoji && <span className="mr-1.5">{stage.emoji}</span>}
                        {stage.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{stage.count.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-zinc-600">{stage.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${stage.percent}%`, backgroundColor: stage.color || '#6366f1' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Volume Graph */}
          {stats.timeline && stats.timeline.length > 0 && (
            <div className="glass-card p-8 mt-8">
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6">Message Volume (7d)</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} dy={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="sent" name="Sent" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                    <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDelivered)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">

          {/* Open Conversations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <InboxIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Open</span>
              </div>
              <p className="text-3xl font-black text-white">{stats.openConversations}</p>
              <p className="text-[10px] text-zinc-600 mt-1">conversations</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <ClockIcon className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pending</span>
              </div>
              <p className="text-3xl font-black text-white">{stats.pendingConversations}</p>
              <p className="text-[10px] text-zinc-600 mt-1">conversations</p>
            </div>
          </div>

          {/* Recent Campaigns */}
          {stats.recentCampaigns.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-4">Recent Campaigns</h2>
              <div className="space-y-3">
                {stats.recentCampaigns.map(c => {
                  const statusColor = { completed: 'text-emerald-400', running: 'text-indigo-400', failed: 'text-rose-400', paused: 'text-amber-400' }[c.status] || 'text-zinc-500';
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{c.name}</p>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-wider">{c.messageCount.toLocaleString()} msgs</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 ml-3 ${statusColor}`}>{c.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disconnected Instances Alert */}
          {stats.disconnectedInstances.length > 0 && (
            <div className="glass-card p-5 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-3">
                <ExclamationTriangleIcon className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Disconnected Channels</span>
              </div>
              <div className="space-y-2">
                {stats.disconnectedInstances.map(inst => (
                  <div key={inst.id} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{inst.name}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${inst.status === 'qr_pending' ? 'text-amber-400' : 'text-rose-400'}`}>{inst.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avg Response Time */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <BoltIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Avg Response Time</span>
            </div>
            <p className="text-3xl font-black text-white">
              {stats.avgResponseTime < 1 ? '<1' : stats.avgResponseTime}
              <span className="text-sm font-bold text-zinc-500 ml-1">min</span>
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">last 7 days</p>
          </div>

          {/* Failed Messages Last 2 Days */}
          {stats.recentFailed.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Failed Messages (2d)</span>
                <span className="text-xs font-black text-rose-400">{stats.recentFailed.length}</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {stats.recentFailed.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">{m.recipientNumber}</span>
                    <span className="text-rose-400/70 text-[10px] truncate max-w-[120px] ml-2">{m.failReason || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Keywords */}
          {stats.topKeywords.length > 0 && (
            <div className="glass-card p-5">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-3">Top Keywords</span>
              <div className="flex flex-wrap gap-2">
                {stats.topKeywords.map(({ word, count }) => (
                  <span key={word} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-xs text-zinc-300 font-medium">
                    {word} <span className="text-zinc-600 ml-1">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="glass-card flex-1 flex flex-col overflow-hidden min-h-[400px]">
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
