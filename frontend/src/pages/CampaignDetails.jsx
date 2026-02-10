import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import io from 'socket.io-client';
import { 
  ArrowLeftIcon, 
  MegaphoneIcon, 
  ClockIcon, 
  PauseIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const CampaignStatus = ({ status }) => {
  const styles = {
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAUSED: 'bg-orange-100 text-orange-800',
    DRAFT: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
};

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    pending: 0
  });

  const socketRef = useRef();

  const fetchCampaignDetails = useCallback(async () => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      setCampaign(response.data);
      
      // Use stats from the API response
      const apiStats = response.data.stats || {};
      setStats({
          total: response.data.totalContacts || 0,
          sent: apiStats.sent || response.data.sentCount || 0,
          delivered: apiStats.delivered || 0,
          read: apiStats.read || 0,
          failed: apiStats.failed || response.data.failedCount || 0,
          pending: apiStats.pending || 0
      });

    } catch (error) {
      console.error('Failed to fetch campaign details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetails();

    // Initialize Socket.io
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const baseUrl = socketUrl.replace('/api', '');
    
    socketRef.current = io(baseUrl);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      socketRef.current.emit('join_campaign', id);
    });

    socketRef.current.on('campaign_progress', (data) => {
      console.log('Campaign progress update:', data);
      
      if (data.type === 'MESSAGE_UPDATE') {
         setStats(prev => {
            const newStats = { ...prev };
            return newStats;
         });
         fetchCampaignDetails();
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [id, fetchCampaignDetails]);

  // Campaign Actions
  const handleAction = async (action, confirmMsg) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      if (action === 'delete') {
        await api.delete(`/campaigns/${id}`);
        navigate('/campaigns');
        return;
      }
      await api.post(`/campaigns/${id}/${action}`);
      fetchCampaignDetails();
    } catch (error) {
      alert(error.response?.data?.error || `Failed to ${action} campaign`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Campaign not found</p>
        <Link to="/campaigns" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Campaigns
        </Link>
      </div>
    );
  }

  // Calculate percentages
  const sentPercent = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;
  const failedPercent = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/campaigns" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Campaigns
          </Link>
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
                {campaign.name}
                <CampaignStatus status={campaign.status} />
              </h2>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <MegaphoneIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {campaign.instance?.instanceName || 'Unknown Instance'}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

             {/* Action Buttons */}
             <div className="mt-4 flex gap-2 md:mt-0 md:ml-4 flex-wrap">
               {campaign.status === 'PROCESSING' && (
                 <button
                   onClick={() => handleAction('pause')}
                   disabled={actionLoading}
                   className="inline-flex items-center px-3 py-2 border border-orange-300 text-sm font-medium rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50 gap-1.5"
                 >
                   <PauseIcon className="h-4 w-4" />
                   Pause
                 </button>
               )}
               {campaign.status === 'PAUSED' && (
                 <button
                   onClick={() => handleAction('resume')}
                   disabled={actionLoading}
                   className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50 gap-1.5"
                 >
                   <PlayIcon className="h-4 w-4" />
                   Resume
                 </button>
               )}
               {(campaign.status === 'PROCESSING' || campaign.status === 'PAUSED') && (
                 <button
                   onClick={() => handleAction('stop', 'This will stop the campaign and cancel all pending messages. Continue?')}
                   disabled={actionLoading}
                   className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 gap-1.5"
                 >
                   <StopIcon className="h-4 w-4" />
                   Stop
                 </button>
               )}
               <button
                 onClick={() => handleAction('delete', 'Are you sure you want to DELETE this campaign and ALL its messages? This cannot be undone.')}
                 disabled={actionLoading}
                 className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 gap-1.5"
               >
                 <TrashIcon className="h-4 w-4" />
                 Delete
               </button>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Contacts</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Sent</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.sent}</dd>
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-2">
                    <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${sentPercent}%` }}></div>
                </div>
              </div>
            </div>

             <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.failed}</dd>
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-2">
                    <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${failedPercent}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                 <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                 <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pending}</dd>
              </div>
            </div>
        </div>
        
        {/* Message Content Preview */}
        <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Message Content</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-100 italic">
                        {campaign.messageTemplate}
                    </p>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}
