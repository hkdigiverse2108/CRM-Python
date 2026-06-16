import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  MessageSquare, Send, CheckCircle, RefreshCw, BarChart2, Play,
  Trash2, FileText, Bot, Users, ExternalLink, ChevronRight,
  Shield, Radio, Sparkles, Lock, Unlock, Database,
  Terminal, DollarSign, ShieldCheck, Activity,
  Search, Plus, X, AlertCircle
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

function generateAuditLog(action, details) {
  return {
    id: `l_${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    action,
    actor: 'Rohan Sharma',
    ip: '192.168.1.99',
    details
  };
}

export default function WhatsAppAutomationDashboard() {
  const { addToast } = useApp();

  // Core navigation tab - updated to user's exact specification
  const [activeTab, setActiveTab] = useState('overview'); // overview, contacts, campaign, template, bot_builder, chat_log

  // 1. Live Inbox / Takeover Simulation States
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [currentAgentLock, setCurrentAgentLock] = useState('AI Responder (Grok)');
  
  // 2. AI & Dual-LLM states
  const [selectedLLM, setSelectedLLM] = useState('grok'); // grok or openai
  const [promptTemplate, setPromptTemplate] = useState('Act as an expert customer success representative...');
  const [aiRepliesCount] = useState(0);

  // 3. Campaign & Queuing simulation states
  const [redisQueueRate, setRedisQueueRate] = useState(15); // msgs per second
  const [bullQueueStatus, setBullQueueStatus] = useState('Idle');
  const [scheduledCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState([]);

  // 4. Access Control (RBAC) & Suspension Simulation States
  const [agents, setAgents] = useState([]);

  // 5. Audit logs simulation states
  const [auditLogs, setAuditLogs] = useState([]);

  // 6. Webhooks simulated live listener stream
  const [webhookPackets, setWebhookPackets] = useState([]);

  // 7. Keyword triggers list
  const [triggers] = useState([]);

  // 8. NEW: Contacts Simulation States
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilter, setContactFilter] = useState('All');

  // 9. NEW: Templates Simulation States
  const [templates, setTemplates] = useState([]);
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);

  // Simulated Webhook Stream effect
  useEffect(() => {
    const interval = setInterval(() => {
      const randomNames = ['+919876543210', '+15550192834', '+442079460982', '+491729460293'];
      const randomMsgs = ['Yes, sounds good!', 'Are you online?', 'Status update please.', 'How is the API configured?', 'Let me check.'];
      const events = ['messages.received', 'messages.status', 'messages.delivered'];
      const randEvent = events[Math.floor(Math.random() * events.length)];
      const randFrom = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randMsg = randomMsgs[Math.floor(Math.random() * randomMsgs.length)];

      const newPacket = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        event: randEvent,
        from: randEvent === 'messages.received' ? randFrom : undefined,
        to: randEvent !== 'messages.received' ? randFrom : undefined,
        type: randEvent === 'messages.received' ? 'text' : 'delivered/read',
        body: randEvent === 'messages.received' ? randMsg : `wamid.${Math.random().toString(36).substring(7)}`
      };

      setWebhookPackets(prev => [newPacket, ...prev.slice(0, 4)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Action: Takeover Toggles
  const handleTakeover = () => {
    if (isLockedByMe) {
      // Release lock
      setIsLockedByMe(false);
      setCurrentAgentLock('AI Responder (Grok)');
      addToast('Released conversation lock. AI Bot responder reactivated.', 'info');
      // Add log
      pushAuditLog('RELEASE', 'Released conversation lock, returned to AI');
    } else {
      // Suspend check
      const rohan = agents.find(a => a.name === 'Rohan Sharma');
      if (rohan && rohan.status === 'Suspended') {
        addToast('Takeover failed. Suspended agents are blocked from active queues.', 'error');
        return;
      }
      setIsLockedByMe(true);
      setCurrentAgentLock('Agent Rohan Sharma (Me)');
      addToast('Atomic Takeover Lock acquired. AI Responder suppressed.', 'success');
      pushAuditLog('ASSIGN', 'Acquired conversation lock via takeover');
    }
  };

  const handleSimulateOtherLock = () => {
    setIsLockedByOther(!isLockedByOther);
    if (!isLockedByOther) {
      setIsLockedByMe(false);
      setCurrentAgentLock('Agent Alex Rivera');
      addToast('Agent Alex Rivera locked this chat conversation.', 'info');
      pushAuditLog('REASSIGN', 'Conversation lock reassigned to Agent Alex Rivera');
    } else {
      setCurrentAgentLock('AI Responder (Grok)');
      addToast('Lock released by other agent.', 'info');
    }
  };

  // Action: Suspend / Unsuspend Agent
  const toggleAgentSuspension = (id, name) => {
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'Active' ? 'Suspended' : 'Active';
        addToast(`Agent "${name}" session invalidated. Access ${nextStatus === 'Suspended' ? 'suspended' : 'restored'}.`);
        pushAuditLog(nextStatus === 'Suspended' ? 'SUSPEND' : 'UNSUSPEND', `${nextStatus === 'Suspended' ? 'Suspended' : 'Restored'} agent ${name}`);
        
        // If suspending self, release lock
        if (name === 'Rohan Sharma' && nextStatus === 'Suspended') {
          setIsLockedByMe(false);
          setCurrentAgentLock('AI Responder (Grok)');
        }
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const pushAuditLog = (action, details) => {
    const newLog = generateAuditLog(action, details);
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const toggleBroadcastStatus = (id) => {
    setBroadcasts(prev => prev.map(b => {
      if (b.id === id) {
        const nextStatus = b.status === 'Paused' ? 'Active' : 'Paused';
        addToast(`Broadcast "${b.name}" is now ${nextStatus.toLowerCase()}`, 'info');
        return { ...b, status: nextStatus };
      }
      return b;
    }));
  };

  const handleDeleteBroadcast = (id, name) => {
    setBroadcasts(prev => prev.filter(b => b.id !== id));
    addToast(`Broadcast "${name}" deleted successfully`, 'success');
  };

  const handleSyncTemplates = () => {
    setIsSyncingTemplates(true);
    addToast('Syncing official Meta templates...', 'info');
    setTimeout(() => {
      setIsSyncingTemplates(false);
      addToast('Template database updated from Meta API.', 'success');
      pushAuditLog('RESOLVE', 'Synchronized official WhatsApp message templates');
    }, 1500);
  };

  const handleDeleteTemplate = (id, name) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    addToast(`Template "${name}" deleted.`, 'success');
    pushAuditLog('RELEASE', `Deleted Meta Template: ${name}`);
  };

  const handleAddContactTag = (contactId, newTag) => {
    if (!newTag.trim()) return;
    setContacts(prev => prev.map(c => {
      if (c.id === contactId && !c.tags.includes(newTag)) {
        return { ...c, tags: [...c.tags, newTag] };
      }
      return c;
    }));
    addToast(`Added tag "${newTag}" to contact`, 'success');
  };

  // Action: Broadcaster trigger
  const runBroadcaster = () => {
    setBullQueueStatus('Processing (Bulk Broadcast)');
    addToast('Broadcasting queue initiated via Redis / Bull.', 'success');
    setTimeout(() => {
      setBullQueueStatus('Idle');
      addToast('Broadcast execution completed.', 'success');
      pushAuditLog('MESSAGE_SENT', 'Executed Q2 Bulk Broadcast to VIP Customers');
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-200">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <PageHeader title="WhatsApp Automation" subtitle="Automated WhatsApp flows & chatbot management" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => addToast('Automation Wizard opened')} className="btn-primary flex items-center gap-1.5 font-semibold py-2 px-3 rounded-xl">
            <Bot size={15} />
            <span>Create Automation</span>
          </button>
          <button onClick={() => addToast('Broadcast setup opened')} className="btn-outline flex items-center gap-1.5 font-semibold py-2 px-3 rounded-xl">
            <Send size={15} />
            <span>Create Broadcast</span>
          </button>
          <button onClick={runBroadcaster} className="btn-outline flex items-center gap-1.5 font-semibold py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200/50">
            <Database size={15} />
            <span>Trigger Redis Broadcast</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'overview', label: 'Overview & Analytics', icon: BarChart2 },
          { id: 'contacts', label: 'Contacts', icon: Users },
          { id: 'campaign', label: 'Campaigns', icon: Send },
          { id: 'template', label: 'Templates', icon: FileText },
          { id: 'bot_builder', label: 'Bot Builder', icon: Bot },
          { id: 'chat_log', label: 'Chat Logs', icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Render Workspace Tab Content */}

      {/* TAB A: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* Messaging */}
            <div className="kpi-card bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Send size={14} className="text-blue-500" /> Messaging
                </h3>
                <span className="badge badge-info">30 Days</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-slate-700 dark:text-slate-200">
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Total Sent</p><p className="text-lg font-bold mt-0.5">142,850</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Delivered</p><p className="text-lg font-bold mt-0.5 text-emerald-500">139,210</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Read Rate</p><p className="text-lg font-bold mt-0.5 text-indigo-500">77.3%</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Failed</p><p className="text-lg font-bold mt-0.5 text-red-500">2.5%</p></div>
              </div>
            </div>

            {/* Contacts */}
            <div className="kpi-card bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-500" /> Contacts
                </h3>
                <span className="badge badge-success">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-slate-700 dark:text-slate-200">
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Total Contacts</p><p className="text-lg font-bold mt-0.5">45,280</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Active</p><p className="text-lg font-bold mt-0.5 text-emerald-500">18,450</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">New Today</p><p className="text-lg font-bold mt-0.5 text-indigo-500">+324</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Blocked</p><p className="text-lg font-bold mt-0.5 text-red-500">142</p></div>
              </div>
            </div>

            {/* Campaigns */}
            <div className="kpi-card bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-indigo-500" /> Campaigns
                </h3>
                <span className="badge badge-neutral">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-slate-700 dark:text-slate-200">
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Total</p><p className="text-lg font-bold mt-0.5">32</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Active</p><p className="text-lg font-bold mt-0.5 text-emerald-500">4</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Scheduled</p><p className="text-lg font-bold mt-0.5 text-amber-500">{scheduledCount}</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Completed</p><p className="text-lg font-bold mt-0.5 text-slate-500">25</p></div>
              </div>
            </div>

            {/* Automation */}
            <div className="kpi-card bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot size={14} className="text-purple-500" /> Automation
                </h3>
                <span className="badge badge-warning">98% Health</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-slate-700 dark:text-slate-200">
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Active Flows</p><p className="text-lg font-bold mt-0.5">8</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Running Bots</p><p className="text-lg font-bold mt-0.5 text-emerald-500">12</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Bot Convs</p><p className="text-lg font-bold mt-0.5 text-indigo-500">5,420</p></div>
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Takeovers</p><p className="text-lg font-bold mt-0.5 text-amber-500">182</p></div>
              </div>
            </div>
          </div>

          {/* SVG Charts Row */}
          <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500" /> Message & Campaign Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Message Performance */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Message Performance</h3>
                <svg className="w-full h-44" viewBox="0 0 200 150">
                  <rect x="20" y="20" width="160" height="15" fill="#f1f5f9" rx="3" />
                  <rect x="20" y="20" width="150" height="15" fill="#0052cc" rx="3" />
                  <text x="25" y="31" className="text-[9px] fill-white font-bold">Sent (142.8k)</text>
                  
                  <rect x="20" y="50" width="160" height="15" fill="#f1f5f9" rx="3" />
                  <rect x="20" y="50" width="145" height="15" fill="#10b981" rx="3" />
                  <text x="25" y="61" className="text-[9px] fill-white font-bold">Delivered (139.2k)</text>
                  
                  <rect x="20" y="80" width="160" height="15" fill="#f1f5f9" rx="3" />
                  <rect x="20" y="80" width="115" height="15" fill="#6366f1" rx="3" />
                  <text x="25" y="91" className="text-[9px] fill-white font-bold">Read (110.4k)</text>
                  
                  <rect x="20" y="110" width="160" height="15" fill="#f1f5f9" rx="3" />
                  <rect x="20" y="110" width="15" height="15" fill="#ef4444" rx="3" />
                  <text x="40" y="121" className="text-[9px] fill-slate-500 font-bold">Failed (3.6k)</text>
                </svg>
              </div>

              {/* Daily message trend */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Daily Message Trend (Last 30 Days)</h3>
                <div className="h-44 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="none">
                    <path d="M10,90 Q40,40 70,70 T130,20 T190,50 L190,120 L10,120 Z" fill="rgba(99, 102, 241, 0.1)" />
                    <path d="M10,90 Q40,40 70,70 T130,20 T190,50" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="130" cy="20" r="3" fill="#6366f1" />
                  </svg>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                    <span>May 06</span>
                    <span>Jun 05 (Today)</span>
                  </div>
                </div>
              </div>

              {/* Campaign funnel */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Campaign Performance Funnel</h3>
                <svg className="w-full h-44" viewBox="0 0 200 120">
                  <polygon points="20,10 180,10 150,35 50,35" fill="#0052cc" opacity="0.9" />
                  <polygon points="50,38 150,38 120,63 80,63" fill="#805ad5" opacity="0.9" />
                  <polygon points="80,66 120,66 105,91 95,91" fill="#10b981" opacity="0.9" />
                  <polygon points="95,94 105,94 102,115 98,115" fill="#f59e0b" opacity="0.9" />
                  
                  <text x="100" y="24" className="text-[8px] fill-white font-bold" textAnchor="middle">Reach (18,200)</text>
                  <text x="100" y="52" className="text-[8px] fill-white font-bold" textAnchor="middle">Clicks (4,500)</text>
                  <text x="100" y="80" className="text-[8px] fill-white font-bold" textAnchor="middle">Responses (1,200)</text>
                  <text x="100" y="106" className="text-[8px] fill-white font-bold" textAnchor="middle">Conversions (310)</text>
                </svg>
              </div>

              {/* Contact growth */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Contact Growth (Daily Acquisition)</h3>
                <div className="h-44 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="none">
                    <path d="M10,100 L40,85 L70,75 L100,55 L130,42 L160,30 L190,10 L190,120 L10,120 Z" fill="rgba(16, 185, 129, 0.1)" />
                    <path d="M10,100 L40,85 L70,75 L100,55 L130,42 L160,30 L190,10" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="190" cy="10" r="3" fill="#10b981" />
                  </svg>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                    <span>Start Today</span>
                    <span>+324 Contacts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System & Billing Diagnostics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* DevOps Console */}
            <div className="lg:col-span-2 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Terminal size={16} className="text-indigo-500" /> DevOps Execution Diagnostics Console
                </h2>
                <p className="text-[11px] text-slate-450">Diagnostics verify Next.js/Express binding ports and session security parameters.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 text-slate-100 p-4 rounded-xl font-mono text-[10.5px] space-y-2 leading-relaxed max-h-[160px] overflow-y-auto">
                <p className="text-emerald-400">[$] run.js - Unified Multi-Runner started successfully.</p>
                <p className="text-slate-400">[info] Port checker diagnostics initialized...</p>
                <p className="text-slate-300">[info] Next.js frontend binding port: 3000 {"->"} <span className="text-emerald-400">AVAILABLE</span></p>
                <p className="text-slate-300">[info] Express backend server port: 5000 {"->"} <span className="text-emerald-400">AVAILABLE</span></p>
                <p className="text-indigo-400">[info] verify-rbac-system.js - CI/CD automated validation sequence initiated:</p>
                <p className="text-slate-400">...... check: Atomic takeover locks concurrency logic {"->"} <span className="text-emerald-400">PASS</span></p>
                <p className="text-slate-400">...... check: Grok/OpenAI responder suppression locks {"->"} <span className="text-emerald-400">PASS</span></p>
                <p className="text-emerald-400">[success] verify-rbac-system.js - All 8 test cases completed with 0 errors.</p>
              </div>
              <button onClick={() => addToast('Port diagnostics re-run initiated')} className="btn-primary text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 w-max">
                <RefreshCw size={12} className="animate-spin" /> Re-Run Diagnostics
              </button>
            </div>

            {/* Stripe Billing limits */}
            <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign size={16} className="text-indigo-500" /> Stripe Subscription Limits
              </h2>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
                  <span>Current Subscription Tier:</span>
                  <span className="font-bold text-indigo-500">Enterprise Starter Plan</span>
                </div>
                <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between text-[11px]">
                    <span>Monthly Messages Sent:</span>
                    <span className="font-semibold">5,420 / 10,000 max</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0052cc] h-full rounded-full" style={{ width: '54.2%' }} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Renewal Date:</span>
                  <span className="font-mono">July 01, 2026</span>
                </div>
              </div>
              <button onClick={() => addToast('Redirecting to Stripe Billing Portal')} className="w-full btn-primary text-xs font-bold py-2 justify-center rounded-xl flex items-center gap-1">
                <span>Manage Billing on Stripe</span> <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      )}      {/* TAB B: CONTACTS & SEGMENTS */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users size={16} className="text-indigo-500" /> WhatsApp Contact Database
              </h2>
              <p className="text-[11px] text-slate-450">Segment customers, apply tags, and check interaction history.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 bg-slate-50/50 dark:bg-slate-900/50 max-w-xs text-xs">
                <Search size={14} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs w-48 placeholder-slate-400"
                />
              </div>
              <button onClick={() => addToast('Importing contacts list')} className="btn-outline flex items-center gap-1 text-xs font-semibold py-2 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <Plus size={14} /> Import CSV
              </button>
            </div>
          </div>

          {/* Contacts filters and Table */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Tags Segment Filters */}
            <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Segments</h3>
              <div className="space-y-1.5 text-xs">
                {['All', 'VIP', 'Lead', 'Customer', 'Blocked'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setContactFilter(filter);
                      addToast(`Filtering contacts by: ${filter}`, 'info');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-semibold ${
                      contactFilter === filter
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{filter} Segment</span>
                    <span className="badge badge-neutral text-[10px]">
                      {filter === 'All'
                        ? contacts.length
                        : contacts.filter(c => filter === 'Blocked' ? c.status === 'Blocked' : c.tags.includes(filter)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts list table */}
            <div className="lg:col-span-3 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold">Active Profiles</h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone Number</th>
                      <th>Job Role</th>
                      <th>Custom Field Tag</th>
                      <th>Last Seen</th>
                      <th>Status</th>
                      <th>Quick Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts
                      .filter(c => {
                        const matchesSearch = c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch);
                        if (contactFilter === 'All') return matchesSearch;
                        if (contactFilter === 'Blocked') return c.status === 'Blocked' && matchesSearch;
                        return c.tags.includes(contactFilter) && matchesSearch;
                      })
                      .map(c => (
                        <tr key={c.id}>
                          <td className="font-semibold text-xs min-w-[120px]">{c.name}</td>
                          <td className="font-mono text-xs text-slate-500">{c.phone}</td>
                          <td className="text-slate-500 text-[11px] font-medium">{c.field}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {c.tags.map(tag => (
                                <span key={tag} className={`badge text-[9px] font-bold ${
                                  tag === 'VIP' ? 'badge-danger' : tag === 'Spam' ? 'badge-neutral' : 'badge-info'
                                }`}>{tag}</span>
                              ))}
                            </div>
                          </td>
                          <td className="text-slate-450 text-[11px] font-mono">{c.lastSeen}</td>
                          <td>
                            <span className={`badge text-[9px] ${
                              c.status === 'Active' ? 'badge-success' : c.status === 'Blocked' ? 'badge-danger' : 'badge-neutral'
                            }`}>{c.status}</span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleAddContactTag(c.id, 'Hot')} className="text-[10px] text-indigo-500 hover:underline font-bold">+ Hot</button>
                              <span className="text-slate-300">|</span>
                              <button onClick={() => handleAddContactTag(c.id, 'Follow-up')} className="text-[10px] text-emerald-500 hover:underline font-bold">+ Alert</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: CAMPAIGNS & BULL QUEUES */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          {/* Rate-limiter and Bulk broadcaster */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Database size={16} className="text-indigo-500" /> Redis & Bull Queuing Diagnostics
                </h2>
                <p className="text-[11px] text-slate-450">Bulk broadcast rate limits configuration and queue processor statuses.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-slate-105 dark:border-slate-800/60 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Bull Queue Status:</span>
                    <span className={`badge ${bullQueueStatus === 'Idle' ? 'badge-neutral' : 'badge-warning'}`}>{bullQueueStatus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Redis Connection:</span>
                    <span className="text-emerald-500 font-bold">Active (redis://127.0.0.1:6379)</span>
                  </div>
                  <button onClick={runBroadcaster} className="w-full btn-primary text-xs font-semibold py-2 px-3 rounded-lg justify-center flex items-center gap-1">
                    <Database size={14} /> Trigger Scheduled Broadcaster Run
                  </button>
                </div>

                <div className="p-4 border border-slate-105 dark:border-slate-800/60 rounded-xl space-y-3.5">
                  <span className="font-bold">Queue Rate Limiter API</span>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-450 uppercase block font-bold">Messages Per Second (Current: {redisQueueRate})</label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={redisQueueRate}
                      onChange={(e) => setRedisQueueRate(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">Limits bulk broadcast rate to avoid Meta API throttling locks.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drip sequences pipeline representation */}
            <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" /> Timed Drip Sequences
              </h2>
              <div className="space-y-3 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
                {[
                  { title: 'Day 1: Welcome message sequence', type: 'Instant Text', time: 'Triggered upon signup' },
                  { title: 'Day 3: Offer code blast', type: 'Meta Template', time: 'Wait duration: 48 hours' },
                  { title: 'Day 7: Follow-up survey check', type: 'AI Responder prompt', time: 'Wait duration: 96 hours' }
                ].map((drip, idx) => (
                  <div key={idx} className="relative pl-6 text-xs leading-snug">
                    <div className="absolute left-[1.5px] top-1.5 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{idx+1}</span>
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-250 ml-1.5">{drip.title}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5 ml-1.5">{drip.type} · {drip.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table: Broadcast logs */}
          <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold">Interactive Broadcast Logs</h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Audience Segment</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Delivered</th>
                    <th>Read Rate</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map(b => (
                    <tr key={b.id}>
                      <td className="font-semibold text-xs min-w-[120px]">{b.name}</td>
                      <td className="text-slate-500 text-[11px] font-medium">{b.audience}</td>
                      <td>
                        <span className={`badge text-[9px] ${
                          b.status === 'Sent' ? 'badge-success' : b.status === 'Paused' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{b.sent}</td>
                      <td className="font-mono text-xs text-emerald-500">{b.delivered}</td>
                      <td className="font-mono text-xs text-indigo-500">
                        {b.sent > 0 ? `${Math.round((b.read / b.sent) * 100)}%` : '0%'}
                      </td>
                      <td className="text-slate-550 text-[11px] font-mono">{b.date}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => addToast(`Viewing campaign details: ${b.name}`)} className="text-xs text-indigo-500 hover:underline font-bold">View</button>
                          <button onClick={() => toggleBroadcastStatus(b.id)} className="text-xs text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold">
                            {b.status === 'Paused' ? 'Resume' : 'Pause'}
                          </button>
                          <button onClick={() => handleDeleteBroadcast(b.id, b.name)} className="text-xs text-red-500 hover:text-red-600 font-bold" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: OFFICIAL META WHATSAPP TEMPLATES */}
      {activeTab === 'template' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> Meta Official Template Manager
              </h2>
              <p className="text-[11px] text-slate-450">Create templates, check approval flags, and synchronize official message models.</p>
            </div>
            <button
              onClick={handleSyncTemplates}
              disabled={isSyncingTemplates}
              className="btn-primary flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-xl shadow-md disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={14} className={isSyncingTemplates ? 'animate-spin' : ''} />
              <span>{isSyncingTemplates ? 'Syncing...' : 'Sync from Meta'}</span>
            </button>
          </div>

          {/* Templates Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(t => (
              <div key={t.id} className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">{t.name}</span>
                    <span className={`badge text-[9px] flex items-center gap-1 ${
                      t.status === 'Approved' ? 'badge-success' : t.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {t.status === 'Approved' ? <CheckCircle size={10} /> : t.status === 'Pending' ? <AlertCircle size={10} /> : <X size={10} />}
                      {t.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold uppercase">
                    <div>Category: <span className="font-bold text-slate-700 dark:text-slate-350">{t.category}</span></div>
                    <div>Language: <span className="font-bold text-slate-700 dark:text-slate-350">{t.language}</span></div>
                  </div>
                  <div className="border border-slate-105 dark:border-slate-800/60 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-mono text-slate-650 dark:text-slate-350 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                    {t.body}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Meta Approved</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => addToast(`Copying template identifier: ${t.name}`)} className="text-xs text-indigo-500 hover:underline font-bold">Copy ID</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleDeleteTemplate(t.id, t.name)} className="text-xs text-red-500 hover:text-red-600 font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB E: BOT BUILDER & AI ENGINES */}
      {activeTab === 'bot_builder' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Canvas Node Builder */}
            <div className="lg:col-span-2 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Play size={16} className="text-indigo-500" /> React Flow Visual Canvas Preview
                </h2>
                <p className="text-[11px] text-slate-450">Draw message sequence paths, connect conditional nodes, and set flow outcomes.</p>
              </div>

              {/* Visual Node Simulator */}
              <div className="border border-slate-105 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-900/50 min-h-[300px] flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold flex items-center gap-1"><Radio size={14} className="text-indigo-500" /> Flow Canvas: Welcome sequence</span>
                  <button onClick={() => addToast('Flow canvas saved')} className="btn-outline py-1 px-3 text-[10px] rounded-lg">Save Nodes</button>
                </div>

                {/* Dynamic canvas nodes map layout */}
                <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-6">
                  <div className="border-2 border-indigo-500 bg-white dark:bg-slate-950 p-3 rounded-lg text-center shadow-md min-w-[120px] relative">
                    <span className="text-[10px] bg-indigo-500 text-white font-bold py-0.5 px-2 rounded absolute -top-2.5 left-1/2 transform -translate-x-1/2 uppercase">Trigger</span>
                    <p className="text-xs font-bold mt-1">Incoming Message</p>
                    <p className="text-[9px] text-slate-400">Match: /welcome/</p>
                  </div>
                  <div className="h-6 w-0.5 md:h-0.5 md:w-12 bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <ChevronRight size={14} className="text-slate-400 rotate-90 md:rotate-0" />
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 rounded-lg text-center shadow-md min-w-[125px] relative">
                    <span className="text-[10px] bg-emerald-500 text-white font-bold py-0.5 px-2 rounded absolute -top-2.5 left-1/2 transform -translate-x-1/2 uppercase font-semibold">Action</span>
                    <p className="text-xs font-bold mt-1">Send Template</p>
                    <p className="text-[9px] text-slate-400">Template: welcome_onboarding</p>
                  </div>
                  <div className="h-6 w-0.5 md:h-0.5 md:w-12 bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <ChevronRight size={14} className="text-slate-400 rotate-90 md:rotate-0" />
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 rounded-lg text-center shadow-md min-w-[125px] relative">
                    <span className="text-[10px] bg-purple-500 text-white font-bold py-0.5 px-2 rounded absolute -top-2.5 left-1/2 transform -translate-x-1/2 uppercase font-semibold">Condition</span>
                    <p className="text-xs font-bold mt-1">If Unread &gt; 24h</p>
                    <p className="text-[9px] text-slate-450">Route to Agent</p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center font-bold">
                  Drag connection nodes to orchestrate automations visually. Double click nodes to open dynamic parameters editor.
                </div>
              </div>
            </div>

            {/* Keyword Triggers Column */}
            <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Keyword Triggers</h2>
                <button onClick={() => addToast('Keyword trigger editor opened')} className="text-xs text-indigo-500 font-bold hover:underline">Add Trigger</button>
              </div>
              
              <div className="space-y-3">
                {triggers.map(trig => (
                  <div key={trig.id} className="p-3 border border-slate-105 dark:border-slate-800/60 rounded-xl bg-slate-50/20 dark:bg-slate-950/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <code className="text-xs text-indigo-500 font-bold">/{trig.keyword}/</code>
                      <span className="badge badge-info text-[9px] font-bold">{trig.matchType}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Target Flow:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{trig.flow}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Matches Triggered:</span>
                      <span>{trig.hits} events</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI LLM Settings row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* OpenAI vs Grok settings */}
            <div className="lg:col-span-2 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Bot size={16} className="text-indigo-500" /> Dual LLM AI Responder Configuration
                </h2>
                <p className="text-[11px] text-slate-450">Select primary engine and configure system directives for autonomous interactions.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setSelectedLLM('openai');
                    addToast('AI Engine switched to OpenAI (GPT-4o)', 'success');
                    pushAuditLog('RESOLVE', 'Switched primary chatbot engine to OpenAI GPT-4o');
                  }}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                    selectedLLM === 'openai'
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-slate-800 dark:text-white">OpenAI Engine</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Driven by GPT-4o API for reasoning and structured onboarding.</span>
                  </div>
                  {selectedLLM === 'openai' && <CheckCircle className="text-indigo-500 shrink-0" size={18} />}
                </button>

                <button
                  onClick={() => {
                    setSelectedLLM('grok');
                    addToast('AI Engine switched to Grok (xAI)', 'success');
                    pushAuditLog('RESOLVE', 'Switched primary chatbot engine to Grok (xAI)');
                  }}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                    selectedLLM === 'grok'
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-slate-800 dark:text-white">Grok Engine (xAI)</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Driven by Grok-Beta API for real-time compliance and sales.</span>
                  </div>
                  {selectedLLM === 'grok' && <CheckCircle className="text-indigo-500 shrink-0" size={18} />}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-450 uppercase block">System Prompts Template Directive</label>
                <textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  rows={3}
                  className="input-field font-mono text-[11px]"
                />
              </div>

              <button onClick={() => addToast('AI Directives updated')} className="btn-primary text-xs font-semibold py-2 px-4 rounded-lg">
                Update Prompts Directive
              </button>
            </div>

            {/* AI Health statistics */}
            <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" /> AI Stats & Health
              </h2>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
                  <span>AI Responses Generated:</span>
                  <span className="font-bold">{aiRepliesCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
                  <span>Average Confidence Rate:</span>
                  <span className="font-bold text-emerald-500">94.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Automation Health Score:</span>
                  <span className="font-bold text-emerald-500">99.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB F: LIVE TRIAGES, AUDIT LOGS & WEBHOOK PACKETS */}
      {activeTab === 'chat_log' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Chat Triage Simulator */}
            <div className="lg:col-span-2 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4">
                <div>
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-500" /> Unified Inbox Live Agent Triage
                  </h2>
                  <p className="text-[11px] text-slate-450">Locks, suppression warnings, and atomic concurrency controls.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold font-mono text-emerald-500">Socket.io Connected</span>
                </div>
              </div>

              {/* Warnings & Takeover Banner */}
              {(!isLockedByMe && !isLockedByOther) ? (
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Bot className="text-indigo-500 animate-pulse" size={20} />
                    <div className="text-xs">
                      <p className="font-bold text-slate-700 dark:text-slate-200">AI Engine active</p>
                      <p className="text-slate-400 mt-0.5">The conversational bot is replying. Take over to suppress the AI responder.</p>
                    </div>
                  </div>
                  <button onClick={handleTakeover} className="btn-primary text-xs font-semibold py-1.5 px-3 rounded-lg shrink-0 flex items-center gap-1">
                    <Lock size={12} /> Take Over
                  </button>
                </div>
              ) : isLockedByOther ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Lock className="text-red-500" size={20} />
                    <div className="text-xs">
                      <p className="font-bold text-red-650 dark:text-red-400">Locked Status Indicator</p>
                      <p className="text-red-400 dark:text-red-500 mt-0.5">This conversation is assigned to Agent <strong>Alex Rivera</strong>. Typing input is disabled.</p>
                    </div>
                  </div>
                  <button onClick={handleSimulateOtherLock} className="text-xs font-semibold border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10">
                    Release Forcefully
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 p-4 rounded-xl flex items-center justify-between gap-4 animate-[slideUp_200ms_ease]">
                  <div className="flex items-center gap-2.5">
                    <Unlock className="text-emerald-500" size={20} />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-650 dark:text-emerald-400">Atomic Takeover Lock acquired</p>
                      <p className="text-emerald-400 dark:text-emerald-500 mt-0.5">AI is suppressed. Locked by <strong>Me</strong>. Other agents will see dual-messaging locks.</p>
                    </div>
                  </div>
                  <button onClick={handleTakeover} className="text-xs font-semibold border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1">
                    <RefreshCw size={12} /> Release & Return to AI
                  </button>
                </div>
              )}

              {/* Chat Thread Simulator */}
              <div className="border border-slate-105 dark:border-slate-800 rounded-xl p-4 space-y-4 bg-slate-50/20 dark:bg-slate-950/20 min-h-[220px]">
                <div className="flex gap-2.5 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs shrink-0">R</div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800/80 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs">
                    <p className="font-semibold text-slate-800 dark:text-white">Rohan Sharma</p>
                    <p className="text-slate-500 dark:text-slate-350 mt-1">Hello! I did not receive the discount code from the automated prompt sequence.</p>
                    <span className="block text-[9px] text-slate-400 text-right mt-1.5 font-mono">14:28 PM</span>
                  </div>
                </div>

                <div className="flex gap-2.5 max-w-[80%] ml-auto flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">AI</div>
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-xs">
                    <p className="font-semibold text-indigo-100">AI Responder (Grok-Beta)</p>
                    <p className="mt-1">Hello Rohan! Apologies for the delay. The discount code is WELCOME10. You can paste it into the check-out terminal.</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1.5 font-mono text-[9px] text-indigo-200">
                      <span>14:29 PM</span>
                      <CheckCircle size={10} className="text-emerald-400" />
                      <span>Read</span>
                    </div>
                  </div>
                </div>

                {isLockedByMe && (
                  <div className="flex gap-2.5 max-w-[80%] ml-auto flex-row-reverse animate-[slideUp_150ms_ease]">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">ME</div>
                    <div className="bg-emerald-650 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-xs">
                      <p className="font-semibold text-emerald-100">Rohan Sharma (Me)</p>
                      <p className="mt-1">[Human Takeover Override] Hey Nexon team, Rohan here from support. Let me help you with custom limits setup.</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1.5 font-mono text-[9px] text-emerald-200">
                        <span>14:31 PM</span>
                        <CheckCircle size={10} className="text-emerald-400" />
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input simulator */}
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-2 gap-2 bg-white dark:bg-slate-900 shadow-inner">
                <input
                  type="text"
                  placeholder={(!isLockedByMe && !isLockedByOther) ? "Take over lock to start typing manually..." : isLockedByOther ? "Conversation locked by other agent. Input disabled." : "Type reply to customer..."}
                  disabled={!isLockedByMe}
                  className="flex-1 bg-transparent border-none text-xs focus:ring-0 focus:outline-none placeholder-slate-400 disabled:opacity-50"
                />
                <button
                  disabled={!isLockedByMe}
                  onClick={() => addToast('Simulating manual message send')}
                  className="bg-indigo-600 text-white text-xs font-semibold py-1.5 px-3.5 rounded-lg shadow hover:opacity-90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Lock controls and Queues summary */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-500" /> Lock Controls
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-105 dark:border-slate-800/50">
                    <span>Current Lock Status:</span>
                    <span className="font-bold flex items-center gap-1">
                      {(isLockedByMe || isLockedByOther) ? <Lock size={12} className="text-red-500" /> : <Unlock size={12} className="text-emerald-500" />}
                      {(isLockedByMe || isLockedByOther) ? 'Locked' : 'Released (AI bot active)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-105 dark:border-slate-800/50">
                    <span>Locked By Agent:</span>
                    <span className="font-bold text-indigo-500">{currentAgentLock}</span>
                  </div>
                </div>
                <button onClick={handleSimulateOtherLock} className="w-full btn-outline py-2 justify-center text-xs font-bold rounded-xl flex items-center gap-1.5 text-red-500 dark:text-red-400 border-red-200/50">
                  <Lock size={14} /> Simulate Duel Lock Access Alert
                </button>
              </div>

              {/* Multi-Tenant RBAC Agent control panel */}
              <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Shield size={16} className="text-indigo-500" /> Team RBAC Session State
                </h2>
                <div className="space-y-2 text-xs">
                  {agents.map(a => (
                    <div key={a.id} className="flex justify-between items-center pb-2 border-b border-slate-105 dark:border-slate-800/50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold">{a.name} ({a.role})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Status: {a.status}</p>
                      </div>
                      <button
                        onClick={() => toggleAgentSuspension(a.id, a.name)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          a.status === 'Active' ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {a.status === 'Active' ? 'Suspend' : 'Restore'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Webhook listener payload and Audit logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Audit Logs */}
            <div className="lg:col-span-2 bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">MongoDB Compliance Audit Logs</h2>
                  <p className="text-[11px] text-slate-440">Compliance logging tracks user locks, reassignments, and API adjustments.</p>
                </div>
                <span className="badge badge-warning flex items-center gap-1 text-[9px] font-bold"><Shield size={12} /> 90-Day Purge Retention Policy</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Actor Name</th>
                      <th>IP Address</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td className="font-mono text-[11px] text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td>
                          <span className={`badge text-[9px] ${
                            log.action === 'ASSIGN' ? 'badge-success' : log.action === 'SUSPEND' ? 'badge-danger' : 'badge-info'
                          }`}>{log.action}</span>
                        </td>
                        <td className="font-semibold text-xs">{log.actor}</td>
                        <td className="font-mono text-[11px] text-slate-500">{log.ip}</td>
                        <td className="text-slate-650 dark:text-slate-350 text-[11px] font-medium">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Storage Index: MongoDB TTL enabled</span>
                <button onClick={() => addToast('Compliance logs export initiated')} className="text-indigo-500 font-bold hover:underline">Export Logs Database (Excel)</button>
              </div>
            </div>

            {/* Webhook live payload packets */}
            <div className="bg-white dark:bg-[#141c2c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> Webhook Live Payload Packets Stream
              </h2>
              <p className="text-[11px] text-slate-450">Meta Webhook listener stream receiving status packets dynamically.</p>
              <div className="space-y-2 text-xs">
                {webhookPackets.map((pack, idx) => (
                  <div key={idx} className="p-2 border border-slate-105 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 font-mono text-[9.5px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-indigo-400 font-bold">{pack.event}</span>
                      <span className="text-slate-450">{pack.timestamp}</span>
                    </div>
                    {pack.from && <div className="text-slate-450 font-bold">From: {pack.from}</div>}
                    <div className="text-slate-550 truncate">Payload: {pack.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
