import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon,
  SignalIcon,
  SignalSlashIcon,
  DevicePhoneMobileIcon,
  EllipsisVerticalIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

const statusConfig = {
  connected: { label: 'Connected', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  qr_pending: { label: 'Awaiting QR', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  disconnected: { label: 'Disconnected', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
};

export default function Instances() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [refreshing, setRefreshing] = useState(null);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await api.get('/instances');
      setInstances(res.data.instances || []);
    } catch (err) {
      console.error('Failed to fetch instances:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuId]);

  const handleRefreshStatus = async (e, instance) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRefreshing(instance.id);
    try {
      await api.get(`/instances/${instance.id}/status`);
      await fetchInstances();
    } catch (err) {
      console.error('Failed to refresh status:', err);
    } finally {
      setRefreshing(null);
    }
  };

  const handleDelete = async (e, instance) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!confirm(`Delete instance "${instance.instanceName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/instances/${instance.id}`);
      setInstances(prev => prev.filter(i => i.id !== instance.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete instance');
    }
  };

  const toggleMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const connectedCount = instances.filter(i => i.status === 'connected').length;
  const totalCount = instances.length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              WhatsApp Instances
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {connectedCount}/{totalCount} connected
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
            <button
              onClick={fetchInstances}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
            >
              <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
            <Link
              to="/instances/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Connect New
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading instances...</p>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-16">
              <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No instances</h3>
              <p className="mt-2 text-sm text-gray-500">Connect a WhatsApp number to get started.</p>
              <div className="mt-6">
                <Link
                  to="/instances/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Connect Instance
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {instances.map(instance => {
                const cfg = statusConfig[instance.status] || statusConfig.disconnected;
                return (
                  <div key={instance.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2.5 rounded-lg ${instance.status === 'connected' ? 'bg-green-50' : 'bg-gray-100'}`}>
                        {instance.status === 'connected' ? (
                          <SignalIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <SignalSlashIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{instance.instanceName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {instance.phoneNumber && (
                            <span className="text-xs text-gray-500">{instance.phoneNumber}</span>
                          )}
                          <span className="text-xs text-gray-400">Created {new Date(instance.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                        {cfg.label}
                      </span>

                      {/* Refreshing spinner */}
                      {refreshing === instance.id && (
                        <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
                      )}

                      {/* Actions */}
                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(e, instance.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>

                        {openMenuId === instance.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                            <button
                              onClick={(e) => handleRefreshStatus(e, instance)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ArrowPathIcon className="h-4 w-4" /> Refresh Status
                            </button>
                            {instance.status !== 'connected' && (
                              <Link
                                to={`/instances/new?instanceId=${instance.id}&name=${encodeURIComponent(instance.instanceName)}`}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                              >
                                <QrCodeIcon className="h-4 w-4" /> Reconnect
                              </Link>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, instance)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
