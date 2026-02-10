import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
  PlusIcon,
  ArrowRightOnRectangleIcon as LogoutIcon, 
  SignalIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  MegaphoneIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="card-body">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm text-gray-600">
        <span className="text-green-600 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
          Live
        </span>
        <span className="mx-2">•</span>
        <span>Stats updated</span>
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name || 'User'}! Here is your campaign performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Active Instances" 
            value={stats.instances}
            icon={SignalIcon}
            color="bg-green-500"
          />
          <StatCard 
            title="Total Messages" 
            value={stats.messages.total.toLocaleString()}
            icon={ChatBubbleLeftRightIcon}
            color="bg-blue-500"
          />
          <StatCard 
            title="Total Campaigns" 
            value={stats.campaigns}
            icon={MegaphoneIcon}
            color="bg-purple-500"
          />
          <StatCard 
            title="Unique Contacts" 
            value={stats.contacts.toLocaleString()}
            icon={UserGroupIcon}
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Status Breakdown */}
          <div className="card">
             <div className="card-header">
                <h2 className="text-lg font-bold text-gray-900">Message Status</h2>
             </div>
             <div className="card-body">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Sent</span>
                      <span>{stats.messages.sent}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                       <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.messages.total > 0 ? (stats.messages.sent / stats.messages.total * 100) : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Delivered</span>
                      <span>{stats.messages.delivered}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                       <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.messages.total > 0 ? (stats.messages.delivered / stats.messages.total * 100) : 0}%` }}></div>
                    </div>
                  </div>
                   <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Read</span>
                      <span>{stats.messages.read}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                       <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.messages.total > 0 ? (stats.messages.read / stats.messages.total * 100) : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Failed</span>
                      <span>{stats.messages.failed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                       <div className="bg-red-500 h-2 rounded-full" style={{ width: `${stats.messages.total > 0 ? (stats.messages.failed / stats.messages.total * 100) : 0}%` }}></div>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Recent Campaigns */}
          <div className="card">
             <div className="card-header flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Campaigns</h2>
                <a href="/campaigns" className="text-sm text-blue-600 hover:text-blue-800">View All</a>
             </div>
             <div className="divide-y divide-gray-200">
                {stats.recentCampaigns.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No campaigns yet.</div>
                ) : (
                  stats.recentCampaigns.map(campaign => (
                    <div key={campaign.id} className="p-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                       <div>
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <p className="text-sm text-gray-500">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{campaign.messageCount} msgs</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {campaign.status}
                          </span>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
