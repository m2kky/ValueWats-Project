import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { formatPhoneNumber } from '../../utils/formatters';

export default function ChatWindow({ conversation, instances, onSendMessage, onUpdate }) {
  const [message, setMessage] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(instances[0]?.id || '');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  useEffect(() => {
    if (instances.length > 0 && !selectedInstance) {
      setSelectedInstance(instances[0].id);
    }
  }, [instances, selectedInstance]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation.id]);

  const handleSend = async () => {
    if (!message.trim() || !selectedInstance || sending) return;

    setSending(true);
    try {
      await onSendMessage({
        conversationId: conversation.id,
        instanceId: selectedInstance,
        content: message.trim(),
        messageType: 'text'
      });
      setMessage('');
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return <span className="text-indigo-400">✓✓</span>;
      default: return '⏳';
    }
  };

  const messages = conversation.messages || [];

  return (
    <div className="flex flex-col h-full bg-zinc-950/20 backdrop-blur-sm relative">
      {/* Premium Header */}
      <header className="h-20 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg flex items-center justify-center text-white font-black text-xl">
            {(conversation.contactName || conversation.contactNumber)?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="font-black text-white tracking-tight uppercase italic truncate max-w-[200px]">
              {conversation.contactName || conversation.contactNumber}
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">WhatsApp Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="hidden sm:flex items-center gap-1 mr-4 pr-4 border-r border-white/5">
            <button className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all"><PhoneIcon className="w-5 h-5" /></button>
            <button className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all"><VideoCameraIcon className="w-5 h-5" /></button>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-tighter">Channel Source</span>
            <select
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-lg px-3 py-1 text-xs font-bold text-zinc-300 outline-none focus:border-indigo-500/30 transition-all cursor-pointer"
            >
              {instances.length === 0 ? (
                <option value="">No active lines</option>
              ) : (
                instances.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.instanceName.toUpperCase()}
                  </option>
                ))
              )}
            </select>
          </div>
          <button className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all ml-4">
            <EllipsisVerticalIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-20">
            <ChatBubbleLeftRightIcon className="w-24 h-24 mb-4" />
            <p className="text-xl font-black uppercase tracking-[0.2em]">Begin discussion</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOut = msg.direction === 'outgoing';
            const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx - 1].createdAt) > 300000;

            return (
              <div key={msg.id} className="space-y-2">
                {showTime && (
                  <div className="flex justify-center my-8">
                    <span className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">
                      {format(new Date(msg.createdAt), 'EEEE, HH:mm')}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] group relative animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`px-5 py-3.5 rounded-2xl text-sm font-medium shadow-xl 
                      ${isOut
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10'
                        : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-none shadow-black/40'
                      }`}>

                      {msg.content || '[Media Content]'}

                      {msg.mediaUrl && msg.messageType === 'image' && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                          <img src={msg.mediaUrl} alt="" className="max-w-full hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}

                      <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-bold opacity-50 
                        ${isOut ? 'justify-end' : 'justify-start'}`}>
                        <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                        {isOut && <span className="text-xs">{getStatusIcon(msg.status)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <footer className="p-6 bg-zinc-950/40 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-5xl mx-auto flex items-end gap-4">
          <div className="flex items-center gap-1 mb-1.5">
            <button className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all"><PaperClipIcon className="w-5 h-5" /></button>
            <button className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all"><FaceSmileIcon className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Craft a message..."
              rows={1}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-zinc-100 outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none custom-scrollbar"
              style={{ maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() || !selectedInstance || sending}
            className={`p-4 rounded-2xl flex items-center justify-center transition-all shadow-lg
              ${!message.trim() || sending
                ? 'bg-zinc-800 text-zinc-600 grayscale'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/20 active:scale-95'
              }`}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5 -rotate-45 -translate-y-0.5" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
