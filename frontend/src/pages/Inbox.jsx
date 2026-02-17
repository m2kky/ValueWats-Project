import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../api/client';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import '../styles/inbox.css';

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Setup socket connection
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.tenantId) return;

    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '');
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      newSocket.emit('join_tenant', user.tenantId);
      console.log('[Inbox] Socket connected, joined tenant room');
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    socket.on('chat:message_received', ({ conversation, message }) => {
      console.log('[Inbox] Received message:', message);

      // Update conversations list
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        if (exists) {
          return prev
            .map(c => c.id === conversation.id ? { ...c, ...conversation } : c)
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        }
        return [conversation, ...prev];
      });

      // If this conversation is selected, add message to it
      setSelectedConversation(prev => {
        if (prev && prev.id === conversation.id) {
          return {
            ...prev,
            ...conversation,
            unreadCount: 0,
            messages: [...(prev.messages || []), message]
          };
        }
        return prev;
      });
    });

    socket.on('chat:message_sent', ({ conversationId, message }) => {
      setSelectedConversation(prev => {
        if (prev && prev.id === conversationId) {
          // Avoid duplicates
          const exists = prev.messages?.some(m => m.id === message.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), message]
          };
        }
        return prev;
      });
    });

    return () => {
      socket.off('chat:message_received');
      socket.off('chat:message_sent');
    };
  }, [socket]);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
    fetchInstances();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const { data } = await api.get('/instances');
      const connected = (data.instances || data || []).filter(i => i.status === 'connected');
      setInstances(connected);
    } catch (error) {
      console.error('Failed to fetch instances:', error);
    }
  };

  const handleSelectConversation = useCallback(async (conversation) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conversation.id}`);
      setSelectedConversation(data.conversation || data);

      // Update unread count locally
      setConversations(prev =>
        prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
      );
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async (messageData) => {
    try {
      const { data } = await api.post('/chat/messages/send', messageData);
      const sentMessage = data.message;

      // Optimistically add to UI
      if (sentMessage) {
        setSelectedConversation(prev => {
          if (!prev) return prev;
          const exists = prev.messages?.some(m => m.id === sentMessage.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), sentMessage]
          };
        });

        // Update conversation list
        setConversations(prev =>
          prev.map(c => c.id === messageData.conversationId
            ? { ...c, lastMessage: messageData.content?.substring(0, 100), lastMessageAt: new Date().toISOString() }
            : c
          ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  }, []);

  const handleConversationUpdate = useCallback((updatedConversation) => {
    // Update list
    setConversations(prev =>
      prev.map(c => c.id === updatedConversation.id ? { ...c, ...updatedConversation } : c)
    );
    // Update selected
    setSelectedConversation(prev => 
      prev && prev.id === updatedConversation.id ? { ...prev, ...updatedConversation } : prev
    );
  }, []);

  return (
    <div className="inbox-container">
      {/* Conversation List Sidebar */}
      <aside className="inbox-sidebar">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          loading={loading}
        />
      </aside>

      {/* Chat Window */}
      <main className="inbox-main">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            instances={instances}
            onSendMessage={handleSendMessage}
            onUpdate={handleConversationUpdate}
          />
        ) : (
          <div className="inbox-empty-state">
            <div className="inbox-empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2>Select a conversation</h2>
            <p>Choose a conversation from the sidebar to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}

