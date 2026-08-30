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
  TableCellsIcon,
  ServerStackIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../api/client';

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [sallaSetup, setSallaSetup] = useState(null);
  const [showSallaPublic, setShowSallaPublic] = useState(false);
  const [sallaStoreName, setSallaStoreName] = useState('');
  const [sallaStoreUrl, setSallaStoreUrl] = useState('');
  const [sallaStoreIdentifier, setSallaStoreIdentifier] = useState('');

  // Form State
  const [type, setType] = useState('google_calendar_oauth');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState(''); // JSON string for old stuff
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Check if we just returned from OAuth successfully
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setNotice({ type: 'success', message: 'Successfully connected account.' });
      window.history.replaceState({}, document.title, "/settings/integrations"); // remove query params
    } else if (params.get('error')) {
      setAuthError(params.get('error'));
      window.history.replaceState({}, document.title, "/settings/integrations"); // remove query params
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
      if (type.includes('_oauth')) {
        const redirectUri = `${window.location.origin}/api/oauth/google/callback`;
        const { data } = await api.post('/integrations/google/auth-url', {
          name,
          clientId,
          clientSecret,
          redirectUri,
          type
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

  const sallaError = (error) => error.response?.data?.error || error.message;

  const consumeSallaConnection = (data) => {
    if (data?.authUrl) {
      window.location.href = data.authUrl;
      return true;
    }
    if (data?.mode === 'easy' && data.pairingCode && data.installUrl) {
      setSallaSetup(data);
      return true;
    }
    return false;
  };

  const startSallaAuth = async () => {
    try {
      const { data } = await api.post('/integrations/salla/auth-url');
      consumeSallaConnection(data);
    } catch (error) {
      setNotice({ type: 'error', message: sallaError(error) === 'SALLA_NOT_CONFIGURED'
        ? 'Salla App keys are not configured.'
        : `Failed to connect Salla: ${sallaError(error)}` });
    }
  };

  const connectSallaPublic = async (event) => {
    event.preventDefault();
    try {
      await api.post('/integrations/salla/public', {
        name: sallaStoreName,
        storeUrl: sallaStoreUrl,
        ...(sallaStoreIdentifier.trim() && { storeIdentifier: sallaStoreIdentifier.trim() })
      });
      setShowSallaPublic(false);
      setSallaStoreName('');
      setSallaStoreUrl('');
      setSallaStoreIdentifier('');
      setNotice({ type: 'success', message: 'Salla public catalog connected. Initial sync started.' });
      fetchIntegrations();
    } catch (error) {
      setNotice({ type: 'error', message: `Failed to connect Salla catalog: ${sallaError(error)}` });
    }
  };

  const handleSallaAction = async (action, id) => {
    try {
      const { data } = await api[action === 'delete' ? 'delete' : 'post'](`/integrations/salla/${id}${action === 'delete' ? '' : `/${action}`}`);
      if (consumeSallaConnection(data)) return;
      setNotice({ type: 'success', message: action === 'sync' ? 'Salla sync started.' : 'Salla integration deleted.' });
      fetchIntegrations();
    } catch (error) {
      const code = sallaError(error);
      setNotice({ type: 'error', message: code === 'SALLA_NOT_CONFIGURED'
        ? 'Salla App keys are not configured.'
        : `Salla ${action} failed: ${code}` });
    }
  };

  const getIntegrationConfig = (type) => {
    switch (type) {
      case 'notion_oauth':
        return { icon: <img src="/assets/google-icons/notion.svg" alt="Notion" className="w-5 h-5 invert object-contain" />, color: 'text-zinc-100', bg: 'bg-zinc-100/10', border: 'border-white/20' };
      case 'google_calendar_oauth':
        return { icon: <CalendarIcon className="h-6 w-6" />, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' };
      case 'google_drive_oauth':
        return { icon: <DocumentIcon className="h-6 w-6" />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
      case 'google_sheets_oauth':
        return { icon: <TableCellsIcon className="h-6 w-6" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      case 'google_oauth': // Generic legacy fallback
        return { icon: <GlobeAltIcon className="h-6 w-6" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'google_sheets':
        return { icon: <TableCellsIcon className="h-6 w-6" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      case 'webhook':
        return { icon: <ServerStackIcon className="h-6 w-6" />, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/20' };
      default:
        return { icon: <CircleStackIcon className="h-6 w-6" />, color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' };
    }
  };

  const openSetupModal = async (selectedType) => {
    // 1-Click Notion Integration
    if (selectedType === 'store_salla') {
      setShowSallaPublic(true);
      return;
    }

    if (selectedType === 'notion_oauth') {
      try {
        const { data } = await api.get('/integrations/notion/auth-url');
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } catch (error) {
        alert('Failed to initialize Notion connection: ' + (error.response?.data?.error || error.message));
      }
      return;
    }

    setType(selectedType);
    setShowModal(true);
  };

  const AVAILABLE_TOOLS = [
    {
      id: 'google_calendar_oauth',
      name: 'Google Calendar',
      desc: 'Connect your personal or team calendar. Allow AI agents to read availability and schedule precise meetings autonomously.',
      icon: <img src="/assets/google-icons/google-calendar.svg" alt="Google Calendar" className="w-10 h-10 object-contain drop-shadow-lg" />,
      color: 'bg-white'
    },
    {
      id: 'google_drive_oauth',
      name: 'Google Drive',
      desc: 'Connect your Google Drive securely. Allow AI to search for documents (like pricing catalogs) and text-upload conversation records.',
      icon: <img src="/assets/google-icons/google-drive.svg" alt="Google Drive" className="w-10 h-10 object-contain drop-shadow-lg" />,
      color: 'bg-white'
    },
    {
      id: 'google_sheets_oauth',
      name: 'Google Sheets',
      desc: 'Connect named spreadsheet ranges as read-only reference sources for AI agents.',
      icon: <img src="/assets/google-icons/google-sheets.svg" alt="Google Sheets" className="w-10 h-10 object-contain drop-shadow-lg" />,
      color: 'bg-white'
    },
    {
      id: 'notion_oauth',
      name: 'Notion',
      desc: 'Connect your Notion workspace. Let AI search your wikis, create pages, or append notes automatically.',
      icon: <img src="/assets/google-icons/notion.svg" alt="Notion" className="w-10 h-10 object-contain drop-shadow-lg invert" />,
      color: 'bg-zinc-800'
    },
    {
      id: 'store_salla',
      name: 'Salla',
      desc: 'Connect a public Salla storefront by URL so AI agents can read live products, prices, availability, and links.',
      icon: <span className="text-3xl font-black text-white">S</span>,
      color: 'bg-[#4f46e5]'
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      desc: 'Set up advanced generic endpoints. Perfect for triggering Zapier, Make, or sending notifications to any internal system.',
      icon: <ServerStackIcon className="w-12 h-12 text-fuchsia-100" />,
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

      {notice && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${notice.type === 'error'
          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
          {notice.message}
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
                          onClick={() => int.type === 'store_salla'
                            ? window.confirm('Are you sure? This might break active workflows.') && handleSallaAction('delete', int.id)
                            : handleDelete(int.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Integration"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">{int.name}</h3>

                      {int.type === 'store_salla' && (
                        <div className="space-y-3 mb-6 text-sm text-zinc-400">
                          <div>Status: <span className="text-white">{int.status}</span></div>
                          {int.metadata?.accessMode === 'public_storefront' && (
                            <div className="text-emerald-400 font-semibold">Public catalog</div>
                          )}
                          <div>Last sync: <span className="text-white">{int.metadata?.lastSyncedAt ? new Date(int.metadata.lastSyncedAt).toLocaleString() : 'Never'}</span></div>
                          <div className="flex gap-2">
                            {int.status !== 'pending' && (
                              <button onClick={() => handleSallaAction('sync', int.id)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
                                <ArrowPathIcon className="h-4 w-4" /> Sync now
                              </button>
                            )}
                            {int.metadata?.accessMode !== 'public_storefront' && (
                              <button onClick={() => handleSallaAction('reconnect', int.id)} className="px-3 py-2 border border-white/10 hover:bg-white/5 text-white rounded-lg text-xs font-bold">
                                {int.status === 'pending' ? 'Continue setup' : 'Reconnect'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

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

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {AVAILABLE_TOOLS.map(tool => (
                <button
                  type="button"
                  key={tool.id} 
                  onClick={() => openSetupModal(tool.id)}
                  className="bg-[#111113] border border-white/5 rounded-3xl p-6 cursor-pointer hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden flex flex-col h-full text-left"
                >
                   {/* Cool Gradient on Hover */}
                   <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   <div className={`w-16 h-16 rounded-2xl ${tool.color} flex items-center justify-center shadow-lg shadow-black/50 mb-5 group-hover:scale-110 transition-transform duration-300`}>
                     {tool.icon}
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{tool.name}</h3>
                   <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                     {tool.desc}
                   </p>

                   <div className="mt-6 flex items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors mt-auto pt-4">
                     Setup Connection &rarr;
                   </div>
                </button>
             ))}
           </div>
         </div>
      )}

      {showSallaPublic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={connectSallaPublic}
            role="dialog"
            aria-modal="true"
            aria-label="Connect Salla public catalog"
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">No app or token required</p>
            <h2 className="mt-2 text-2xl font-black text-white">Connect Salla catalog</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Enter the public storefront URL. ValueChat detects the Store ID and product categories automatically.
            </p>
            <div className="mt-6 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Connection Name
                <input
                  required
                  value={sallaStoreName}
                  onChange={(event) => setSallaStoreName(event.target.value)}
                  placeholder="Greens"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm normal-case text-white outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Store URL
                <input
                  required
                  type="url"
                  value={sallaStoreUrl}
                  onChange={(event) => setSallaStoreUrl(event.target.value)}
                  placeholder="https://your-store.com/"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm normal-case text-white outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Store ID (recommended)
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={sallaStoreIdentifier}
                  onChange={(event) => setSallaStoreIdentifier(event.target.value)}
                  placeholder="112506134"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm normal-case text-white outline-none focus:border-emerald-500"
                />
                <span className="mt-2 block normal-case font-normal text-zinc-500">
                  Uses Salla API directly when the storefront blocks server access. This is not a secret.
                </span>
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowSallaPublic(false)}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500"
              >
                Connect catalog
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                setShowSallaPublic(false);
                await startSallaAuth();
              }}
              className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Use Salla app instead
            </button>
          </form>
        </div>
      )}

      {sallaSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Connect Salla"
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Salla Easy Mode</p>
            <h2 className="mt-2 text-2xl font-black text-white">Connect Salla</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Copy this code, open Salla, then paste it into the ValueChat Connection Code field. The code expires in 30 minutes.
            </p>
            <div className="mt-6 break-all rounded-2xl border border-indigo-400/30 bg-black px-4 py-5 text-center font-mono text-lg font-bold tracking-wider text-indigo-200">
              {sallaSetup.pairingCode}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(sallaSetup.pairingCode);
                    setNotice({ type: 'success', message: 'Salla connection code copied.' });
                  } catch {
                    setNotice({ type: 'error', message: 'Could not copy the Salla connection code.' });
                  }
                }}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/5"
              >
                Copy code
              </button>
              <button
                type="button"
                onClick={() => window.open(sallaSetup.installUrl, '_blank', 'noopener,noreferrer')}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500"
              >
                Open Salla
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSallaSetup(null)}
              className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Close
            </button>
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
                   {type === 'google_calendar_oauth' ? 'Connect Google Calendar' : 
                    type === 'google_drive_oauth' ? 'Connect Google Drive' : 
                    type === 'google_sheets_oauth' ? 'Connect Google Sheets' : 
                    type === 'notion_oauth' ? 'Connect Notion Workspace' : 'Add Connection'}
                 </h2>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              
              {type.includes('_oauth') ? (
                <>
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">About this integration</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Securely connect your own Custom OAuth application to grant the AI Agents and workflows access to this specific service.
                    </p>
                    <p className="text-xs font-bold text-zinc-400 uppercase">
                      Need help? <a href={`/help/integrations/${type.includes('notion') ? 'notion' : 'google'}`} target="_blank" className="text-indigo-400 hover:text-indigo-300 transition-colors underline ml-1">Open Setup Guide</a>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">OAuth Redirect URL (Copy this)</label>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/oauth/${type.includes('notion') ? 'notion' : 'google'}/callback`}
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
                      placeholder={'{\n  "Headers": "..."\n}'}
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
                  {type.includes('_oauth') ? (
                    <>
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1 overflow-hidden">
                        {type.includes('notion') ? (
                          <img src="/assets/google-icons/notion.svg" alt="N" className="w-full h-full object-contain" />
                        ) : (
                          <img src="https://www.google.com/favicon.ico" alt="G" className="w-full h-full object-contain" />
                        )}
                      </div>
                      {type.includes('notion') ? 'Sign in with Notion' : 'Sign in with Google'}
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
