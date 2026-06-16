import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function WhatsApp() {
  const { addToast } = useApp();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Unread, Bots, AI, Waiting
  const [showDetails, setShowDetails] = useState(false);

  // Inbox Data
  const [conversations, setConversations] = useState([]);

  const [activeChatId, setActiveChatId] = useState('');
  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0];

  const selectConversation = (id) => {
    setActiveChatId(id);
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, unread: 0 };
      }
      return c;
    }));
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setConversations(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const wasBotHandled = chat.botHandled;
        return {
          ...chat,
          lastMessage: message,
          time: timeNow,
          botHandled: false,
          assignedTo: 'Gajera Prince Laxmanbhai',
          lastAssignedTime: 'Just now',
          messages: [
            ...chat.messages,
            ...(wasBotHandled ? [{ sender: 'system', text: 'Gajera Prince Laxmanbhai (Human Agent) took over this chat', time: timeNow }] : []),
            { sender: 'agent', text: message, time: timeNow }
          ]
        };
      }
      return chat;
    }));

    addToast('Message sent via WhatsApp', 'success');
    setMessage('');
  };

  const handleTakeover = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConversations(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          botHandled: false,
          assignedTo: 'Gajera Prince Laxmanbhai',
          lastAssignedTime: 'Just now',
          messages: [
            ...chat.messages,
            { sender: 'system', text: 'Gajera Prince Laxmanbhai (Human Agent) took over this chat', time: timeNow }
          ]
        };
      }
      return chat;
    }));
    addToast('Assigned chat to yourself', 'success');
  };

  const handleReturnToBot = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConversations(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          botHandled: true,
          assignedTo: 'AI Bot',
          messages: [
            ...chat.messages,
            { sender: 'system', text: 'Conversation returned to AI Bot Responder', time: timeNow }
          ]
        };
      }
      return chat;
    }));
    addToast('Conversation returned to AI Bot Responder', 'info');
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

  return (
    <div className="flex flex-col h-full bg-background text-slate-800 dark:text-slate-200">
      <div className="flex h-[calc(100vh-110px)] border border-outline-variant rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        
        {/* Pane 1: WhatsApp-like Header & Conversation List */}
        <section className="w-80 flex flex-col border-r border-outline-variant bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          {/* Header with settings menu */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-outline-variant shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-emerald-500/20">
                <span className="material-symbols-outlined text-[16px]">chat</span>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Chats</span>
            </div>
            <div className="flex items-center gap-1 relative">
              <button onClick={() => addToast('Create new chat')} className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all" title="New Chat">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                title="WhatsApp Settings"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-[slideUp_150ms_ease]">
                  <button 
                    onClick={() => { navigate('/omnichannel/whatsapp/automation'); setSettingsOpen(false); addToast('Loaded Automation Dashboard'); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    <span className="material-symbols-outlined text-[16px] text-indigo-500">dashboard</span>
                    Show Automation Dashboard
                  </button>
                  <button 
                    onClick={() => { addToast('API configuration active'); setSettingsOpen(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-400">api</span>
                    API Connection Config
                  </button>
                  <button 
                    onClick={() => { addToast('Notification alerts configured'); setSettingsOpen(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-400">notifications</span>
                    Manage Notifications
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Input Box */}
          <div className="p-3 border-b border-outline-variant bg-slate-50/10 dark:bg-slate-900/10">
            <div className="relative flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 bg-slate-50/50 dark:bg-slate-900/50 text-xs shadow-inner">
              <span className="material-symbols-outlined text-slate-400 mr-2 text-[16px] shrink-0">search</span>
              <input
                type="text"
                placeholder="Search or start new chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs w-full placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter buttons */}
          <div className="p-3 border-b border-outline-variant flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/20 dark:bg-slate-950/20">
            {['All', 'Unread', 'Bots', 'AI', 'Waiting'].map(filter => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); addToast(`Filtering: ${filter}`); }}
                className={`flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full text-label-sm font-bold whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary-foreground font-semibold'
                    : 'text-on-surface-variant'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Chat List Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredConversations.map(chat => (
              <div 
                key={chat.id}
                onClick={() => selectConversation(chat.id)}
                className={`rounded-xl p-3 cursor-pointer relative transition-all ${
                  activeChatId === chat.id 
                    ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-l-primary' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img className="w-10 h-10 rounded-full object-cover" src={chat.avatar} alt={chat.name}/>
                    {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-on-surface truncate text-xs">{chat.name}</h4>
                      <span className="text-slate-400 font-bold text-[9px]">{chat.time}</span>
                    </div>
                    
                    {/* Handled by Badge / text */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {chat.botHandled ? (
                        <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide flex items-center gap-0.5 border border-slate-205 dark:border-slate-800">
                          <span className="material-symbols-outlined text-[9px]">smart_toy</span> Bot
                        </span>
                      ) : (
                        <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide flex items-center gap-0.5 border border-indigo-200/50">
                          <span className="material-symbols-outlined text-[9px]">person</span> Handled
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 truncate max-w-[150px]">
                        {chat.botHandled ? 'AI Bot Active' : `Assigned: ${chat.assignedTo}`}
                      </span>
                    </div>

                    <p className="text-on-surface-variant truncate font-medium text-[11px]">{chat.lastMessage}</p>
                  </div>
                </div>
                {chat.unread > 0 && (
                  <div className="absolute right-3 bottom-3 bg-primary text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold shadow-sm animate-pulse">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
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
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 border-l border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 mb-3">chat_bubble</span>
            <p className="text-sm font-semibold">No active WhatsApp conversations</p>
            <p className="text-xs text-slate-400 mt-1">Ready to receive new incoming customer chats.</p>
          </div>
        ) : (
          <>
            {/* Pane 2: Active Chat Window (Wide) */}
            <section className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative">
          <header className="min-h-[64px] py-2 flex justify-between items-center px-6 border-b border-outline-variant bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant relative shrink-0">
                <img src={activeChat.avatar} className="w-full h-full object-cover" alt="Active Chat Avatar"/>
                {activeChat.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>}
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-bold text-sm text-on-surface truncate min-w-0 max-w-[120px] sm:max-w-[180px]">{activeChat.name}</h3>
                  <span 
                    className={`text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded inline-block truncate min-w-0 max-w-[150px] sm:max-w-[200px] ${
                      activeChat.botHandled 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700/50' 
                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50'
                    }`}
                    title={activeChat.botHandled ? 'Handled by AI Bot' : `Handled by ${activeChat.assignedTo}`}
                  >
                    {activeChat.botHandled ? '• Handled by AI Bot' : `• Handled by ${activeChat.assignedTo}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-medium mt-0.5 min-w-0">
                  <span className="font-mono text-slate-400 shrink-0">+{activeChat.phone}</span>
                  <span className="text-slate-300 shrink-0">|</span>
                  <span className="truncate min-w-0">{activeChat.botHandled ? 'AI Agent Active' : `${activeChat.assignedTo} (${activeChat.lastAssignedTime})`}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Takeover vs Return to Bot Button */}
              {activeChat.botHandled ? (
                <button 
                  onClick={handleTakeover}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white hover:opacity-90 transition-all font-bold text-xs shadow-sm shadow-primary/10"
                >
                  <span className="material-symbols-outlined text-[15px]">lock</span>
                  <span>Takeover Chat</span>
                </button>
              ) : (
                <button 
                  onClick={handleReturnToBot}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#805ad5] text-white hover:bg-[#6b46c1] transition-all font-bold text-xs shadow-md shadow-[#805ad5]/15"
                >
                  <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                  <span>Return to Bot</span>
                </button>
              )}
              
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
                  showDetails 
                    ? 'text-primary bg-primary/10' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Toggle Contact Info"
              >
                <span className="material-symbols-outlined text-[18px]">info</span>
              </button>
              <button 
                onClick={() => addToast('More options')}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="More Options"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
            </div>
          </header>

          {/* Chat Thread stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 dark:bg-slate-950/20">
            <div className="flex justify-center">
              <span className="bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1 rounded-full text-label-sm font-semibold text-on-surface-variant">
                Conversation started on WhatsApp · {activeChat.time}
              </span>
            </div>

            {activeChat.messages.map((msg, idx) => {
              if (msg.sender === 'system') {
                return (
                  <div key={idx} className="flex justify-center">
                    <span className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 animate-[slideUp_150ms_ease]">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      {msg.text}
                    </span>
                  </div>
                );
              }

              if (msg.sender === 'user') {
                return (
                  <div key={idx} className="flex items-end gap-3 max-w-[80%]">
                    <img className="w-8 h-8 rounded-full mb-1 object-cover shrink-0" src={activeChat.avatar} alt="Sender Avatar"/>
                    <div className="bg-slate-100 dark:bg-slate-800 text-on-surface p-4 rounded-2xl rounded-bl-none shadow-sm text-body-sm leading-relaxed whitespace-pre-wrap">
                      {msg.image && (
                        <div className="mb-2">
                          <img className="w-full max-w-xs rounded-xl shadow-sm hover:scale-[1.01] transition-transform cursor-pointer" src={msg.image} alt="Media upload" onClick={() => addToast('Opening full scale image')}/>
                        </div>
                      )}
                      <p>{msg.text}</p>
                      <span className="block mt-1.5 text-[9px] text-slate-400 font-semibold text-right">{msg.time}</span>
                    </div>
                  </div>
                );
              }

              // agent or bot
              const isBot = msg.sender === 'bot';
              return (
                <div key={idx} className="flex items-end gap-3 max-w-[80%] ml-auto flex-row-reverse">
                  <div className="w-8 h-8 rounded-full mb-1 bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm">
                    {isBot ? 'AI' : 'GP'}
                  </div>
                  <div className={`${isBot ? 'bg-indigo-600 dark:bg-indigo-700' : 'bg-primary'} text-white p-4 rounded-2xl rounded-br-none shadow-md text-body-sm leading-relaxed whitespace-pre-wrap`}>
                    <p className="font-bold text-white/80 text-[9px] mb-1">
                      {isBot ? 'AI Bot Responder' : `Agent: ${activeChat.assignedTo}`}
                    </p>
                    {msg.image && (
                      <div className="mb-2">
                        <img className="w-full max-w-xs rounded-xl border border-white/10 shadow-sm hover:scale-[1.01] transition-transform cursor-pointer" src={msg.image} alt="Media preview" onClick={() => addToast('Opening full scale image')}/>
                      </div>
                    )}
                    <p>{msg.text}</p>
                    
                    {msg.isLockerMenu && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="bg-white text-indigo-600 dark:text-indigo-400 font-bold text-[9px] px-3 py-1.5 rounded-lg hover:bg-white/95 transition-colors" onClick={() => addToast('Selected: View Locker Prices')}>View Locker Details</button>
                        <button className="bg-transparent border border-white/40 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors" onClick={() => addToast('Selected: Contact Support')}>Contact Staff</button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-white/70 font-semibold">
                      <span>{msg.time}</span>
                      <span className="material-symbols-outlined text-[10px] text-emerald-300">done_all</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input area footer */}
          <footer className="p-4 bg-white dark:bg-slate-900 border-t border-outline-variant shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <button className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-on-surface-variant text-label-sm font-semibold rounded-full hover:bg-slate-200" onClick={() => addToast('Quick Replies list opened')}>
                <span className="material-symbols-outlined text-[16px]">bolt</span> Quick Replies
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-on-surface-variant text-label-sm font-semibold rounded-full hover:bg-slate-200" onClick={() => addToast('Broadcast templates opened')}>
                <span className="material-symbols-outlined text-[16px]">note_add</span> Templates
              </button>
            </div>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/40 border border-outline-variant rounded-xl p-2 gap-2 shadow-inner">
              <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors" title="Quick Replies" onClick={() => addToast('Quick replies opened')}>
                <span className="material-symbols-outlined">bolt</span>
              </button>
              <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors" title="Attach file" onClick={() => addToast('Attachment selector opened')}>
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors" title="Emoji selector" onClick={() => addToast('Emoji selector opened')}>
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </button>
              <input 
                type="text" 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none text-body-sm focus:ring-0 focus:outline-none"
              />
              <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors" title="Record voice message" onClick={() => addToast('Microphone recording simulator started')}>
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button className="bg-primary text-white w-9 h-9 flex items-center justify-center rounded-lg shadow hover:opacity-90 transition-opacity" onClick={handleSend}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </footer>
        </section>

        {/* Pane 3: Customer 360 Sidebar */}
        {showDetails && (
          <section className="w-80 flex flex-col border-l border-outline-variant bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto shrink-0 p-6 space-y-6 animate-[slideLeft_200ms_ease]">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white dark:border-slate-800 shadow-md overflow-hidden">
                <img className="w-full h-full object-cover" src={activeChat.avatar} alt={activeChat.name}/>
              </div>
              <h4 className="font-bold text-on-surface text-base">{activeChat.name}</h4>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{activeChat.role || 'Visitor'}, {activeChat.company || 'WhatsApp Contact'}</p>
              <div className="mt-3 flex justify-center gap-1.5 text-[9px] font-bold">
                {activeChat.tags && activeChat.tags.map(tag => (
                  <span key={tag} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 px-2.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-4 space-y-3.5 text-xs">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</h5>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">mail</span>
                <span className="text-on-surface truncate">{activeChat.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">phone</span>
                <span className="text-on-surface font-semibold">+{activeChat.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                <span className="text-on-surface">{activeChat.location || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-4 text-center">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lead Score</h5>
              <div className="text-2xl font-black text-primary">{activeChat.score || 50}<span className="text-xs font-semibold text-slate-400">/100</span></div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${activeChat.score || 50}%` }}></div>
              </div>
            </div>

            <div className="space-y-2.5">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Quick Actions</h5>
              <button onClick={() => addToast('Task created')} className="w-full flex items-center gap-3 bg-white dark:bg-slate-900 border border-outline-variant p-3 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all group font-bold text-xs text-on-surface">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">task_alt</span>
                <span>Create Task</span>
              </button>
              <button onClick={() => addToast('Invoice sheet opened')} className="w-full flex items-center gap-3 bg-white dark:bg-slate-900 border border-outline-variant p-3 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all group font-bold text-xs text-on-surface">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">receipt_long</span>
                <span>Create Invoice</span>
              </button>
              <button onClick={() => addToast('Quote generator opened')} className="w-full flex items-center gap-3 bg-white dark:bg-slate-900 border border-outline-variant p-3 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all group font-bold text-xs text-on-surface">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">request_quote</span>
                <span>Send Quote</span>
              </button>
            </div>

            <div className="space-y-4">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Activity Timeline</h5>
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant">
                <div className="relative pl-7 text-xs">
                  <div className="absolute left-0 top-0.5 w-[22px] h-[22px] bg-primary text-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px]">chat_bubble</span>
                  </div>
                  <p className="font-bold text-on-surface">WhatsApp Session</p>
                  <p className="text-[10px] text-slate-400">Active Now · {activeChat.time}</p>
                </div>
                <div className="relative pl-7 text-xs">
                  <div className="absolute left-0 top-0.5 w-[22px] h-[22px] bg-purple-500 text-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px]">mail</span>
                  </div>
                  <p className="font-bold text-on-surface">Lead Tag Assigned</p>
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
