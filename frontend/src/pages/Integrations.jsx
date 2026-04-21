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
  EnvelopeIcon,
  ServerStackIcon
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
      alert("Successfully connected Account!");
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
      case 'webhook':
        return { icon: <ServerStackIcon className="h-6 w-6" />, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/20' };
      default:
        return { icon: <CircleStackIcon className="h-6 w-6" />, color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' };
    }
  };

  const openSetupModal = (selectedType) => {
    setType(selectedType);
    setShowModal(true);
  };

  const AVAILABLE_TOOLS = [
    {
      id: 'google_oauth',
      name: 'Google Workspace',
      desc: 'Connect Drive & Calendar. AI can search files, upload records, and schedule Google meetings autonomously.',
      icon: (
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 
1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.44 2.79-1.35 
3.84-1.31 1.63-3.6 2.31-5.59 1.71-2.1-.64-3.51-2.61-3.48-4.79.03-2.02 1.34-3.87 3.23-4.59.39-.15.8-.23 
1.21-.28v4.04c-.4.07-.79.22-1.12.45-.61.43-.83 1.25-.56 1.94.31.74 1.18 1.1 1.93.84.58-.2 1-.78 
1.02-1.4.02-4.14.01-8.28.02-12.42z"/>
        </svg>
      ),
      color: 'bg-blue-600'
    },
    {
      id: 'google_sheets',
      name: 'Google Sheets',
      desc: 'Connect via Service Account JSON. Allow AI agents or workflows to securely append rows and log data.',
      icon: (
        <svg className="w-12 h-12 text-emerald-100" viewBox="0 0 24 24" fill="currentColor">
           <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.
164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.
606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242
-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 
2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 
1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 
01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 
2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 
11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.119.554 4.188 1.607 6.04L0 24l6.117-1.605A11.793 11.793 0 0012.046 
24c6.638 0 12.032-5.393 12.035-12.03a11.77 11.77 0 00-3.536-8.508z"/>
        </svg>
      ),
      color: 'bg-emerald-600'
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      desc: 'Set up advanced generic endpoints. Perfect for triggering Zapier, Make, or any internal system.',
      icon: <ServerStackIcon className="w-12 h-12 text-white" />,
      color: 'bg-fuchsia-600'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <GlobeAltIcon className="w-8 h-8 text-indigo-400" />
            Integrations Center
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm text-zinc-400 font-medium">
              Connect external tools to expand your AI Agents capabilities and automate entire workflows.
            </p>
          </div>
        </div>
        <a 
          href="/help/integrations/google" 
          target="_blank"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all"
        >
          Documentation
        </a>
      </div>

      {authError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
          Error connecting account: {authError}
        </div>
      )}

      {/* ACTIVE INTEGRATIONS */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        integrations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Your Active Connections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map(int => {
                const config = getIntegrationConfig(int.type);
                return (
                  <div
                    key={int.id}
                    className="glass-card p-6 border border-white/5 rounded-2xl hover:border-white/20 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
                  >
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
            </div>
          </div>
        )
      )}

      {/* AVAILABLE TOOLS SECTION (Takes up empty state gracefully) */}
      {!loading && (
         <div className="space-y-6 pt-4">
           {integrations.length === 0 ? (
             <div className="text-center py-6">
                <h3 className="text-2xl font-black text-white mb-2">Build Your Capabilities</h3>
                <p className="text-zinc-400">Connect a supported tool to let AI access live data and orchestrate processes.</p>
             </div>
           ) : (
             <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 border-t border-white/5 pt-12">Connect More Tools</h2>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {AVAILABLE_TOOLS.map(tool => (
                <div 
                  key={tool.id} 
                  onClick={() => openSetupModal(tool.id)}
                  className="bg-[#111113] border border-white/5 rounded-3xl p-6 cursor-pointer hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden"
                >
                   {/* Cool Gradient on Hover */}
                   <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   <div className={`w-20 h-20 rounded-2xl ${tool.color} flex items-center justify-center shadow-lg shadow-black/50 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                     {tool.icon}
                   </div>
                   <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{tool.name}</h3>
                   <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                     {tool.desc}
                   </p>

                   <div className="mt-8 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                     Setup Connection &rarr;
                   </div>
                </div>
             ))}
           </div>
         </div>
      )}

      {/* Connection Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-start pt-16 p-4 z-50 overflow-y-auto w-full h-full animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/10 rounded-xl max-w-2xl w-full shadow-2xl mb-16 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className={`p-6 border-b border-white/5 flex justify-between items-center bg-[#18181A]`}>
              <div className="flex items-center gap-4 z-10 w-full">
                 {getIntegrationConfig(type).icon}
                 <h2 className="text-lg font-semibold text-white truncate w-full pr-10">
                   {type === 'google_oauth' ? 'Connect Google Account' : 'Add Connection'}
                 </h2>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              
              {type === 'google_oauth' ? (
                <>
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">About this integration</p>
                    <p className="text-sm text-indigo-200/80 leading-relaxed">
                      By securely connecting your own Google Custom OAuth application, your agents gain immediate access to <strong>Google Drive</strong> (File search & text uploads) and <strong>Google Calendar</strong> (creating and reading appointments).
                    </p>
                    <p className="text-xs font-bold text-zinc-400 uppercase">
                      Need help? <a href="/help/integrations/google" target="_blank" className="text-indigo-400 hover:text-white transition-colors underline ml-1">Open Setup Guide</a>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">OAuth Redirect URL (Copy this)</label>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/oauth/google/callback`}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-indigo-300 select-all focus:outline-none"
                    />
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
                      placeholder="e.g., Internal System Sync"
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
                      placeholder={type === 'google_sheets' ? '{\n  "client_email": "...",\n  "private_key": "..."\n}' : '{\n  "Headers": "..."\n}'}
                    />
                  </div>
                </>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-3 transform hover:-translate-y-0.5"
                >
                  {type === 'google_oauth' ? (
                    <>
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1">
                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-full h-full object-contain" />
                      </div>
                      Sign in with Google
                    </>
                  ) : (
                    'Connect Integration'
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
