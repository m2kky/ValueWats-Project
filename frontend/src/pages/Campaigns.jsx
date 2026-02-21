import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
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
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const CampaignStatus = ({ status }) => {
  const styles = {
    PROCESSING: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    FAILED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    PAUSED: 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    SCHEDULED: 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles[status] || styles.PENDING}`}>
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
    <div className="font-sans">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-white sm:text-3xl sm:truncate tracking-tight uppercase italic">
            Campaigns
          </h2>
          <p className="mt-1 text-sm text-zinc-400 font-medium tracking-wide">
            Create and manage your bulk messaging campaigns.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/campaigns/new"
            className="btn-premium flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5 border-2 border-white/20 rounded-full p-0.5" aria-hidden="true" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Campaign List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <MegaphoneIcon className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="mt-2 text-sm font-black text-white uppercase tracking-widest italic">No campaigns yet</h3>
            <p className="mt-2 mb-8 text-sm text-zinc-400 max-w-sm mx-auto">Get started by creating a new campaign to reach your audience effectively.</p>
            <Link
              to="/campaigns/new"
              className="btn-glass inline-flex items-center"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Campaign
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="group relative">
                <Link to={`/campaigns/${campaign.id}`} className="block hover:bg-white/[0.02] transition-colors rounded-xl m-2">
                  <div className="px-5 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0 pr-4">
                        <div className="bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 p-3 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                          <MegaphoneIcon className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-white truncate tracking-tight">{campaign.name}</p>
                          <p className="flex items-center text-sm text-zinc-400 mt-1">
                            <span className="truncate">{campaign.messageTemplate?.substring(0, 60)}{campaign.messageTemplate?.length > 60 ? '...' : ''}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <CampaignStatus status={campaign.status} />

                        {/* Actions Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => toggleMenu(e, campaign.id)}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>

                          {openMenuId === campaign.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 py-1 backdrop-blur-xl">
                              {campaign.status === 'PROCESSING' && (
                                <button
                                  onClick={(e) => handleAction(e, campaign.id, 'pause')}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-white/5 transition-colors"
                                >
                                  <PauseIcon className="h-4 w-4" /> Pause Campaign
                                </button>
                              )}
                              {campaign.status === 'PAUSED' && (
                                <button
                                  onClick={(e) => handleAction(e, campaign.id, 'resume')}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-white/5 transition-colors"
                                >
                                  <PlayIcon className="h-4 w-4" /> Resume Campaign
                                </button>
                              )}
                              {(campaign.status === 'PROCESSING' || campaign.status === 'PAUSED' || campaign.status === 'SCHEDULED') && (
                                <button
                                  onClick={(e) => handleAction(e, campaign.id, 'stop', 'Stop this campaign and cancel pending messages?')}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-white/5 transition-colors"
                                >
                                  <StopIcon className="h-4 w-4" /> Stop Campaign
                                </button>
                              )}
                              <div className="h-px bg-white/5 my-1" />
                              <button
                                onClick={(e) => handleAction(e, campaign.id, 'delete', 'Delete this campaign and all its messages? This cannot be undone.')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-white/5 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" /> Delete Campaign
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:flex sm:justify-between items-center ml-[3.25rem]">
                      <div className="sm:flex sm:gap-6">
                        <p className="flex items-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          <CheckCircleIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-emerald-500" />
                          {campaign._count?.messages || 0} messages
                        </p>
                        {campaign.status === 'SCHEDULED' && campaign.scheduledAt && (
                          <p className="flex items-center text-xs font-bold text-indigo-400 uppercase tracking-widest mt-2 sm:mt-0">
                            <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest sm:mt-0">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>
                          Created <time dateTime={campaign.createdAt}>{new Date(campaign.createdAt).toLocaleDateString()}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
