import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon,
  VideoCameraIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const channelConfigs = {
  whatsapp: {
    name: 'WhatsApp',
    description: 'Connect your WhatsApp account using Evolution API. You only need to scan a QR code to start automating your messages.',
    color: 'emerald',
    resources: [
      { name: 'Everything about WhatsApp Instances', link: '/help/channels/whatsapp' },
      { name: 'How to connect WhatsApp Instance', link: '/help/channels/whatsapp/connect' },
      { name: 'QR Scan Safety & Best Practices', link: '/help/channels/whatsapp' }
    ],
    icon: (
      <svg className="w-24 h-24 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.119.554 4.188 1.607 6.04L0 24l6.117-1.605A11.793 11.793 0 0012.046 24c6.638 0 12.032-5.393 12.035-12.03a11.77 11.77 0 00-3.536-8.508z"/>
      </svg>
    )
  },
  messenger: {
    name: 'Facebook Messenger',
    description: 'Connect Facebook Messenger to engage with your customers on the world\'s largest social media platform.',
    color: 'blue',
    resources: [
      { name: 'Everything about Messenger', link: '/help/channels/messenger' },
      { name: 'How to connect Facebook Page', link: '/help/channels/messenger/connect' }
    ],
    icon: (
      <svg className="w-24 h-24 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.303 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.291 14.896l-3.048-3.253-5.941 3.253 6.538-6.945 3.122 3.253 5.856-3.253-6.527 6.945z"/>
      </svg>
    )
  },
  instagram: {
    name: 'Instagram',
    description: 'Connect Instagram to reply to private messages and build strong brand connections.',
    color: 'rose',
    resources: [
      { name: 'Everything about Instagram Direct', link: '/help/channels/instagram' },
      { name: 'How to connect Instagram account', link: '/help/channels/instagram/connect' }
    ],
    icon: (
      <svg className="w-24 h-24 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.475 1.382.895.419.42.679.819.895 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.013 3.584-.07 4.85c-.054 1.17-.248 1.805-.413 2.227-.215.56-.475.96-.895 1.382-.42.419-.819.679-1.381.895-.422.164-1.056.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.584-.013-4.85-.07c-1.17-.054-1.805-.248-2.227-.413-.56-.215-.96-.475-1.382-.895-.419-.42-.679-.819-.895-1.381-.164-.422-.36-1.056-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.013-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.475-.96.895-1.382.42-.419.819-.679 1.381-.895.422-.164 1.057-.36 2.227-.413 1.266-.057 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126s1.347 1.077 2.126 1.384c.766.297 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384s1.077-1.347 1.384-2.126c.297-.766.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.788-.718-1.459-1.384-2.126s-1.347-1.077-2.126-1.384c-.766-.297-1.636-.499-2.913-.558C15.667.014 15.259 0 12 0z"/>
      </svg>
    )
  },
  tiktok: {
    name: 'TikTok',
    description: 'Connect TikTok Business Messaging to engage with a whole new audience from TikTok.',
    color: 'zinc',
    resources: [
      { name: 'Everything about TikTok Business', link: '/help/channels/tiktok' },
      { name: 'How to connect TikTok Business', link: '/help/channels/tiktok/connect' }
    ],
    icon: (
      <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.44 2.79-1.35 3.84-1.31 1.63-3.6 2.31-5.59 1.71-2.1-.64-3.51-2.61-3.48-4.79.03-2.02 1.34-3.87 3.23-4.59.39-.15.8-.23 1.21-.28v4.04c-.4.07-.79.22-1.12.45-.61.43-.83 1.25-.56 1.94.31.74 1.18 1.1 1.93.84.58-.2 1-.78 1.02-1.4.02-4.14.01-8.28.02-12.42z"/>
      </svg>
    )
  },
  telegram: {
    name: 'Telegram',
    description: 'Connect Telegram Bot to provide real-time support when customers reach out.',
    color: 'sky',
    resources: [
      { name: 'Everything you need to know about Telegram', link: '/help/channels/telegram' }
    ],
    icon: (
      <svg className="w-24 h-24 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0C5.337 0 0 5.337 0 11.944c0 6.606 5.337 11.944 11.944 11.944 6.607 0 11.944-5.338 11.944-11.944C23.888 5.337 18.551 0 11.944 0zm5.833 8.333l-2.04 9.613c-.154.678-.556.846-1.127.525l-3.109-2.29-1.5 1.444c-.166.166-.305.305-.625.305l.223-3.167 5.764-5.208c.249-.221-.055-.345-.386-.123l-7.126 4.456-3.078-.962c-.67-.209-.684-.67.14-.99l12.036-4.638c.556-.205 1.042.125.834.99z"/>
      </svg>
    )
  },
  whatsapp_cloud: {
    name: 'WhatsApp Cloud API',
    description: 'Connect the official WhatsApp Cloud API from your Meta Business account for enterprise-grade messaging with message templates, verified sender, and professional features.',
    color: 'indigo',
    resources: [
      { name: 'Everything about WhatsApp Cloud API', link: '/help/channels/whatsapp_cloud' },
      { name: 'How to connect WhatsApp Cloud API', link: '/help/channels/whatsapp_cloud/connect' },
      { name: 'WhatsApp Message Templates', link: '/help/channels/whatsapp_cloud' },
      { name: 'Meta Business Verification Guide', link: '/help/channels/whatsapp_cloud' },
    ],
    icon: (
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 text-emerald-500 opacity-30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.119.554 4.188 1.607 6.04L0 24l6.117-1.605A11.793 11.793 0 0012.046 24c6.638 0 12.032-5.393 12.035-12.03a11.77 11.77 0 00-3.536-8.508z"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-indigo-600 rounded-2xl p-3 shadow-2xl border border-white/20">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
            </svg>
          </div>
        </div>
      </div>
    )
  }
};

export default function ConnectChannel() {
  const navigate = useNavigate();
  const { type } = useParams();
  const config = channelConfigs[type] || channelConfigs.whatsapp;

  const [instanceName, setInstanceName] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [step, setStep] = useState('config'); // config, qr

  const isWhatsAppQR = type === 'whatsapp';
  const isCloudAPI = type === 'whatsapp_cloud';
  const isMetaChannel = type === 'messenger' || type === 'instagram';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = { 
        instanceName: instanceName || config.name, 
        channelType: type,
      };

      // Add channel-specific fields
      if (isCloudAPI) {
        payload.phoneNumberId = phoneNumberId;
        payload.accessToken = accessToken;
        // wabaId stored in phoneNumberId for now (can be extended later)
      } else if (isMetaChannel) {
        if (phoneNumberId) payload.phoneNumberId = phoneNumberId; // Optional — auto-detected from token
        payload.accessToken = accessToken;
      }

      const response = await api.post('/instances', payload);
      
      if (isWhatsAppQR) {
        if (response.data.instance.qrCode) {
          setQrCode(response.data.instance.qrCode);
          setStep('qr');
        } else {
          setError('Failed to generate QR code. Try again.');
        }
      } else {
        navigate('/channels');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full text-white">
      {/* LEFT SIDEBAR - Informative */}
      <aside className="w-full md:w-[320px] bg-[#0c0c0e] border-r border-white/5 p-8 flex flex-col shrink-0">
        <div className="mb-8">
           <div className={`w-24 h-24 mb-6`}>
              {config.icon}
           </div>
           <h2 className="text-2xl font-bold mb-3">{config.name}</h2>
           <p className="text-zinc-500 text-sm leading-relaxed font-medium">
             {config.description}
           </p>
        </div>

        <div className="space-y-8 mt-auto">
          {/* Tutorial Link */}
          <Link to={`/help/channels/${type}/video`} className="group block cursor-pointer">
            <div className="flex items-center gap-3 text-[#6366f1] mb-2">
               <VideoCameraIcon className="w-4 h-4" />
               <span className="text-xs font-black uppercase tracking-widest hover:underline">Step-by-step Video Tutorial</span>
            </div>
          </Link>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Additional Resources</h3>
            <ul className="space-y-3">
              {config.resources.map((res, i) => (
                <li key={i}>
                  <Link to={res.link} className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-[13px] font-medium group">
                    <BookOpenIcon className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                    {res.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-2xl">
          {/* Back Navigation */}
          <button 
            onClick={() => navigate('/channels')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold tracking-tight">Back</span>
          </button>

          <header className="mb-10">
            <h1 className="text-[28px] font-bold tracking-tight">Connect {config.name}</h1>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-medium">
              <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {step === 'config' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Account Section */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">?</div>
                  <span className="text-sm font-bold text-zinc-300">Unknown Account</span>
                </div>
                
                {type !== 'whatsapp' && (
                  <div className="space-y-6">
                    {/* Channel Name */}
                    <div>
                      <label className="block text-sm font-bold text-zinc-300 mb-2">Channel Name</label>
                      <input
                        type="text"
                        className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold tracking-tight"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder={`e.g., My ${config.name} Channel`}
                        required
                      />
                    </div>

                    {/* WhatsApp Cloud API specific fields */}
                    {isCloudAPI && (
                      <>
                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                          <div>
                            <h4 className="text-sm font-bold text-indigo-400">1. Meta Cloud API Setup</h4>
                            <p className="text-xs text-zinc-500">You'll need your Phone Number ID, Business Account ID, and a Permanent Access Token from the <a href="https://business.facebook.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Meta Business Suite</a>.</p>
                          </div>
                          <div className="pt-3 border-t border-indigo-500/10">
                            <h4 className="text-sm font-bold text-indigo-400 mb-2">2. Webhook Configuration</h4>
                            <p className="text-xs text-zinc-500 mb-2">Configure these in your Meta App Dashboard under WhatsApp &gt; Configuration:</p>
                            <div className="space-y-3">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-500">Callback URL</span>
                                <div className="bg-[#1c1f26] border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                                  <code className="text-xs text-emerald-400 font-mono select-all break-all">{window.location.origin}/api/webhooks/meta</code>
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-500">Verify Token</span>
                                <div className="bg-[#1c1f26] border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                                  <code className="text-xs text-emerald-400 font-mono select-all">valuewats_verify_2026</code>
                                </div>
                                <div className="mt-1.5 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                  <p className="text-[11px] text-yellow-500 leading-snug">
                                    <strong>Important:</strong> If you get a verification error in Meta, ensure <code className="text-white px-1">META_WEBHOOK_VERIFY_TOKEN</code> is set to the value above in your Coolify Environment Variables.
                                  </p>
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-2">Make sure to Subscribe to `messages` webhook fields.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Phone Number ID</label>
                          <input
                            type="text"
                            className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                            value={phoneNumberId}
                            onChange={(e) => setPhoneNumberId(e.target.value)}
                            placeholder="e.g., 123456789012345"
                            required
                          />
                          <p className="text-[11px] text-zinc-600 mt-1.5">Found in Meta Business Suite → WhatsApp → Phone Numbers</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">WhatsApp Business Account ID (WABA ID)</label>
                          <input
                            type="text"
                            className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                            value={wabaId}
                            onChange={(e) => setWabaId(e.target.value)}
                            placeholder="e.g., 987654321098765"
                            required
                          />
                          <p className="text-[11px] text-zinc-600 mt-1.5">Found in Meta Business Suite → WhatsApp → Business Account Settings</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Permanent Access Token</label>
                          <input
                            type="password"
                            className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="Paste your permanent system user token"
                            required
                          />
                          <p className="text-[11px] text-zinc-600 mt-1.5">Generate a System User Token in Meta Business Settings → System Users</p>
                        </div>
                      </>
                    )}

                    {/* Messenger / Instagram specific fields */}
                    {isMetaChannel && (
                      <>
                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 space-y-4 mb-4 mt-2">
                          <div>
                            <h4 className="text-sm font-bold text-indigo-400">1. {config.name} Webhook Setup</h4>
                            <p className="text-xs text-zinc-500 mb-2">Configure Webhooks in your Meta App Dashboard under {config.name} &gt; Configuration:</p>
                            <div className="space-y-3">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-500">Callback URL</span>
                                <div className="bg-[#1c1f26] border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                                  <code className="text-xs text-emerald-400 font-mono select-all break-all">{window.location.origin}/api/webhooks/meta</code>
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-500">Verify Token</span>
                                <div className="bg-[#1c1f26] border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                                  <code className="text-xs text-emerald-400 font-mono select-all">valuewats_verify_2026</code>
                                </div>
                                <div className="mt-1.5 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                  <p className="text-[11px] text-yellow-500 leading-snug">
                                    <strong>Important:</strong> If you get a verification error in Meta, ensure <code className="text-white px-1">META_WEBHOOK_VERIFY_TOKEN</code> is set to the value above in your Coolify Environment Variables.
                                  </p>
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-2">Make sure you subscribe to the `messages` and `messaging_postbacks` events.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-2 mt-4">2. Connect your {config.name}</label>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Page Access Token <span className="text-rose-400">*</span></label>
                              <input
                                type="password"
                                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                placeholder="Paste your Page Access Token here"
                                required
                              />
                              <p className="text-[11px] text-emerald-500/80 mt-1.5">✨ The Page ID will be auto-detected from your token — no need to find it manually!</p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">{config.name} ID <span className="text-zinc-600">(Optional)</span></label>
                                <input
                                  type="text"
                                  className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                                  value={phoneNumberId}
                                  onChange={(e) => setPhoneNumberId(e.target.value)}
                                  placeholder="Auto-detected from token (override only if needed)"
                                />
                                <p className="text-[11px] text-zinc-600 mt-1.5">Leave empty — we'll fetch it automatically. Only fill if auto-detection fails.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Generic channels (telegram, tiktok, etc.) */}
                    {!isCloudAPI && !isMetaChannel && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">API Token / Configuration</label>
                        <input
                          type="password"
                          className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="Paste your API token or key here"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {isWhatsAppQR && (
                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-2">Channel Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold tracking-tight"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      placeholder="e.g., My WhatsApp Channel"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-xl
                    ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[#6366f1] hover:bg-[#5558e3] text-white shadow-indigo-500/20'}`}
                >
                  {loading ? 'Processing...' : isWhatsAppQR ? 'Generate QR Code' : isCloudAPI ? 'Connect Cloud API' : 'Complete'}
                </button>
              </div>
            </form>
          )}

          {step === 'qr' && (
            <div className="space-y-10 text-center md:text-left">
               <div className="bg-white p-8 rounded-[32px] inline-block shadow-2xl shadow-indigo-500/10 transition-transform hover:scale-[1.02]">
                  {qrCode ? (
                    <img 
                      src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                      alt="QR Code" 
                      className="w-64 h-64 object-contain" 
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-zinc-50 text-zinc-400">
                      <ArrowPathIcon className="w-12 h-12 animate-spin" />
                    </div>
                  )}
               </div>

               <div className="space-y-2">
                 <h3 className="text-xl font-bold">Scan with your phone</h3>
                 <p className="text-zinc-500 text-sm max-w-sm">Open WhatsApp &gt; Settings &gt; Linked Devices to scan this code.</p>
               </div>

               <button 
                 onClick={() => navigate('/channels')}
                 className="px-8 py-3 rounded-xl text-sm font-bold bg-[#1c1f26] text-white border border-white/10 hover:bg-white/10 transition-all uppercase tracking-wider italic"
               >
                 Done
               </button>
            </div>
          )}

          <footer className="mt-20 pt-10 border-t border-white/5">
             <p className="text-zinc-500 text-xs font-medium">
               Visit our <Link to="/help" className="text-indigo-400 hover:underline">Help Center</Link> if you need step-by-step guidance to connect this Channel.
             </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
