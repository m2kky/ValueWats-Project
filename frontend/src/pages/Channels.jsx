import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { 
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  RocketLaunchIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'messaging', name: 'Business Messaging' },
  { id: 'calls', name: 'Calls' },
  { id: 'sms', name: 'SMS' },
  { id: 'email', name: 'Email' },
  { id: 'livechat', name: 'Live Chat' }
];

const catalog = [
  {
    id: 'whatsapp-instance',
    type: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect your WhatsApp account by scanning a QR code to start sending and receiving messages instantly.',
    category: 'messaging',
    badge: 'Popular',
    color: 'emerald',
    helpLink: '/help/channels/whatsapp',
    connectHelpLink: '/help/channels/whatsapp/connect',
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-10 h-10" alt="WhatsApp" />
    )
  },
  {
    id: 'tiktok',
    type: 'tiktok',
    name: 'TikTok',
    description: 'Connect TikTok Business Messaging to engage with a whole new audience from TikTok.',
    category: 'messaging',
    badge: 'Beta',
    color: 'zinc',
    helpLink: '/help/channels/tiktok',
    connectHelpLink: '/help/channels/tiktok/connect',
    icon: (
      <img src="https://www.vectorlogo.zone/logos/tiktok/tiktok-icon.svg" className="w-10 h-10" alt="TikTok" />
    )
  },
  {
    id: 'messenger',
    type: 'messenger',
    name: 'Facebook Messenger',
    description: 'Connect Facebook Messenger to engage with your customers on the world\'s largest social media platform.',
    category: 'messaging',
    badge: 'Popular',
    color: 'blue',
    helpLink: '/help/channels/messenger',
    connectHelpLink: '/help/channels/messenger/connect',
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg" className="w-10 h-10" alt="Messenger" />
    )
  },
  {
    id: 'instagram',
    type: 'instagram',
    name: 'Instagram',
    description: 'Connect Instagram to reply to private messages and build strong brand connections.',
    category: 'messaging',
    color: 'rose',
    helpLink: '/help/channels/instagram',
    connectHelpLink: '/help/channels/instagram/connect',
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" className="w-10 h-10" alt="Instagram" />
    )
  },
  {
    id: 'telegram',
    type: 'telegram',
    name: 'Telegram',
    description: 'Connect Telegram Bot to provide real-time support when customers reach out.',
    category: 'messaging',
    color: 'sky',
    helpLink: '/help/channels/telegram',
    connectHelpLink: '/help/channels/telegram/connect',
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" className="w-10 h-10" alt="Telegram" />
    )
  },
  {
    id: 'viber',
    type: 'viber',
    name: 'Viber',
    description: 'Connect Viber Bot to enable customer support and engagement on Viber.',
    category: 'messaging',
    color: 'purple',
    helpLink: '/help/channels/viber',
    connectHelpLink: '/help/channels/viber/connect',
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Viber_logo_2018.svg" className="w-10 h-10" alt="Viber" />
    )
  },
  {
    id: 'line',
    type: 'line',
    name: 'LINE',
    description: 'Connect LINE Official Account to provide timely support to your customers on LINE.',
    category: 'messaging',
    color: 'green',
    helpLink: '/help/channels/line',
    connectHelpLink: '/help/channels/line/connect',
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" className="w-10 h-10" alt="LINE" />
    )
  },
  {
    id: 'wechat',
    type: 'wechat',
    name: 'WeChat',
    description: 'Connect WeChat Service Account for customer engagement, brand promotion, and seamless communication.',
    category: 'messaging',
    color: 'green',
    helpLink: '/help/channels/wechat',
    connectHelpLink: '/help/channels/wechat/connect',
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/7/73/WeChat_logo.svg" className="w-10 h-10" alt="WeChat" />
    )
  },
  {
    id: 'whatsapp-cloud',
    type: 'whatsapp_cloud',
    name: 'WhatsApp Cloud API',
    description: 'Connect official WhatsApp Cloud API (Meta) for enterprise-grade scalability and reliability.',
    category: 'messaging',
    color: 'blue',
    helpLink: '/help/channels/whatsapp_cloud',
    connectHelpLink: '/help/channels/whatsapp_cloud/connect',
    icon: (
      <div className="relative">
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-10 h-10 opacity-40 blur-[1px]" alt="WhatsApp Cloud" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-indigo-600 rounded-lg p-1.5 shadow-lg border border-white/20">
                <img src="https://www.vectorlogo.zone/logos/facebook/facebook-icon.svg" className="w-5 h-5 brightness-200" alt="Meta" />
            </div>
        </div>
      </div>
    )
  },
  {
    id: 'custom',
    type: 'custom',
    name: 'Custom Channel',
    description: 'Connect any channels not natively available in respond.io to expand your messaging capabilities.',
    category: 'messaging',
    color: 'amber',
    helpLink: '/help/ai-agents',
    icon: (
      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
          <path d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zM21 17a3 3 0 11-6 0 3 3 0 016 0zM9 17a3 3 0 11-6 0 3 3 0 016 0z" />
          <path d="M12 11v4M9 17h6" />
        </svg>
      </div>
    )
  }
];

export default function Channels() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedChannels, setConnectedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  // View: 'connected' or 'catalog'
  const [view, setView] = useState('connected');

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await api.get('/instances');
      const instances = response.data.instances || [];
      setConnectedChannels(instances);
      // If no connected channels, default to catalog view
      if (instances.length === 0) {
        setView('catalog');
      }
    } catch (err) {
      console.error('Failed to fetch instances:', err);
      setView('catalog');
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (type) => {
    const item = catalog.find(c => c.type === type);
    return item?.icon || null;
  };

  const getChannelName = (type) => {
    const item = catalog.find(c => c.type === type);
    return item?.name || type;
  };

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesTab = activeTab === 'all' || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const filteredConnected = useMemo(() => {
    if (!searchQuery) return connectedChannels;
    return connectedChannels.filter(inst =>
      inst.instanceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.channelType || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [connectedChannels, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ──────────────────────── CONNECTED CHANNELS VIEW ────────────────────────
  if (view === 'connected') {
    return (
      <div className="font-sans">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 border border-white/10 rounded-lg bg-white/5 shadow-inner">
                <div className="w-6 h-6 text-zinc-400">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-[32px] font-bold text-white tracking-tight leading-tight">Channels</h1>
                <p className="text-zinc-500 text-sm mt-1 max-w-2xl font-medium">
                  Manage your messaging channels and discover new ones to help you acquire more customers.
                </p>
              </div>
            </div>
            <button
              onClick={() => setView('catalog')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-[0.15em] transition-all shadow-lg shadow-indigo-500/20"
            >
              <PlusIcon className="w-4 h-4" />
              Add Channel
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative w-full md:w-[360px]">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search Channels"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1f26] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Connected Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnected.map(instance => (
            <div 
              key={instance.id}
              className="bg-[#14171c]/80 border border-white/5 rounded-[24px] p-6 flex flex-col justify-between group hover:border-white/10 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8">
                    {getChannelIcon(instance.channelType)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-[15px] leading-tight mb-1 truncate">{instance.instanceName}</h4>
                  <p className="text-[12px] text-zinc-500 font-medium mb-2">{getChannelName(instance.channelType)}</p>
                  <div className="flex items-center gap-2">
                    {instance.status === 'connected' ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        Active
                      </span>
                    ) : instance.status === 'qr_pending' ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                        Scan Required
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                        Disconnected
                      </span>
                    )}
                  </div>
                  {(instance.phoneNumber || instance.phoneNumberId) && (
                    <span className="text-[11px] text-zinc-600 font-mono mt-1 block">
                      {instance.phoneNumber || instance.phoneNumberId}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => navigate(`/channels/manage/${instance.id}`)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-black bg-[#1c1f26] text-white border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all uppercase tracking-[0.2em] shadow-sm"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Manage
              </button>
            </div>
          ))}

          {/* Browse Catalog Card */}
          <div 
            onClick={() => setView('catalog')}
            className="bg-[#14171c]/40 border border-dashed border-white/10 rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all min-h-[200px] group"
          >
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-indigo-500/20 transition-colors">
              <PlusIcon className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-zinc-400 font-bold text-sm group-hover:text-white transition-colors">Connect more channels</p>
              <p className="text-zinc-600 text-xs mt-1">Reach your contacts in their preferred channels</p>
            </div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              Browse Catalog <ChevronRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────── CHANNEL CATALOG VIEW ────────────────────────
  return (
    <div className="font-sans">
      {/* Header with back button */}
      <div className="mb-10">
        {connectedChannels.length > 0 && (
          <button
            onClick={() => { setView('connected'); setSearchQuery(''); }}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            My Channels
          </button>
        )}
        <div className="flex items-start gap-4">
          <div className="p-2 border border-white/10 rounded-lg bg-white/5 shadow-inner">
             <div className="w-6 h-6 text-zinc-400">
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
               </svg>
             </div>
          </div>
          <div>
            <h1 className="text-[32px] font-bold text-white tracking-tight leading-tight">Channel Catalog</h1>
            <p className="text-zinc-500 text-sm mt-1 max-w-2xl font-medium">
              Manage your messaging channels and discover new ones to help you acquire more customers.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-white/5 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-3 text-sm font-bold tracking-tight transition-all relative
                ${activeTab === cat.id ? 'text-[#6366f1]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {cat.name}
              {activeTab === cat.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6366f1] rounded-full shadow-[0_-4px_10px_#6366f1]" />
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[320px]">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Channel Catalog"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1c1f26] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="space-y-12">
        <section>
          <div className="mb-6">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 mb-1 ml-1">Business Messaging</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCatalog.length > 0 ? (
              filteredCatalog.map(item => (
                <div
                  key={item.id}
                  className="group relative flex flex-col bg-[#14171c]/80 border border-white/5 rounded-[20px] p-6 transition-all duration-300 hover:border-white/20 hover:bg-[#1a1d24] hover:shadow-2xl hover:shadow-indigo-500/5 cursor-default overflow-hidden"
                >
                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                        ${item.badge === 'Popular' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                        <span className={`w-1 h-1 rounded-full ${item.badge === 'Popular' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                        {item.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col h-full mt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                    </div>

                    <h4 className="text-[17px] font-bold text-white mb-2 leading-tight pr-4">{item.name}</h4>
                    <p className="text-zinc-500 text-[13px] leading-relaxed mb-8 flex-grow">
                      {item.description}
                    </p>

                    <div className="mt-auto pt-5 border-t border-white/5 space-y-4">
                      {item.helpLink && (
                        <div className="space-y-1.5 px-0.5">
                           <Link to={item.helpLink} className="flex items-center gap-2.5 text-[11px] font-bold text-zinc-500 hover:text-indigo-400 transition-colors group/link uppercase tracking-wider">
                             <InformationCircleIcon className="w-3.5 h-3.5 text-zinc-600 group-hover/link:text-indigo-500 transition-colors" />
                             <span>About {item.name}</span>
                           </Link>
                           <Link to={item.connectHelpLink || item.helpLink} className="flex items-center gap-2.5 text-[11px] font-bold text-zinc-500 hover:text-indigo-400 transition-colors group/link uppercase tracking-wider">
                             <RocketLaunchIcon className="w-3.5 h-3.5 text-zinc-600 group-hover/link:text-indigo-500 transition-colors" />
                             <span>Setup Guide</span>
                           </Link>
                        </div>
                      )}

                      <button 
                        onClick={() => navigate(`/channels/connect/${item.type}`)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-black bg-[#1c1f26] text-white border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all uppercase tracking-[0.2em] italic shadow-lg"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                  
                  {/* Hover Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center glass-card border-dashed">
                <p className="text-zinc-500 font-medium tracking-tight">No channels found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
