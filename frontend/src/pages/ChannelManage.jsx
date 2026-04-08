import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { 
  ArrowLeftIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  Bars3BottomLeftIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

// ─── Channel metadata ───────────────────────────────────────────────────
const channelMeta = {
  whatsapp: {
    name: 'WhatsApp',
    color: 'emerald',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-8 h-8" alt="WhatsApp" />,
    tabs: ['configuration', 'troubleshoot'],
    chatLinkPrefix: null,
    helpLinks: [
      { label: 'About WhatsApp Instances', url: '/help/channels/whatsapp' },
      { label: 'How to Connect', url: '/help/channels/whatsapp/connect' },
    ],
    statusPage: null,
    troubleshootSteps: [
      { step: 1, text: 'Check your phone\'s internet connection and make sure WhatsApp is running.' },
      { step: 2, text: 'If disconnected, go to Channels and reconnect by scanning the QR code again.' },
      { step: 3, text: 'Make sure your phone number is not connected to more than 4 linked devices.' },
      { step: 4, text: 'Check out the Help Center documentation.' },
      { step: 5, text: 'Can\'t find a solution? Contact us!' },
    ]
  },
  whatsapp_cloud: {
    name: 'WhatsApp Cloud API',
    color: 'blue',
    icon: (
      <div className="relative">
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-8 h-8 opacity-40 blur-[0.5px]" alt="WhatsApp Cloud" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-indigo-600 rounded-md p-1 shadow-lg border border-white/20">
            <img src="https://www.vectorlogo.zone/logos/facebook/facebook-icon.svg" className="w-4 h-4 brightness-200" alt="Meta" />
          </div>
        </div>
      </div>
    ),
    tabs: ['configuration', 'templates', 'troubleshoot'],
    chatLinkPrefix: null,
    helpLinks: [
      { label: 'WhatsApp Cloud API Guide', url: '/help/channels/whatsapp_cloud' },
      { label: 'WhatsApp Message Templates', url: '/help/channels/whatsapp_cloud' },
    ],
    statusPage: 'https://metastatus.com/',
    troubleshootSteps: [
      { step: 1, text: 'Press Refresh Permission. Sign in may be requested.' },
      { step: 2, text: 'Verify your Meta Business account is verified and in good standing.' },
      { step: 3, text: 'Check that your webhook URL is correctly configured.' },
      { step: 4, text: 'Check out the Meta Status Page for any ongoing issues.' },
      { step: 5, text: 'Can\'t find a solution? Contact us!' },
    ]
  },
  messenger: {
    name: 'Facebook Messenger',
    color: 'blue',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg" className="w-8 h-8" alt="Messenger" />,
    tabs: ['configuration', 'templates', 'private_replies', 'chat_menu', 'troubleshoot'],
    chatLinkPrefix: 'https://m.me/',
    helpLinks: [
      { label: 'About Facebook Message Templates', url: '/help/channels/messenger' },
      { label: 'About Private Replies', url: '/help/channels/messenger' },
      { label: 'Help Center', url: '/help/channels/messenger' },
    ],
    statusPage: 'https://metastatus.com/',
    troubleshootSteps: [
      { step: 1, text: 'Press Refresh Permission. Sign in may be requested.', hasAction: true, actionLabel: 'Refresh Permission' },
      { step: 2, text: 'Page permissions can be dropped by Messenger platform if the admin changes their account password. Refresh permissions using the button above.' },
      { step: 3, text: 'Check out the Troubleshooting Documentation.' },
      { step: 4, text: 'Check out the Meta Status Page.' },
      { step: 5, text: 'Can\'t find a solution? Contact us!' },
    ]
  },
  instagram: {
    name: 'Instagram',
    color: 'rose',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" className="w-8 h-8" alt="Instagram" />,
    tabs: ['configuration', 'private_replies', 'troubleshoot'],
    chatLinkPrefix: null,
    helpLinks: [
      { label: 'About Instagram Direct', url: '/help/channels/instagram' },
      { label: 'Instagram Auto Private Replies', url: '/help/channels/instagram' },
    ],
    statusPage: 'https://metastatus.com/',
    troubleshootSteps: [
      { step: 1, text: 'Press Refresh Permission. Sign in may be requested.', hasAction: true, actionLabel: 'Refresh Permission' },
      { step: 2, text: 'Make sure your Instagram account is a Business or Creator account linked to a Facebook Page.' },
      { step: 3, text: 'Check out the Meta Status Page.' },
      { step: 4, text: 'Can\'t find a solution? Contact us!' },
    ]
  },
  telegram: {
    name: 'Telegram',
    color: 'sky',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" className="w-8 h-8" alt="Telegram" />,
    tabs: ['configuration', 'troubleshoot'],
    chatLinkPrefix: 'https://t.me/',
    helpLinks: [
      { label: 'About Telegram Bots', url: '/help/channels/telegram' },
    ],
    statusPage: null,
    troubleshootSteps: [
      { step: 1, text: 'Make sure the Bot Token is still valid. You can regenerate it via @BotFather on Telegram.' },
      { step: 2, text: 'Verify the webhook URL is correctly configured for this bot.' },
      { step: 3, text: 'Check out the Telegram Bot API documentation.' },
      { step: 4, text: 'Can\'t find a solution? Contact us!' },
    ]
  },
  tiktok: {
    name: 'TikTok',
    color: 'zinc',
    icon: <img src="https://www.vectorlogo.zone/logos/tiktok/tiktok-icon.svg" className="w-8 h-8" alt="TikTok" />,
    tabs: ['configuration', 'troubleshoot'],
    chatLinkPrefix: null,
    helpLinks: [{ label: 'About TikTok Business Messaging', url: '/help/channels/tiktok' }],
    statusPage: null,
    troubleshootSteps: [
      { step: 1, text: 'Verify your TikTok Business account is still connected.' },
      { step: 2, text: 'Check the Help Center documentation.' },
      { step: 3, text: 'Can\'t find a solution? Contact us!' },
    ]
  },
};

// Default metadata for unknown channel types
const defaultMeta = {
  name: 'Channel',
  color: 'zinc',
  icon: <div className="w-8 h-8 bg-zinc-700 rounded-full" />,
  tabs: ['configuration', 'troubleshoot'],
  chatLinkPrefix: null,
  helpLinks: [],
  statusPage: null,
  troubleshootSteps: [
    { step: 1, text: 'Check the channel connection status.' },
    { step: 2, text: 'Contact support if the issue persists.' },
  ]
};

const tabLabels = {
  configuration: { label: 'Configuration', icon: Cog6ToothIcon },
  templates: { label: 'Templates', icon: DocumentTextIcon },
  private_replies: { label: 'Private Replies', icon: ChatBubbleLeftRightIcon },
  chat_menu: { label: 'Chat Menu', icon: Bars3BottomLeftIcon },
  troubleshoot: { label: 'Troubleshoot', icon: WrenchScrewdriverIcon },
};

// ─── Main Component ─────────────────────────────────────────────────────
export default function ChannelManage() {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configuration');
  const [channelName, setChannelName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchInstance();
  }, [instanceId]);

  const fetchInstance = async () => {
    try {
      const res = await api.get(`/instances/${instanceId}/details`);
      setInstance(res.data.instance);
      setChannelName(res.data.instance.instanceName);
    } catch (err) {
      console.error('Failed to fetch instance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await api.patch(`/instances/${instanceId}`, { instanceName: channelName });
      setInstance(res.data.instance);
      setSaveMessage('Changes saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this channel? Messages and contacts will remain but you won\'t be able to interact via this channel anymore.')) return;
    setDeleting(true);
    try {
      await api.delete(`/instances/${instanceId}`);
      navigate('/channels');
    } catch (err) {
      alert('Failed to delete channel');
      setDeleting(false);
    }
  };

  const handleReconnect = async () => {
    setQrLoading(true);
    setQrCode(null);
    try {
      const res = await api.get(`/instances/${instanceId}/connect`);
      setQrCode(res.data.qrCode);
    } catch (err) {
      alert('Failed to get QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect this WhatsApp number?')) return;
    setDisconnecting(true);
    try {
      await api.post(`/instances/${instanceId}/disconnect`);
      setInstance(prev => ({ ...prev, status: 'disconnected' }));
      setQrCode(null);
    } catch (err) {
      alert('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <ExclamationTriangleIcon className="w-12 h-12 text-zinc-500" />
        <p className="text-zinc-400 font-medium">Channel not found</p>
        <button onClick={() => navigate('/channels')} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold">
          ← Back to Channels
        </button>
      </div>
    );
  }

  const meta = channelMeta[instance.channelType] || defaultMeta;

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#09090b]">
      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-[260px] border-r border-white/5 bg-[#0f0f11] flex flex-col shrink-0">
        {/* Back + Channel Header */}
        <div className="p-5 border-b border-white/5">
          <button 
            onClick={() => navigate('/channels')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold mb-5 transition-colors group uppercase tracking-wider"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Channels
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
              {meta.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{instance.instanceName}</h3>
              <p className="text-zinc-500 text-[11px] font-mono">ID: {instance.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 space-y-1">
          {meta.tabs.map(tabKey => {
            const tab = tabLabels[tabKey];
            if (!tab) return null;
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 font-bold' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Info */}
        <div className="p-5 border-t border-white/5 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2">
              {instance.status === 'connected' ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                  Disconnected
                </span>
              )}
            </div>
          </div>

          {meta.helpLinks.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Additional Resources</p>
              <div className="space-y-1.5">
                {meta.helpLinks.map((link, i) => (
                  <Link
                    key={i}
                    to={link.url}
                    className="flex items-center gap-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          {/* ── Configuration Tab ───────────────────────────────── */}
          {activeTab === 'configuration' && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-1">Configure {meta.name}</h2>
                <p className="text-zinc-500 text-sm">Manage Channel information and settings.</p>
              </div>

              {/* Chat Link (if applicable) */}
              {meta.chatLinkPrefix && instance.phoneNumberId && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                    Chat Link
                    <InformationCircleIcon className="w-3.5 h-3.5 inline ml-1.5 text-zinc-600" />
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${meta.chatLinkPrefix}${instance.phoneNumberId}`}
                      className="flex-1 bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 font-mono"
                    />
                    <button 
                      onClick={() => copyToClipboard(`${meta.chatLinkPrefix}${instance.phoneNumberId}`)}
                      className="p-3 bg-[#1c1f26] border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Phone Number (WhatsApp) */}
              {instance.phoneNumber && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    readOnly
                    value={instance.phoneNumber}
                    className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 font-mono"
                  />
                </div>
              )}

              {/* Channel Name */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Channel Name</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-4 mb-12">
                <button
                  onClick={handleSave}
                  disabled={saving || channelName === instance.instanceName}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMessage && (
                  <span className={`text-xs font-medium ${saveMessage.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>

              {/* Pause / Enable Toggle */}
              <div className="border-t border-white/5 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Channel Status</h4>
                    <p className="text-zinc-500 text-xs mt-1">
                      {instance?.status === 'disabled' ? 'Channel is paused — not used in campaigns' : 'Channel is active and available for campaigns'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await api.patch(`/instances/${instanceId}/toggle`);
                      setInstance(res.data.instance);
                    }}
                    className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      instance?.status !== 'disabled' ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      instance?.status !== 'disabled' ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* WhatsApp Reconnect / Disconnect */}
              {(!instance.channelType || instance.channelType === 'whatsapp') && (
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <h4 className="text-sm font-bold text-white">Connection</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReconnect}
                      disabled={qrLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all uppercase tracking-wider"
                    >
                      {qrLoading ? 'Loading...' : '🔄 Reconnect'}
                    </button>
                    {instance.status === 'connected' && (
                      <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all uppercase tracking-wider"
                      >
                        {disconnecting ? 'Disconnecting...' : '⏏ Disconnect'}
                      </button>
                    )}
                  </div>
                  {qrCode && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <p className="text-xs text-zinc-400 mb-3">Scan with WhatsApp on your phone</p>
                      <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-xl border border-white/10" />
                    </div>
                  )}
                </div>
              )}

              {/* Danger Zone */}
              <div className="border-t border-white/5 pt-8">
                <h3 className="text-sm font-bold text-white mb-3">Danger Zone</h3>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-200/70 text-sm leading-relaxed">
                      If you delete this channel, messages and contacts associated with this channel will remain but you won't be able to interact with your contacts via this Channel anymore.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all uppercase tracking-wider"
                >
                  <TrashIcon className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete Channel'}
                </button>
              </div>
            </div>
          )}

          {/* ── Templates Tab ────────────────────────────────────── */}
          {activeTab === 'templates' && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-1">{meta.name} Message Templates</h2>
                <p className="text-zinc-500 text-sm">Manage message templates for this channel.</p>
              </div>

              {instance.channelType === 'messenger' && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 mb-6">
                  <h4 className="text-sm font-bold text-white mb-2">What are Facebook Message Templates?</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                    Facebook Message Templates are pre-approved message formats provided by Meta's template library. 
                    They are intended for utility messages such as account updates, transaction confirmations, 
                    post-purchase notifications, and customer support follow-ups.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Templates are required when sending messages outside the 24-hour messaging window.
                  </p>
                </div>
              )}

              {instance.channelType === 'whatsapp_cloud' && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                  <h4 className="text-sm font-bold text-white mb-2">WhatsApp Message Templates</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                    WhatsApp Message Templates allow you to engage with contacts at any time. 
                    Templates must be pre-approved by Meta and can include utility, marketing, and authentication messages.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    You can manage templates in the Meta Business Suite and sync them here.
                  </p>
                </div>
              )}

              <div className="bg-[#14171c]/80 border border-white/5 rounded-2xl p-10 text-center">
                <DocumentTextIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 font-bold mb-2">No templates synced yet</p>
                <p className="text-zinc-600 text-sm mb-6">Templates will appear here once synced from the platform.</p>
                <button className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-wider transition-all">
                  Sync Templates
                </button>
              </div>
            </div>
          )}

          {/* ── Private Replies Tab ──────────────────────────────── */}
          {activeTab === 'private_replies' && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-1">Private Replies</h2>
                <p className="text-zinc-500 text-sm">
                  Send an automatic private message to a user who comments on a post on your page. 
                  This converts users from {meta.name} to a Value chat Contact.
                </p>
              </div>

              <div className="bg-[#14171c]/80 border border-white/5 rounded-2xl p-6 space-y-5">
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Enable Auto Private Replies</h4>
                    <p className="text-zinc-500 text-xs mt-1">Automatically send a DM when someone comments on your posts</p>
                  </div>
                  <button className="w-11 h-6 bg-zinc-700 rounded-full relative transition-colors cursor-pointer hover:bg-zinc-600">
                    <div className="w-5 h-5 bg-zinc-400 rounded-full absolute left-0.5 top-0.5 transition-transform" />
                  </button>
                </div>

                <div className="border-t border-white/5 pt-5">
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Track Comments Under</label>
                  <select className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none">
                    <option value="all">All Posts</option>
                    <option value="specific">Specific Post</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Auto-Reply Message</label>
                  <textarea
                    rows={3}
                    placeholder="Thanks for reaching out! How can we help you today?"
                    className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none placeholder-zinc-600"
                  />
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200/60 leading-relaxed">
                      <p className="font-bold text-amber-300 mb-1">Eligibility Rules</p>
                      <ul className="space-y-1 list-disc ml-4">
                        <li>Each post or comment can only receive one private reply.</li>
                        <li>The private reply must be sent within 7 days of the original comment.</li>
                        <li>The comment must be made by a user to the Page surface.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-wider transition-all">
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* ── Chat Menu Tab ────────────────────────────────────── */}
          {activeTab === 'chat_menu' && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-1">Chat Menu</h2>
                <p className="text-zinc-500 text-sm">
                  Facebook Messenger allows the creation of a persistent menu next to the chat. 
                  Create chat menu to facilitate your audience to discover more content, visit websites, etc.
                </p>
              </div>

              <div className="bg-[#14171c]/80 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-sm font-bold text-white">Menu Buttons</h4>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 transition-colors">
                    + Add Button
                  </button>
                </div>

                <div className="bg-[#1c1f26] border border-white/5 rounded-xl p-8 text-center">
                  <Bars3BottomLeftIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-bold text-sm mb-1">No menu buttons yet</p>
                  <p className="text-zinc-600 text-xs">Add buttons to create a persistent chat menu for your Messenger audience.</p>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500/50" />
                    <label className="text-sm text-zinc-300 font-medium">Allow User Input</label>
                  </div>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 mt-5">
                  <div className="flex items-start gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-200/50 leading-relaxed">
                      Two button types are available: <strong className="text-indigo-300">Payload</strong> (sends a message with the button name) 
                      and <strong className="text-indigo-300">URL</strong> (opens a webpage). You can drag to reorder buttons.
                    </p>
                  </div>
                </div>

                <button className="mt-5 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-wider transition-all">
                  Save Menu
                </button>
              </div>
            </div>
          )}

          {/* ── Troubleshoot Tab ──────────────────────────────────── */}
          {activeTab === 'troubleshoot' && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-1">{meta.name} Troubleshooting</h2>
                <p className="text-zinc-500 text-sm">Follow the instructions to troubleshoot the Channel.</p>
              </div>

              <div className="space-y-4">
                {meta.troubleshootSteps.map((step, i) => (
                  <div key={i} className="bg-[#14171c]/80 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-indigo-400">{step.step}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-zinc-300 leading-relaxed">{step.text}</p>
                        {step.hasAction && (
                          <button className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-wider transition-all">
                            <ArrowPathIcon className="w-3.5 h-3.5" />
                            {step.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* External Links */}
              <div className="mt-8 space-y-3">
                {meta.statusPage && (
                  <a
                    href={meta.statusPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Check Platform Status Page
                  </a>
                )}
                <Link
                  to="/help"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Visit Help Center
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
