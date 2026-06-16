import PageHeader from '@/components/ui/PageHeader';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Clock, CheckCircle, AlertCircle, UserCheck, Search, 
  MapPin, LogIn, LogOut, UserX, Plus, Edit3, X, Calendar, Watch
} from 'lucide-react';

export default function Attendance() {
  const { 
    attendance, 
    employees, 
    clockInOut,
    addToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [activeShiftTab, setActiveShiftTab] = useState('Overview');

  // Manual correction form fields
  const [correctionFields, setCorrectionFields] = useState({
    employeeId: '',
    type: 'in',
    time: '',
    status: 'On Time',
    method: 'Manual Entry'
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute daily metrics from global attendance list
  const stats = useMemo(() => {
    const todayLogs = attendance.filter(a => a.date === todayStr);
    const totalStaff = employees.length;
    const present = todayLogs.filter(a => ['On Time', 'Present', 'Late', 'Half Day', 'Work From Home'].includes(a.status)).length;
    const absent = totalStaff - present;
    const late = todayLogs.filter(a => a.status === 'Late').length;
    const punctuality = present > 0 ? Math.round(((present - late) / present) * 100) : 100;

    return {
      totalStaff,
      present,
      absent,
      late,
      punctuality
    };
  }, [attendance, employees, todayStr]);

  // Filter list
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || 
                            (statusFilter === 'Present' && a.status !== 'Absent') ||
                            a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendance, searchQuery, statusFilter]);

  const handleManualCorrection = (e) => {
    e.preventDefault();
    if (!correctionFields.employeeId || !correctionFields.time) return;

    clockInOut(correctionFields.employeeId, correctionFields.type, {
      time: correctionFields.time,
      status: correctionFields.status,
      method: correctionFields.method
    });
    
    setShowCorrectionModal(false);
    setCorrectionFields({
      employeeId: '',
      type: 'in',
      time: '',
      status: 'On Time',
      method: 'Manual Entry'
    });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
            <PageHeader title="Attendance Management" subtitle="Track employee attendance, punch-in/out & work hours" />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Staff Present Today', value: `${stats.present} / ${stats.totalStaff}`, icon: UserCheck, color: 'text-indigo-500' },
          { label: 'Absent Today', value: stats.absent, icon: UserX, color: 'text-red-500' },
          { label: 'Late Clock-Ins', value: stats.late, icon: AlertCircle, color: 'text-amber-500' },
          { label: 'Punctuality Ratio', value: `${stats.punctuality}%`, icon: CheckCircle, color: 'text-emerald-500' }
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <h4 className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">{stat.value}</h4>
              </div>
              <div className={`p-2.5 rounded-xl bg-muted dark:bg-slate-800/60 ${stat.color}`}>
                <StatIcon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs for Shift Management Overview */}
      <div className="flex border-b border-border/60">
        {['Overview', 'Shift Schedules'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveShiftTab(tab)}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeShiftTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeShiftTab === 'Overview' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, or status..."
                className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto shrink-0">
              {['All', 'Present', 'Late', 'Half Day', 'Absent'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === tab
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-border/60'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted text-muted-foreground font-bold border-b border-border/80">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Check In</th>
                    <th className="px-5 py-3">Check Out</th>
                    <th className="px-5 py-3">Working Hours</th>
                    <th className="px-5 py-3">Break Duration</th>
                    <th className="px-5 py-3">Overtime</th>
                    <th className="px-5 py-3">Verification Method</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
                  {filteredAttendance.map(log => (
                    <tr key={log.id} className={`hover:bg-muted/40 transition-colors ${log.active ? 'bg-green-500/5' : ''}`}>
                      <td className="px-5 py-3.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                          {log.name.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{log.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{log.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-primary">{log.checkIn}</td>
                      <td className="px-5 py-3.5 font-mono">{log.checkOut}</td>
                      <td className="px-5 py-3.5 font-mono">{log.workingHours || 0} hrs</td>
                      <td className="px-5 py-3.5">{log.breakDuration || '-'}</td>
                      <td className="px-5 py-3.5 text-success font-mono">+{log.overtimeHours || 0} hrs</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <MapPin size={12} className="text-muted-foreground" /> {log.method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          log.status === 'On Time' || log.status === 'Present' ? 'bg-success/15 text-success border-success/30' :
                          log.status === 'Absent' ? 'bg-danger/10 text-danger border-danger/20' :
                          log.status === 'Half Day' ? 'bg-slate-100 text-slate-600 border-slate-250' :
                          'bg-amber-400/10 text-amber-500 border-amber-400/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-muted-foreground font-medium">
                        No attendance logs match the query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeShiftTab === 'Shift Schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'General Shift', hours: '09:30 AM - 06:30 PM', count: 12, bg: 'from-blue-500 to-indigo-600' },
            { title: 'Morning Shift', hours: '06:00 AM - 02:00 PM', count: 4, bg: 'from-amber-400 to-orange-500' },
            { title: 'Evening Shift', hours: '02:00 PM - 10:00 PM', count: 6, bg: 'from-purple-500 to-indigo-500' },
            { title: 'Night Shift', hours: '10:00 PM - 06:00 AM', count: 3, bg: 'from-slate-800 to-slate-950' }
          ].map(shift => (
            <div key={shift.title} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className={`p-4 bg-gradient-to-br ${shift.bg} text-white`}>
                <h4 className="font-bold text-sm">{shift.title}</h4>
                <p className="text-[10px] text-white/80 mt-0.5 flex items-center gap-1 font-mono">
                  <Watch size={11} /> {shift.hours}
                </p>
              </div>
              <div className="p-4 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Assigned Count:</span>
                <span className="text-foreground bg-muted border border-border/40 px-2 py-0.5 rounded-md">{shift.count} Staff</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MANUAL PUNCH CORRECTION DIALOG */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-foreground">Log Manual Punch Record</h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleManualCorrection} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>Select Employee</label>
                <select
                  value={correctionFields.employeeId}
                  onChange={e => setCorrectionFields(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                  required
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label>Punch Type</label>
                  <select
                    value={correctionFields.type}
                    onChange={e => setCorrectionFields(prev => ({ ...prev, type: e.target.value }))}
                    className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                  >
                    <option value="in">Clock In</option>
                    <option value="out">Clock Out</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label>Punch Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:15 AM"
                    value={correctionFields.time}
                    onChange={e => setCorrectionFields(prev => ({ ...prev, time: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label>Daily Punctuality Status</label>
                <select
                  value={correctionFields.status}
                  onChange={e => setCorrectionFields(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                >
                  <option value="On Time">On Time</option>
                  <option value="Late">Late Mark</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Work From Home">Work From Home</option>
                </select>
              </div>

              <div className="space-y-1">
                <label>Verification Method / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Bio-sensor failure override"
                  value={correctionFields.method}
                  onChange={e => setCorrectionFields(prev => ({ ...prev, method: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2 font-bold mt-2">
                Submit Attendance Correction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
