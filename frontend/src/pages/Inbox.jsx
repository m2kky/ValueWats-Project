import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import usePageTitle from '../hooks/usePageTitle';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import ContactSidebar from '../components/chat/ContactSidebar';
import InboxFiltersSidebar from '../components/chat/InboxFiltersSidebar';
import '../styles/inbox.css';
import { 
  UserCircleIcon, 
  ChatBubbleLeftRightIcon, 
  BoltIcon, 
  UserCircleIcon as UserIcon, 
  InboxIcon 
} from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';

export default function Inbox() {
  usePageTitle('Inbox');
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [initialSynced, setInitialSynced] = useState(false);
  const [showContactSidebar, setShowContactSidebar] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [instances, setInstances] = useState([]);
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      const list = Array.isArray(data) ? data : (data.conversations || []);
      setConversations(list);
      return list;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  }, []);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (data) => {
      const { conversation, message } = data;
      
      // Update conversations list (move to top, increment unread, etc)
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        const updatedConversation = {
          ...(exists || conversation),
          lastMessage: message.content?.substring(0, 100) || '[Media]',
          lastMessageAt: message.createdAt || new Date().toISOString(),
          unreadCount: (exists ? exists.unreadCount : 0) + 1
        };
        
        return [updatedConversation, ...prev.filter(c => c.id !== conversation.id)];
      });

      // If this is the currently open conversation, append the message
      setSelectedConversation(prev => {
        if (!prev || prev.id !== conversation.id) return prev;
        
        // Prevent duplicate messages
        if (prev.messages && prev.messages.some(m => m.id === message.id)) {
          return prev;
        }

        // Mark as read immediately if it's the active chat
        api.get(`/chat/conversations/${conversation.id}`).catch(() => {});
        setConversations(list => list.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c));

        return {
          ...prev,
          messages: [...(prev.messages || []), message]
        };
      });
    };

    socket.on('chat:message_received', handleMessageReceived);
    return () => {
      socket.off('chat:message_received', handleMessageReceived);
    };
  }, [socket]);

  // Auto-sync + fetch on mount
  useEffect(() => {
    const initInbox = async () => {
      try {
        setLoading(true);
        setSyncing(true);

        await api.post('/chat/sync').catch(err => {
          console.warn('[Inbox] Auto-sync failed (non-fatal):', err.message);
        });

        setSyncing(false);
        await fetchConversations();
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
  }, [fetchConversations]);

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
      await fetchConversations();
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
    setConversations(prev =>
      prev.map(c => c.id === updatedConversation.id ? { ...c, ...updatedConversation } : c)
    );
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-[40px] blur-2xl animate-pulse"></div>
                <div className="relative w-full h-full bg-[#18181b] rounded-[40px] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <ChatBubbleLeftRightIcon className="w-14 h-14 text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>

              {syncing ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Syncing Your World</h2>
                  <p className="text-zinc-400 text-base font-medium max-w-md mx-auto leading-relaxed">
                    We're currently pulling conversations from all your connected channels. Sit tight while we organize your workspace.
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Select a Conversation</h2>
                  <p className="text-zinc-400 text-base font-medium max-w-md mx-auto leading-relaxed">
                    Pick a discussion from the sidebar to view messages, manage contact details, or handover to an AI agent.
                  </p>
                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><BoltIcon className="w-5 h-5" /></div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Handover</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><UserIcon className="w-5 h-5" /></div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">CRM Sync</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><InboxIcon className="w-5 h-5" /></div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Multi-Channel</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
