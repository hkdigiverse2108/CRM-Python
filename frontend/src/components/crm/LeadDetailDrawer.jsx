import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Mail, Phone, Building, Globe, User, Tag, Calendar, Clock, 
  MessageCircle, Edit, Bell, ClipboardList, CheckSquare
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import StatusProgressBar from './StatusProgressBar';
import FollowupTimeline from './FollowupTimeline';

export default function LeadDetailDrawer({
  lead,
  onClose,
  onStartEdit,
  addToast,
  fetchLeadFollowups,
  createLeadFollowup,
  fetchLeadAuditLogs,
  createReminder,
  formatAssignedAgent
}) {
  const navigate = useNavigate();

  // Follow-up States
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [followupType, setFollowupType] = useState('Call');
  const [newFollowupNote, setNewFollowupNote] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [nextFollowupRemarks, setNextFollowupRemarks] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Reminder Scheduling inline state
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderPriority, setReminderPriority] = useState('Medium');
  const [showReminderForm, setShowReminderForm] = useState(false);

  // Load followups & audit logs on lead change
  useEffect(() => {
    if (!lead?.id) return;

    const loadData = async () => {
      setLoadingFollowups(true);
      const data = await fetchLeadFollowups(lead.id);
      setFollowups(data || []);
      setLoadingFollowups(false);

      setLoadingAuditLogs(true);
      const logs = await fetchLeadAuditLogs(lead.id);
      setAuditLogs(logs || []);
      setLoadingAuditLogs(false);
    };

    loadData();
  }, [lead?.id, fetchLeadFollowups, fetchLeadAuditLogs]);

  // Handle Log Followup submit
  const handleLogFollowupSubmit = async (e) => {
    e.preventDefault();
    if (!newFollowupNote.trim()) {
      addToast('Remarks note is required', 'warning');
      return;
    }
    const payload = {
      followup_date: new Date().toISOString().split('T')[0],
      followup_type: followupType,
      remarks: newFollowupNote,
      next_followup_date: nextFollowupDate || null,
      next_followup_remarks: nextFollowupRemarks || null,
    };
    const created = await createLeadFollowup(lead.id, payload);
    if (created) {
      setFollowups(prev => [...prev, created]);
      setNewFollowupNote('');
      setNextFollowupDate('');
      setNextFollowupRemarks('');
      addToast('Follow-up logged successfully', 'success');

      // Refresh audit logs
      const logs = await fetchLeadAuditLogs(lead.id);
      setAuditLogs(logs || []);
    }
  };

  // Handle Schedule Reminder submit
  const handleScheduleReminderSubmit = async (e) => {
    e.preventDefault();
    if (!reminderDateTime) {
      addToast('Please select a date and time for the reminder', 'warning');
      return;
    }
    if (!reminderNote.trim()) {
      addToast('Reminder description is required', 'warning');
      return;
    }

    // Format time: HTML datetime-local format: "YYYY-MM-DDTHH:MM" -> expected: "YYYY-MM-DD HH:MM"
    const formattedTime = reminderDateTime.replace('T', ' ');

    const payload = {
      desc: `[Lead: ${lead.name}] ${reminderNote.trim()}`,
      type: 'Call',
      time: formattedTime,
      priority: reminderPriority,
      linkedTo: lead.name,
      completed: false
    };

    try {
      const created = await createReminder(payload);
      if (created) {
        addToast('Background reminder scheduled successfully', 'success');
        setReminderNote('');
        setReminderDateTime('');
        setShowReminderForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] z-50 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800/80 flex flex-col h-full transform transition-transform duration-300 ease-out">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <ClipboardList size={16} />
          </span>
          <h2 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Lead Profile Profile</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onStartEdit(lead)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
            title="Edit Info"
          >
            <Edit size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg cursor-pointer">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Drawer Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Profile Card */}
        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center mx-auto shadow-md text-sm">
            {lead.name ? lead.name.split(' ').map(n => n.charAt(0)).join('') : 'LD'}
          </div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mt-3">{lead.name}</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">{lead.company}</p>
          {lead.industry && (
            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 inline-block">
              {lead.industry}
            </span>
          )}
        </div>

        {/* Dynamic Status Progress Bar */}
        <div className="bg-slate-50/50 dark:bg-slate-900/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs">
          <StatusProgressBar currentStage={lead.stage || lead.status} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Expected Value</span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(lead.value)}</p>
          </div>
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Stage Status</span>
            <div className="mt-1">
              <span className={`badge ${getStatusColor(lead.stage || lead.status || 'New')} whitespace-nowrap`}>
                {lead.stage || lead.status || 'New'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Info Details */}
        <div className="bg-slate-50/20 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3.5 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <Mail size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 truncate" title="Email">{lead.email || 'No Email'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300" title="Phone">{lead.phone || 'No Phone'}</span>
          </div>
          {lead.altPhone && (
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300" title="Alt Phone">{lead.altPhone} (Alternate)</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Building size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 truncate" title="Company">{lead.company}</span>
          </div>
          {lead.website && (
            <div className="flex items-center gap-3">
              <Globe size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <a href={`https://${lead.website}`} target="_blank" rel="noreferrer" className="text-indigo-650 dark:text-indigo-400 hover:underline truncate">{lead.website}</a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <User size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">Rep Agent: <span className="font-bold text-slate-800 dark:text-white">{formatAssignedAgent(lead.assignedTo || lead.assigned_to)}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Tag size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              Interest Label: <span className="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded font-bold uppercase text-[10px] tracking-wider">{lead.product_interest || 'Unlabeled'}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">Created At: {formatDate(lead.createdAt || lead.created_at)}</span>
          </div>
          {lead.priority && (
            <div className="flex items-center gap-3">
              <Tag size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Priority Score: <span className="font-bold">{lead.priority}</span></span>
            </div>
          )}
          
          {lead.requirement && (
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 mt-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lead Requirements</span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed font-medium">{lead.requirement}</p>
            </div>
          )}
        </div>

        {/* WhatsApp & Call integration - Premium buttons */}
        <div className="flex items-center gap-3 border-t border-slate-150 dark:border-slate-800/80 pt-4">
          <button 
            onClick={() => {
              navigate(`/omnichannel/whatsapp?leadId=${lead.id}`);
              addToast(`Opening WhatsApp chat with ${lead.name}`, 'info');
            }}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/10 active:scale-98 transform"
          >
            <MessageCircle size={14} />
            <span>WhatsApp Chat</span>
          </button>
          <button 
            onClick={() => {
              navigate('/omnichannel/calls');
              addToast(`Dialing ${lead.name}`, 'info');
            }}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-650/10 active:scale-98 transform"
          >
            <Phone size={14} />
            <span>Call Dialer</span>
          </button>
        </div>

        {/* Reminders / Cron scheduler form */}
        <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Bell size={11} className="text-amber-500" />
              <span>Scheduled Reminders (Background Tasks)</span>
            </h4>
            <button 
              onClick={() => setShowReminderForm(prev => !prev)}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline"
            >
              {showReminderForm ? 'Cancel' : '🗓️ Schedule'}
            </button>
          </div>

          {showReminderForm && (
            <form onSubmit={handleScheduleReminderSubmit} className="space-y-3 bg-amber-50/20 dark:bg-amber-950/5 p-3 rounded-xl border border-amber-200/40 dark:border-amber-900/30 mb-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reminder Date & Time *</label>
                <input 
                  type="datetime-local" 
                  value={reminderDateTime}
                  onChange={e => setReminderDateTime(e.target.value)}
                  className="w-full text-xs p-2 bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reminder Note / Alarm Desc *</label>
                <textarea 
                  value={reminderNote}
                  onChange={e => setReminderNote(e.target.value)}
                  placeholder="What is this reminder for?"
                  className="w-full text-xs p-2 bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority Level</label>
                <select 
                  value={reminderPriority}
                  onChange={e => setReminderPriority(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full justify-center py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
              >
                Schedule Task
              </button>
            </form>
          )}
        </div>

        {/* Follow-up logs & scheduler form */}
        <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CheckSquare size={11} className="text-indigo-500" />
              <span>Follow-Up History Logs</span>
            </h4>
            {followups.length > 0 && (
              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-extrabold">
                {followups.length} Registered
              </span>
            )}
          </div>

          {/* Inline form to log current follow up */}
          <form onSubmit={handleLogFollowupSubmit} className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex gap-2">
              <select 
                value={followupType} 
                onChange={e => setFollowupType(e.target.value)} 
                className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="Call">📞 Call</option>
                <option value="WhatsApp">💬 WhatsApp</option>
                <option value="Email">✉️ Email</option>
                <option value="F2F Meeting">🤝 Meeting</option>
              </select>
              <span className="text-[9px] text-slate-400 font-semibold self-center">
                First Follow-up: {followups.length > 0 ? followups[0].followup_date : 'None'}
              </span>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Follow-Up Remarks *</label>
              <textarea 
                value={newFollowupNote}
                onChange={e => setNewFollowupNote(e.target.value)}
                placeholder="What was discussed during the interaction?" 
                className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium" 
                rows="2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Next Follow-Up Date</label>
                <input 
                  type="date" 
                  value={nextFollowupDate}
                  onChange={e => setNextFollowupDate(e.target.value)}
                  className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 font-semibold" 
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Next Task / Goal</label>
                <input 
                  type="text" 
                  value={nextFollowupRemarks}
                  onChange={e => setNextFollowupRemarks(e.target.value)}
                  placeholder="e.g. Closing call" 
                  className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 font-medium" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full justify-center py-2 text-xs font-bold cursor-pointer"
            >
              Log Interaction
            </button>
          </form>

          {/* Follow-up Timeline */}
          <div className="max-h-60 overflow-y-auto pr-1">
            <FollowupTimeline followups={followups} loading={loadingFollowups} />
          </div>
        </div>

        {/* Activity & Audit Logs */}
        <div className="space-y-3 pt-4 border-t border-slate-150 dark:border-slate-800/80">
          <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Activity Logs & Field Changes</span>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
              {auditLogs.length} updates
            </span>
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {loadingAuditLogs ? (
              <p className="text-[10px] text-slate-400 italic">Loading audit logs...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No activity recorded yet.</p>
            ) : (
              auditLogs.map((log) => {
                const utcDate = new Date(log.changed_at);
                const istOptions = {
                  timeZone: 'Asia/Kolkata',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                };
                const istTimeString = utcDate.toLocaleString('en-IN', istOptions);

                const fieldNameMap = {
                  full_name: 'Name',
                  email: 'Email',
                  phone_primary: 'Phone',
                  company_name: 'Company',
                  lead_source: 'Source',
                  lead_status: 'Status/Stage',
                  lead_score: 'Score',
                  assigned_agent_id: 'Assigned Agent',
                  deal_value_expected: 'Expected Income'
                };
                const friendlyField = fieldNameMap[log.field_name] || log.field_name;

                return (
                  <div key={log.id} className="p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-xl relative text-[11px] font-medium">
                    <p className="font-semibold text-slate-700 dark:text-slate-205">
                      Updated <span className="text-indigo-650 dark:text-indigo-400 font-bold">{friendlyField}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      From: <span className="italic">"{log.old_value || 'None'}"</span> → To: <span className="font-semibold">"{log.new_value || 'None'}"</span>
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                      <span>By: {log.changed_by || 'System/Admin'}</span>
                      <span className="text-amber-600 dark:text-amber-500">🇮🇳 {istTimeString}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
