import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  MagnifyingGlassIcon
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
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Premium Header */}
      <header className="h-[72px] border-b border-white/5 bg-transparent flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
            {(conversation.contactName || conversation.contactNumber)?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-[15px] text-white tracking-tight flex items-center gap-2">
              {conversation.contactName || conversation.contactNumber}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                New Lead
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <button className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all"><MagnifyingGlassIcon className="w-5 h-5" /></button>
          <button className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all"><PhoneIcon className="w-5 h-5" /></button>
          <button className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all"><VideoCameraIcon className="w-5 h-5" /></button>
          <div className="w-px h-5 bg-white/10 mx-1"></div>
          <button className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-20">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-bold uppercase tracking-[0.2em]">No Messages</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOut = msg.direction === 'outgoing';
            const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx - 1].createdAt) > 300000;

            return (
              <div key={msg.id} className="space-y-2">
                {showTime && (
                  <div className="flex justify-center my-6 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <span className="relative px-3 py-1 bg-[#000000] text-[10px] font-bold text-zinc-500 uppercase tracking-widest rounded-full border border-white/5">
                      Today
                    </span>
                  </div>
                )}
                <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] group relative animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm
                      ${isOut
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-[#18181b] border border-white/5 text-zinc-200 rounded-tl-sm'
                      }`}>

                      {msg.content || '[Media Content]'}

                      {msg.mediaUrl && msg.messageType === 'image' && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                          <img src={msg.mediaUrl} alt="" className="max-w-full" />
                        </div>
                      )}

                      <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-semibold opacity-60 
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

      {/* Modern Composer Area */}
      <footer className="px-6 pb-6 pt-2 bg-transparent shrink-0">
        <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden flex flex-col focus-within:border-white/10 transition-colors shadow-lg">
          {/* Source/Channel Selector Top Bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#18181b]">
            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            </div>
            <span className="bg-transparent text-xs font-semibold text-zinc-300">
              {instances.find(inst => inst.id === selectedInstance)?.instanceName || 'Unknown Instance'}
            </span>
          </div>

          {/* Text Input Area */}
          <div className="px-4 py-3 bg-[#18181b]">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Use '/' for snippets, '@' for variables, ':' for emoji"
              rows={1}
              className="w-full bg-transparent text-[15px] text-zinc-100 outline-none resize-none placeholder:text-zinc-600"
              style={{ maxHeight: '160px', minHeight: '24px' }}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#18181b] border-t border-white/5">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors" title="Formatting">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              </button>
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors" title="Attach file">
                <PaperClipIcon className="w-5 h-5" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors" title="Insert Emoji">
                <FaceSmileIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Assist
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || !selectedInstance || sending}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${!message.trim() || sending
                    ? 'bg-zinc-800 text-zinc-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
