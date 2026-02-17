import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import ContactSidebar from './ContactSidebar';
import { formatPhoneNumber } from '../../utils/formatters';

export default function ChatWindow({ conversation, instances, onSendMessage, onUpdate }) {
  const [message, setMessage] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(instances[0]?.id || '');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  // Set default instance
  useEffect(() => {
    if (instances.length > 0 && !selectedInstance) {
      setSelectedInstance(instances[0].id);
    }
  }, [instances, selectedInstance]);

  // Focus input when conversation changes
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
    switch (status) {
      case 'sent': return '✓';
      case 'delivered':
      case 'DELIVERED': return '✓✓';
      case 'read':
      case 'READ': return '✓✓';
      default: return '⏳';
    }
  };

  const messages = conversation.messages || [];

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            <span>{(conversation.contactName || conversation.contactNumber)?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div className="chat-header-text">
            <div className="chat-header-name">
              {conversation.contactName || conversation.contactNumber}
            </div>
            <div className="chat-header-number">
              {conversation.contactNumber}
            </div>
          </div>
        </div>

        {/* Instance Selector */}
        <div className="chat-header-actions">
          <label className="chat-instance-label">Send from:</label>
          <select
            value={selectedInstance}
            onChange={(e) => setSelectedInstance(e.target.value)}
            className="chat-instance-select"
          >
            {instances.length === 0 ? (
              <option value="">No instances</option>
            ) : (
              instances.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.instanceName}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-messages-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`chat-bubble-wrapper ${msg.direction === 'outgoing' ? 'chat-bubble--out' : 'chat-bubble--in'}`}
            >
              <div className={`chat-bubble ${msg.direction === 'outgoing' ? 'chat-bubble-outgoing' : 'chat-bubble-incoming'}`}>
                {/* Content */}
                <div className="chat-bubble-content">
                  {msg.content || '[Media]'}
                </div>

                {/* Media */}
                {msg.mediaUrl && msg.messageType === 'image' && (
                  <img src={msg.mediaUrl} alt="" className="chat-bubble-media" />
                )}

                {/* Meta */}
                <div className={`chat-bubble-meta ${msg.direction === 'outgoing' ? 'chat-bubble-meta--out' : ''}`}>
                  <span className="chat-bubble-time">
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </span>
                  {msg.direction === 'outgoing' && (
                    <span className={`chat-bubble-status ${msg.status === 'read' || msg.status === 'READ' ? 'chat-bubble-status--read' : ''}`}>
                      {getStatusIcon(msg.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-container">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || !selectedInstance || sending}
            className="chat-send-btn"
            title="Send message"
          >
            {sending ? (
              <svg className="chat-send-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
