import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  MinusIcon, 
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

export default function GlobalProgressBar({ socket }) {
  const [activeCampaigns, setActiveCampaigns] = useState({}); // { id: { name, total, processed, status } }
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      // console.log('Global progress:', data);
      
      if (data.type === 'MESSAGE_UPDATE') {
        setIsVisible(true);
        setActiveCampaigns(prev => {
          const newState = { ...prev };
          const campaign = newState[data.campaignId] || {
            name: data.campaignName || 'Unknown Campaign',
            total: data.totalContacts || 0,
            processed: 0,
            lastStatus: null
          };

          // Crude approximation of progress since we only get individual updates
          // Ideally we'd get "processed count" from backend
          // We'll just increment processed count here, capped at total
          
          if (!newState[data.campaignId]) {
              // First time seeing this campaign in this session
              // We might want to fetch current stats? 
              // For now, let's start processed at 1 (this update)
              campaign.processed = 1;
          } else {
              campaign.processed = Math.min(campaign.processed + 1, campaign.total);
          }
          
          campaign.lastStatus = data.status;
          newState[data.campaignId] = campaign;
          return newState;
        });
      }
    };

    socket.on('campaign_progress', handleProgress);

    return () => {
      socket.off('campaign_progress', handleProgress);
    };
  }, [socket]);

  if (!isVisible || Object.keys(activeCampaigns).length === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden transition-all duration-300 z-50 ${isMinimized ? 'w-64' : 'w-80 sm:w-96'}`}>
      {/* Header */}
      <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-white">
        <h3 className="text-sm font-medium flex items-center gap-2">
          {isMinimized ? 'Active Campaigns' : `Active Tasks (${Object.keys(activeCampaigns).length})`}
          {Object.keys(activeCampaigns).length > 0 && (
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
             </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-blue-700 rounded">
            {isMinimized ? <ArrowsPointingOutIcon className="h-4 w-4" /> : <MinusIcon className="h-4 w-4" />}
          </button>
          <button onClick={() => setIsVisible(false)} className="p-1 hover:bg-blue-700 rounded">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="p-4 max-h-64 overflow-y-auto space-y-4">
          {Object.entries(activeCampaigns).map(([id, campaign]) => {
             const percent = campaign.total > 0 ? (campaign.processed / campaign.total) * 100 : 0;
             return (
               <div key={id}>
                 <div className="flex justify-between items-end mb-1">
                   <span className="text-sm font-medium text-gray-700 truncate max-w-[70%]">{campaign.name}</span>
                   <span className="text-xs text-gray-500">{Math.round(percent)}%</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                   <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                   ></div>
                 </div>
                 <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{campaign.processed} / {campaign.total}</span>
                    <span className="capitalize text-blue-600">{campaign.lastStatus?.toLowerCase()}</span>
                 </div>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
