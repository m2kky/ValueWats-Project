import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { QrCodeIcon, ArrowLeftIcon, DevicePhoneMobileIcon, ChatBubbleBottomCenterTextIcon, CameraIcon } from '@heroicons/react/24/outline';

const channels = [
  { id: 'whatsapp', name: 'WhatsApp', icon: DevicePhoneMobileIcon, emoji: '📱', color: 'blue' },
  { id: 'messenger', name: 'Messenger', icon: ChatBubbleBottomCenterTextIcon, emoji: '💬', color: 'indigo' },
  { id: 'instagram', name: 'Instagram', icon: CameraIcon, emoji: '📸', color: 'pink' },
];

export default function NewInstance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const instanceId = searchParams.get('instanceId');
  const instanceNameParam = searchParams.get('name');

  const [channelType, setChannelType] = useState('whatsapp');
  const [instanceName, setInstanceName] = useState(instanceNameParam || '');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('input'); // input, creating, qr_ready, connected
  const [error, setError] = useState(null);

  useEffect(() => {
    if (instanceId) {
      fetchQrForInstance(instanceId);
    }
  }, [instanceId]);

  const fetchQrForInstance = async (id) => {
    setLoading(true);
    setStatus('creating');
    setError(null);
    try {
      const res = await api.get(`/instances/${id}/connect`);
      if (res.data.qrCode) {
        setQrCode(res.data.qrCode);
        setStatus('qr_ready');
      } else {
        throw new Error('No QR code returned');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to get QR code');
      setStatus('input');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus('creating');

    try {
      const payload = { 
        instanceName, 
        channelType,
        ...(channelType !== 'whatsapp' && { phoneNumberId, accessToken })
      };

      const response = await api.post('/instances', payload);
      
      if (channelType === 'whatsapp') {
        if (response.data.instance.qrCode) {
          setQrCode(response.data.instance.qrCode);
          setStatus('qr_ready');
        } else {
          setError('Instance created but QR code not received yet. Please try reconnecting from the list.');
          setStatus('input');
        }
      } else {
        // Meta channels are automatically 'connected' if tokens are valid
        navigate('/instances');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create instance');
      setStatus('input');
    } finally {
      setLoading(false);
    }
  };

  const currentChannel = channels.find(c => c.id === channelType);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 font-sans">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/instances')} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tight">Connect Channel</h1>
      </div>

      <div className="glass-card max-w-lg mx-auto">
        <div className="p-8">
          {status === 'input' && (
            <div className="space-y-8">
              {/* Channel Selection */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChannelType(ch.id)}
                    className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all border
                      ${channelType === ch.id 
                        ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-white' 
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                  >
                    <ch.icon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{ch.name}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 border shadow-xl
                    ${channelType === 'whatsapp' ? 'bg-emerald-500/20 border-emerald-500/30' : 
                      channelType === 'messenger' ? 'bg-blue-500/20 border-blue-500/30' : 'bg-pink-500/20 border-pink-500/30'}`}>
                    <span className="text-3xl">{currentChannel.emoji}</span>
                  </div>
                  <h2 className="text-xl font-black text-white uppercase italic">Add {currentChannel.name}</h2>
                  <p className="text-zinc-400 text-sm font-medium mt-1">Configure your {currentChannel.name} connection</p>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1">Instance Name</label>
                    <input
                      type="text"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder={`e.g., ${currentChannel.name} Support`}
                      required
                    />
                  </div>

                  {channelType !== 'whatsapp' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1">Page ID</label>
                        <input
                          type="text"
                          value={phoneNumberId}
                          onChange={(e) => setPhoneNumberId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                          placeholder="Meta Page ID"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1">Page Access Token</label>
                        <textarea
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-xs h-24 resize-none"
                          placeholder="Paste your Page Access Token here..."
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                <button type="submit" className="btn-premium w-full py-4 text-sm" disabled={loading}>
                  {loading ? 'Processing...' : channelType === 'whatsapp' ? 'Generate QR Code' : 'Connect Channel'}
                </button>
              </form>
            </div>
          )}

          {status === 'creating' && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] mx-auto mb-6"></div>
              <p className="text-white font-bold tracking-widest uppercase italic text-xs animate-pulse">Initializing Connection...</p>
            </div>
          )}

          {status === 'qr_ready' && (
            <div className="text-center space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">Scan QR Code</h2>
                <p className="text-zinc-400 text-sm font-medium">Open WhatsApp &gt; Settings &gt; Linked Devices</p>
              </div>

              <div className="bg-white p-6 rounded-3xl inline-block shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-transform hover:scale-105">
                {qrCode ? (
                  <img 
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                    alt="QR Code" 
                    className="w-64 h-64 object-contain" 
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-zinc-50 text-zinc-400">
                    <QrCodeIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl text-xs text-left">
                <p className="font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span> Important Note
                </p>
                <ul className="text-zinc-300 font-medium space-y-2 list-disc list-inside">
                  <li>Keep this page open while scanning</li>
                  <li>The status will update automatically once linked</li>
                  <li>Make sure your phone is connected to the internet</li>
                </ul>
              </div>

              <button onClick={() => navigate('/instances')} className="btn-glass w-full py-4 text-xs font-black tracking-widest uppercase italic">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
