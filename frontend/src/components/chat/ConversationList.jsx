import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatPhoneNumber } from '../../utils/formatters';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ConversationList({ conversations, selectedId, onSelect, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter(conv =>
    (conv.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contactNumber.includes(searchTerm)
  );

  if (loading) {
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
    <div className="flex flex-col h-full border-r border-white/5 bg-zinc-950/30 backdrop-blur-xl">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white tracking-tight italic">INBOX</h2>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
            {conversations.length} TOTAL
          </span>
        </div>

        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
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
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 group relative
                ${selectedId === conv.id
                  ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_20px_rgba(71,37,244,0.05)]'
                  : 'hover:bg-white/[0.03] border border-transparent'
                }`}
            >
              {/* Selected Indicator */}
              {selectedId === conv.id && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(71,37,244,0.5)]"></div>
              )}

              {/* Avatar */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 transition-transform group-hover:scale-105
                ${selectedId === conv.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white'}`}>
                <span>{(conv.contactName || conv.contactNumber)?.[0]?.toUpperCase() || '?'}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className={`text-sm font-black truncate tracking-tight uppercase italic
                    ${selectedId === conv.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                    {conv.contactName || formatPhoneNumber(conv.contactNumber)}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase">
                    {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate font-medium
                    ${conv.unreadCount > 0 ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                    {conv.lastMessage || 'No discussion yet'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white shadow-[0_0_10px_rgba(71,37,244,0.4)]">
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
