import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Search, Send, Users, User, Plus, MessageSquare, Hash, 
  X, UserPlus, Paperclip, Pin, Smile, Check, CheckCheck, Loader2,
  Mic, Square, Volume2, CornerUpLeft, VolumeX, AlertCircle,
  Trash2, Share2, Info, LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export default function Chat() {
  const { user } = useApp();
  const token = localStorage.getItem('token') || '';
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const WS_BASE = API_BASE.replace(/^http/, 'ws').replace(/^https/, 'wss');
  
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  // Advanced Chat states
  const [searchMessageQuery, setSearchMessageQuery] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  
  // Add member modal inside settings
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedAddMembers, setSelectedAddMembers] = useState([]);

  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  
  // Real-time Statuses
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // { channelId: { userId: name } }
  
  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // Reaction picker state
  const [activeReactionPicker, setActiveReactionPicker] = useState(null); // messageId
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/channels`, { headers: getHeaders() });
      const d = await res.json();
      if (res.ok) {
        setChannels(d.data || []);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/users`, { headers: getHeaders() });
      const d = await res.json();
      if (res.ok) {
        setUsers(d.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${channelId}/messages`, { headers: getHeaders() });
      const d = await res.json();
      if (res.ok) {
        setMessages(d.data || []);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            action: 'read_channel',
            channel_id: channelId
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchGroupMembers = async (channelId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${channelId}/members`, { headers: getHeaders() });
      const d = await res.json();
      if (res.ok) {
        setGroupMembers(d.data || []);
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
    }
  };

  // WebSocket Connection
  useEffect(() => {
    if (!token) return;

    const wsUrl = `${WS_BASE}/chat/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[*] Chat WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'online_users_list') {
        setOnlineUsers(new Set(data.user_ids));
        return;
      }

      if (data.type === 'user_status') {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (data.status === 'online') {
            next.add(data.user_id);
          } else {
            next.delete(data.user_id);
          }
          return next;
        });
        return;
      }

      if (data.type === 'typing') {
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (!next[data.channel_id]) next[data.channel_id] = {};
          
          if (data.is_typing) {
            next[data.channel_id][data.user_id] = data.sender_name;
          } else {
            delete next[data.channel_id][data.user_id];
          }
          return next;
        });
        return;
      }

      if (data.type === 'reaction') {
        setMessages((prev) => 
          prev.map((msg) => {
            if (msg.message_id === data.message_id) {
              let updatedReactions = [...msg.reactions];
              if (data.action === 'add') {
                if (!updatedReactions.some(r => r.user_id === data.user_id && r.emoji === data.emoji)) {
                  updatedReactions.push({
                    emoji: data.emoji,
                    user_id: data.user_id,
                    user_name: data.user_name
                  });
                }
              } else {
                updatedReactions = updatedReactions.filter(
                  r => !(r.user_id === data.user_id && r.emoji === data.emoji)
                );
              }
              return { ...msg, reactions: updatedReactions };
            }
            return msg;
          })
        );
        return;
      }

      if (data.type === 'channel_read') {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.channel_id === data.channel_id && msg.sender_id !== data.user_id) {
              const updatedRead = new Set(msg.read_by);
              updatedRead.add(data.user_id);
              return { ...msg, read_by: Array.from(updatedRead) };
            }
            return msg;
          })
        );
        return;
      }

      if (data.type === 'message_pinned_update') {
        setMessages((prev) => 
          prev.map((msg) => {
            if (msg.message_id === data.message_id) {
              return { ...msg, is_pinned: data.is_pinned };
            }
            return msg;
          })
        );
        return;
      }

      if (data.type === 'message_deleted') {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.message_id === data.message_id) {
              return { 
                ...msg, 
                text: '', 
                file_url: null, 
                file_name: null, 
                file_type: null, 
                is_pinned: false,
                is_deleted: true 
              };
            }
            return msg;
          })
        );
        return;
      }

      if (data.channel_id) {
        setSelectedChannel((curr) => {
          if (curr && curr.channel_id === data.channel_id) {
            setMessages((prev) => [...prev, data]);
            if (data.sender_id !== user?.id && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                action: 'read_channel',
                channel_id: curr.channel_id
              }));
            }
          }
          return curr;
        });

        setChannels((prevChannels) => {
          const updated = prevChannels.map((ch) => {
            if (ch.channel_id === data.channel_id) {
              return {
                ...ch,
                latest_message: {
                  text: data.text || '📎 Attachment',
                  created_at: data.created_at,
                  sender_id: data.sender_id
                }
              };
            }
            return ch;
          });
          
          return [...updated].sort((a, b) => {
            const timeA = a.latest_message ? new Date(a.latest_message.created_at) : new Date(a.created_at);
            const timeB = b.latest_message ? new Date(b.latest_message.created_at) : new Date(b.created_at);
            return timeB - timeA;
          });
        });
      }
    };

    ws.onclose = () => {
      console.log('[*] Chat WebSocket Disconnected');
    };

    fetchChannels();
    fetchUsers();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [token]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Channel Selection
  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    setSearchMessageQuery('');
    setShowMsgSearch(false);
    setReplyMessage(null);
    setForwardingMessage(null);
    setShowGroupSettings(false);
    fetchMessages(channel.channel_id);
    if (channel.type === 'group') {
      fetchGroupMembers(channel.channel_id);
    }
  };

  // Toggle Mute Status
  const handleToggleMute = async (channelId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${channelId}/mute`, {
        method: 'PUT',
        headers: getHeaders()
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.data.is_muted ? 'Channel muted' : 'Channel unmuted');
        setChannels(prev => prev.map(c => 
          c.channel_id === channelId ? { ...c, is_muted: d.data.is_muted } : c
        ));
        if (selectedChannel && selectedChannel.channel_id === channelId) {
          setSelectedChannel(prev => ({ ...prev, is_muted: d.data.is_muted }));
        }
      }
    } catch (err) {
      toast.error('Error toggling mute status');
    }
  };

  // Message Deletion (Recall)
  const handleRecallMessage = async (messageId) => {
    if (!confirm('Are you sure you want to recall this message?')) return;
    try {
      const res = await fetch(`${API_BASE}/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success('Message recalled');
      } else {
        toast.error('Failed to recall message');
      }
    } catch (err) {
      toast.error('Error recalling message');
    }
  };

  // Message Forwarding Submit
  const handleForwardMessage = async (channelIds) => {
    if (!forwardingMessage || channelIds.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/chat/messages/forward`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message_id: forwardingMessage.message_id,
          channel_ids: channelIds
        })
      });
      if (res.ok) {
        toast.success('Message forwarded');
        setForwardingMessage(null);
        fetchChannels();
      } else {
        toast.error('Failed to forward message');
      }
    } catch (err) {
      toast.error('Error forwarding message');
    }
  };

  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedMembers(prev => [...prev, userId]);
    }
  };

  const handleStartDirectChat = async (recipientId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/channels`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: 'direct',
          recipient_id: recipientId
        })
      });
      const d = await res.json();
      if (res.ok) {
        toast.success('Chat started');
        setShowNewChatModal(false);
        await fetchChannels();
        const newChan = d.data;
        if (newChan && newChan.channel_id) {
          handleSelectChannel({
            channel_id: newChan.channel_id,
            type: 'direct',
            name: users.find(u => u.user_id === recipientId)?.full_name || 'Direct Chat'
          });
        }
      } else {
        toast.error(d.message || 'Failed to start chat');
      }
    } catch (err) {
      toast.error('Error starting chat');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/chat/channels`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: 'group',
          name: groupName,
          member_ids: selectedMembers
        })
      });
      const d = await res.json();
      if (res.ok) {
        toast.success('Group created');
        setShowCreateGroupModal(false);
        setGroupName('');
        setSelectedMembers([]);
        await fetchChannels();
        const newChan = d.data;
        if (newChan && newChan.channel_id) {
          handleSelectChannel({
            channel_id: newChan.channel_id,
            type: 'group',
            name: groupName
          });
        }
      } else {
        toast.error(d.message || 'Failed to create group');
      }
    } catch (err) {
      toast.error('Error creating group');
    }
  };


  // Add Group Member
  const handleAddGroupMembers = async (e) => {
    e.preventDefault();
    if (selectedAddMembers.length === 0 || !selectedChannel) return;
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${selectedChannel.channel_id}/members`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          user_ids: selectedAddMembers
        })
      });
      if (res.ok) {
        toast.success('Members added');
        setShowAddMemberModal(false);
        setSelectedAddMembers([]);
        fetchGroupMembers(selectedChannel.channel_id);
      } else {
        toast.error('Failed to add members');
      }
    } catch (err) {
      toast.error('Error adding members');
    }
  };

  // Remove Group Member
  const handleRemoveGroupMember = async (memberId) => {
    if (!selectedChannel || !confirm('Remove this member from group?')) return;
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${selectedChannel.channel_id}/members/${memberId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success('Member removed');
        fetchGroupMembers(selectedChannel.channel_id);
      } else {
        toast.error('Failed to remove member');
      }
    } catch (err) {
      toast.error('Error removing member');
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      toast.error('Recording cancelled');
    }
  };

  const uploadAudioBlob = async (blob) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', blob, 'voice_message.webm');

    try {
      const res = await fetch(`${API_BASE}/chat/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const d = await res.json();
      if (res.ok) {
        setAttachedFile({
          file_url: d.data.file_url,
          file_name: 'Voice Message',
          file_type: 'audio/webm'
        });
        toast.success('Voice message recorded');
      } else {
        toast.error('Voice note upload failed');
      }
    } catch (err) {
      toast.error('Error uploading voice message');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/chat/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const d = await res.json();
      if (res.ok) {
        setAttachedFile(d.data);
        toast.success('File uploaded successfully');
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  // Send Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachedFile) || !selectedChannel) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        channel_id: selectedChannel.channel_id,
        text: newMessage
      };
      
      if (attachedFile) {
        payload.file_url = attachedFile.file_url;
        payload.file_name = attachedFile.file_name;
        payload.file_type = attachedFile.file_type;
      }

      if (replyMessage) {
        payload.reply_to_id = replyMessage.message_id;
      }

      wsRef.current.send(JSON.stringify(payload));
      setNewMessage('');
      setAttachedFile(null);
      setReplyMessage(null);
      sendTypingStatus(false);
    } else {
      toast.error('Connection lost. Please refresh.');
    }
  };

  const sendTypingStatus = (isTyping) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedChannel) {
      wsRef.current.send(JSON.stringify({
        action: 'typing',
        channel_id: selectedChannel.channel_id,
        is_typing: isTyping
      }));
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    sendTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const handleTogglePin = async (messageId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/messages/${messageId}/pin`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (!res.ok) {
        toast.error('Failed to pin message');
      }
    } catch (err) {
      toast.error('Error pinning message');
    }
  };

  const handleAddReaction = (messageId, emoji) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedChannel) {
      wsRef.current.send(JSON.stringify({
        action: 'react',
        channel_id: selectedChannel.channel_id,
        message_id: messageId,
        emoji: emoji
      }));
    }
    setActiveReactionPicker(null);
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-indigo-500/10', 'dark:bg-indigo-500/5', 'animate-pulse');
      setTimeout(() => {
        el.classList.remove('bg-indigo-500/10', 'dark:bg-indigo-500/5', 'animate-pulse');
      }, 2000);
    }
  };

  const renderTypingText = () => {
    if (!selectedChannel) return null;
    const typers = typingUsers[selectedChannel.channel_id];
    if (!typers || Object.keys(typers).length === 0) return null;
    
    const names = Object.values(typers);
    if (names.length === 1) return `${names[0]} is typing...`;
    return `${names.join(', ')} are typing...`;
  };

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(m => {
    if (!searchMessageQuery) return true;
    return m.text?.toLowerCase().includes(searchMessageQuery.toLowerCase()) || 
           m.file_name?.toLowerCase().includes(searchMessageQuery.toLowerCase());
  });

  const pinnedMessages = messages.filter(m => m.is_pinned);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950 shadow-xl select-none">
      
      {/* ─── SIDEBAR LIST ─────────────────────────────────────────── */}
      <div className="w-80 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Chat Rooms
          </h1>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCreateGroupModal(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              title="New Group"
            >
              <Users className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
              title="New Message"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search chat or group..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Scrollable channels list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredChannels.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              No conversations found.
            </div>
          ) : (
            filteredChannels.map((ch) => {
              const isSelected = selectedChannel?.channel_id === ch.channel_id;
              const isOnline = ch.type === 'direct' && ch.recipient && onlineUsers.has(ch.recipient.user_id);
              
              return (
                <button
                  key={ch.channel_id}
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                    isSelected 
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {ch.type === 'general' ? (
                        <Hash className="w-5 h-5" />
                      ) : ch.type === 'group' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h2 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                          {ch.name}
                        </h2>
                        {ch.is_muted && (
                          <VolumeX className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-400'}`} />
                        )}
                      </div>
                      {ch.latest_message && (
                        <span className={`text-[9px] shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          {new Date(ch.latest_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-[11px] truncate ${isSelected ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'}`}>
                      {typingUsers[ch.channel_id] && Object.keys(typingUsers[ch.channel_id]).length > 0 ? (
                        <span className="italic font-medium">Typing...</span>
                      ) : (
                        ch.latest_message ? ch.latest_message.text : 'No messages yet'
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── CHAT MAIN AREA ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-900/10">
        
        {selectedChannel ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-slate-950 shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-500 shadow-sm">
                  {selectedChannel.type === 'general' ? (
                    <Hash className="w-5 h-5" />
                  ) : selectedChannel.type === 'group' ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                
                <div>
                  <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {selectedChannel.name}
                  </h1>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {renderTypingText() || `${selectedChannel.type} chat room`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMsgSearch(!showMsgSearch)}
                  className={`p-2 rounded-xl transition-all ${
                    showMsgSearch 
                      ? 'bg-indigo-50 text-indigo-500 dark:bg-slate-900' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                  }`}
                  title="Search Messages"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleToggleMute(selectedChannel.channel_id)}
                  className={`p-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    selectedChannel.is_muted ? 'text-amber-500' : 'text-slate-500'
                  }`}
                  title={selectedChannel.is_muted ? 'Unmute notifications' : 'Mute notifications'}
                >
                  {selectedChannel.is_muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {selectedChannel.type === 'group' && (
                  <button
                    onClick={() => {
                      setShowGroupSettings(!showGroupSettings);
                      fetchGroupMembers(selectedChannel.channel_id);
                    }}
                    className={`p-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      showGroupSettings ? 'text-indigo-500 bg-indigo-50 dark:bg-slate-900' : 'text-slate-500'
                    }`}
                    title="Group Settings/Members"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Local Search */}
            {showMsgSearch && (
              <div className="px-6 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3 shrink-0">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Filter messages in this room..."
                  value={searchMessageQuery}
                  onChange={(e) => setSearchMessageQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                {searchMessageQuery && (
                  <button onClick={() => setSearchMessageQuery('')}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
            )}

            {/* Pinned Announcements */}
            {pinnedMessages.length > 0 && (
              <div className="bg-amber-500/10 border-b border-amber-500/25 px-6 py-2.5 flex items-center gap-2.5 shrink-0 select-none">
                <Pin className="w-4 h-4 text-amber-500 rotate-45 shrink-0" />
                <div className="flex-1 min-w-0 text-xs text-amber-850 dark:text-amber-400">
                  <span className="font-bold mr-1">Pinned Message:</span>
                  <span 
                    onClick={() => scrollToMessage(pinnedMessages[pinnedMessages.length - 1].message_id)}
                    className="truncate inline-block max-w-[80%] align-bottom cursor-pointer hover:underline"
                  >
                    {pinnedMessages[pinnedMessages.length - 1].text || "📎 Attachment"}
                  </span>
                </div>
                <button 
                  onClick={() => handleTogglePin(pinnedMessages[pinnedMessages.length - 1].message_id)}
                  className="text-[10px] text-amber-500 font-bold hover:underline"
                >
                  Unpin
                </button>
              </div>
            )}

            {/* Messages Thread Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/10 dark:bg-slate-950/5">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-800 mb-2" />
                  <p className="text-xs">No messages found matching search filter.</p>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => {
                  const isOwn = msg.sender_id === user?.id;
                  
                  let ticks = <Check className="w-3.5 h-3.5 text-slate-400" />;
                  if (selectedChannel.type === 'direct') {
                    const readCount = msg.read_by?.filter(uid => uid !== msg.sender_id).length || 0;
                    if (readCount > 0) {
                      ticks = <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />;
                    } else {
                      ticks = <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
                    }
                  } else {
                    const otherReads = msg.read_by?.filter(uid => uid !== msg.sender_id).length || 0;
                    if (otherReads > 0) {
                      ticks = <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />;
                    }
                  }

                  return (
                    <div 
                      key={msg.message_id || idx}
                      id={`msg-${msg.message_id}`}
                      className={`flex flex-col group/msg ${isOwn ? 'items-end' : 'items-start'} transition-colors duration-500 rounded-xl p-1`}
                    >
                      {!isOwn && (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 ml-1">
                          {msg.sender_name}
                        </span>
                      )}
                      
                      <div className="relative max-w-[70%] flex items-center gap-2">
                        
                        {/* Hover message actions */}
                        <div className={`opacity-0 group-hover/msg:opacity-100 transition-all flex gap-1 shrink-0 ${isOwn ? 'order-first' : 'order-last'}`}>
                          {isOwn && !msg.is_deleted && (
                            <>
                              <button 
                                onClick={() => handleRecallMessage(msg.message_id)}
                                className="p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-red-500"
                                title="Recall Message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleTogglePin(msg.message_id)}
                                className="p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-slate-400"
                                title={msg.is_pinned ? "Unpin message" : "Pin message"}
                              >
                                <Pin className="w-3.5 h-3.5 rotate-45" />
                              </button>
                            </>
                          )}
                          {!msg.is_deleted && (
                            <>
                              <button 
                                onClick={() => setReplyMessage(msg)}
                                className="p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-slate-400"
                                title="Quote Reply"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setForwardingMessage(msg)}
                                className="p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-slate-400"
                                title="Forward Message"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setActiveReactionPicker(msg.message_id)}
                                className="p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-slate-400"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Message Balloon */}
                        <div className={`p-3 rounded-2xl shadow-sm text-xs relative ${
                          isOwn 
                            ? 'bg-indigo-500 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                        }`}>
                          
                          {msg.is_deleted ? (
                            /* Recall Message presentation */
                            <div className="flex items-center gap-1 text-[11px] italic text-slate-400 dark:text-slate-500">
                              <Trash2 className="w-3.5 h-3.5" /> This message was recalled.
                            </div>
                          ) : (
                            <>
                              {msg.reply_to_id && (
                                <div 
                                  onClick={() => scrollToMessage(msg.reply_to_id)}
                                  className={`mb-2 p-2 rounded-lg text-[10px] cursor-pointer border-l-4 text-left ${
                                    isOwn 
                                      ? 'bg-white/10 text-white/90 border-white/40' 
                                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-indigo-500'
                                  }`}
                                >
                                  <p className="font-bold mb-0.5">{msg.reply_to_sender_name || 'User'}</p>
                                  <p className="truncate">{msg.reply_to_text}</p>
                                </div>
                              )}

                              {msg.is_pinned && (
                                <div className="flex items-center gap-0.5 text-[8px] text-amber-500 font-bold mb-1 border-b border-amber-500/20 pb-0.5">
                                  <Pin className="w-2.5 h-2.5 rotate-45" /> Pinned
                                </div>
                              )}

                              {/* Media attachments */}
                              {msg.file_url && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                  {msg.file_type?.startsWith('image/') ? (
                                    <img 
                                      src={msg.file_url.startsWith('/') ? `${API_BASE.replace('/api', '')}${msg.file_url}` : msg.file_url} 
                                      alt="Attachment" 
                                      className="max-h-48 w-full object-cover"
                                    />
                                  ) : msg.file_type?.startsWith('audio/') ? (
                                    <div className="p-2 select-none">
                                      <audio 
                                        controls 
                                        src={msg.file_url.startsWith('/') ? `${API_BASE.replace('/api', '')}${msg.file_url}` : msg.file_url} 
                                        className="w-48 max-w-full h-8"
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-3 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                      <Paperclip className="w-4 h-4 text-indigo-500 shrink-0" />
                                      <div className="truncate flex-1 min-w-0">
                                        <p className="font-bold truncate">{msg.file_name}</p>
                                        <a 
                                          href={msg.file_url.startsWith('/') ? `${API_BASE.replace('/api', '')}${msg.file_url}` : msg.file_url} 
                                          download 
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-indigo-500 hover:underline block"
                                        >
                                          Download File
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}
                              
                              <div className="flex items-center justify-end gap-1 mt-1.5">
                                <span className={`text-[8px] block ${isOwn ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isOwn && ticks}
                              </div>

                              {/* Reactions */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="absolute -bottom-2 right-2 flex gap-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-full px-1.5 py-0.5 shadow-sm select-none">
                                  {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                    <button 
                                      key={emoji} 
                                      onClick={() => handleAddReaction(msg.message_id, emoji)}
                                      className="text-[9px] hover:scale-125 transition-transform"
                                      title={msg.reactions.filter(r => r.emoji === emoji).map(r => r.user_name).join(', ')}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                      </div>

                      {/* Floating Emoji Palette */}
                      {activeReactionPicker === msg.message_id && (
                        <div className="flex gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xl mt-1 z-10 select-none animate-in fade-in zoom-in-95 duration-100">
                          {['👍', '❤️', '🔥', '👏', '😂', '😮'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg.message_id, emoji)}
                              className="text-xs hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button 
                            onClick={() => setActiveReactionPicker(null)}
                            className="text-[9px] font-bold text-slate-400 hover:text-slate-600 pl-1 border-l border-slate-200 dark:border-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quoted Message Preview */}
            {replyMessage && (
              <div className="px-6 py-2.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs shrink-0 select-none border-l-4 border-indigo-500">
                <div className="min-w-0">
                  <span className="font-bold text-indigo-500 block">Replying to {replyMessage.sender_name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-xl">
                    {replyMessage.text || '📎 Attachment'}
                  </span>
                </div>
                <button onClick={() => setReplyMessage(null)} className="text-slate-455 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* File upload preview */}
            {attachedFile && (
              <div className="px-6 py-2.5 border-t border-slate-100 dark:border-slate-800/65 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-xs shrink-0 select-none">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-bold truncate max-w-sm">{attachedFile.file_name}</span>
                </div>
                <button 
                  onClick={() => setAttachedFile(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Bar Form */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex items-center gap-3 shrink-0"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isRecording}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              {isRecording ? (
                <div className="flex-1 px-4 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-500 dark:text-red-400 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold">Recording voice message... {formatTime(recordingSeconds)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={cancelRecording}
                      className="px-2.5 py-1 hover:bg-red-500/20 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={stopRecording}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-1 font-bold shadow-sm"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" /> Stop & Send
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button 
                    type="button"
                    onClick={startRecording}
                    disabled={uploading}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-50"
                    title="Record Voice Note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </>
              )}

              <button 
                type="submit"
                disabled={(!newMessage.trim() && !attachedFile) || uploading || isRecording}
                className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 transition-all shadow-md shadow-indigo-500/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20 dark:bg-slate-950/20 select-none">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/5 flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            
            <h1 className="text-base font-bold text-slate-850 dark:text-slate-100 mb-1">
              Internal Chat Room
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              Connect and collaborate with your team instantly. Choose an existing channel or start a new conversation.
            </p>
          </div>
        )}
      </div>

      {/* ─── GROUP SETTINGS DRAWER ────────────────────────────────── */}
      {selectedChannel && selectedChannel.type === 'group' && showGroupSettings && (
        <div className="w-72 border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 shrink-0 select-none animate-in slide-in-from-right duration-250">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Group Info</h2>
            <button onClick={() => setShowGroupSettings(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-850/50 flex flex-col items-center text-center shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-slate-900 flex items-center justify-center text-indigo-500 shadow-sm mb-3">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedChannel.name}</h3>
            <span className="text-[10px] text-slate-400 mt-1">{groupMembers.length} members</span>
          </div>

          <div className="p-3 border-b border-slate-200/50 dark:border-slate-800/40 shrink-0">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 text-slate-500 hover:text-indigo-500 text-xs font-bold transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Members
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Members List</span>
            {groupMembers.map(m => (
              <div key={m.user_id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-slate-950 flex items-center justify-center text-indigo-500 text-xs font-bold shrink-0 relative">
                    {m.full_name.charAt(0)}
                    {m.is_online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{m.full_name}</p>
                    <p className="text-[9px] text-slate-400 truncate capitalize">{m.role_name}</p>
                  </div>
                </div>
                {/* Remove member option (not for oneself) */}
                {m.user_id !== user?.id && (
                  <button 
                    onClick={() => handleRemoveGroupMember(m.user_id)}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500"
                    title="Remove member"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL: START CHAT ──────────────────────── */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
            
            <div className="p-4 border-b border-slate-250/50 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                Start a Conversation
              </h2>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {users.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-450">No other employees found.</p>
              ) : (
                users.map(u => (
                  <button
                    key={u.user_id}
                    onClick={() => handleStartDirectChat(u.user_id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-500 shrink-0 font-bold text-xs uppercase">
                      {u.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{u.full_name}</h3>
                      <p className="text-[10px] text-slate-400 capitalize">{u.role_name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-350 ml-auto" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE GROUP ──────────────────────────────────── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateGroup}
            className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-slate-250/50 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Create New Group
              </h2>
              <button 
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/60 space-y-3 shrink-0">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">
                  Group Name *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Sales Team, Marketing Gurus"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-2">
                Select Members
              </span>
              
              {users.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-455">No other employees found.</p>
              ) : (
                users.map(u => {
                  const isSelected = selectedMembers.includes(u.user_id);
                  return (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => handleToggleMember(u.user_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5' 
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-500 font-bold text-xs uppercase shrink-0">
                        {u.full_name.charAt(0)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{u.full_name}</h3>
                        <p className="text-[10px] text-slate-400 capitalize">{u.role_name}</p>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {isSelected && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="btn-ghost px-4 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!groupName.trim()}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: FORWARD MESSAGE ──────────────────────────────── */}
      {forwardingMessage && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
            
            <div className="p-4 border-b border-slate-250/50 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-500" />
                Forward Message
              </h2>
              <button 
                onClick={() => setForwardingMessage(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-150 dark:border-slate-800 text-xs italic text-slate-500 max-h-24 overflow-y-auto">
              {forwardingMessage.text || `📎 ${forwardingMessage.file_name}`}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Select Chats/Groups</span>
              {channels.map(ch => {
                const [isSelected, setIsSelected] = useState(false);
                return (
                  <button
                    key={ch.channel_id}
                    onClick={() => {
                      setIsSelected(!isSelected);
                      if (!isSelected) {
                        setSelectedMembers(prev => [...prev, ch.channel_id]);
                      } else {
                        setSelectedMembers(prev => prev.filter(id => id !== ch.channel_id));
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5' 
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-500 text-xs font-bold shrink-0">
                        {ch.type === 'general' ? <Hash className="w-4 h-4" /> : ch.type === 'group' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{ch.name}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setForwardingMessage(null)}
                className="btn-ghost px-4 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleForwardMessage(selectedMembers)}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs"
              >
                Forward Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD MEMBERS TO GROUP ─────────────────────────── */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddGroupMembers}
            className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-slate-250/50 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                Add Members to Group
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {users.filter(u => !groupMembers.some(gm => gm.user_id === u.user_id)).length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-450">All workspace users are already members.</p>
              ) : (
                users.filter(u => !groupMembers.some(gm => gm.user_id === u.user_id)).map(u => {
                  const isSelected = selectedAddMembers.includes(u.user_id);
                  return (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedAddMembers(prev => prev.filter(id => id !== u.user_id));
                        } else {
                          setSelectedAddMembers(prev => [...prev, u.user_id]);
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5' 
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-500 font-bold text-xs uppercase shrink-0">
                        {u.full_name.charAt(0)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{u.full_name}</h3>
                        <p className="text-[10px] text-slate-400 capitalize">{u.role_name}</p>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {isSelected && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="btn-ghost px-4 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={selectedAddMembers.length === 0}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs disabled:opacity-50"
              >
                Add Selected
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
