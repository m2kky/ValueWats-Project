import { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CircleStackIcon,
  GlobeAltIcon,
  DocumentIcon,
  CalendarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import api from '../api/client';

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [type, setType] = useState('google_sheets');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState(''); // JSON string

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data } = await api.get('/integrations');
      setIntegrations(data.integrations);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/integrations', {
        type,
        name,
        credentials
      });
      setShowModal(false);
      setName('');
      setCredentials('');
      fetchIntegrations();
    } catch (error) {
      alert('Failed to create integration: ' + error.response?.data?.error || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This might break active workflows.')) return;
    try {
      await api.delete(`/integrations/${id}`);
      fetchIntegrations();
    } catch (error) {
      console.error(error);
    }
  };

  const getIntegrationConfig = (type) => {
    switch (type) {
      case 'google_sheets':
        return { icon: <CircleStackIcon className="h-6 w-6" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      case 'google_drive':
        return { icon: <DocumentIcon className="h-6 w-6" />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
      case 'google_calendar':
        return { icon: <CalendarIcon className="h-6 w-6" />, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' };
      case 'gmail':
        return { icon: <EnvelopeIcon className="h-6 w-6" />, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' };
      case 'webhook':
        return { icon: <GlobeAltIcon className="h-6 w-6" />, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/20' };
      default:
        return { icon: <CircleStackIcon className="h-6 w-6" />, color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' };
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <GlobeAltIcon className="w-8 h-8 text-indigo-400" />
            Integrations
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-medium max-w-lg">
            Connect external tools, services, and Google accounts to expand your AI agents' capabilities.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-5 w-5" />
          Add Integration
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map(int => {
            const config = getIntegrationConfig(int.type);
            return (
              <div
                key={int.id}
                className="glass-card p-6 border border-white/5 rounded-2xl hover:border-white/20 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Decorative background gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${config.bg} blur-3xl rounded-full opacity-50 -mr-10 -mt-10 transition-opacity group-hover:opacity-100`} />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-5">
                    <div className={`p-3 rounded-xl border ${config.border} ${config.bg} ${config.color}`}>
                      {config.icon}
                    </div>
                    <button
                      onClick={() => handleDelete(int.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete Integration"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{int.name}</h3>

                  <div className="flex items-center gap-3 text-xs font-semibold mb-6">
                    <span className="text-zinc-400 uppercase tracking-wider">
                      {int.type.replace('_', ' ')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${int.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${int.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      {int.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-600 font-mono bg-black/40 px-3 py-2 rounded-lg truncate border border-white/5 group-hover:border-white/10 transition-colors">
                    ID: {int.id}
                  </div>
                </div>
              </div>
            );
          })}

          {integrations.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 glass-card border border-white/5 border-dashed rounded-3xl">
              <CircleStackIcon className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-lg font-bold text-zinc-300 mb-2">No integrations yet</h3>
              <p className="text-zinc-500 text-sm max-w-sm text-center mb-6">
                Connect your first integration to allow AI agents to interact with Google Drive, Calendar, or external Webhooks.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Add Integration
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modern Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">

            {/* Modal Header */}
            <div className={`p-6 border-b border-white/5 relative overflow-hidden`}>
              {/* Dynamic Header Background based on selected type */}
              <div className={`absolute inset-0 ${getIntegrationConfig(type).bg} opacity-20`} />

              <div className="relative flex items-center gap-4">
                <div className={`p-3 rounded-xl border ${getIntegrationConfig(type).border} ${getIntegrationConfig(type).bg} ${getIntegrationConfig(type).color}`}>
                  {getIntegrationConfig(type).icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Connect Service</h2>
                  <p className="text-xs font-semibold text-zinc-400 mt-1 uppercase tracking-wider">
                    Add new API credentials
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Service Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="google_sheets" className="bg-zinc-900">Google Sheets (Service Account)</option>
                  <option value="google_drive" className="bg-zinc-900">Google Drive (Service Account)</option>
                  <option value="google_calendar" className="bg-zinc-900">Google Calendar (Service Account)</option>
                  <option value="gmail" className="bg-zinc-900">Gmail (App Password)</option>
                  <option value="webhook" className="bg-zinc-900">Webhook (Generic)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Connection Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Marketing Team Drive"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Credentials (JSON)</label>
                  <span className="text-[10px] text-zinc-500 font-medium">Encrypted at rest</span>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-2 flex gap-2">
                  <ExclamationCircleIcon className="w-5 h-5 text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    {type === 'gmail'
                      ? 'Paste JSON containing your email and App Password. E.g., {"email": "...", "appPassword": "..."}'
                      : type.startsWith('google_')
                        ? 'Paste the full Service Account JSON key file contents here. Ensure the Service Account has access to the required APIs.'
                        : 'Paste headers or auth token JSON here to be sent with webhook requests.'}
                  </p>
                </div>

                <textarea
                  required
                  rows={6}
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-zinc-700"
                  placeholder={type === 'gmail' ? '{\n  "email": "you@gmail.com",\n  "appPassword": "xxxx xxxx xxxx xxxx"\n}' : '{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  ...\n}'}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
