import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Bell, Search, Plus, CheckCircle, X, Clock, 
  Send, ShieldAlert, CheckSquare, Trash2, PlusCircle
} from 'lucide-react';

const mockReminders = [];

export default function Reminders() {
  const { 
    reminders = [], 
    createReminder, 
    updateReminder, 
    deleteReminder, 
    addToast 
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active'); // Active, Completed
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New reminder state
  const [newReminder, setNewReminder] = useState({
    desc: '',
    type: 'Call',
    time: '',
    priority: 'Medium',
    linkedTo: ''
  });

  // Calculate statistics
  const activeCount = reminders.filter(r => !r.completed).length;
  const overdueCount = reminders.filter(r => !r.completed && new Date(r.time) < new Date()).length;
  const completedToday = reminders.filter(r => r.completed).length;

  // Filter list
  const filteredReminders = reminders.filter(r => {
    const descLower = (r.desc || '').toLowerCase();
    const linkedToLower = (r.linkedTo || '').toLowerCase();
    const matchesSearch = descLower.includes(searchQuery.toLowerCase()) || 
                          linkedToLower.includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Active') matchesStatus = !r.completed;
    else if (statusFilter === 'Completed') matchesStatus = r.completed;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleComplete = async (id) => {
    try {
      await updateReminder(id, { completed: true });
      addToast('Reminder marked as completed', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSnooze = async (id, mins) => {
    const snoozeTime = new Date(Date.now() + mins * 60 * 1000);
    // Format to YYYY-MM-DD HH:MM
    const formatted = snoozeTime.toISOString().split('T')[0] + ' ' + 
                      snoozeTime.toTimeString().split(' ')[0].substring(0, 5);
    try {
      await updateReminder(id, { time: formatted });
      addToast(`Reminder snoozed for ${mins} minutes`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleWhatsAppAlert = (r) => {
    addToast(`WhatsApp alert dispatched to ${r.linkedTo}`, 'success');
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this reminder?')) {
      try {
        await deleteReminder(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.desc || !newReminder.time) {
      addToast('Please fill out description and due time.', 'error');
      return;
    }

    // Format date input value
    const formattedTime = newReminder.time.replace('T', ' ');

    const generated = {
      desc: newReminder.desc,
      type: newReminder.type,
      time: formattedTime,
      priority: newReminder.priority,
      linkedTo: newReminder.linkedTo || 'Internal',
      completed: false
    };

    try {
      await createReminder(generated);
      setShowCreateModal(false);
      setNewReminder({ desc: '', type: 'Call', time: '', priority: 'Medium', linkedTo: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
            <PageHeader title="Reminders" subtitle="Set and manage scheduled follow-up reminders">
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <PlusCircle size={14} /> Create Reminder
        </button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Active Reminders', value: activeCount, icon: Bell, color: 'text-indigo-500' },
          { label: 'Overdue Alerts', value: overdueCount, icon: ShieldAlert, color: 'text-red-500' },
          { label: 'Completed Log Today', value: completedToday, icon: CheckSquare, color: 'text-emerald-500' }
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <h4 className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">{stat.value}</h4>
              </div>
              <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${stat.color}`}>
                <StatIcon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and List */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by reminder desc or client link..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <div className="flex gap-1 border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl bg-white dark:bg-slate-900">
            {['Active', 'Completed'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reminders List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reminder Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Due time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Linked context</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
              {filteredReminders.map(r => {
                const isOverdue = !r.completed && new Date(r.time) < new Date();
                return (
                  <tr key={r.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <p className={`font-bold text-sm ${r.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{r.desc}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-550 border font-bold text-[10px]">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className={isOverdue ? 'text-red-500' : 'text-slate-400'} />
                        <span className={isOverdue ? 'text-red-500 font-bold' : 'text-slate-550 font-medium'}>
                          {r.time} {isOverdue && '(Overdue)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-bold">{r.linkedTo}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                        r.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200/50' :
                        r.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                        'bg-blue-50 text-blue-700 border-blue-200/50'
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {!r.completed && (
                          <>
                            <button 
                              onClick={() => handleComplete(r.id)}
                              className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Mark Completed"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button 
                              onClick={() => handleSnooze(r.id, 15)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold flex items-center gap-0.5"
                              title="Snooze 15m"
                            >
                              +15m
                            </button>
                          </>
                        )}
                        {r.linkedTo !== 'Internal' && !r.completed && (
                          <button 
                            onClick={() => handleWhatsAppAlert(r)}
                            className="p-1.5 text-slate-400 hover:text-purple-650 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Dispatched WhatsApp reminder"
                          >
                            <Send size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredReminders.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No reminders found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Reminder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="text-indigo-500" /> Schedule Reminder
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description / Action *</label>
                <input 
                  type="text" 
                  required
                  value={newReminder.desc}
                  onChange={e => setNewReminder(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="e.g. Call Vikram Patel regarding inventory setup" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Type</label>
                  <select 
                    value={newReminder.type}
                    onChange={e => setNewReminder(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option>Call</option>
                    <option>Document</option>
                    <option>Payment</option>
                    <option>Meeting</option>
                    <option>Task</option>
                    <option>Debug</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority</label>
                  <select 
                    value={newReminder.priority}
                    onChange={e => setNewReminder(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Client / Lead</label>
                  <input 
                    type="text" 
                    value={newReminder.linkedTo}
                    onChange={e => setNewReminder(prev => ({ ...prev, linkedTo: e.target.value }))}
                    placeholder="e.g. Vikram Patel" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Time *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newReminder.time}
                    onChange={e => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
