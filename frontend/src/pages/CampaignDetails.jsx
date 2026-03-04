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
    PROCESSING: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
    FAILED: 'bg-rose-500/20 text-rose-400 border border-rose-500/20',
    PENDING: 'bg-amber-500/20 text-amber-400 border border-amber-500/20',
    PAUSED: 'bg-orange-500/20 text-orange-400 border border-orange-500/20',
    STOPPED: 'bg-red-500/20 text-red-400 border border-red-500/20',
    DRAFT: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/20'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles[status] || styles.PENDING}`}>
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
    <div className="min-h-screen font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/campaigns" className="text-sm text-zinc-400 hover:text-white mb-4 inline-flex items-center transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Campaigns
          </Link>
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black leading-7 text-white sm:text-3xl sm:truncate flex items-center gap-3 uppercase italic">
                {campaign.name}
                <CampaignStatus status={campaign.status} />
              </h2>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm font-medium text-zinc-400 tracking-wide">
                  <MegaphoneIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-zinc-500" />
                  {campaign.campaignInstances?.length > 0
                    ? campaign.campaignInstances.map(ci => ci.instance?.instanceName).filter(Boolean).join(', ')
                    : campaign.instance?.instanceName || 'No Instance'}
                </div>
                <div className="mt-2 flex items-center text-sm font-medium text-zinc-400 tracking-wide">
                  <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-zinc-500" />
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
                {campaign.status === 'SCHEDULED' && campaign.scheduledAt && (
                  <div className="mt-2 flex items-center text-sm font-bold text-indigo-400 tracking-wide">
                    <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-indigo-500" />
                    Starts: {new Date(campaign.scheduledAt).toLocaleString()}
                  </div>
                )}
                {campaign.endAt && (
                  <div className="mt-2 flex items-center text-sm font-bold text-rose-400 tracking-wide">
                    <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-rose-500" />
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
                  className="btn-glass inline-flex items-center px-3 py-2 text-sm font-medium gap-1.5 text-orange-400 hover:text-orange-300 disabled:opacity-50"
                >
                  <PauseIcon className="h-4 w-4" />
                  Pause
                </button>
              )}
              {(campaign.status === 'PAUSED' || campaign.status === 'PENDING' || campaign.status === 'SCHEDULED') && (
                <button
                  onClick={openEditModal}
                  disabled={actionLoading}
                  className="btn-glass inline-flex items-center px-3 py-2 text-sm font-medium gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
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
                  className="btn-glass inline-flex items-center px-3 py-2 text-sm font-medium gap-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                >
                  <PlayIcon className="h-4 w-4" />
                  Resume
                </button>
              )}
              {(campaign.status === 'PROCESSING' || campaign.status === 'PAUSED') && (
                <button
                  onClick={() => handleAction('stop', 'This will stop the campaign and cancel all pending messages. Continue?')}
                  disabled={actionLoading}
                  className="btn-glass inline-flex items-center px-3 py-2 text-sm font-medium gap-1.5 text-rose-400 hover:text-rose-300 disabled:opacity-50"
                >
                  <StopIcon className="h-4 w-4" />
                  Stop
                </button>
              )}
              {/* Export Buttons */}
              {stats.sent > 0 && (
                <button
                  onClick={() => handleExport('SENT')}
                  className="btn-glass inline-flex items-center px-3 py-2 text-sm font-medium gap-1.5 text-emerald-400 hover:text-emerald-300"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export Sent
                </button>
              )}
              {stats.failed > 0 && (
                <button
                  onClick={() => handleExport('FAILED')}
                  className="btn-glass inline-flex items-center px-3 py-2 text-sm font-medium gap-1.5 text-rose-400 hover:text-rose-300"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export Failed
                </button>
              )}
              <button
                onClick={() => handleAction('delete', 'Are you sure you want to DELETE this campaign and ALL its messages? This cannot be undone.')}
                disabled={actionLoading}
                className="btn-glass inline-flex items-center px-3 py-2 text-sm font-medium gap-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-5">
              <dt className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate">Total Contacts</dt>
              <dd className="mt-2 text-3xl font-black text-white">{stats.total}</dd>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-5">
              <dt className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate">Sent</dt>
              <dd className="mt-2 text-3xl font-black text-emerald-400">{stats.sent}</dd>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${sentPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-5">
              <dt className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate">Failed</dt>
              <dd className="mt-2 text-3xl font-black text-rose-400">{stats.failed}</dd>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
                <div className="bg-rose-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${failedPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-5">
              <dt className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate">Pending</dt>
              <dd className="mt-2 text-3xl font-black text-amber-400">{stats.pending}</dd>
            </div>
          </div>

          {/* Removed Click Tracking Stats */}
        </div>

        {/* Message Content Preview */}
        <div className="bg-zinc-900 border border-white/10 sm:rounded-2xl mb-8 overflow-hidden">
          <div className="px-5 py-5 sm:p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Message Content</h3>
            <div className="mt-4 max-w-xl">
              <p className="whitespace-pre-wrap bg-zinc-800 text-zinc-300 p-4 rounded-xl text-sm font-mono leading-relaxed border border-white/5">
                {campaign.messageTemplate}
              </p>
            </div>
          </div>
        </div>

        {/* Failed Messages Panel */}
        {stats.failed > 0 && (
          <div className="bg-zinc-900 border border-white/10 sm:rounded-2xl mb-8 overflow-hidden">
            <div className="px-5 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Failed Messages Analysis</h3>
                <button
                  onClick={fetchFailReasons}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors"
                >
                  {showFailReasons ? 'Hide' : 'Show Reasons'}
                </button>
              </div>
              {showFailReasons && (
                <div className="overflow-x-auto">
                  {failReasons.length === 0 ? (
                    <p className="text-sm text-zinc-500">No fail reason data available.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-white/5 text-sm">
                      <thead>
                        <tr>
                          <th className="py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Number</th>
                          <th className="py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {failReasons.map((msg, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="py-3 font-mono text-zinc-400">{msg.recipientNumber}</td>
                            <td className="py-3 text-rose-400 font-medium">{msg.failReason || 'Unknown'}</td>
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
            <div className="fixed inset-0 transition-opacity bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-zinc-900 border border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdate}>
                <div className="px-6 pt-6 pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg font-black text-white uppercase italic tracking-widest" id="modal-title">
                        Edit Campaign Messages
                      </h3>
                      <div className="mt-3 space-y-4">
                        <p className="text-sm text-zinc-400">
                          Updating message templates will <strong className="text-amber-400 font-bold">regenerate all PENDING messages</strong>. Sent messages will not be affected.
                        </p>

                        {editMessages.map((msg, index) => (
                          <div key={index}>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Variant {index + 1}</label>
                            <textarea
                              rows={4}
                              className="input w-full rounded-xl border border-white/10 bg-zinc-800 text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 transition-colors"
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
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest"
                        >
                          + Add Variant
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-premium"
                  >
                    {actionLoading ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn-glass"
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
