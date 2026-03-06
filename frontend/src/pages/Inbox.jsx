import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../api/client';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import ContactSidebar from '../components/chat/ContactSidebar';
import InboxFiltersSidebar from '../components/chat/InboxFiltersSidebar';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import '../styles/inbox.css';

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [instances, setInstances] = useState([]);
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [initialSynced, setInitialSynced] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [showContactSidebar, setShowContactSidebar] = useState(true);

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

  // Auto-sync + fetch on mount
  useEffect(() => {
    const initInbox = async () => {
      try {
        setLoading(true);
        setSyncing(true);

        // 1. Auto-sync chats from Evolution API (pulls old chats with names)
        await api.post('/chat/sync').catch(err => {
          console.warn('[Inbox] Auto-sync failed (non-fatal):', err.message);
        });

        setSyncing(false);

        // 2. Then fetch conversations
        const { data } = await api.get('/chat/conversations');
        setConversations(data.conversations || []);
        setInitialSynced(true);
      } catch (error) {
        console.error('Failed to initialize inbox:', error);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    };

    initInbox();
    fetchInstances();
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const [agentsRes, teamRes] = await Promise.all([
        api.get('/agents').catch(() => ({ data: [] })),
        api.get('/team').catch(() => ({ data: { users: [] } }))
      ]);

      const fetchedAgents = Array.isArray(agentsRes.data) ? agentsRes.data : (agentsRes.data?.agents || []);
      setAgents(fetchedAgents.filter(a => a.isActive));

      if (teamRes.data?.users) setUsers(teamRes.data.users);
    } catch (error) {
      console.error('Failed to fetch support data:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.post('/chat/sync');
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to sync chats:', error);
      alert('Failed to sync chats. Check logs.');
    } finally {
      setSyncing(false);
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
      {showFilters && (
        <InboxFiltersSidebar
          conversations={conversations}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Conversation List Sidebar */}
      <aside className="inbox-sidebar">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          loading={loading}
          onSync={handleSync}
          syncing={syncing}
          activeFilter={activeFilter}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />
      </aside>

      {/* Chat Window */}
      <main className="inbox-main flex-1 flex min-w-0">
        {selectedConversation ? (
          <>
            <div className="flex-1 min-w-0 h-full">
              <ChatWindow
                conversation={selectedConversation}
                instances={instances}
                onSendMessage={handleSendMessage}
                onUpdate={handleConversationUpdate}
                showContactSidebar={showContactSidebar}
                onToggleContactSidebar={() => setShowContactSidebar(!showContactSidebar)}
              />
            </div>
            {showContactSidebar && (
              <ContactSidebar
                conversation={selectedConversation}
                agents={agents}
                users={users}
                onToggle={() => setShowContactSidebar(!showContactSidebar)}
                onUpdate={handleConversationUpdate}
              />
            )}

            {/* Right Mini Toolbar (Like Image 2) */}
            <div className="w-12 h-full bg-[#0f0f11] border-l border-white/5 flex flex-col items-center py-4 gap-4 z-10">
              <button
                onClick={() => setShowContactSidebar(!showContactSidebar)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showContactSidebar ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                title="Toggle Contact Details"
              >
                <UserCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="inbox-empty-state">
            <div className="inbox-empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            {syncing ? (
              <>
                <h2>Syncing chats...</h2>
                <p>Pulling conversations from all channels. This may take a moment.</p>
              </>
            ) : (
              <>
                <h2>Select a conversation</h2>
                <p>Choose a conversation from the sidebar to start chatting</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
