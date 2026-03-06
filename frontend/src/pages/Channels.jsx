import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { 
  MagnifyingGlassIcon,
  ChevronRightIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  RocketLaunchIcon
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
      <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.119.554 4.188 1.607 6.04L0 24l6.117-1.605A11.793 11.793 0 0012.046 24c6.638 0 12.032-5.393 12.035-12.03a11.77 11.77 0 00-3.536-8.508z"/>
      </svg>
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
      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.44 2.79-1.35 3.84-1.31 1.63-3.6 2.31-5.59 1.71-2.1-.64-3.51-2.61-3.48-4.79.03-2.02 1.34-3.87 3.23-4.59.39-.15.8-.23 1.21-.28v4.04c-.4.07-.79.22-1.12.45-.61.43-.83 1.25-.56 1.94.31.74 1.18 1.1 1.93.84.58-.2 1-.78 1.02-1.4.02-4.14.01-8.28.02-12.42z"/>
      </svg>
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
      <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.303 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.291 14.896l-3.048-3.253-5.941 3.253 6.538-6.945 3.122 3.253 5.856-3.253-6.527 6.945z"/>
      </svg>
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
      <svg className="w-10 h-10 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.475 1.382.895.419.42.679.819.895 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.013 3.584-.07 4.85c-.054 1.17-.248 1.805-.413 2.227-.215.56-.475.96-.895 1.382-.42.419-.819.679-1.381.895-.422.164-1.056.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.584-.013-4.85-.07c-1.17-.054-1.805-.248-2.227-.413-.56-.215-.96-.475-1.382-.895-.419-.42-.679-.819-.895-1.381-.164-.422-.36-1.056-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.013-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.475-.96.895-1.382.42-.419.819-.679 1.381-.895.422-.164 1.057-.36 2.227-.413 1.266-.057 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126s1.347 1.077 2.126 1.384c.766.297 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384s1.077-1.347 1.384-2.126c.297-.766.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.788-.718-1.459-1.384-2.126s-1.347-1.077-2.126-1.384c-.766-.297-1.636-.499-2.913-.558C15.667.014 15.259 0 12 0z"/>
        <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zM18.406 4.155a1.44 1.44 0 100 2.88 1.44 0 000-2.88z"/>
      </svg>
    )
  },
  {
    id: 'telegram',
    type: 'telegram',
    name: 'Telegram',
    description: 'Connect Telegram Bot to provide real-time support when customers reach out.',
    category: 'messaging',
    color: 'sky',
    icon: (
      <svg className="w-10 h-10 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0C5.337 0 0 5.337 0 11.944c0 6.606 5.337 11.944 11.944 11.944 6.607 0 11.944-5.338 11.944-11.944C23.888 5.337 18.551 0 11.944 0zm5.833 8.333l-2.04 9.613c-.154.678-.556.846-1.127.525l-3.109-2.29-1.5 1.444c-.166.166-.305.305-.625.305l.223-3.167 5.764-5.208c.249-.221-.055-.345-.386-.123l-7.126 4.456-3.078-.962c-.67-.209-.684-.67.14-.99l12.036-4.638c.556-.205 1.042.125.834.99z"/>
      </svg>
    )
  },
  {
    id: 'viber',
    type: 'viber',
    name: 'Viber',
    description: 'Connect Viber Bot to enable customer support and engagement on Viber.',
    category: 'messaging',
    color: 'purple',
    icon: (
      <svg className="w-10 h-10 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 0a6.528 6.528 0 016.528 6.516v13.68c-.024.18-.084.324-.168.456a.465.465 0 01-.228.168.64.64 0 01-.192.012H16.2c-.372-.012-.66-.192-.852-.528l-.348-.6V16.62c0-.588-.228-1.572-.672-2.928-.276-.84-.732-2.028-1.344-3.564-.624-1.524-1.284-3.048-2.004-4.572C8.748 4.716 7.956 3.192 7.044 1.704l-.168-.276A3.6 3.6 0 016.636.54a.42.42 0 01.12-.396C6.816.096 6.948 0 7.152 0h10.32z"/>
      </svg>
    )
  },
  {
    id: 'line',
    type: 'line',
    name: 'LINE',
    description: 'Connect LINE Official Account to provide timely support to your customers on LINE.',
    category: 'messaging',
    color: 'green',
    icon: (
      <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645s6.934-4.089 9.47-6.992c1.004-1.12 1.513-3.818 1.513-5.951z"/>
      </svg>
    )
  },
  {
    id: 'wechat',
    type: 'wechat',
    name: 'WeChat',
    description: 'Connect WeChat Service Account for customer engagement, brand promotion, and seamless communication.',
    category: 'messaging',
    color: 'green',
    icon: (
      <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.611 12.012c4.712 0 8.521-3.328 8.521-7.433 0-4.106-3.812-7.433-8.521-7.433S.11 0.473.11 4.579c0 2.27 1.157 4.314 3.011 5.75-.15.462-.513 1.567-.532 1.631-.039.111-.073.303.113.186C2.868 12.051 4.38 11.233 5.3 10.8c1.052.8 2.288 1.212 3.311 1.212zm-3.522-6.527c-.512 0-.928-.363-.928-.809 0-.447.416-.81.928-.81s.928.363.928.81c0 .446-.416.809-.928.809zm6.983 0c-.512 0-.928-.363-.928-.809 0-.447.416-.81.928-.81.513 0 .928.363.928.81 0 .446-.416.809-.928.809zM23.89 13.918c0-3.562-3.328-6.447-7.433-6.447-4.106 0-7.433 2.885-7.433 6.447s3.327 6.447 7.433 6.447c.801 0 1.558-.113 2.264-.32.784.394 2.103 1.083 2.155 1.11.162.1.135-.11.1-.212-.03-.131-.334-1.077-.463-1.479 2.016-1.21 3.414-3.1 3.414-5.546zm-9.352-1.285c-.41 0-.742-.29-.742-.647 0-.357.332-.647.742-.647.413 0 .743.29.743.647 0 .357-.33.647-.743.647zm5.568 0c-.41 0-.742-.29-.742-.647 0-.357.332-.647.742-.647.413 0 .743.29.743.647 0 .357-.33.647-.743.647z"/>
      </svg>
    )
  },
  {
    id: 'whatsapp-cloud',
    type: 'whatsapp_cloud',
    name: 'WhatsApp Cloud API',
    description: 'Connect official WhatsApp Cloud API (Meta) for enterprise-grade scalability and reliability.',
    category: 'messaging',
    color: 'blue',
    helpLink: '/help/channels/messenger',
    connectHelpLink: '/help/channels/messenger/connect',
    icon: (
      <svg className="w-10 h-10 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.25 18.25c-3.15 0-5.75-2.6-5.75-5.75s2.6-5.75 5.75-5.75 5.75 2.6 5.75 5.75-2.6 5.75-5.75 5.75z"/>
      </svg>
    )
  },
  {
    id: 'custom',
    type: 'custom',
    name: 'Custom Channel',
    description: 'Connect any channels not natively available in respond.io to expand your messaging capabilities.',
    category: 'messaging',
    color: 'amber',
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

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await api.get('/api/instances');
      setConnectedChannels(response.data.instances || []);
    } catch (err) {
      console.error('Failed to fetch instances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      await api.delete(`/api/instances/${id}`);
      setConnectedChannels(prev => prev.filter(inst => inst.id !== id));
    } catch (err) {
      alert('Failed to delete channel');
    }
  };

  const getChannelIcon = (type) => {
    const item = catalog.find(c => c.type === type);
    return item?.icon || null;
  };

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesTab = activeTab === 'all' || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="font-sans">
      {/* Header Area */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-2">
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

      {/* Connected Channels Section */}
      {connectedChannels.length > 0 && (
        <div className="mb-16">
          <div className="mb-6">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 mb-1 ml-1">Connected Channels</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedChannels.map(instance => (
              <div 
                key={instance.id}
                className="bg-[#14171c]/80 border border-white/5 rounded-[24px] p-5 flex items-center justify-between group hover:border-white/10 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-8 h-8">
                       {getChannelIcon(instance.channelType)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[15px] leading-tight mb-1">{instance.instanceName}</h4>
                    <div className="flex flex-col gap-1">
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
                         <span className="text-[11px] text-zinc-500 font-mono">
                           {instance.phoneNumber || instance.phoneNumberId}
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {instance.channelType === 'whatsapp' && (instance.status === 'disconnected' || instance.status === 'qr_pending') && (
                    <button 
                      onClick={() => navigate(`/channels/connect/whatsapp`)}
                      className="p-2 hover:bg-white/5 rounded-lg text-indigo-400 transition-colors"
                      title="Reconnect"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(instance.id)}
                    className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete Channel"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

function Squares2X2Icon({ className }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
    </svg>
  );
}
