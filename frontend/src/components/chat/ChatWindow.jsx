import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { formatPhoneNumber } from '../../utils/formatters';
import api from '../../api/client';

// Common emojis grouped
const EMOJI_GROUPS = {
  '😊': ['😊', '😂', '🤣', '❤️', '😍', '🥰', '😘', '😎', '🤩', '🥳', '😁', '😆', '😋', '🤗', '😏', '🤔', '🤨', '😐', '😑', '😶', '😒', '😓', '😔', '😞', '😟', '😠', '😡', '🤬', '😤', '😭', '😢', '😥', '🤯', '😱', '😨', '😰', '😪', '🤤', '😴', '🤢', '🤮', '🤧', '🥵', '🥶', '🤠', '🤡', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿'],
  '👍': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '💪', '🦾', '🦿', '🙏', '🤲', '🤝', '✍️', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☯️', '🌟', '⭐', '✨', '💫', '🔥'],
  '🎉': ['🎉', '🎊', '🎈', '🎂', '🎁', '🎀', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎫', '🎟️', '🎠', '🎡', '🎢', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎷', '🎸', '🎺', '🎻', '🥁', '🎹', '🎲', '🎯', '🎳', '🎮', '🕹️', '♟️', '🧩', '🎰', '🎳'],
  '🌍': ['🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🌋', '🏔️', '⛰️', '🏕️', '🏖️', '🏗️', '🏘️', '🏙️', '🏚️', '🏛️', '🏟️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '⛪', '🕌', '🕍', '⛩️', '🕋'],
};

const FORMATTING_BUTTONS = [
  { label: 'B', wrapper: '*', title: 'Bold (*text*)', style: 'font-bold' },
  { label: 'I', wrapper: '_', title: 'Italic (_text_)', style: 'italic' },
  { label: 'S', wrapper: '~', title: 'Strikethrough (~text~)', style: 'line-through' },
  { label: '<>', wrapper: '`', title: 'Monospace (`text`)', style: 'font-mono text-xs' },
];

export default function ChatWindow({ conversation, instances, onSendMessage, onUpdate, showContactSidebar, onToggleContactSidebar }) {
  const [message, setMessage] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(instances[0]?.id || '');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiGroup, setEmojiGroup] = useState('😊');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [show3Dot, setShow3Dot] = useState(false);
  const [closingConv, setClosingConv] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

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
    setShowEmojiPicker(false);
    setShowTemplates(false);
    setAiSuggestion('');
    setShowSearch(false);
    setSearchQuery('');
  }, [conversation.id]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleLoadTemplates = async () => {
    setShowTemplates(true); // always show — X button closes it
    if (templates.length > 0) return; // already cached
    setTemplatesLoading(true);
    try {
      const { data } = await api.get('/templates');
      setTemplates(data.templates || data || []);
    } catch (e) {
      console.error('Failed to load templates', e);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Auto-show templates when user types exactly "/"
  useEffect(() => {
    if (message === '/') {
      setTemplates(prev => prev); // keep cache
      setShowTemplates(true);
      if (templates.length === 0) {
        api.get('/templates')
          .then(({ data }) => setTemplates(data.templates || data || []))
          .catch(() => { });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || !selectedInstance || sending) return;
    const content = message.trim();
    setSending(true);
    setAiSuggestion('');
    try {
      await onSendMessage({
        conversationId: conversation.id,
        instanceId: selectedInstance,
        content,
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
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
      setShowTemplates(false);
      setShow3Dot(false);
    }
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) { setMessage(m => m + emoji); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = message.substring(0, start) + emoji + message.substring(end);
    setMessage(newVal);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length;
      el.focus();
    }, 0);
  };

  const applyFormat = (wrapper) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = message.substring(start, end) || 'text';
    const newVal = message.substring(0, start) + wrapper + selected + wrapper + message.substring(end);
    setMessage(newVal);
    setTimeout(() => {
      el.selectionStart = start + wrapper.length;
      el.selectionEnd = end + wrapper.length;
      el.focus();
    }, 0);
  };

  const handleAiAssist = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const messages = (conversation.messages || []).slice(-10);
      const { data } = await api.post('/chat/ai-assist', {
        messages,
        contactName: conversation.contactName || conversation.contactNumber,
        instruction: ''
      });
      if (data.suggestion) setAiSuggestion(data.suggestion);
    } catch (e) {
      console.error('AI assist failed', e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedInstance) {
      alert('Please select a WhatsApp instance before attaching a file.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversation.id);
      formData.append('instanceId', selectedInstance);
      await api.post('/chat/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // File sent — conversation will update via socket event
    } catch (e) {
      // upload endpoint might not exist yet — show gentle warning
      const msg = e.response?.data?.error || e.message;
      if (e.response?.status === 404) {
        alert('File upload endpoint not yet deployed. Coming soon!');
      } else {
        alert('Failed to upload file: ' + msg);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCloseConversation = async () => {
    setShow3Dot(false);
    setClosingConv(true);
    try {
      const { data } = await api.put(`/chat/conversations/${conversation.id}/status`, { status: 'closed' });
      if (onUpdate) onUpdate(data.conversation);
    } catch (e) {
      alert('Failed to close conversation');
    } finally {
      setClosingConv(false);
    }
  };

  const handleMarkUnread = async () => {
    setShow3Dot(false);
    try {
      await api.put(`/chat/conversations/${conversation.id}/status`, { status: 'open' });
    } catch (e) { }
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
  const filteredMessages = searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-col h-full bg-transparent relative" onClick={() => { setShowEmojiPicker(false); setShow3Dot(false); }}>
      {/* Header */}
      <header className="h-[72px] border-b border-white/5 bg-transparent flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
            {(conversation.contactName || conversation.contactNumber)?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-[15px] text-white tracking-tight flex items-center gap-2">
              {conversation.contactName || conversation.contactNumber}
              {conversation.lifecycleStage ? (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider"
                  style={{
                    backgroundColor: `${conversation.lifecycleStage.color}15` || 'rgba(59, 130, 246, 0.1)',
                    color: conversation.lifecycleStage.color || '#3b82f6',
                    borderColor: `${conversation.lifecycleStage.color}30` || 'rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {conversation.lifecycleStage.name}
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  New Lead
                </span>
              )}
              {conversation.labels?.length > 0 && conversation.labels.map(lbl => (
                <span key={lbl} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {lbl}
                </span>
              ))}
            </h3>
            <p className="text-xs text-zinc-500">{formatPhoneNumber(conversation.contactNumber)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); setSearchQuery(''); }}
            className={`p-2 rounded-xl transition-all ${showSearch ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
            title="Search in conversation"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all" title="Voice call (coming soon)"><PhoneIcon className="w-5 h-5" /></button>
          <button className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all" title="Video call (coming soon)"><VideoCameraIcon className="w-5 h-5" /></button>
          <div className="w-px h-5 bg-white/10 mx-1"></div>
          <button
            className={`p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all ${showContactSidebar ? 'text-white bg-white/5' : ''}`}
            onClick={onToggleContactSidebar}
            title="Toggle Contact Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>

          {/* 3-dot menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShow3Dot(!show3Dot); }}
              className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {show3Dot && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 py-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleCloseConversation}
                  disabled={closingConv || conversation.status === 'closed'}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 disabled:opacity-40"
                >
                  <CheckIcon className="w-4 h-4 text-emerald-400" />
                  {conversation.status === 'closed' ? 'Already Closed' : 'Close Conversation'}
                </button>
                {conversation.status === 'closed' && (
                  <button
                    onClick={async () => { setShow3Dot(false); const { data } = await api.put(`/chat/conversations/${conversation.id}/status`, { status: 'open' }); if (onUpdate) onUpdate(data.conversation); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-blue-400" />
                    Reopen Conversation
                  </button>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(conversation.contactNumber); setShow3Dot(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3"
                >
                  <DocumentTextIcon className="w-4 h-4 text-zinc-400" />
                  Copy Phone Number
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={handleMarkUnread}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-zinc-400" />
                  Mark as Unread
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-zinc-950 border-b border-white/5 flex items-center gap-3">
          <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search in this conversation..."
            className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          {searchQuery && (
            <span className="text-xs text-zinc-500">
              {filteredMessages.length} match{filteredMessages.length !== 1 ? 'es' : ''}
            </span>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-zinc-500 hover:text-white">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Closed conversation banner */}
      {conversation.status === 'closed' && (
        <div className="mx-4 mt-3 px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-between">
          <span className="text-xs text-zinc-400">This conversation is closed.</span>
          <button
            onClick={async () => { const { data } = await api.put(`/chat/conversations/${conversation.id}/status`, { status: 'open' }); if (onUpdate) onUpdate(data.conversation); }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Reopen
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-transparent">
        {(searchQuery ? filteredMessages : messages).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-20">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-bold uppercase tracking-[0.2em]">{searchQuery ? 'No matches' : 'No Messages'}</p>
          </div>
        ) : (
          (searchQuery ? filteredMessages : messages).map((msg, idx) => {
            const isOut = msg.direction === 'outgoing';
            const allMsgs = searchQuery ? filteredMessages : messages;
            const showTime = idx === 0 || new Date(msg.createdAt) - new Date(allMsgs[idx - 1].createdAt) > 300000;
            const isHighlighted = searchQuery && msg.content?.toLowerCase().includes(searchQuery.toLowerCase());

            return (
              <div key={msg.id} className="space-y-2">
                {showTime && (
                  <div className="flex justify-center my-6 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <span className="relative px-3 py-1 bg-[#000000] text-[10px] font-bold text-zinc-500 uppercase tracking-widest rounded-full border border-white/5">
                      {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] group relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${isHighlighted ? 'ring-2 ring-yellow-400/50 rounded-2xl' : ''}`}>
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
                      {msg.mediaUrl && msg.messageType === 'document' && (
                        <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-xs text-blue-400 underline">
                          <DocumentTextIcon className="w-4 h-4" /> Download file
                        </a>
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

      {/* AI Suggestion Banner */}
      {aiSuggestion && (
        <div className="mx-4 mb-2 px-4 py-3 bg-indigo-950/70 border border-indigo-500/30 rounded-xl flex items-start gap-3">
          <BoltIcon className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-indigo-400 mb-1">AI Suggestion</p>
            <p className="text-sm text-zinc-200">{aiSuggestion}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setMessage(aiSuggestion); setAiSuggestion(''); inputRef.current?.focus(); }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
            >
              Use
            </button>
            <button onClick={() => setAiSuggestion('')} className="text-zinc-500 hover:text-white">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <footer className="px-6 pb-6 pt-2 bg-transparent shrink-0" onClick={e => e.stopPropagation()}>
        <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-visible flex flex-col focus-within:border-white/10 transition-colors shadow-lg relative">

          {/* Templates Panel */}
          {showTemplates && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Templates</span>
                <button onClick={() => setShowTemplates(false)} className="text-zinc-500 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
              </div>
              {templatesLoading ? (
                <div className="p-4 text-center text-zinc-500 text-sm">Loading...</div>
              ) : templates.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">No templates found</div>
              ) : (
                templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setMessage(t.content); setShowTemplates(false); inputRef.current?.focus(); }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                  >
                    <div className="font-semibold text-sm text-white mb-0.5">{t.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{t.content}</div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-40" onClick={e => e.stopPropagation()}>
              <div className="flex border-b border-white/5">
                {Object.keys(EMOJI_GROUPS).map(g => (
                  <button
                    key={g}
                    onClick={() => setEmojiGroup(g)}
                    className={`flex-1 py-2 text-lg transition-colors ${emojiGroup === g ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                {EMOJI_GROUPS[emojiGroup].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { insertEmoji(emoji); setShowEmojiPicker(false); }}
                    className="text-xl w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instance Selector Bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#18181b]">
            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            </div>
            {instances.length > 1 ? (
              <select
                value={selectedInstance}
                onChange={e => setSelectedInstance(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-300 outline-none cursor-pointer"
              >
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id} className="bg-zinc-900">{inst.instanceName}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold text-zinc-300">
                {instances.find(i => i.id === selectedInstance)?.instanceName || 'No Instance Connected'}
              </span>
            )}
          </div>

          {/* Formatting Bar */}
          {showFormatBar && (
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/5 bg-[#18181b]">
              {FORMATTING_BUTTONS.map(btn => (
                <button
                  key={btn.label}
                  onClick={() => applyFormat(btn.wrapper)}
                  title={btn.title}
                  className={`px-2 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ${btn.style}`}
                >
                  {btn.label}
                </button>
              ))}
              <div className="w-px h-4 bg-white/10 mx-1" />
              <span className="text-[10px] text-zinc-600 italic">WhatsApp markdown: *bold*, _italic_, ~strike~, `mono`</span>
            </div>
          )}

          {/* Text Input */}
          <div className="px-4 py-3 bg-[#18181b]">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... ('/' for templates, ':' for emojis)"
              rows={1}
              className="w-full bg-transparent text-[15px] text-zinc-100 outline-none resize-none placeholder:text-zinc-600"
              style={{ maxHeight: '160px', minHeight: '24px' }}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#18181b] border-t border-white/5">
            <div className="flex items-center gap-1">
              {/* Formatting Toggle */}
              <button
                onClick={() => setShowFormatBar(!showFormatBar)}
                className={`p-1.5 rounded-lg transition-colors ${showFormatBar ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                title="Toggle Formatting"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>

              {/* Attach File */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`p-1.5 rounded-lg transition-colors ${uploading ? 'text-indigo-400 animate-pulse' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                title="Attach File"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*,application/pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />

              {/* Emoji */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); setShowTemplates(false); }}
                className={`p-1.5 rounded-lg transition-colors ${showEmojiPicker ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                title="Insert Emoji"
              >
                <FaceSmileIcon className="w-5 h-5" />
              </button>

              {/* Templates */}
              <button
                onClick={() => { setShowEmojiPicker(false); handleLoadTemplates(); }}
                className={`p-1.5 rounded-lg transition-colors ${showTemplates ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                title="Templates"
              >
                <DocumentTextIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Assist */}
              <button
                onClick={handleAiAssist}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <BoltIcon className="w-4 h-4" />
                )}
                AI Assist
              </button>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={!message.trim() || !selectedInstance || sending}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${!message.trim() || sending
                    ? 'bg-zinc-800 text-zinc-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.4)]'
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
