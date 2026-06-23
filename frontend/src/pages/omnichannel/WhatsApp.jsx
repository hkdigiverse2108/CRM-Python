import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp, getTenantId } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

const emojiCategories = [
  {
    icon: '😊',
    name: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠']
  },
  {
    icon: '👋',
    name: 'People',
    emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️']
  },
  {
    icon: '❤️',
    name: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','🌟','⭐','✨','⚡','💥','🔥','🌈','☀️','🌤️','⛅','🌥️','☁️','🌧️','⛈️','🌩️','❄️','💨','💧','💦','💤','💬','💭']
  },
  {
    icon: '🐱',
    name: 'Animals',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙊','🙉','🙈','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦢','🦅','🦉','🦤','🦩','🐢','🐍','🦎','🐙','🦑','🦞','🦀','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐈','🐓','🦃','🐇','🦝','🦡','🦦','🦫','🦥','🐿️','🦔']
  },
  {
    icon: '🍔',
    name: 'Food',
    emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🧅','🧄','🥔','🥕','🌽','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🍳','🥘','🍲','🥣','🥗','🍿','バター','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍣','🍤','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🥛','☕','🍵','🍶','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🥤']
  },
  {
    icon: '🚗',
    name: 'Travel',
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛹','🛼','🚨','🛑','🚧','⚓','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🛎️','🧳','⌛','⏳','⌚','⏰','⏱️','⏲️','🕰️','🌡️','☀️','🪐','⭐','🌟','🌠','🌌','☁️','⛅','⛈️','🌪️','🌫️','🌬️','🌀','🌈','☂️','☔','⚡','❄️','☃️','⛄','☄️','🔥','💧','🌊']
  }
];

export default function WhatsApp() {
  const { addToast, token, tenantId } = useApp();
  const navigate = useNavigate();

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const str = String(timeStr).trim();
    if (str.includes(' AM') || str.includes(' PM')) return str;
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    // Fallback: Parse ISO manually (T[HH]:[MM])
    const match = str.match(/T(\d{2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${suffix}`;
    }
    return str;
  };

  const getDateLabel = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return '';
      
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {
      return '';
    }
  };


  const [message, setMessage] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Unread, Bots, AI, Waiting
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);

  // Emoji picker & File upload state/refs
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Inbox Data
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);
  const isNearBottom = useRef(true);
  const prevActiveChatId = useRef('');

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

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // If we are within 100px of the bottom, keep auto-scrolling
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      isNearBottom.current = atBottom;
    }
  };

  // Auto scroll to bottom of chat thread when messages array or active chat changes
  useEffect(() => {
    if (activeChatId !== prevActiveChatId.current) {
      prevActiveChatId.current = activeChatId;
      isNearBottom.current = true;
      scrollToBottom();
    } else if (isNearBottom.current) {
      scrollToBottom();
    }
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

  const activeChat = conversations.find(c => c.id === activeChatId);

  const selectConversation = (id) => {
    setActiveChatId(id);
  };

  const handleSend = async () => {
    if (!message.trim() && !pendingAttachment) return;
    if (!activeChatId) return;

    let sendBody = { message: message.trim() };
    if (pendingAttachment) {
      if (pendingAttachment.isImage) {
        sendBody.imageUrl = pendingAttachment.url;
      } else {
        sendBody.fileUrl = pendingAttachment.url;
      }
    }

    // Optimistically prepend local chat preview
    isNearBottom.current = true;
    const localMsg = { 
      sender: 'agent', 
      text: message.trim() || (pendingAttachment.isImage ? '[Image]' : '[File]'), 
      time: new Date().toISOString()
    };
    if (pendingAttachment) {
      if (pendingAttachment.isImage) localMsg.image = pendingAttachment.url;
      else localMsg.file = pendingAttachment.url;
    }
    setMessages(prev => [...prev, localMsg]);

    setMessage('');
    const prevPending = pendingAttachment;
    setPendingAttachment(null);

    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${activeChatId}/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(sendBody)
      });
      if (res.ok) {
        fetchMessages(activeChatId);
      } else {
        // Restore attachment on failure so the user doesn't lose it
        setPendingAttachment(prevPending);
        addToast('Failed to send message', 'error');
      }
    } catch {
      setPendingAttachment(prevPending);
      addToast('Network error sending message', 'error');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    addToast('Uploading attachment...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId() || '96722',
        },
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.url) {
          const url = result.data.url;
          const isImage = file.type.startsWith('image/');
          setPendingAttachment({
            url,
            name: file.name,
            isImage
          });
          addToast('Attachment ready to send. Press enter or click send.', 'success');
        } else {
          addToast('Upload failed', 'error');
        }
      } else {
        addToast('Server error uploading file', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error uploading file', 'error');
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

  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
  const [workspaceLabels, setWorkspaceLabels] = useState([]);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');

  const fetchLabels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/labels`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setWorkspaceLabels(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/agents`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setAgents(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleAssignAgent = async (agentId) => {
    setAgentDropdownOpen(false);
    if (!activeChatId) return;
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${activeChatId}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ agent_id: agentId })
      });
      if (res.ok) {
        addToast('Lead assigned successfully', 'success');
        fetchConversations();
      } else {
        const err = await res.json();
        addToast(err.detail || 'Failed to assign lead', 'error');
      }
    } catch {
      addToast('Network error assigning lead', 'error');
    }
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/labels`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ label_name: newLabelName.trim() })
      });
      if (res.ok) {
        addToast('Label added successfully!', 'success');
        setNewLabelName('');
        fetchLabels();
      } else {
        const err = await res.json();
        addToast(err.detail || 'Failed to add label', 'error');
      }
    } catch {
      addToast('Network error adding label', 'error');
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/labels/${labelId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addToast('Label deleted successfully', 'info');
        fetchLabels();
      } else {
        addToast('Failed to delete label', 'error');
      }
    } catch {
      addToast('Network error deleting label', 'error');
    }
  };

  const handleUpdateLabel = async (lbl) => {
    setLabelDropdownOpen(false);
    if (!activeChatId) return;
    
    setConversations(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, productInterest: lbl };
      }
      return c;
    }));

    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${activeChatId}/label`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ product_interest: lbl })
      });
      if (res.ok) {
        addToast(`Lead labeled as "${lbl || 'Unlabelled'}"`, 'success');
        fetchConversations();
      } else {
        addToast('Failed to update lead label', 'error');
        fetchConversations();
      }
    } catch {
      addToast('Network error updating lead label', 'error');
      fetchConversations();
    }
  };

  const handleClearChat = async () => {
    setShowMoreMenu(false);
    if (!activeChatId) return;
    if (!window.confirm("Are you sure you want to permanently delete all messages in this chat? This action cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/conversations/${activeChatId}/clear`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addToast("Chat history cleared successfully.", "success");
        setMessages([]);
        setActiveChatId(''); // Reset active chat
        fetchConversations();
      } else {
        addToast("Failed to clear chat history.", "error");
      }
    } catch {
      addToast("Network error clearing chat history.", "error");
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
                        <span className="text-slate-400 font-medium text-[10px] shrink-0">{formatTime(chat.time)}</span>
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
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>📞 {activeChat.phone}</span>
                      
                      {/* Label Dropdown Selector */}
                      <div className="relative inline-block text-left z-30">
                        <button
                          onClick={() => setLabelDropdownOpen(!labelDropdownOpen)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Assign Lead Label"
                        >
                          <span className="material-symbols-outlined text-[10px]">sell</span>
                          <span>{activeChat.productInterest || "Unlabelled"}</span>
                        </button>
                        {labelDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setLabelDropdownOpen(false)} />
                            <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
                               <p className="px-2.5 py-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">Category Label</p>
                              {workspaceLabels.map(lbl => (
                                <button
                                  key={lbl.id}
                                  onClick={() => handleUpdateLabel(lbl.name)}
                                  className={`w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors ${activeChat.productInterest === lbl.name ? 'text-emerald-600 font-bold bg-emerald-50/30' : 'text-slate-700 dark:text-slate-200'}`}
                                >
                                  {lbl.name}
                                </button>
                              ))}
                              {activeChat.productInterest && (
                                <button
                                  onClick={() => handleUpdateLabel(null)}
                                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-t border-slate-100 dark:border-slate-700 font-semibold"
                                >
                                  Clear Label
                                </button>
                              )}
                              <button
                                onClick={() => { setLabelDropdownOpen(false); setManageModalOpen(true); }}
                                className="w-full text-left px-2.5 py-1.5 text-[11px] text-indigo-650 hover:bg-slate-50 dark:text-indigo-400 dark:hover:bg-slate-700/60 transition-colors border-t border-slate-100 dark:border-slate-700 font-semibold flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[12px]">settings</span>
                                <span>Manage Labels</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {activeChat.online && (
                        <span className="text-[10px] text-emerald-500 font-sans font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          online
                        </span>
                      )}
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

                  {/* Assign Agent Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-bold text-xs shadow-sm"
                      title="Assign to Employee"
                    >
                      <span className="material-symbols-outlined text-[15px]">assignment_ind</span>
                      <span>Assign</span>
                    </button>
                    {agentDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setAgentDropdownOpen(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-40 max-h-60 overflow-y-auto">
                          <p className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-105 dark:border-slate-700">Assign Employee</p>
                          {agents.map(agent => (
                            <button
                              key={agent.id}
                              onClick={() => handleAssignAgent(agent.id)}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors ${activeChat.assignedAgentId === agent.id ? 'text-indigo-600 font-bold bg-indigo-55/35' : 'text-slate-700 dark:text-slate-200'}`}
                            >
                              {agent.name}
                            </button>
                          ))}
                          {agents.length === 0 && (
                            <p className="px-3 py-2 text-[10px] text-slate-400">No employees found.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
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
                  <div className="relative">
                    <button 
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="More Options"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                    {showMoreMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-40 animate-[slideUp_150ms_ease]">
                          <button
                            onClick={handleClearChat}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                            <span>Clear Chat History</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </header>

              {/* Chat Thread stream with classic sand background */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 space-y-4 relative"
                style={{
                  backgroundColor: '#efeae2',
                  backgroundImage: 'radial-gradient(#dfdcd6 1px, transparent 1px)',
                  backgroundSize: '15px 15px'
                }}
              >
                {(() => {
                  let lastDateLabel = null;
                  return messages.map((msg, idx) => {
                    const msgDateLabel = msg.time ? getDateLabel(msg.time) : '';
                    const showDivider = msgDateLabel && msgDateLabel !== lastDateLabel;
                    if (showDivider) {
                      lastDateLabel = msgDateLabel;
                    }

                    const isOutgoing = msg.sender === 'agent' || msg.sender === 'bot';

                    return (
                      <div key={idx} className="w-full flex flex-col gap-1">
                        {showDivider && (
                          <div className="flex justify-center my-3 select-none">
                            <span className="bg-white/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 px-3.5 py-1 rounded-md text-[11px] font-bold shadow-sm uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50">
                              {msgDateLabel}
                            </span>
                          </div>
                        )}
                        
                        {msg.sender === 'system' ? (
                          <div className="flex justify-center">
                            <span className="bg-[#f0ebd8] dark:bg-slate-800/95 border border-slate-200/50 dark:border-slate-700/50 text-slate-750 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                              {msg.text}
                            </span>
                          </div>
                        ) : !isOutgoing ? (
                          // Incoming (left-aligned)
                          <div className="flex flex-col items-start gap-1 max-w-[80%]">
                            <div className="bg-white text-slate-800 pt-2.5 px-3 pb-5.5 rounded-xl rounded-tl-none shadow-sm text-[13px] leading-relaxed relative min-w-[130px]">
                              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mb-1">
                                <span className="material-symbols-outlined text-[12px]">bolt</span>
                                {activeChat.name}
                              </div>
                              {msg.image && (
                                <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                                  <img className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90" src={msg.image} alt="Upload" onClick={() => window.open(msg.image, '_blank')}/>
                                </div>
                              )}
                              {msg.file && (
                                <div className="mb-2 max-w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center gap-3">
                                  <span className="material-symbols-outlined text-[24px] text-emerald-600">description</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate text-slate-850 dark:text-slate-200">
                                      {msg.file.split('/').pop()}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Document File</p>
                                  </div>
                                  <a 
                                    href={msg.file} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-350 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                  </a>
                                </div>
                              )}
                              <p className="pr-10 pb-1.5 whitespace-pre-wrap">{msg.text}</p>
                              <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 select-none">
                                {formatTime(msg.time)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Outgoing (right-aligned)
                          <div className="flex flex-col items-end gap-1 max-w-[80%] ml-auto">
                            <div className={`text-slate-800 pt-2.5 px-3 pb-5.5 rounded-xl rounded-tr-none shadow-sm text-[13px] leading-relaxed relative min-w-[130px] ${
                              msg.sender === 'bot' 
                                ? 'bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200/60 dark:border-indigo-850/50' 
                                : 'bg-[#d1fae5] dark:bg-emerald-950/30'
                            }`}>
                              {msg.sender === 'bot' && (
                                <div className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5 border-b border-indigo-100 dark:border-indigo-900/50 pb-0.5 select-none">
                                  <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                                  <span>AI Responder</span>
                                </div>
                              )}
                              {msg.sender !== 'bot' && (
                                <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5 border-b border-emerald-100 dark:border-emerald-900/50 pb-0.5 select-none">
                                  <span className="material-symbols-outlined text-[13px]">person</span>
                                  <span>Agent Reply</span>
                                </div>
                              )}
                              {msg.image && (
                                <div className={`mb-2 max-w-full rounded-lg overflow-hidden border shadow-sm ${msg.sender === 'bot' ? 'border-indigo-150' : 'border-emerald-100'}`}>
                                  <img className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90" src={msg.image} alt="Upload" onClick={() => window.open(msg.image, '_blank')}/>
                                </div>
                              )}
                              {msg.file && (
                                <div className={`mb-2 max-w-full rounded-lg p-3 flex items-center gap-3 border shadow-sm ${msg.sender === 'bot' ? 'bg-indigo-100/55 border-indigo-200' : 'bg-emerald-100/10 border-emerald-250/30'}`}>
                                  <span className="material-symbols-outlined text-[24px] text-emerald-600">description</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate text-slate-850 dark:text-slate-200">
                                      {msg.file.split('/').pop()}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Document File</p>
                                  </div>
                                  <a 
                                    href={msg.file} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-350 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                  </a>
                                </div>
                              )}
                              <p className="pr-12 pb-1.5 whitespace-pre-wrap">{msg.text}</p>
                              
                              {msg.isLockerMenu && (
                                <div className="mt-3 flex flex-wrap gap-1.5 pb-1">
                                  <button className="bg-white text-emerald-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors" onClick={() => addToast('Selected: View Locker Prices')}>View Locker Details</button>
                                  <button className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors" onClick={() => addToast('Selected: Contact Support')}>Contact Staff</button>
                                </div>
                              )}

                              <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] text-slate-400 select-none">
                                <span>{formatTime(msg.time)}</span>
                                {msg.status === 'read' ? (
                                  <span className="material-symbols-outlined text-[12px] text-sky-500 font-bold" title="Read">done_all</span>
                                ) : msg.status === 'delivered' ? (
                                  <span className="material-symbols-outlined text-[12px] text-slate-400 font-bold" title="Delivered">done_all</span>
                                ) : (
                                  <span className="material-symbols-outlined text-[12px] text-slate-400" title="Sent">done</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Floating scroll to bottom arrow */}
              <div className="absolute bottom-24 right-6 z-20">
                <button 
                  onClick={() => {
                    isNearBottom.current = true;
                    scrollToBottom();
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
                {pendingAttachment && (
                  <div className="mb-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center justify-between text-xs transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-emerald-600 shrink-0">
                        {pendingAttachment.isImage ? 'image' : 'description'}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[220px]">
                        {pendingAttachment.name}
                      </span>
                      <span className="text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                        Ready to send
                      </span>
                    </div>
                    <button 
                      onClick={() => setPendingAttachment(null)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px] block">close</span>
                    </button>
                  </div>
                )}
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 gap-2 shadow-inner relative">
                  <div ref={emojiPickerRef}>
                    <button 
                      className={`w-8 h-8 flex items-center justify-center transition-colors ${showEmojiPicker ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' : 'text-slate-450 hover:text-emerald-600'}`}
                      title="Emoji selector" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full mb-2 left-0 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col h-64">
                        {/* Categories tabs */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1.5 gap-1 shrink-0 overflow-x-auto no-scrollbar">
                          {emojiCategories.map((cat, idx) => (
                            <button
                              key={cat.name}
                              onClick={() => setActiveEmojiCategory(idx)}
                              className={`p-1.5 rounded-lg text-sm transition-colors flex-1 text-center ${activeEmojiCategory === idx ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold' : 'hover:bg-slate-150 dark:hover:bg-slate-750'}`}
                              title={cat.name}
                            >
                              {cat.icon}
                            </button>
                          ))}
                        </div>
                        {/* Emojis grid */}
                        <div className="flex-1 p-2 overflow-y-auto grid grid-cols-8 gap-1.5 content-start">
                          {emojiCategories[activeEmojiCategory].emojis.map((emoji, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setMessage(prev => prev + emoji);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    className="w-8 h-8 flex items-center justify-center text-slate-450 hover:text-emerald-600 transition-colors" 
                    title="Attach file" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
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

      {/* Manage Labels Modal */}
      {manageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-[scaleUp_200ms_ease]">
            <header className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-850 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-indigo-500">settings</span>
                Manage Lead Labels
              </h3>
              <button 
                onClick={() => setManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] block">close</span>
              </button>
            </header>
            
            <div className="p-4 space-y-4">
              {/* Add New Label Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new label (e.g. VIP Lead)"
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-0 focus:outline-none placeholder-slate-400 dark:text-white"
                />
                <button
                  onClick={handleAddLabel}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add
                </button>
              </div>

              {/* Labels List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-100 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">Workspace Labels</p>
                {workspaceLabels.map(lbl => (
                  <div 
                    key={lbl.id} 
                    className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm text-xs text-slate-800 dark:text-slate-200 hover:shadow transition-shadow"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-slate-400 font-bold">sell</span>
                      {lbl.name}
                    </span>
                    <button
                      onClick={() => handleDeleteLabel(lbl.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Label"
                    >
                      <span className="material-symbols-outlined text-[15px] block">delete</span>
                    </button>
                  </div>
                ))}
                {workspaceLabels.length === 0 && (
                  <p className="text-center py-6 text-[11px] text-slate-400">No labels configured. Add one above.</p>
                )}
              </div>
            </div>

            <footer className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-right">
              <button 
                onClick={() => setManageModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
