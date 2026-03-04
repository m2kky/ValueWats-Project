import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ValueWatsLoader from '../components/ValueWatsLoader';
import {
  PlusIcon,
  MegaphoneIcon,
  ClockIcon,
  CheckCircleIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const CampaignStatus = ({ status }) => {
  const styles = {
    PROCESSING: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.2)]',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]',
    FAILED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[inset_0_0_12px_rgba(244,63,94,0.2)]',
    PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[inset_0_0_12px_rgba(245,158,11,0.2)]',
    PAUSED: 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[inset_0_0_12px_rgba(249,115,22,0.2)]',
    SCHEDULED: 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[inset_0_0_12px_rgba(139,92,246,0.2)]'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.PENDING}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse"></span>
      {status}
    </span>
  );
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data.campaigns || response.data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e, campaignId, action, confirmMsg) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmMsg && !confirm(confirmMsg)) return;
    try {
      if (action === 'delete') {
        await api.delete(`/campaigns/${campaignId}`);
      } else {
        await api.post(`/campaigns/${campaignId}/${action}`);
      }
      setOpenMenuId(null);
      fetchCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || `Failed to ${action} campaign`);
    }
  };

  const toggleMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30">

      {/* Top Navigation Bar placeholder could go here if needed, or rely on layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 p-2">
                <img src="/valuewats-broadcast.svg" alt="Broadcast" className="w-full h-full rounded-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Campaigns</h1>
                <p className="text-sm text-zinc-400 font-medium">Broadcast messages and manage scheduled sequences at scale.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/campaigns/new"
              className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white transition-all duration-200 bg-indigo-500 font-pj rounded-xl hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-95"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Campaign
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#131315]/80 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">

          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <ValueWatsLoader size={72} text="Loading Campaigns..." />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-6 text-center z-10 relative">
              <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5">
                <MegaphoneIcon className="w-10 h-10 text-zinc-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">No campaigns yet</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                Connect with your audience by creating your first bulk messaging campaign. You can schedule it or send it immediately.
              </p>
              <Link
                to="/campaigns/new"
                className="btn-glass inline-flex items-center px-6 py-3 text-sm font-bold text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Start Your First Campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th scope="col" className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest w-2/5">Campaign Details</th>
                    <th scope="col" className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest w-1/5">Status</th>
                    <th scope="col" className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest w-1/5">Metrics</th>
                    <th scope="col" className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Timing</th>
                    <th scope="col" className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => window.location.href = `/campaigns/${campaign.id}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-colors">
                            <MegaphoneIcon className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{campaign.name}</p>
                            <p className="text-xs text-zinc-500 mt-1 truncate max-w-[250px] sm:max-w-xs">
                              {campaign.messageTemplate || 'No message content'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <CampaignStatus status={campaign.status} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold text-white">{campaign._count?.messages || 0}</span>
                          <span className="text-xs text-zinc-500 font-medium tracking-wide">Msgs</span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {campaign.status === 'SCHEDULED' && campaign.scheduledAt ? (
                            <div className="flex items-center gap-2 text-indigo-400">
                              <CalendarDaysIcon className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">{new Date(campaign.scheduledAt).toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-zinc-400">
                              <ClockIcon className="w-4 h-4" />
                              <span className="text-xs font-bold">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleMenu(e, campaign.id)}
                          className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all inline-flex items-center justify-center"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>

                        {openMenuId === campaign.id && (
                          <div className="absolute right-10 top-5 w-48 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden transform origin-top-right transition-all">
                            {campaign.status === 'PROCESSING' && (
                              <button
                                onClick={(e) => handleAction(e, campaign.id, 'pause')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-orange-400 hover:bg-white/5 transition-colors"
                              >
                                <PauseIcon className="w-4 h-4" /> Pause Campaign
                              </button>
                            )}
                            {campaign.status === 'PAUSED' && (
                              <button
                                onClick={(e) => handleAction(e, campaign.id, 'resume')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-white/5 transition-colors"
                              >
                                <PlayIcon className="w-4 h-4" /> Resume Campaign
                              </button>
                            )}
                            {(campaign.status === 'PROCESSING' || campaign.status === 'PAUSED' || campaign.status === 'SCHEDULED') && (
                              <button
                                onClick={(e) => handleAction(e, campaign.id, 'stop', 'Stop this campaign and cancel pending messages?')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-white/5 transition-colors"
                              >
                                <StopIcon className="w-4 h-4" /> Stop Campaign
                              </button>
                            )}
                            {/* Simple divider */}
                            <div className="h-px bg-white/5 my-1 mx-4" />
                            <Link
                              to={`/campaigns/${campaign.id}`}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-white/5 transition-colors"
                            >
                              <CheckCircleIcon className="w-4 h-4" /> View Details
                            </Link>
                            <button
                              onClick={(e) => handleAction(e, campaign.id, 'delete', 'Delete this campaign and all its messages? This cannot be undone.')}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-white/5 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" /> Delete Campaign
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
