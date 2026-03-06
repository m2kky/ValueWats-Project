import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatPhoneNumber } from '../../utils/formatters';
import { 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  DevicePhoneMobileIcon,
  ChatBubbleBottomCenterTextIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const channelIcons = {
  whatsapp: DevicePhoneMobileIcon,
  messenger: ChatBubbleBottomCenterTextIcon,
  instagram: CameraIcon
};

export default function ConversationList({ conversations, selectedId, onSelect, loading, onSync, syncing, activeFilter = 'all', showFilters, onToggleFilters }) {
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
          <div className="flex gap-4">
            <button className="text-[1.3rem] font-bold text-white tracking-tight border-b-2 border-indigo-500 pb-1">
              Chats
            </button>
            <button className="text-[1.3rem] font-bold text-zinc-500 hover:text-white transition-colors pb-1">
              Calls
            </button>
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={onToggleFilters}
              title={showFilters ? 'Close Filters' : 'Open Filters'}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition-all flex items-center justify-center ${showFilters ? 'text-indigo-400 bg-white/5' : ''}`}
            >
              {showFilters ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <path d="M15 16l-4-4 4-4"></path>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <path d="M11 8l4 4-4 4"></path>
                </svg>
              )}
            </button>
            <div className="w-px h-5 bg-white/10 mx-1"></div>
            <button
              onClick={onSync}
              disabled={syncing}
              title="Sync Chats"
              className={`p-1.5 rounded-full hover:bg-white/5 text-zinc-400 transition-all ${syncing ? 'animate-spin opacity-50' : ''}`}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowSearchBar(!showSearchBar); setSearchTerm(''); }}
              title="Search conversations"
              className={`p-1.5 rounded-full hover:bg-white/5 transition-all ${showSearchBar ? 'text-white bg-white/5' : 'text-zinc-400'}`}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>
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

        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/20">
          <button className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
            Open, Newest
            <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Unread</span>
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
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-8 text-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <MagnifyingGlassIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest">{searchTerm ? 'No matches' : 'Empty'}</p>
          </div>
        ) : (
          filtered.map(conv => {
            const ChannelIcon = channelIcons[conv.channelType || 'whatsapp'] || DevicePhoneMobileIcon;
            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative
                  ${selectedId === conv.id
                    ? 'bg-white/10'
                    : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
              >
                {selectedId === conv.id && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(71,37,244,0.5)]"></div>
                )}

                <div className="relative shrink-0 mt-0.5 ml-2">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-transform group-hover:scale-105 shadow-md
                    ${selectedId === conv.id ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white' : 'bg-white/10 text-white'}`}>
                    <span>{(conv.contactName || conv.contactNumber)?.[0]?.toUpperCase() || '?'}</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#18181b] rounded-full flex items-center justify-center border border-white/5">
                    <ChannelIcon className={`w-2.5 h-2.5 ${conv.channelType === 'whatsapp' ? 'text-emerald-500' : conv.channelType === 'messenger' ? 'text-blue-500' : 'text-pink-500'}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                  <div className="flex justify-between items-baseline mb-0.5 w-full">
                    <span className={`text-[15px] font-semibold truncate tracking-tight
                      ${selectedId === conv.id ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                      {conv.contactName || (conv.channelType === 'whatsapp' ? formatPhoneNumber(conv.contactNumber) : conv.contactNumber)}
                    </span>
                    <span className={`text-[11px] font-medium shrink-0 ml-2
                      ${conv.unreadCount > 0 ? 'text-indigo-400 font-bold' : 'text-zinc-500'}`}>
                      {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </span>
                  </div>

                  <div className="flex justify-between items-start mt-0.5">
                    <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                      <p className={`text-[13px] truncate flex items-center gap-1.5
                        ${conv.unreadCount > 0 ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                        {conv.unreadCount === 0 && conv.direction === 'outgoing' && (
                          <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span className="truncate">{conv.lastMessage || 'No discussion yet'}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {conv.lifecycleStage ? (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border"
                            style={{
                              backgroundColor: `${conv.lifecycleStage.color}15` || 'rgba(59, 130, 246, 0.1)',
                              color: conv.lifecycleStage.color || '#3b82f6',
                              borderColor: `${conv.lifecycleStage.color}20` || 'rgba(59, 130, 246, 0.15)'
                            }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full mr-1.5 opacity-80" style={{ backgroundColor: conv.lifecycleStage.color || '#3b82f6' }}></div>
                            {conv.lifecycleStage.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <div className="w-1.5 h-1.5 rounded-full mr-1.5 opacity-80 bg-blue-400"></div>
                            New Lead
                          </span>
                        )}

                        {/* Labels */}
                        {(conv.labels || []).slice(0, 2).map(lbl => (
                          <span key={lbl} className="inline-flex items-center px-1.5 py-[1px] rounded-[4px] text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {lbl}
                          </span>
                        ))}

                        {conv.isGroup && (
                          <span className="inline-flex items-center px-1.5 py-[1px] rounded-[4px] text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                            👥 Group
                          </span>
                        )}

                        {conv.instanceName && (
                          <span className="inline-flex items-center px-1.5 py-[1px] rounded-[4px] text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/80 max-w-[100px] truncate" title={`Instance: ${conv.instanceName}`}>
                            <ChannelIcon className="w-2.5 h-2.5 mr-1" /> {conv.instanceName}
                          </span>
                        )}

                        {conv.assignedUser ? (
                          <span className="inline-flex items-center px-1.5 py-[1px] rounded-[4px] text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/80">
                            {conv.assignedUser.email.split('@')[0]}
                          </span>
                        ) : conv.currentAgentId ? (
                          <span className="inline-flex items-center px-1.5 py-[1px] rounded-[4px] text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            🤖 Bot
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="ml-2 mt-1 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white shadow-[0_0_10px_rgba(71,37,244,0.4)] shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
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
