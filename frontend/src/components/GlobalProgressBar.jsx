import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
  XMarkIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  MegaphoneIcon 
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
        // Update the specific campaign's progress
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
    <div className="fixed bottom-4 right-4 z-50" style={{ maxWidth: '380px' }}>
      {/* Expanded List */}
      {isExpanded && (
        <div className="bg-white border border-gray-200 shadow-2xl rounded-xl mb-2 overflow-hidden animate-in">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Active Campaigns ({totalActive})</h3>
            <button onClick={() => setIsVisible(false)} className="text-white/70 hover:text-white">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {activeCampaigns.map(campaign => {
              const processed = (campaign.sentCount || 0) + (campaign.failedCount || 0);
              const total = campaign.totalContacts || 1;
              const percent = Math.min(Math.round((processed / total) * 100), 100);

              return (
                <div 
                  key={campaign.id} 
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                      {campaign.name}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-700" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{processed} / {total}</span>
                    {campaign.failedCount > 0 && (
                      <span className="text-red-500">{campaign.failedCount} failed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsed Badge / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <MegaphoneIcon className="h-5 w-5" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
              {totalActive}
            </span>
          </div>
          <span className="text-sm font-medium">
            {totalActive} campaign{totalActive > 1 ? 's' : ''} running
          </span>
        </div>
        {isExpanded ? (
          <ChevronDownIcon className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
        ) : (
          <ChevronUpIcon className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
        )}
      </button>
    </div>
  );
}
