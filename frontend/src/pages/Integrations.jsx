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
  const [authError, setAuthError] = useState(null);

  // Form State
  const [type, setType] = useState('google_oauth');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState(''); // JSON string for old stuff
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Check if we just returned from OAuth successfully
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      alert("Successfully connected Google Account!");
      window.history.replaceState({}, document.title, "/integrations"); // remove query params
    } else if (params.get('error')) {
      setAuthError(params.get('error'));
      window.history.replaceState({}, document.title, "/integrations"); // remove query params
    }
    
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
      if (type === 'google_oauth') {
        // n8n style OAuth Redirect Flow
        const redirectUri = `${window.location.origin}/api/oauth/google/callback`;
        const { data } = await api.post('/integrations/google/auth-url', {
          name,
          clientId,
          clientSecret,
          redirectUri
        });
        
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
        return;
      }

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
      alert('Failed to create integration: ' + (error.response?.data?.error || error.message));
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
      case 'google_oauth':
        return { icon: <GlobeAltIcon className="h-6 w-6" />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
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
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm text-zinc-400 font-medium">
              Connect external tools, services, and Google accounts to expand your AI agents' capabilities.
            </p>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <a 
              href="/help/workflows" 
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
            >
              Documentation
            </a>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-5 w-5" />
          Add Integration
        </button>
      </div>

      {authError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
          Error connecting account: {authError}
        </div>
      )}

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
                        : int.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${int.status === 'active' ? 'bg-emerald-400 animate-pulse' : int.status === 'pending' ? 'bg-yellow-500' : 'bg-red-400'}`} />
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-start pt-16 p-4 z-50 overflow-y-auto w-full h-full animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/10 rounded-xl max-w-2xl w-full shadow-2xl mb-16">

            {/* Modal Header */}
            <div className={`p-6 border-b border-white/5 relative overflow-hidden flex justify-between items-center bg-[#18181A]`}>
              <div className="relative flex items-center gap-4 z-10 w-full">
                 {getIntegrationConfig(type).icon}
                 <h2 className="text-lg font-semibold text-white truncate w-full pr-10">
                   {type === 'google_oauth' ? 'Google API Custom OAuth App' : 'Add Connection'}
                 </h2>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="space-y-1.5 flex justify-between items-center p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex gap-2 items-center">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                   <label className="text-sm font-bold text-indigo-400">Connection Method</label>
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-black border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="google_oauth" className="bg-zinc-900">Sign in with Google (OAuth 2.0)</option>
                  <option value="google_sheets" className="bg-zinc-900">Google Sheets (Service Account JSON)</option>
                  <option value="webhook" className="bg-zinc-900">Webhook (Generic)</option>
                </select>
              </div>

              {type === 'google_oauth' ? (
                <>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-2">Need help filling out these fields?</p>
                    <p className="text-xs text-yellow-200 leading-relaxed">
                      Make sure you have enabled the <strong>Google Calendar API</strong> and <strong>Google Drive API</strong> in your Google Cloud Console before clicking "Sign in with Google".
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">OAuth Redirect URL (Copy this)</label>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/oauth/google/callback`}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-zinc-300 select-all"
                    />
                    <p className="text-[10px] text-zinc-500">In Google Cloud Console, use the URL above when prompted to enter an Authorized redirect URI.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Connection Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Marketing Team Google Account"
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Client ID <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Your Google Auth Client ID"
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Client Secret <span className="text-red-400">*</span></label>
                    <input
                      type="password"
                      required
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                    />
                  </div>

                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Connection Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Accounts Sheet"
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Credentials (JSON)</label>
                    <textarea
                      required
                      rows={6}
                      value={credentials}
                      onChange={(e) => setCredentials(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500 placeholder:text-zinc-700"
                      placeholder={'{\n  "client_email": "...",\n  "private_key": "..."\n}'}
                    />
                  </div>
                </>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg flex justify-center items-center gap-2"
                >
                  {type === 'google_oauth' ? (
                    <>
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1">
                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-full h-full object-contain" />
                      </div>
                      Sign in with Google
                    </>
                  ) : (
                    'Save Connection'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
