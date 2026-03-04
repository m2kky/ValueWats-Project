import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

export default function GlobalProgressBar({ socket }) {
  const navigate = useNavigate();
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch active campaigns from backend
  const fetchActiveCampaigns = useCallback(async () => {
    try {
      const response = await api.get('/campaigns/active');
      const campaigns = response.data.campaigns || [];
      setActiveCampaigns(campaigns);
      if (campaigns.length > 0) {
        setIsVisible(true);
      }
    } catch (error) {
      // Silently fail - user might not be logged in
    }
  }, []);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchActiveCampaigns();
    const interval = setInterval(fetchActiveCampaigns, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveCampaigns]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      if (data.type === 'MESSAGE_UPDATE') {
        setIsVisible(true);
        setActiveCampaigns(prev => {
          return prev.map(campaign => {
            if (campaign.id === data.campaignId) {
              return {
                ...campaign,
                sentCount: (campaign.sentCount || 0) + (data.status === 'sent' || data.status === 'delivered' || data.status === 'read' ? 1 : 0),
                failedCount: (campaign.failedCount || 0) + (data.status === 'failed' ? 1 : 0),
              };
            }
            return campaign;
          });
        });
      }
    };

    socket.on('campaign_progress', handleProgress);
    return () => socket.off('campaign_progress', handleProgress);
  }, [socket]);

  if (!isVisible || activeCampaigns.length === 0) return null;

  const totalActive = activeCampaigns.length;

  return (
    <>
      {/* Backdrop overlay when panel is open */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[70] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ width: '400px' }}
      >
        <div className="h-full bg-[#0f0f11]/95 backdrop-blur-2xl border-l border-white/10 shadow-[−30px_0_60px_rgba(0,0,0,0.5)] flex flex-col">
          {/* Panel Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <img
                  src="/valuewats-animated-loader.svg"
                  alt="Processing"
                  className="w-10 h-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                />
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Live Campaigns</h2>
                  <p className="text-xs text-zinc-500 font-medium">{totalActive} campaign{totalActive > 1 ? 's' : ''} broadcasting</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Campaign Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {activeCampaigns.map(campaign => {
              const processed = (campaign.sentCount || 0) + (campaign.failedCount || 0);
              const total = campaign.totalContacts || 1;
              const percent = Math.min(Math.round((processed / total) * 100), 100);

              return (
                <div
                  key={campaign.id}
                  className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/20 rounded-2xl p-4 cursor-pointer transition-all duration-300"
                  onClick={() => {
                    navigate(`/campaigns/${campaign.id}`);
                    setIsExpanded(false);
                  }}
                >
                  {/* Campaign Name + Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <img
                          src="/valuewats-broadcast.svg"
                          alt=""
                          className="w-5 h-5 rounded"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{campaign.name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                          {campaign.status === 'PROCESSING' ? '● SENDING' : campaign.status}
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-indigo-400 tabular-nums">{percent}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative"
                      style={{ width: `${percent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-zinc-400">{campaign.sentCount || 0} sent</span>
                      </div>
                      {(campaign.failedCount || 0) > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="text-xs font-bold text-rose-400">{campaign.failedCount} failed</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">{processed}/{total}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => {
                navigate('/campaigns');
                setIsExpanded(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-bold text-zinc-300 hover:text-white transition-all"
            >
              View All Campaigns
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Tab (always visible on right edge) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed z-[65] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'right-[400px]' : 'right-0'
          }`}
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white pl-3 pr-2 py-3 rounded-l-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition-all group">
          <div className="relative">
            <img
              src="/valuewats-animated-loader.svg"
              alt=""
              className="w-6 h-6 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
            />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black shadow-lg">
              {totalActive}
            </span>
          </div>
          {isExpanded ? (
            <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          )}
        </div>
      </button>

      {/* Shimmer keyframe (injected once) */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}
