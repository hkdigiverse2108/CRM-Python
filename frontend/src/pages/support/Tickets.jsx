import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';

export default function Tickets() {
  const { addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State of all tickets on the board
  const [tickets, setTickets] = useState([
    {
      id: 'TK-8821',
      subject: 'Payment gateway failing for EU customers',
      description: 'Multiple reports of 3DS authentication loops on checkout...',
      priority: 'Urgent',
      category: 'Technical',
      status: 'New',
      slaText: '14m to Breach',
      slaUrgent: true,
      assignees: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ3bS7E4oroCAaj6pzChtqqyyofwcWloGNvzzVbV0PmNWvC43oOk0Cs5KL9epIauI1QaC0c3xl3HAWCZbo5UpkCtbQOfvYXHLWeTORRmnUrM-BgAT8fBRuQYRs6ggmepOWKH-PJ7N0q2G0WvYp3vsOXlB5qBguyL2k6TVYs3-PFGaUAvNts41fZMxEjdZFyUiS2r42KZDUd5_w8ocz9lesgYdgXHR1t-qJOhu9oG7B4RGqmxw4-5Jc34LllUEataaT2YE0EAaZ7iI'
      ],
      extraAssigneeCount: 2,
      created: '2026-06-05',
      customer: 'Acme Europe Corp'
    },
    {
      id: 'TK-8834',
      subject: 'Exporting CSV with custom date range',
      description: 'Enterprise user needs historical data export capability...',
      priority: 'Feature Request',
      category: 'Feature Request',
      status: 'New',
      slaText: '2h remaining',
      slaUrgent: false,
      assignees: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAakUXTAxe7x7ljGIS6cHZ9m1Qq68QtGGtVRQ64lwyubU7madCu-rmnX5LlUY0hnwUNMjBlqxow0DHKzAfgGIzH5R7Dd9QyAVjedHKHTu1YrUEGJsHlLD6voAkgDgnVY0wZUFHCbYKZfzGhQingADXpndB-tpdhLynUHhgzTWfX_5MOvbZsxy2lyUkHEt4Ah2F-zjm-pf4crYr5bhLD8N0pLFHpmzxPJKKti0X9cuRmzf8-Vt4j8R9W8YLAU07e07ij4yTSjbWUCOI'
      ],
      extraAssigneeCount: 0,
      created: '2026-06-05',
      customer: 'Initech Group'
    },
    {
      id: 'TK-8801',
      subject: 'API Rate Limit Increase Request',
      description: 'Webhook latency issues observed on high-volume days...',
      priority: 'Medium',
      category: 'Integration',
      status: 'In Progress',
      slaText: 'SLA Met',
      slaUrgent: false,
      assignees: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBeZ5YnFU5_gMNv8Tp8Bf0CJlpWF5_ECaJdmMzyWa8FqGcibyj5RqBKd0r8Oq9fl9vZtSgi5PkIPvmQBzZTkXau6RfO1hu6qcgHF7rUaog-OU74o-JDtwyrsZrfVKOrb-SW2d40NuBv4Kfi5vNJUi8rwy5EVpEAeajYM7Yo3qCJJM9mFfdDVn7QLHceBAwbrQPVpDUxkxlhodAuosS-hTT192jnjDwJfKAzd5AW27hq-IBeI7lvWOPtOtEyC3tlo0Ut2a-Sz5r2Iew'
      ],
      extraAssigneeCount: 0,
      assigneeName: 'Sam',
      created: '2026-06-04',
      customer: 'Hooli Inc'
    },
    {
      id: 'TK-8792',
      subject: 'Typo in mobile app settings page',
      description: 'User noticed "Notifictions" instead of "Notifications"...',
      priority: 'Low',
      category: 'Bug',
      status: 'Resolved',
      slaText: '4h ago',
      slaUrgent: false,
      resolverName: 'Sarah',
      created: '2026-06-04',
      customer: 'Soylent Corp'
    }
  ]);

  // Form state for creating a new ticket
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
    category: 'Technical',
    customer: '',
    assignedUser: 'Sarah',
    status: 'New',
    resolution: '',
    closedDate: '',
    notes: ''
  });

  const handleCreateTicketSubmit = (e) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim()) {
      addToast('Please enter a subject.');
      return;
    }

    const nextIdNum = Math.max(...tickets.map(t => parseInt(t.id.split('-')[1]) || 8800)) + 1;
    const ticket = {
      id: `TK-${nextIdNum}`,
      subject: newTicketForm.subject,
      description: newTicketForm.description || 'No description provided.',
      priority: newTicketForm.priority,
      category: newTicketForm.category,
      status: newTicketForm.status,
      slaText: '24h remaining',
      slaUrgent: false,
      assignees: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCEtKQPcmT818U7NmXsWLGpg--sLLoaJj2Yaz93EJ82OVS_5FOwnn0zFQ02baKg2BhT7ej6Cowz8PIcDuuuBv7C3lA0ik_xqtGYHPGn_q1bmwZw2DIXcO4V5MIfimYx1BySVkSIPuZk5AO29v6pEJuoFAjn5t2h1yZ8uDCibDtiILbrdPu98-piyswq_emYdnWrOsHsx5Ue5KO0layy4JM14MpLatfVgmZmRzj_78-7u_JBXoqwGQvpA__RhwocMYEQv58UVsHiZ6w'
      ],
      extraAssigneeCount: 0,
      created: new Date().toISOString().split('T')[0],
      customer: newTicketForm.customer || 'Guest User',
      assignedUser: newTicketForm.assignedUser,
      resolution: newTicketForm.resolution,
      closedDate: newTicketForm.closedDate,
      notes: newTicketForm.notes
    };

    setTickets(prev => [ticket, ...prev]);
    setShowCreateModal(false);
    setNewTicketForm({
      subject: '',
      description: '',
      priority: 'Medium',
      category: 'Technical',
      customer: '',
      assignedUser: 'Sarah',
      status: 'New',
      resolution: '',
      closedDate: '',
      notes: ''
    });
    addToast(`Ticket #${ticket.id} created successfully.`);
  };

  const updateTicketStatus = (ticketId, nextStatus) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        let update = { ...t, status: nextStatus };
        if (nextStatus === 'Resolved') {
          update.resolverName = 'You';
          update.slaText = 'Just now';
        } else if (nextStatus === 'In Progress') {
          update.assigneeName = 'You';
          update.slaText = 'SLA Met';
        }
        return update;
      }
      return t;
    }));
    addToast(`Ticket #${ticketId} moved to ${nextStatus}.`);
    setSelectedTicket(null);
  };

  // Filter tickets based on search
  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.customer.toLowerCase().includes(q)
    );
  });

  // Split tickets by status columns
  const newColTickets = filteredTickets.filter(t => t.status === 'New');
  const inProgressColTickets = filteredTickets.filter(t => t.status === 'In Progress');
  const resolvedColTickets = filteredTickets.filter(t => t.status === 'Resolved');

  return (
    <div className="flex flex-col h-full space-y-8 animate-fade-in">
      <PageHeader 
        title="Support Tickets" 
        subtitle="Manage customer support requests & helpdesk"
      >
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search tickets, customers..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-905 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-white"
          />
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create Ticket
        </button>
      </PageHeader>

      {/* Dashboard Highlights (Glassmorphic Bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Response */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/85 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Average Response</p>
            <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">12m 45s</h3>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-[11px] font-semibold relative z-10">
            <span className="material-symbols-outlined text-[15px]">trending_down</span>
            <span>14% faster than last week</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-900 dark:text-white pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">timer</span>
          </div>
        </div>

        {/* CSAT Score */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/85 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">CSAT Score</p>
            <h3 className="text-3xl font-black text-violet-600 dark:text-violet-400">4.8/5.0</h3>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] relative z-10">
            <div className="flex text-amber-500 shrink-0">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[13px]">star_half</span>
            </div>
            <span className="truncate">Based on 1.2k reviews</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-900 dark:text-white pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">sentiment_very_satisfied</span>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/85 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Open Tickets</p>
            <h3 className="text-3xl font-black text-red-650 dark:text-red-400">42 Active</h3>
          </div>
          <div className="flex items-center gap-1 text-red-650 dark:text-red-400 text-[11px] font-bold relative z-10">
            <span className="material-symbols-outlined text-[15px]">priority_high</span>
            <span>8 tickets nearing SLA breach</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-900 dark:text-white pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">confirmation_number</span>
          </div>
        </div>

        {/* Team Capacity */}
        <div className="glass-card p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/35 bg-indigo-50/10 dark:bg-indigo-950/5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Team Capacity</p>
            <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">88%</h3>
          </div>
          <div className="space-y-1 z-10 w-full">
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full" style={{ width: '88%' }}></div>
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500">8 of 9 agents online</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-indigo-600 dark:text-indigo-400 pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">groups</span>
          </div>
        </div>
      </div>

      {/* Ticket Board (Multi-column Kanban) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* NEW COLUMN */}
        <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">New</h4>
              <span className="bg-slate-105 dark:bg-slate-800 text-slate-500 dark:text-slate-450 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {newColTickets.length}
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
            {newColTickets.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    t.priority === 'Urgent' 
                      ? 'bg-red-50 text-red-750 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                      : 'bg-indigo-50 text-indigo-750 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                  }`}>
                    {t.priority}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">#{t.id}</p>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t.subject}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {t.description}
                </p>
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div className="flex -space-x-1.5">
                    {t.assignees && t.assignees.map((img, i) => (
                      <div key={i} className="w-6.5 h-6.5 rounded-full border border-white dark:border-slate-900 overflow-hidden bg-slate-100 shrink-0">
                        <img className="w-full h-full object-cover" src={img} alt="avatar" />
                      </div>
                    ))}
                    {t.extraAssigneeCount > 0 && (
                      <div className="w-6.5 h-6.5 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        +{t.extraAssigneeCount}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                    t.slaUrgent
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    <span className="material-symbols-outlined text-[13px]">{t.slaUrgent ? 'bolt' : 'schedule'}</span>
                    {t.slaText}
                  </div>
                </div>
              </div>
            ))}
            {newColTickets.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No new tickets</p>
            )}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">In Progress</h4>
              <span className="bg-slate-105 dark:bg-slate-800 text-slate-500 dark:text-slate-450 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {inProgressColTickets.length}
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
            {inProgressColTickets.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-l-4 border-l-violet-650 border-y-slate-200 border-r-slate-200 dark:border-y-slate-800/80 dark:border-r-slate-800/80 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                    {t.priority}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">#{t.id}</p>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {t.subject}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {t.description}
                </p>
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div className="flex items-center gap-2">
                    {t.assignees && t.assignees.map((img, i) => (
                      <div key={i} className="w-6.5 h-6.5 rounded-full overflow-hidden bg-slate-100 shrink-0">
                        <img className="w-full h-full object-cover" src={img} alt="avatar" />
                      </div>
                    ))}
                    <span className="text-[10px] font-medium text-slate-550 dark:text-slate-400">
                      Assigned to {t.assigneeName || 'Agent'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-100/50 dark:border-green-900/20">
                    <span className="material-symbols-outlined text-[13px] fill-[1]">done_all</span>
                    {t.slaText}
                  </div>
                </div>
              </div>
            ))}
            {inProgressColTickets.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No active tickets</p>
            )}
          </div>
        </div>

        {/* RESOLVED COLUMN */}
        <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Resolved</h4>
              <span className="bg-slate-105 dark:bg-slate-800 text-slate-500 dark:text-slate-450 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {resolvedColTickets.length}
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar opacity-80">
            {resolvedColTickets.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="bg-slate-50/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-green-50 text-green-705 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30">
                    {t.priority}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550">#{t.id}</p>
                </div>
                <h5 className="text-xs font-bold text-slate-750 dark:text-slate-300 mb-1.5 line-through group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {t.subject}
                </h5>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 mb-4">
                  {t.description}
                </p>
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-green-500 text-[18px] fill-[1]">check_circle</span>
                    <span className="text-[10px] font-medium text-slate-450 dark:text-slate-550">
                      Resolved by {t.resolverName || 'Sarah'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-105 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[9px] font-semibold">
                    <span className="material-symbols-outlined text-[13px]">timer</span>
                    {t.slaText}
                  </div>
                </div>
              </div>
            ))}
            {resolvedColTickets.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No resolved tickets</p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) (Matches Stitch layout) */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-white/10"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
        <span className="absolute right-16 bg-slate-900 dark:bg-slate-950 text-white px-3 py-1.5 rounded-xl text-xs font-semibold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg border border-slate-850">
          Create Ticket
        </span>
      </button>

      {/* Slide-out details drawer */}
      {selectedTicket && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setSelectedTicket(null)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between transition-transform duration-300 transform translate-x-0 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Support Portal</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">#{selectedTicket.id} Detail</h3>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Subject</label>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">{selectedTicket.subject}</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Customer</label>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{selectedTicket.customer}</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Description</label>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 mt-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Priority</label>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700">
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Category</label>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700">
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">SLA Target</label>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTicket.slaText}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Created On</label>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTicket.created}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-850 mt-8 space-y-3">
              {selectedTicket.status === 'New' && (
                <button 
                  onClick={() => updateTicketStatus(selectedTicket.id, 'In Progress')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  Start Work (In Progress)
                </button>
              )}
              {selectedTicket.status !== 'Resolved' && (
                <button 
                  onClick={() => updateTicketStatus(selectedTicket.id, 'Resolved')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Mark as Resolved
                </button>
              )}
              <button 
                onClick={() => updateTicketStatus(selectedTicket.id, 'New')}
                className="w-full py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-55 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold transition-all"
              >
                Reset to New Status
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl z-50 p-6 flex flex-col transition-all duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">New Support Ticket</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">File an internal or customer-reported ticket.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-650 dark:text-slate-455 block mb-1.5">Ticket Title *</label>
                <input 
                  type="text" 
                  value={newTicketForm.subject}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Summary of the support issue"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-655 block mb-1.5">Customer Name</label>
                <input 
                  type="text" 
                  value={newTicketForm.customer}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, customer: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-655 block mb-1.5">Priority</label>
                  <select 
                    value={newTicketForm.priority}
                    onChange={e => setNewTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-655 block mb-1.5">Category</label>
                  <select 
                    value={newTicketForm.category}
                    onChange={e => setNewTicketForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Bug">Bug</option>
                    <option value="Integration">Integration</option>
                    <option value="Billing">Billing</option>
                    <option value="Feature Request">Feature Request</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-655 block mb-1.5">Assigned User</label>
                  <input 
                    type="text" 
                    value={newTicketForm.assignedUser}
                    onChange={e => setNewTicketForm(prev => ({ ...prev, assignedUser: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-655 block mb-1.5">Status</label>
                  <select 
                    value={newTicketForm.status}
                    onChange={e => setNewTicketForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-655 block mb-1.5">Resolution</label>
                <input 
                  type="text" 
                  value={newTicketForm.resolution}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, resolution: e.target.value }))}
                  placeholder="Ticket resolution summary"
                  className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-655 block mb-1.5">Closed Date</label>
                <input 
                  type="date" 
                  value={newTicketForm.closedDate}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, closedDate: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-650 dark:text-slate-455 block mb-1.5">Description</label>
                <textarea 
                  rows="2"
                  value={newTicketForm.description}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detail symptoms, error codes, logs, etc."
                  className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-655 block mb-1.5">Notes</label>
                <textarea 
                  rows="2"
                  value={newTicketForm.notes}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal remarks..."
                  className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-202 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  style={{ color: '#ffffff' }}
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
