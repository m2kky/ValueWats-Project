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
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAUSED: 'bg-orange-100 text-orange-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
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
      setCampaigns(response.data.campaigns);
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Campaigns
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your bulk messaging campaigns.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/campaigns/new"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Campaign
            </Link>
          </div>
        </div>

        {/* Campaign List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
              <div className="mt-6">
                <Link
                  to="/campaigns/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Campaign
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <Link to={`/campaigns/${campaign.id}`} className="block hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="bg-blue-100 p-2 rounded-lg">
                             <MegaphoneIcon className="h-5 w-5 text-blue-600" />
                           </div>
                           <div>
                              <p className="text-sm font-medium text-blue-600 truncate">{campaign.name}</p>
                              <p className="flex items-center text-sm text-gray-500 mt-0.5">
                                <span className="truncate">{campaign.messageTemplate?.substring(0, 50)}...</span>
                              </p>
                           </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                          <CampaignStatus status={campaign.status} />

                          {/* Actions Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => toggleMenu(e, campaign.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </button>

                            {openMenuId === campaign.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                                {campaign.status === 'PROCESSING' && (
                                  <button
                                    onClick={(e) => handleAction(e, campaign.id, 'pause')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors"
                                  >
                                    <PauseIcon className="h-4 w-4" /> Pause
                                  </button>
                                )}
                                {campaign.status === 'PAUSED' && (
                                  <button
                                    onClick={(e) => handleAction(e, campaign.id, 'resume')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
                                  >
                                    <PlayIcon className="h-4 w-4" /> Resume
                                  </button>
                                )}
                                {(campaign.status === 'PROCESSING' || campaign.status === 'PAUSED' || campaign.status === 'SCHEDULED') && (
                                  <button
                                    onClick={(e) => handleAction(e, campaign.id, 'stop', 'Stop this campaign and cancel pending messages?')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                  >
                                    <StopIcon className="h-4 w-4" /> Stop
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleAction(e, campaign.id, 'delete', 'Delete this campaign and all its messages? This cannot be undone.')}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:gap-6">
                          <p className="flex items-center text-sm text-gray-500">
                            <CheckCircleIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-green-400" />
                            {campaign._count?.messages || 0} messages
                          </p>
                          {campaign.status === 'SCHEDULED' && campaign.scheduledAt && (
                            <p className="flex items-center text-sm text-indigo-600 font-medium">
                              <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-indigo-500" />
                              Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                            </p>
                          )}
                         </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>
                            Created on <time dateTime={campaign.createdAt}>{new Date(campaign.createdAt).toLocaleDateString()}</time>
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
      </main>
    </div>
  );
}
