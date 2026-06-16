import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tasks as initialTasks, calendarEvents as initialEvents } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { getStatusColor } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, GripVertical, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function TasksCalendar() {
  const { tasks = [], createTask, updateTask, deleteTask, addToast } = useApp();
  const events = tasks.map(t => ({
    id: t.id,
    title: t.title,
    type: t.type?.toLowerCase() === 'meeting' ? 'meeting' : t.type?.toLowerCase() === 'holiday' ? 'holiday' : 'task',
    date: t.dueDate || t.startDate,
    startTime: '09:00',
    endTime: '10:00'
  }));
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.includes('calendar') ? 'calendar' : 'board';
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  
  const [newEvent, setNewEvent] = useState({ title: '', type: 'meeting', startTime: '09:00', endTime: '10:00' });
  const [newFormTask, setNewFormTask] = useState({
    title: '', // Task Name
    type: 'Task', // Task Type
    priority: 'Medium',
    status: 'To Do',
    assignee: 'Arjun Mehta', // Assigned To
    startDate: '',
    dueDate: '',
    reminderDate: '',
    description: '',
    notes: '',
    project: 'General'
  });
  
  const [draggedTask, setDraggedTask] = useState(null);

  // Task Board
  const taskColumns = ['To Do', 'In Progress', 'Done'];
  const handleTaskDrop = (e, status) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === status) return;
    updateTask(draggedTask.id, { status });
    addToast(`"${draggedTask.title}" moved to ${status}`);
    setDraggedTask(null);
  };

  const handleCreateTaskSubmit = (e) => {
    e.preventDefault();
    if (!newFormTask.title) {
      addToast('Task Name is required', 'warning');
      return;
    }
    const payload = {
      ...newFormTask,
      dueDate: newFormTask.dueDate || new Date().toISOString().split('T')[0]
    };
    createTask(payload);
    setShowAddTaskModal(false);
    setNewFormTask({
      title: '',
      type: 'Task',
      priority: 'Medium',
      status: 'To Do',
      assignee: 'Arjun Mehta',
      startDate: '',
      dueDate: '',
      reminderDate: '',
      description: '',
      notes: '',
      project: 'General'
    });
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDate = (dateStr) => {
    return tasks.filter(t => t.dueDate === dateStr || t.startDate === dateStr).map(t => ({
      id: t.id,
      title: t.title,
      type: t.type?.toLowerCase() === 'meeting' ? 'meeting' : t.type?.toLowerCase() === 'holiday' ? 'holiday' : 'task',
      date: t.dueDate || t.startDate,
      startTime: '09:00',
      endTime: '10:00'
    }));
  };

  const eventColors = { meeting: 'bg-blue-100 text-blue-700 border-l-2 border-l-blue-500', task: 'bg-emerald-100 text-emerald-700 border-l-2 border-l-emerald-500', holiday: 'bg-white text-red-600 border border-red-300' };

  const handleAddEvent = () => {
    if (!newEvent.title) return;
    createTask({
      title: newEvent.title,
      type: newEvent.type === 'meeting' ? 'Meeting' : newEvent.type === 'task' ? 'Task' : 'Review',
      startDate: selectedDay,
      dueDate: selectedDay,
      status: 'To Do',
      priority: 'Medium',
      assignee: 'Arjun Mehta',
      project: 'General',
      description: 'Calendar Event'
    });
    setShowAddEvent(false);
    setNewEvent({ title: '', type: 'meeting', startTime: '09:00', endTime: '10:00' });
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    setShowAddEvent(true);
  };

  // Week view dates
  const getWeekDates = () => {
    const curr = new Date(year, month, today.getDate());
    const start = new Date(curr);
    start.setDate(curr.getDate() - curr.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <PageHeader title="Tasks & Calendar" subtitle="Plan, schedule, and track team tasks" />
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate('/tasks')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'board' ? 'bg-[var(--color-primary)] text-white font-bold' : 'bg-[var(--color-muted)] hover:opacity-95 text-slate-600 dark:text-slate-300'}`}>Task Board</button>
          <button onClick={() => navigate('/tasks/calendar')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'calendar' ? 'bg-[var(--color-primary)] text-white font-bold' : 'bg-[var(--color-muted)] hover:opacity-95 text-slate-600 dark:text-slate-300'}`}>Calendar</button>
          {activeTab === 'board' && (
            <button onClick={() => setShowAddTaskModal(true)} className="btn-primary flex items-center gap-1.5 py-1.5 px-3.5 text-xs rounded-xl" style={{ color: '#ffffff' }}>
              <Plus size={14} />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {taskColumns.map(col => {
            const colTasks = tasks.filter(t => t.status === col);
            return (
              <div key={col} className={`kanban-column shrink-0 w-[320px] ${col === 'To Do' ? 'border-t-[3px] border-t-blue-400' : col === 'In Progress' ? 'border-t-[3px] border-t-amber-400' : 'border-t-[3px] border-t-emerald-400'}`}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleTaskDrop(e, col)}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold">{col}</h3>
                  <span className="text-xs text-[var(--color-muted-foreground)]">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(task => (
                    <div key={task.id} className="kanban-card" draggable onDragStart={(e) => { setDraggedTask(task); setTimeout(() => e.target.classList.add('dragging'), 0); }} onDragEnd={(e) => { e.target.classList.remove('dragging'); setDraggedTask(null); }}>
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium flex-1">{task.title}</p>
                        <GripVertical size={14} className="text-[#cbd5e1] shrink-0 cursor-grab" />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[var(--color-muted-foreground)]">{task.assignee}</span>
                        <span className={`badge ${getStatusColor(task.priority)} text-[10px]`}>{task.priority}</span>
                      </div>
                      <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1">Due: {task.dueDate} • {task.project}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          {/* Calendar header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="btn-ghost p-1.5"><ChevronLeft size={18} /></button>
              <h2 className="text-sm font-semibold min-w-[140px] text-center">{monthNames[month]} {year}</h2>
              <button onClick={nextMonth} className="btn-ghost p-1.5"><ChevronRight size={18} /></button>
            </div>
            <div className="flex items-center gap-1">
              {['month', 'week', 'day'].map(v => (
                <button key={v} onClick={() => setCalendarView(v)} className={`px-3 py-1 rounded-md text-xs font-medium capitalize ${calendarView === v ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)] hover:bg-[#e2e8f0]'}`}>{v}</button>
              ))}
            </div>
          </div>

          {/* Calendar legend */}
          <div className="flex items-center gap-4 px-5 py-2 border-b border-[var(--color-border)] text-xs">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-400" />Meetings</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400" />Tasks</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border-2 border-red-400" />Holidays</span>
          </div>

          {calendarView === 'month' && (
            <div>
              <div className="grid grid-cols-7">{dayNames.map(d => <div key={d} className="text-center text-xs font-semibold text-[var(--color-muted-foreground)] py-2 border-b border-[var(--color-border)]">{d}</div>)}</div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="calendar-cell bg-[var(--color-muted)]/30 min-h-[100px]" />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = getEventsForDate(dateStr);
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  return (
                    <div key={day} className={`calendar-cell ${isToday ? 'today' : ''}`} onClick={() => handleDayClick(day)}>
                      <div className="flex items-center justify-between px-1 mb-1">
                        <span className={`text-xs font-medium ${isToday ? 'w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center' : ''}`}>{day}</span>
                      </div>
                      <div className="space-y-0.5 px-0.5">
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${eventColors[ev.type]}`}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div className="text-[10px] text-[var(--color-muted-foreground)] px-1">+{dayEvents.length - 3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calendarView === 'week' && (
            <div>
              <div className="grid grid-cols-8">
                <div className="w-16 shrink-0 border-b border-r border-[var(--color-border)] py-2" />
                {getWeekDates().map(d => (
                  <div key={d.toISOString()} className="text-center py-2 border-b border-r border-[var(--color-border)]">
                    <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{dayNames[d.getDay()]}</span>
                    <span className={`block text-sm font-semibold mt-0.5 ${d.toDateString() === today.toDateString() ? 'text-[var(--color-primary)]' : ''}`}>{d.getDate()}</span>
                  </div>
                ))}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-8 h-16">
                    <div className="w-16 shrink-0 text-right pr-2 pt-1 text-[10px] text-[var(--color-muted-foreground)] border-r border-[var(--color-border)]">
                      {hour}:00
                    </div>
                    {getWeekDates().map(d => {
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      const hourEvents = events.filter(e => e.date === dateStr && parseInt(e.startTime) === hour);
                      return (
                        <div key={d.toISOString()} className="border-r border-b border-[var(--color-border)] px-0.5 py-0.5">
                          {hourEvents.map(ev => (
                            <div key={ev.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${eventColors[ev.type]}`}>{ev.title}</div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {calendarView === 'day' && (
            <div className="max-h-[500px] overflow-y-auto">
              <div className="text-center py-3 border-b border-[var(--color-border)]">
                <span className="text-sm font-semibold">{today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {hours.map(hour => {
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const hourEvents = events.filter(e => e.date === dateStr && parseInt(e.startTime) === hour);
                return (
                  <div key={hour} className="flex h-20 border-b border-[var(--color-border)]">
                    <div className="w-20 shrink-0 text-right pr-3 pt-1 text-xs text-[var(--color-muted-foreground)]">{hour}:00</div>
                    <div className="flex-1 px-2 py-1 border-l border-[var(--color-border)]">
                      {hourEvents.map(ev => (
                        <div key={ev.id} className={`text-xs px-2 py-1.5 rounded mb-1 ${eventColors[ev.type]}`}>
                          <span className="font-medium">{ev.title}</span>
                          <span className="ml-2 opacity-70">{ev.startTime} – {ev.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Event modal */}
      {showAddEvent && (
        <div className="modal-overlay" onClick={() => setShowAddEvent(false)}>
          <div className="modal-content w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Add Event — {selectedDay}</h3>
              <button onClick={() => setShowAddEvent(false)} className="btn-ghost p-1"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-sm font-medium mb-1 block">Title *</label><input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="input-field" placeholder="Event title" /></div>
              <div><label className="text-sm font-medium mb-1 block">Type</label>
                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="input-field">
                  <option value="meeting">Meeting</option><option value="task">Task</option><option value="holiday">Holiday</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1 block">Start</label><input type="time" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} className="input-field" /></div>
                <div><label className="text-sm font-medium mb-1 block">End</label><input type="time" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} className="input-field" /></div>
              </div>
              <button onClick={handleAddEvent} className="btn-primary w-full justify-center">Add Event</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showAddTaskModal && (
        <div className="sheet-overlay animate-fade-in" onClick={() => setShowAddTaskModal(false)}>
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 border-b pb-3 border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Create CRM Task</h2>
              <button onClick={() => setShowAddTaskModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="col-span-2"><label className="text-xs font-semibold mb-1 block">Task Name *</label><input type="text" value={newFormTask.title} onChange={e => setNewFormTask({...newFormTask, title: e.target.value})} className="input-field" placeholder="Task Title" required /></div>
              
              <div><label className="text-xs font-semibold mb-1 block">Task Type</label>
                <select value={newFormTask.type} onChange={e => setNewFormTask({...newFormTask, type: e.target.value})} className="input-field">
                  <option value="Task">Task</option><option value="Meeting">Meeting</option><option value="Follow-Up">Follow-Up</option><option value="Call">Call</option><option value="Review">Review</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Priority</label>
                <select value={newFormTask.priority} onChange={e => setNewFormTask({...newFormTask, priority: e.target.value})} className="input-field">
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Status</label>
                <select value={newFormTask.status} onChange={e => setNewFormTask({...newFormTask, status: e.target.value})} className="input-field">
                  <option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Done">Done</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Assigned To</label><input type="text" value={newFormTask.assignee} onChange={e => setNewFormTask({...newFormTask, assignee: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Start Date</label><input type="date" value={newFormTask.startDate} onChange={e => setNewFormTask({...newFormTask, startDate: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Due Date</label><input type="date" value={newFormTask.dueDate} onChange={e => setNewFormTask({...newFormTask, dueDate: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Reminder Date</label><input type="date" value={newFormTask.reminderDate} onChange={e => setNewFormTask({...newFormTask, reminderDate: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Associated Project</label><input type="text" value={newFormTask.project} onChange={e => setNewFormTask({...newFormTask, project: e.target.value})} className="input-field" placeholder="e.g. General" /></div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Description</label>
                <textarea rows="2" value={newFormTask.description} onChange={e => setNewFormTask({...newFormTask, description: e.target.value})} className="input-field" placeholder="Detail task description..."></textarea>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Notes</label>
                <textarea rows="2" value={newFormTask.notes} onChange={e => setNewFormTask({...newFormTask, notes: e.target.value})} className="input-field" placeholder="Internal remarks..."></textarea>
              </div>

              <div className="col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="btn-outline w-full justify-center py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary w-full justify-center py-2 text-xs" style={{ color: '#ffffff' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
