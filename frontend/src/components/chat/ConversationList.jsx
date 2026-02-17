import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatPhoneNumber } from '../../utils/formatters';

export default function ConversationList({ conversations, selectedId, onSelect, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter(conv =>
    (conv.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contactNumber.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="conv-list">
        <div className="conv-list-header">
          <h2>Inbox</h2>
        </div>
        <div className="conv-list-loading">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="conv-skeleton">
              <div className="conv-skeleton-avatar" />
              <div className="conv-skeleton-text">
                <div className="conv-skeleton-line wide" />
                <div className="conv-skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="conv-list">
      {/* Header */}
      <div className="conv-list-header">
        <h2>Inbox</h2>
        <span className="conv-list-count">{conversations.length}</span>
      </div>

      {/* Search */}
      <div className="conv-list-search">
        <svg className="conv-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="conv-search-input"
        />
      </div>

      {/* List */}
      <div className="conv-list-items">
        {filtered.length === 0 ? (
          <div className="conv-list-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>{searchTerm ? 'No matching conversations' : 'No conversations yet'}</p>
          </div>
        ) : (
          filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`conv-item ${selectedId === conv.id ? 'conv-item--selected' : ''} ${conv.unreadCount > 0 ? 'conv-item--unread' : ''}`}
            >
              {/* Avatar */}
              <div className="conv-avatar">
                <span>{(conv.contactName || conv.contactNumber)?.[0]?.toUpperCase() || '?'}</span>
              </div>

              {/* Info */}
              <div className="conv-info">
                <div className="conv-info-top">
                  <span className="conv-name">
                    {conv.contactName || formatPhoneNumber(conv.contactNumber)}
                  </span>
                  <span className="conv-time">
                    {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="conv-info-bottom">
                  <span className="conv-preview">
                    {conv.lastMessage || 'No messages yet'}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="conv-badge">
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
