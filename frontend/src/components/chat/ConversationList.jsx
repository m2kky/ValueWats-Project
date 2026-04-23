import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatPhoneNumber } from '../../utils/formatters';
import { 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
  InboxIcon,
  UserIcon,
  UserGroupIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { getChannelIcon, channelColors, getChannelLabel } from './ChannelIcons';

export default function ConversationList({ conversations, selectedId, onSelect, loading, onSync, syncing, activeFilter = 'all', setActiveFilter, showFilters, onToggleFilters }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnread, setShowUnread] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (showSearchBar && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearchBar]);

  const filtered = conversations.filter(conv => {
    const matchesSearch = (conv.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contactNumber.includes(searchTerm);
    if (!matchesSearch) return false;

    if (showUnread && conv.unreadCount === 0) return false;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (activeFilter === 'mine') {
      return conv.assignedUserId === user.id;
    } else if (activeFilter === 'unassigned') {
      return !conv.assignedUserId && !conv.currentAgentId;
    } else if (activeFilter === 'team') {
      return !!conv.assignedUserId;
    } else if (activeFilter === 'bot') {
      return !!conv.currentAgentId;
    } else if (activeFilter.startsWith('stage_')) {
      const stageId = activeFilter.replace('stage_', '');
      return conv.lifecycleStageId === stageId;
    } else if (activeFilter.startsWith('label_')) {
      const label = activeFilter.replace('label_', '');
      return (conv.labels || []).includes(label);
    }

    return true;
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col h-full bg-zinc-950/20">
        <div className="p-6 border-b border-white/5">
          <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-white/5"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-white/5 rounded w-3/4"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-white/5 bg-[#0f0f11]">
      {/* Header */}
      <div className="flex flex-col border-b border-white/5">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-lg font-black text-white tracking-tight">Conversations</h2>
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={onToggleFilters}
              title={showFilters ? 'Close Filters' : 'Open Filters'}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition-all flex items-center justify-center ${showFilters ? 'text-indigo-400 bg-white/5' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            <button
              onClick={onSync}
              disabled={syncing}
              title="Sync Chats"
              className={`p-1.5 rounded-full hover:bg-white/5 text-zinc-400 transition-all ${syncing ? 'animate-spin opacity-50' : ''}`}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowSearchBar(!showSearchBar); setSearchTerm(''); }}
              title="Search conversations"
              className={`p-1.5 rounded-full hover:bg-white/5 transition-all ${showSearchBar ? 'text-white bg-white/5' : 'text-zinc-400'}`}
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Smart View Tabs */}
        <div className="flex items-center px-3 gap-1 pb-2">
          {[
            { key: 'all', label: 'All', icon: InboxIcon },
            { key: 'mine', label: 'Mine', icon: UserIcon },
            { key: 'unassigned', label: 'Unassigned', icon: UserGroupIcon },
            { key: 'bot', label: 'Bot', icon: CpuChipIcon },
          ].map(tab => {
            const isActive = activeFilter === tab.key;
            const TabIcon = tab.icon;
            const count = conversations.filter(c => {
              if (tab.key === 'all') return true;
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              if (tab.key === 'mine') return c.assignedUserId === user.id;
              if (tab.key === 'unassigned') return !c.assignedUserId && !c.currentAgentId;
              if (tab.key === 'bot') return !!c.currentAgentId;
              return true;
            }).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter && setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                  }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-zinc-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        {showSearchBar && (
          <div className="px-3 pb-2 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5">
              <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-zinc-500 hover:text-white">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/30 border-t border-white/[0.03]">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-500">Unread</span>
            <div
              className={`w-7 h-4 rounded-full relative cursor-pointer transition-all ${showUnread ? 'bg-indigo-500' : 'bg-white/10'}`}
              onClick={() => setShowUnread(!showUnread)}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showUnread ? 'left-3.5' : 'left-0.5 bg-zinc-400'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-in fade-in duration-700">
            <div className="w-20 h-20 mb-6 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <ChatBubbleBottomCenterTextIcon className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-white font-black text-sm mb-1 uppercase tracking-wider">
              {searchTerm ? 'No matches found' : 'No conversations yet'}
            </h3>
            <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-[200px] mx-auto">
              {searchTerm 
                ? `We couldn't find any chats matching "${searchTerm}". Try a different name or number.` 
                : 'Your inbox is clear. Start a campaign or sync to pull existing chats.'}
            </p>
            {!searchTerm && (
              <button 
                onClick={onSync}
                className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
              >
                Sync Now
              </button>
            )}
          </div>
        ) : (
          filtered.map(conv => {
            const ChannelIcon = getChannelIcon(conv.channelType);
            const colors = channelColors[conv.channelType || 'whatsapp'] || channelColors.whatsapp;
            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group relative
                  ${selectedId === conv.id
                    ? 'bg-indigo-500/10 border border-indigo-500/15'
                    : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
              >
                {selectedId === conv.id && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                )}

                {/* Avatar with channel badge */}
                <div className="relative shrink-0 mt-0.5 ml-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0 transition-transform group-hover:scale-105
                    ${selectedId === conv.id ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/[0.08] text-zinc-200'}`}>
                    <span>{(conv.contactName || conv.contactNumber)?.[0]?.toUpperCase() || '?'}</span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0f0f11] ${colors.bg}`}>
                    <ChannelIcon className={`w-2.5 h-2.5 ${colors.text}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Row 1: Name + Time */}
                  <div className="flex justify-between items-baseline mb-0.5 w-full">
                    <span className={`text-[14px] font-semibold truncate tracking-tight
                      ${selectedId === conv.id ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                      {conv.contactName || (conv.channelType === 'whatsapp' ? formatPhoneNumber(conv.contactNumber) : conv.contactNumber)}
                    </span>
                    <span className={`text-[10px] font-medium shrink-0 ml-2
                      ${conv.unreadCount > 0 ? 'text-indigo-400 font-bold' : 'text-zinc-600'}`}>
                      {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </span>
                  </div>

                  {/* Row 2: Last Message + Unread Badge */}
                  <div className="flex justify-between items-center">
                    <p className={`text-[12px] truncate flex items-center gap-1.5 flex-1
                      ${conv.unreadCount > 0 ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
                      {conv.unreadCount === 0 && conv.direction === 'outgoing' && (
                        <svg className="w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="truncate">{conv.lastMessage || 'No messages yet'}</span>
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 w-[18px] h-[18px] flex items-center justify-center rounded-full bg-indigo-500 text-[9px] font-black text-white shadow-[0_0_8px_rgba(99,102,241,0.4)] shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Labels - cleaner pill layout */}
                  <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                    {/* Lifecycle Stage */}
                    {conv.lifecycleStage ? (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[9px] font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: `${conv.lifecycleStage.color}12`,
                          color: conv.lifecycleStage.color || '#3b82f6',
                          borderColor: `${conv.lifecycleStage.color}25`
                        }}
                      >
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: conv.lifecycleStage.color || '#3b82f6' }}></div>
                        {conv.lifecycleStage.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[9px] font-bold uppercase tracking-wider bg-sky-500/8 text-sky-400 border border-sky-500/15">
                        <div className="w-1 h-1 rounded-full bg-sky-400"></div>
                        New
                      </span>
                    )}

                    {/* Custom Labels */}
                    {(conv.labels || []).slice(0, 2).map(lbl => (
                      <span key={lbl} className="inline-flex items-center px-1.5 py-[2px] rounded-md text-[9px] font-bold text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 truncate max-w-[70px]">
                        {lbl}
                      </span>
                    ))}

                    {/* Group indicator */}
                    {conv.isGroup && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-md text-[9px] font-bold text-zinc-400 bg-zinc-800/60 border border-zinc-700/50">
                        <UserGroupIcon className="w-2.5 h-2.5" /> Grp
                      </span>
                    )}

                    {/* Assigned agent */}
                    {conv.assignedUser ? (
                      <span className="inline-flex items-center px-1.5 py-[2px] rounded-md text-[9px] font-bold text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 truncate max-w-[60px]" title={conv.assignedUser.email}>
                        {conv.assignedUser.email.split('@')[0]}
                      </span>
                    ) : conv.currentAgentId ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-md text-[9px] font-bold text-violet-400 bg-violet-500/8 border border-violet-500/15">
                        <CpuChipIcon className="w-2.5 h-2.5" /> AI
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
