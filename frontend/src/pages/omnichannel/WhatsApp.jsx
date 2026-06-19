import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp, getTenantId } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function WhatsApp() {
  const { addToast, token, tenantId } = useApp();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Unread, Bots, AI, Waiting
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inbox Data
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      // Fire multiple times to account for dynamic height calculations/rendering
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 30);
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 100);
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 250);
    }
  }, []);

  // Auto scroll to bottom of chat thread when messages array or active chat changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId, scrollToBottom]);



  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || getTenantId() || '96722',
  }), [token, tenantId]);

  // Fetch all active WhatsApp conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setConversations(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 5 seconds for real-time emulation
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Fetch message history for the active conversation
  const fetchMessages = useCallback(async (leadId) => {
    if (!leadId) return;
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${leadId}/messages`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setMessages(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId, fetchMessages]);

  // Poll for messages of the active chat every 2.5 seconds
  useEffect(() => {
    if (!activeChatId) return;
    const interval = setInterval(() => fetchMessages(activeChatId), 2500);
    return () => clearInterval(interval);
  }, [activeChatId, fetchMessages]);

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0];

  const selectConversation = (id) => {
    setActiveChatId(id);
  };

  const handleSend = async () => {
    if (!message.trim() || !activeChatId) return;

    // Optimistically prepend local chat preview
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { sender: 'agent', text: message, time: timeNow };
    setMessages(prev => [...prev, newMsg]);

    const bodyText = message;
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${activeChatId}/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: bodyText })
      });
      if (res.ok) {
        fetchMessages(activeChatId);
      } else {
        addToast('Failed to send message', 'error');
      }
    } catch {
      addToast('Network error sending message', 'error');
    }
  };

  const handleTakeover = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${activeChatId}/takeover`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        addToast('Assigned chat to yourself', 'success');
        fetchConversations();
      } else {
        addToast('Failed to take over conversation', 'error');
      }
    } catch {
      addToast('Network error during takeover', 'error');
    }
  };

  const handleReturnToBot = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${activeChatId}/return-to-bot`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        addToast('Conversation returned to AI Bot Responder', 'info');
        fetchConversations();
      } else {
        addToast('Failed to return conversation to bot', 'error');
      }
    } catch {
      addToast('Network error returning to bot', 'error');
    }
  };


  // Filter conversations
  const filteredConversations = conversations.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chat.phone.includes(searchQuery) ||
                          chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return chat.unread > 0;
    if (activeFilter === 'Bots') return chat.botHandled;
    if (activeFilter === 'AI') return chat.botHandled;
    if (activeFilter === 'Waiting') return chat.waiting;
    return true;
  });

  // Helper to generate a consistent color based on name
  const getAvatarBgColor = (name) => {
    const colors = [
      'bg-emerald-600',
      'bg-teal-600',
      'bg-green-600',
      'bg-cyan-600',
      'bg-blue-600',
      'bg-indigo-600',
      'bg-purple-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return 'WA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="flex h-[calc(100vh-110px)] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md">
        
        {/* Pane 1: WhatsApp-like Header & Conversation List */}
        <section className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {/* Header with settings menu */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Chats
            </h2>
            <div className="flex items-center gap-2 relative">
              <button onClick={() => addToast('Create new chat')} className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all" title="New Chat">
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
              <button onClick={() => addToast('Search chats')} className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all" title="Search">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                title="More Options"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50">
                  <button 
                    onClick={() => { navigate('/omnichannel/whatsapp/automation'); setSettingsOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 font-bold"
                  >
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    Show Automation Dashboard
                  </button>
                  <button 
                    onClick={() => { addToast('API configuration active'); setSettingsOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400">api</span>
                    API Connection Config
                  </button>
                  <button 
                    onClick={() => { addToast('Notification alerts configured'); setSettingsOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400">notifications</span>
                    Manage Notifications
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Input Box */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs shadow-inner">
              <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px] shrink-0">search</span>
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs w-full placeholder-slate-450 dark:text-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-450 hover:text-slate-600 dark:text-slate-450 dark:hover:text-slate-350">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter buttons */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-slate-900">
            {['All', 'Unread', 'Bots', 'AI', 'Waiting'].map(filter => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => { setActiveFilter(filter); }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Chat List Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white dark:bg-slate-900">
            {filteredConversations.map(chat => {
              const isActive = activeChatId === chat.id;
              const initials = getInitials(chat.name);
              const avatarBg = getAvatarBgColor(chat.name);

              return (
                <div 
                  key={chat.id}
                  onClick={() => selectConversation(chat.id)}
                  className={`rounded-lg p-3 cursor-pointer relative transition-all ${
                    isActive 
                      ? 'bg-emerald-50/50 dark:bg-slate-800 border-l-4 border-l-emerald-600' 
                      : chat.waiting
                        ? 'bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 border-l-4 border-l-amber-500 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full ${avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                        {initials}
                      </div>
                      {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{chat.name}</h4>
                          {chat.botHandled && (
                            <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase shrink-0">
                              BOT
                            </span>
                          )}
                          {chat.waiting && (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase shrink-0 animate-pulse">
                              WAITING
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 font-medium text-[10px] shrink-0">{chat.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px] truncate">
                        {chat.botHandled ? (
                          <span className="material-symbols-outlined text-[13px] text-indigo-500 shrink-0">smart_toy</span>
                        ) : (
                          <span className="material-symbols-outlined text-[13px] text-emerald-500 shrink-0">person</span>
                        )}
                        <span className="truncate">{chat.lastMessage || 'No messages yet'}</span>
                      </div>
                    </div>
                  </div>
                  {chat.unread > 0 && (
                    <div className="absolute right-3 bottom-3 bg-emerald-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                      {chat.unread}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredConversations.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 block mb-2">chat_bubble_outline</span>
                No chats match this filter.
              </div>
            )}
          </div>
        </section>

        {/* Active Chat & Detail Panes */}
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-slate-950/40 border-l border-slate-200 dark:border-slate-800">
            <div className="text-center max-w-md p-6">
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[48px]">chat</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">WhatsApp Business</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Send and receive messages from your customers. Select a conversation to start chatting.
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-400 font-semibold">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Pane 2: Active Chat Window (Wide) */}
            <section className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative">
              <header className="h-[64px] flex justify-between items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                    {getInitials(activeChat.name)}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{activeChat.name}</h3>
                      {activeChat.botHandled && (
                        <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase shrink-0">
                          BOT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      📞 {activeChat.phone}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {/* Takeover vs Return to Bot Button */}
                  {activeChat.botHandled ? (
                    <button 
                      onClick={handleTakeover}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-bold text-xs shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">lock</span>
                      <span>Take Over</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleReturnToBot}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f70] text-white transition-all font-bold text-xs shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                      <span>Return to Bot</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      showDetails 
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-slate-800' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Toggle Contact Info"
                  >
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </button>
                  <button 
                    onClick={() => addToast('More options')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="More Options"
                  >
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
              </header>

              {/* Chat Thread stream with classic sand background */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 relative"
                style={{
                  backgroundColor: '#efeae2',
                  backgroundImage: 'radial-gradient(#dfdcd6 1px, transparent 1px)',
                  backgroundSize: '15px 15px'
                }}
              >
                {messages.map((msg, idx) => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={idx} className="flex justify-center">
                        <span className="bg-[#f0ebd8] dark:bg-slate-800/95 border border-slate-200/50 dark:border-slate-700/50 text-slate-750 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isOutgoing = msg.sender === 'agent' || msg.sender === 'bot';

                  if (!isOutgoing) {
                    // Incoming (left-aligned)
                    return (
                      <div key={idx} className="flex flex-col items-start gap-1 max-w-[80%]">
                        <div className="bg-white text-slate-800 p-2.5 rounded-xl rounded-tl-none shadow-sm text-[13px] leading-relaxed relative min-w-[120px]">
                          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-[12px]">bolt</span>
                            {activeChat.name}
                          </div>
                          {msg.image && (
                            <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                              <img className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90" src={msg.image} alt="Upload" onClick={() => addToast('Opening full scale image')}/>
                            </div>
                          )}
                          <p className="pr-10 whitespace-pre-wrap">{msg.text}</p>
                          <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 select-none">
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Outgoing (right-aligned)
                  const isBot = msg.sender === 'bot';
                  return (
                    <div key={idx} className="flex flex-col items-end gap-1 max-w-[80%] ml-auto">
                      <div className={`text-slate-800 p-2.5 rounded-xl rounded-tr-none shadow-sm text-[13px] leading-relaxed relative min-w-[120px] ${
                        isBot 
                          ? 'bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200/60 dark:border-indigo-850/50' 
                          : 'bg-[#d1fae5] dark:bg-emerald-950/30'
                      }`}>
                        {isBot && (
                          <div className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5 border-b border-indigo-100 dark:border-indigo-900/50 pb-0.5 select-none">
                            <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                            <span>AI Responder</span>
                          </div>
                        )}
                        {!isBot && (
                          <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5 border-b border-emerald-100 dark:border-emerald-900/50 pb-0.5 select-none">
                            <span className="material-symbols-outlined text-[13px]">person</span>
                            <span>Agent Reply</span>
                          </div>
                        )}
                        {msg.image && (
                          <div className={`mb-2 max-w-full rounded-lg overflow-hidden border shadow-sm ${isBot ? 'border-indigo-150' : 'border-emerald-100'}`}>
                            <img className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90" src={msg.image} alt="Upload" onClick={() => addToast('Opening full scale image')}/>
                          </div>
                        )}
                        <p className="pr-12 whitespace-pre-wrap">{msg.text}</p>
                        
                        {msg.isLockerMenu && (
                          <div className="mt-3 flex flex-wrap gap-1.5 pb-1">
                            <button className="bg-white text-emerald-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors" onClick={() => addToast('Selected: View Locker Prices')}>View Locker Details</button>
                            <button className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors" onClick={() => addToast('Selected: Contact Support')}>Contact Staff</button>
                          </div>
                        )}

                        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] text-slate-450 select-none">
                          <span>{msg.time}</span>
                          <span className="material-symbols-outlined text-[12px] text-sky-555 font-bold">done_all</span>
                        </div>
                      </div>
                    </div>
                  );

                })}
              </div>

              {/* Floating scroll to bottom arrow */}
              <div className="absolute bottom-24 right-6 z-20">
                <button 
                  onClick={() => {
                    const el = document.querySelector('.overflow-y-auto');
                    if (el) el.scrollTop = el.scrollHeight;
                  }}
                  className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-slate-650 hover:text-slate-800 dark:text-slate-350 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:scale-105"
                  title="Scroll to bottom"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </button>
              </div>

              {/* Input area footer */}
              <footer className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar">
                  <button className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-55 dark:bg-slate-900 text-slate-650 dark:text-slate-350 text-[11px] font-semibold rounded-full border border-slate-200 dark:border-slate-700 transition-colors" onClick={() => addToast('Quick Replies list opened')}>
                    <span className="material-symbols-outlined text-[14px]">bolt</span> Quick Replies
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-55 dark:bg-slate-900 text-slate-650 dark:text-slate-350 text-[11px] font-semibold rounded-full border border-slate-200 dark:border-slate-700 transition-colors" onClick={() => addToast('Broadcast templates opened')}>
                    <span className="material-symbols-outlined text-[14px]">note_add</span> Templates
                  </button>
                </div>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 gap-2 shadow-inner">
                  <button className="w-8 h-8 flex items-center justify-center text-slate-450 hover:text-emerald-600 transition-colors" title="Emoji selector" onClick={() => addToast('Emoji selector opened')}>
                    <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-slate-450 hover:text-emerald-600 transition-colors" title="Attach file" onClick={() => addToast('Attachment selector opened')}>
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>
                  <input 
                    type="text" 
                    value={message} 
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message"
                    className="flex-1 bg-transparent border-none text-xs focus:ring-0 focus:outline-none placeholder-slate-400 dark:text-white"
                  />
                  <button className="w-8 h-8 flex items-center justify-center text-slate-450 hover:text-emerald-600 transition-colors" title="Record voice message" onClick={() => addToast('Microphone recording simulator started')}>
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </button>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white w-8 h-8 flex items-center justify-center rounded-lg shadow transition-colors" onClick={handleSend}>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </footer>
            </section>

            {/* Pane 3: Customer 360 Sidebar */}
            {showDetails && (
              <section className="w-80 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto shrink-0 p-6 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white dark:border-slate-800 shadow-md overflow-hidden bg-orange-105 text-orange-850 flex items-center justify-center font-bold text-xl">
                    {getInitials(activeChat.name)}
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-base">{activeChat.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{activeChat.role || 'Visitor'}, {activeChat.company || 'WhatsApp Contact'}</p>
                  <div className="mt-3 flex justify-center gap-1.5 text-[9px] font-bold">
                    {activeChat.tags && activeChat.tags.map(tag => (
                      <span key={tag} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5 text-xs">
                  <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Contact Details</h5>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-base">mail</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate">{activeChat.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-base">phone</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">+{activeChat.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-base">location_on</span>
                    <span className="text-slate-700 dark:text-slate-300">{activeChat.location || 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                  <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Lead Score</h5>
                  <div className="text-2xl font-black text-emerald-600">{activeChat.score || 50}<span className="text-xs font-semibold text-slate-400">/100</span></div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${activeChat.score || 50}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider px-1">Quick Actions</h5>
                  <button onClick={() => addToast('Task created')} className="w-full flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:bg-emerald-50/50 hover:border-emerald-200 dark:hover:bg-slate-800 transition-all group font-bold text-xs text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-slate-450 group-hover:text-emerald-600">task_alt</span>
                    <span>Create Task</span>
                  </button>
                  <button onClick={() => addToast('Invoice sheet opened')} className="w-full flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:bg-emerald-50/50 hover:border-emerald-200 dark:hover:bg-slate-800 transition-all group font-bold text-xs text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-slate-450 group-hover:text-emerald-600">receipt_long</span>
                    <span>Create Invoice</span>
                  </button>
                  <button onClick={() => addToast('Quote generator opened')} className="w-full flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:bg-emerald-50/50 hover:border-emerald-200 dark:hover:bg-slate-800 transition-all group font-bold text-xs text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-slate-450 group-hover:text-emerald-600">request_quote</span>
                    <span>Send Quote</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider px-1">Activity Timeline</h5>
                  <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
                    <div className="relative pl-7 text-xs">
                      <div className="absolute left-0 top-0.5 w-[22px] h-[22px] bg-emerald-600 text-white rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px]">chat_bubble</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">WhatsApp Session</p>
                      <p className="text-[10px] text-slate-400">Active Now · {activeChat.time}</p>
                    </div>
                    <div className="relative pl-7 text-xs">
                      <div className="absolute left-0 top-0.5 w-[22px] h-[22px] bg-purple-500 text-white rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px]">mail</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">Lead Tag Assigned</p>
                      <p className="text-[10px] text-slate-400">Today, 10:00 AM</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
