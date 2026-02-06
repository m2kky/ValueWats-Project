import { useState, useEffect } from 'react';
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
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await api.get('/instances');
      setInstances(response.data.instances);
    } catch (error) {
      console.error('Failed to fetch instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Manage your WhatsApp instances and campaigns from one place.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Active Instances" 
            value={instances.filter(i => i.status === 'connected').length}
            icon={SignalIcon}
            color="bg-green-500"
          />
          <StatCard 
            title="Total Messages" 
            value="1,240"
            icon={ChatBubbleLeftRightIcon}
            color="bg-blue-500"
          />
          <StatCard 
            title="Total Campaigns" 
            value="3"
            icon={MegaphoneIcon}
            color="bg-purple-500"
          />
          <StatCard 
            title="Total Contacts" 
            value="5,420"
            icon={UserGroupIcon}
            color="bg-orange-500"
          />
        </div>

        {/* Instances Section */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="text-lg font-bold text-gray-900">WhatsApp Instances</h2>
              <p className="text-sm text-gray-500">Manage your connected devices</p>
            </div>
            <a href="/instances/new" className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Connect New Instance
            </a>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : instances.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <QrCodeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No instances connected</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Get started by connecting your first WhatsApp number to start sending messages.</p>
                <a href="/instances/new" className="btn-primary">
                  Connect Instance
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((instance) => (
                  <div key={instance.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors group bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-green-100 p-2.5 rounded-lg group-hover:bg-green-200 transition-colors">
                        <span className="text-2xl">📱</span>
                      </div>
                      <span className={`badge ${
                        instance.status === 'connected' ? 'badge-success' : 
                        instance.status === 'qr_pending' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {instance.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{instance.instanceName}</h3>
                    <p className="text-gray-500 text-sm mb-4">{instance.phoneNumber || 'Waiting for connection...'}</p>
                    
                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                      <button className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                        View Details
                      </button>
                      <button className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
