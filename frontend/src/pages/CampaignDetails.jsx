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
  CalendarDaysIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

const CampaignStatus = ({ status }) => {
  const styles = {
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAUSED: 'bg-orange-100 text-orange-800',
    STOPPED: 'bg-red-100 text-red-800',
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
  const [failReasons, setFailReasons] = useState([]);
  const [showFailReasons, setShowFailReasons] = useState(false);
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

  const fetchFailReasons = async () => {
    try {
      const response = await api.get(`/campaigns/${id}/messages?status=FAILED&limit=50`);
      setFailReasons(response.data.messages || []);
      setShowFailReasons(true);
    } catch (error) {
      console.error('Failed to fetch fail reasons:', error);
    }
  };

  const handleExport = (status) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');
    window.open(`${baseUrl}/campaigns/${id}/export?status=${status}&token=${token}`, '_blank');
  };

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

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMessages, setEditMessages] = useState(['']);

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

  const openEditModal = () => {
    // Populate with existing templates
    if (campaign.messageTemplates && campaign.messageTemplates.length > 0) {
      setEditMessages(campaign.messageTemplates.map(t => t.content));
    } else {
      setEditMessages([campaign.messageTemplate]);
    }
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/campaigns/${id}`, {
        messages: editMessages
      });
      setShowEditModal(false);
      fetchCampaignDetails();
      alert('Campaign updated successfully. Pending messages have been regenerated.');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update campaign');
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
                  {campaign.campaignInstances?.length > 0
                    ? campaign.campaignInstances.map(ci => ci.instance?.instanceName).filter(Boolean).join(', ')
                    : campaign.instance?.instanceName || 'No Instance'}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
                {campaign.status === 'SCHEDULED' && campaign.scheduledAt && (
                  <div className="mt-2 flex items-center text-sm text-indigo-600 font-medium">
                    <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-indigo-500" />
                    Starts: {new Date(campaign.scheduledAt).toLocaleString()}
                  </div>
                )}
                {campaign.endAt && (
                  <div className="mt-2 flex items-center text-sm text-red-500 font-medium">
                    <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-red-400" />
                    Ends: {new Date(campaign.endAt).toLocaleString()}
                  </div>
                )}
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
              {(campaign.status === 'PAUSED' || campaign.status === 'PENDING' || campaign.status === 'SCHEDULED') && (
                <button
                  onClick={openEditModal}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
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
              {/* Export Buttons */}
              {stats.sent > 0 && (
                <button
                  onClick={() => handleExport('SENT')}
                  className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors gap-1.5"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export Sent
                </button>
              )}
              {stats.failed > 0 && (
                <button
                  onClick={() => handleExport('FAILED')}
                  className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors gap-1.5"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export Failed
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

          {/* Click Tracking Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Clicks</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">{campaign.clicks || 0}</dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">CTR (Click Rate)</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                {stats.sent > 0 ? ((campaign.clicks || 0) / stats.sent * 100).toFixed(1) : 0}%
              </dd>
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

        {/* Failed Messages Panel */}
        {stats.failed > 0 && (
          <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Failed Messages Analysis</h3>
                <button
                  onClick={fetchFailReasons}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  {showFailReasons ? 'Hide' : 'Show Reasons'}
                </button>
              </div>
              {showFailReasons && (
                <div className="overflow-x-auto">
                  {failReasons.length === 0 ? (
                    <p className="text-sm text-gray-500">No fail reason data available.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {failReasons.map((msg, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-mono text-gray-700">{msg.recipientNumber}</td>
                            <td className="px-4 py-2 text-red-600">{msg.failReason || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Edit Campaign Messages
                      </h3>
                      <div className="mt-2 space-y-4">
                        <p className="text-sm text-gray-500">
                          Updating message templates will <strong>regenerate all PENDING messages</strong>. Sent messages will not be affected.
                        </p>

                        {editMessages.map((msg, index) => (
                          <div key={index}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Variant {index + 1}</label>
                            <textarea
                              rows={4}
                              className="input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              value={msg}
                              onChange={(e) => {
                                const newMsgs = [...editMessages];
                                newMsgs[index] = e.target.value;
                                setEditMessages(newMsgs);
                              }}
                              required
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEditMessages([...editMessages, ''])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Add Variant
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
