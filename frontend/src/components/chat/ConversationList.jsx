import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatPhoneNumber } from '../../utils/formatters';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ConversationList({ conversations, selectedId, onSelect, loading, onSync, syncing }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter(conv =>
    (conv.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contactNumber.includes(searchTerm)
  );

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
          <div className="flex items-center gap-2">
            <button
              onClick={onSync}
              disabled={syncing}
              title="Sync Chats from WhatsApp"
              className={`p-1.5 rounded-full hover:bg-white/5 text-zinc-400 transition-all ${syncing ? 'animate-spin opacity-50' : ''}`}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 transition-all">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/20">
          <button className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
            Open, Newest
            <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Unread</span>
            <div className="w-7 h-4 bg-white/10 rounded-full relative cursor-pointer">
              <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-zinc-400 rounded-full transition-all"></div>
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
          filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative
                ${selectedId === conv.id
                  ? 'bg-white/10'
                  : 'hover:bg-white/[0.03] border border-transparent'
                }`}
            >
              {/* Selected Indicator (left edge line) */}
              {selectedId === conv.id && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(71,37,244,0.5)]"></div>
              )}

              {/* Avatar */}
              <div className="relative shrink-0 mt-0.5 ml-2">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-transform group-hover:scale-105 shadow-md
                  ${selectedId === conv.id ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white' : 'bg-white/10 text-white'}`}>
                  <span>{(conv.contactName || conv.contactNumber)?.[0]?.toUpperCase() || '?'}</span>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#18181b] rounded-full"></div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                <div className="flex justify-between items-baseline mb-0.5 w-full">
                  <span className={`text-[15px] font-semibold truncate tracking-tight
                    ${selectedId === conv.id ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                    {conv.contactName || formatPhoneNumber(conv.contactNumber)}
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
                      {/* Read Receipt Mock */}
                      {conv.unreadCount === 0 && (
                        <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="truncate">{conv.lastMessage || 'No discussion yet'}</span>
                    </p>
                    {/* Badge */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                        New Lead
                      </span>
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
          ))
        )}
      </div>
    </div>
  );
}
