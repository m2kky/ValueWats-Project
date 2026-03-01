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
  connected: { label: 'Connected', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' },
  qr_pending: { label: 'Awaiting QR', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]', dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' },
  disconnected: { label: 'Disconnected', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]', dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' },
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
    const handleClick = (e) => {
      if (e.target.closest('.menu-toggle-btn')) return;
      setOpenMenuId(null);
    };
    if (openMenuId) {
      document.addEventListener('click', handleClick);
    }
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
    e.stopPropagation();
    setOpenMenuId(prev => prev === id ? null : id);
  };

  const connectedCount = instances.filter(i => i.status === 'connected').length;
  const totalCount = instances.length;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-white sm:text-3xl sm:truncate tracking-tight uppercase italic">
            WhatsApp Instances
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400 font-medium tracking-wide">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connectedCount > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connectedCount > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            {connectedCount}/{totalCount} connected instances
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <button
            onClick={fetchInstances}
            className="btn-glass flex items-center"
          >
            <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
          <Link
            to="/instances/new"
            className="btn-premium flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5 border-2 border-white/20 rounded-full p-0.5" />
            Connect New
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="glass-card overflow-visible">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] mx-auto mb-4"></div>
            <p className="text-zinc-500 font-medium">Loading instances...</p>
          </div>
        ) : instances.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <DevicePhoneMobileIcon className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="mt-4 text-sm font-black text-white uppercase tracking-widest italic">No instances</h3>
            <p className="mt-2 mb-8 text-sm text-zinc-400">Connect a WhatsApp number to start automating messages.</p>
            <Link
              to="/instances/new"
              className="btn-glass inline-flex items-center"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Connect Instance
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {instances.map(instance => {
              const cfg = statusConfig[instance.status] || statusConfig.disconnected;
              return (
                <div key={instance.id} className="px-5 py-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors rounded-xl m-2">
                  <div className="flex items-center gap-5 min-w-0 pr-4">
                    <div className={`p-3 rounded-xl border transition-all duration-300 shadow-lg group-hover:scale-110 shrink-0
                      ${instance.status === 'connected'
                        ? 'bg-emerald-500/20 border-emerald-500/20 shadow-emerald-500/10'
                        : 'bg-zinc-800/50 border-white/5 shadow-black/20'}`}>
                      {instance.status === 'connected' ? (
                        <SignalIcon className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <SignalSlashIcon className="h-6 w-6 text-zinc-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate tracking-tight mb-1">{instance.instanceName}</p>
                      <div className="flex items-center gap-4">
                        {instance.phoneNumber && (
                          <span className="text-xs font-bold text-zinc-300 tracking-wider font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                            {instance.phoneNumber}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Created <time>{new Date(instance.createdAt).toLocaleDateString()}</time>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                      {cfg.label}
                    </span>

                    {refreshing === instance.id && (
                      <ArrowPathIcon className="h-5 w-5 text-indigo-400 animate-spin" />
                    )}

                    {/* Actions */}
                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(e, instance.id)}
                        className="menu-toggle-btn p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 pointer-events-none" />
                      </button>

                      {openMenuId === instance.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 py-1 backdrop-blur-xl">
                          <button
                            onClick={(e) => handleRefreshStatus(e, instance)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <ArrowPathIcon className="h-4 w-4" /> Refresh Status
                          </button>
                          {instance.status !== 'connected' && (
                            <Link
                              to={`/instances/new?instanceId=${instance.id}&name=${encodeURIComponent(instance.instanceName)}`}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-white/5 transition-colors"
                            >
                              <QrCodeIcon className="h-4 w-4" /> Reconnect
                            </Link>
                          )}
                          <div className="h-px bg-white/5 my-1" />
                          <button
                            onClick={(e) => handleDelete(e, instance)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-white/5 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" /> Delete Instance
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
    </div>
  );
}
