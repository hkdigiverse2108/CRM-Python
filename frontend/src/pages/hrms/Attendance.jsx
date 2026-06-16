import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Clock, CheckCircle, AlertCircle, Calendar, Coffee, Briefcase, Search, Plus, X, Watch, User, RefreshCw
} from 'lucide-react';

export default function Attendance() {
  const { 
    attendance = [], 
    employees = [], 
    clockInOut,
    user,
    hrmsEmployeeId,
    addToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [liveWorkedTime, setLiveWorkedTime] = useState('0h 0m');
  const [liveBreakTime, setLiveBreakTime] = useState('0h 0m');

  // Manual correction form fields
  const [correctionFields, setCorrectionFields] = useState({
    employeeId: '',
    type: 'in',
    time: '',
    status: 'On Time',
    method: 'Manual Entry'
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Find corresponding employee record for logged-in user or active simulator employee
  const currentEmployee = useMemo(() => {
    return employees.find(emp => emp.employee_id === hrmsEmployeeId || emp.id === hrmsEmployeeId) || 
           employees.find(emp => emp.email === user?.email) || 
           employees[0] || 
           null;
  }, [employees, hrmsEmployeeId, user]);

  // Filter attendance records to ONLY show the logged-in user's records
  const myAttendance = useMemo(() => {
    if (!currentEmployee) return [];
    return attendance.filter(a => a.employeeId === currentEmployee.employee_id || a.employeeId === currentEmployee.id);
  }, [attendance, currentEmployee]);

  // Today's specific log
  const todayLog = useMemo(() => {
    return myAttendance.find(a => a.date === todayStr) || null;
  }, [myAttendance, todayStr]);

  const todayBreaks = useMemo(() => {
    if (!todayLog || !todayLog.breakHistory) return [];
    try {
      return JSON.parse(todayLog.breakHistory);
    } catch (e) {
      return [];
    }
  }, [todayLog]);

  // Helper: parse string time (e.g. "08:44 AM") into milliseconds from today start
  const parseTimeToMs = (timeStr) => {
    if (!timeStr) return 0;
    try {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d.getTime();
    } catch (e) {
      return 0;
    }
  };

  // Helper: format milliseconds into "Xh Ym"
  const formatMsToHrsMins = (ms) => {
    const totalMins = Math.max(0, Math.floor(ms / 60000));
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  // Live timer updates
  useEffect(() => {
    if (!todayLog || !todayLog.active) {
      // If not active (either clocked out or no log today), set values static
      setLiveWorkedTime(todayLog ? `${Math.floor(todayLog.workingHours)}h ${Math.round((todayLog.workingHours % 1) * 60)}m` : '0h 0m');
      setLiveBreakTime(todayLog?.breakDuration || '0h 0m');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const checkInMs = parseTimeToMs(todayLog.checkIn);
      if (!checkInMs) return;

      let breaks = [];
      try {
        breaks = todayLog.breakHistory ? JSON.parse(todayLog.breakHistory) : [];
      } catch (e) {
        breaks = [];
      }

      // Calculate total completed breaks
      let totalCompletedBreakMs = 0;
      breaks.forEach(b => {
        if (b.start && b.end) {
          totalCompletedBreakMs += (parseTimeToMs(b.end) - parseTimeToMs(b.start));
        }
      });

      let currentBreakMs = 0;
      const isActiveBreak = todayLog.currentStatus === 'break-in';
      
      if (isActiveBreak && breaks.length > 0) {
        const lastBreak = breaks[breaks.length - 1];
        const lastBreakStartMs = parseTimeToMs(lastBreak.start);
        if (lastBreakStartMs) {
          currentBreakMs = now - lastBreakStartMs;
        }
      }

      const totalBreakMs = totalCompletedBreakMs + currentBreakMs;
      setLiveBreakTime(formatMsToHrsMins(totalBreakMs));

      // Calculate worked duration
      let workedMs = 0;
      if (isActiveBreak) {
        // Worked time is frozen at the moment of break start
        const lastBreak = breaks[breaks.length - 1];
        const lastBreakStartMs = parseTimeToMs(lastBreak.start);
        workedMs = (lastBreakStartMs - checkInMs) - totalCompletedBreakMs;
      } else {
        // Active working: total elapsed time - total completed breaks
        workedMs = (now - checkInMs) - totalCompletedBreakMs;
      }

      setLiveWorkedTime(formatMsToHrsMins(workedMs));
    }, 1000);

    return () => clearInterval(interval);
  }, [todayLog]);

  // Compute Metrics for current user this month
  const stats = useMemo(() => {
    const presentRecords = myAttendance.filter(a => a.status === 'Present');
    const totalWorkingHours = presentRecords.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    
    // Parse breaks to compute total break duration this month
    let totalBreakMinutes = 0;
    presentRecords.forEach(a => {
      const bStr = a.breakDuration || '';
      const hMatch = bStr.match(/(\d+)h/);
      const mMatch = bStr.match(/(\d+)m/);
      const h = hMatch ? parseInt(hMatch[1]) : 0;
      const m = mMatch ? parseInt(mMatch[1]) : 0;
      totalBreakMinutes += (h * 60 + m);
    });

    const avgHours = presentRecords.length > 0 ? (totalWorkingHours / presentRecords.length) : 0;
    const avgH = Math.floor(avgHours);
    const avgM = Math.round((avgHours % 1) * 60);

    const breakH = Math.floor(totalBreakMinutes / 60);
    const breakM = totalBreakMinutes % 60;

    const workH = Math.floor(totalWorkingHours);
    const workM = Math.round((totalWorkingHours % 1) * 60);

    return {
      presentDays: presentRecords.length,
      avgDailyHours: `${avgH}h ${avgM}m`,
      breakTime: `${breakH}h ${breakM}m`,
      workingTime: `${workH}h ${workM}m`
    };
  }, [myAttendance]);

  // Monthly Calendar Generation (June 2026 as per user screenshot and context date)
  const currentMonthDays = useMemo(() => {
    const days = [];
    // June has 30 days
    const totalDays = 30;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `2026-06-${d.toString().padStart(2, '0')}`;
      const log = myAttendance.find(a => a.date === dateStr);
      days.push({
        dayNum: d,
        dateString: dateStr,
        isPresent: log?.status === 'Present',
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [myAttendance, todayStr]);

  // Filter and search on personal logs
  const filteredLogs = useMemo(() => {
    return myAttendance.filter(a => {
      const matchesSearch = searchQuery === '' || 
                            a.date.includes(searchQuery) ||
                            (a.currentStatus || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [myAttendance, searchQuery]);

  const handleAction = (actType) => {
    if (!currentEmployee) {
      addToast('No employee profile associated with your user account.', 'error');
      return;
    }
    clockInOut(currentEmployee.employee_id || currentEmployee.id, 'in', { action: actType });
  };

  const handleManualCorrection = (e) => {
    e.preventDefault();
    if (!correctionFields.employeeId || !correctionFields.time) return;

    clockInOut(correctionFields.employeeId, correctionFields.type, {
      time: correctionFields.time,
      status: correctionFields.status,
      method: 'Manual Entry'
    });
    
    setShowCorrectionModal(false);
  };

  const getDayName = (dateStr) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Attendance List</h1>
          <p className="text-xs text-slate-500">View and manage attendance records for the organization.</p>
        </div>
        <button
          onClick={() => {
            if (currentEmployee) {
              setCorrectionFields(prev => ({ ...prev, employeeId: currentEmployee.employee_id || currentEmployee.id }));
            }
            setShowCorrectionModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 dark:bg-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Clock size={13} className="text-slate-400" /> Recover Time
        </button>
      </div>

      {/* Main Stats and Action Panel */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Profile Card & Punch Controls */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/50 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 font-extrabold text-sm border border-indigo-100 dark:border-indigo-900/40">
                {(currentEmployee?.name || user?.full_name)?.split(' ').map(w => w[0]).join('') || 'U'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {currentEmployee?.name || user?.full_name || 'User Name'} <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md">(You)</span>
                </h4>
                <p className="text-[10px] text-slate-450 mt-0.5">
                  Employee • {currentEmployee?.role || 'Staff Member'}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle size={10} /> Present today
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-50 dark:bg-slate-850/40 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/30">
                <span className="block text-[8px] font-extrabold uppercase text-slate-450 tracking-wider">Today</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5 block">{todayLog ? liveWorkedTime : '--'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850/40 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/30">
                <span className="block text-[8px] font-extrabold uppercase text-slate-450 tracking-wider">Check-in</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5 block">{todayLog?.checkIn || '--:--'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850/40 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/30">
                <span className="block text-[8px] font-extrabold uppercase text-slate-450 tracking-wider">Status</span>
                <span className={`text-sm font-extrabold mt-0.5 block ${
                  todayLog?.currentStatus === 'punch-in' || todayLog?.currentStatus === 'break-out' ? 'text-emerald-600 dark:text-emerald-400' :
                  todayLog?.currentStatus === 'break-in' ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  {todayLog?.currentStatus === 'punch-in' || todayLog?.currentStatus === 'break-out' ? 'Active' :
                   todayLog?.currentStatus === 'break-in' ? 'Break' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons & Details */}
          <div className="mt-5 space-y-4">
            {todayLog && todayLog.currentStatus !== 'punch-out' ? (
              <>
                {/* Worked progress bar */}
                <div className="space-y-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    <span>Shift Progress (8h standard)</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                      {Math.min(100, Math.round(((parseInt(liveWorkedTime.match(/(\d+)h/)?.[1] || 0) * 60 + parseInt(liveWorkedTime.match(/(\d+)m/)?.[1] || 0)) / 480) * 100))}% ({liveWorkedTime} / 8h)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round(((parseInt(liveWorkedTime.match(/(\d+)h/)?.[1] || 0) * 60 + parseInt(liveWorkedTime.match(/(\d+)m/)?.[1] || 0)) / 480) * 100))}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                  {todayLog.currentStatus !== 'break-in' ? (
                    <button
                      onClick={() => handleAction('break-in')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-200 dark:shadow-none cursor-pointer"
                    >
                      Break In
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('break-out')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer"
                    >
                      Break Out
                    </button>
                  )}

                  {todayBreaks.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mr-1">Today's Breaks:</span>
                      {todayBreaks.map((b, idx) => (
                        <span key={idx} className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-800 text-slate-500 flex items-center gap-1">
                          <Coffee size={9} className="text-amber-500" /> {b.start} - {b.end || 'Active'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-850/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertCircle className="text-slate-400 shrink-0" size={18} />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">Not Clocked In Today</p>
                  <p className="text-slate-455 text-[10px] mt-0.5">Please Clock In from the main HRMS Dashboard to record your worked time and manage breaks.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* June 2026 Calendar Card */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3 mb-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">June 2026</h4>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
              {stats.presentDays} present
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* June 1, 2026 is Monday, so 1 empty spacer for Sunday */}
            <div className="aspect-square"></div>
            
            {currentMonthDays.map(day => (
              <div
                key={day.dayNum}
                className={`aspect-square flex items-center justify-center rounded-lg font-extrabold text-[10px] transition-all ${
                  day.isToday
                    ? 'bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-100 dark:shadow-none'
                    : day.isPresent
                      ? 'bg-emerald-550/10 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                {day.dayNum}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present Days', value: stats.presentDays, desc: 'My attendance records', icon: Calendar, color: 'text-indigo-500' },
          { label: 'Avg Daily Hours', value: stats.avgDailyHours, desc: 'Based on active logs', icon: Clock, color: 'text-amber-500' },
          { label: 'Break Time', value: todayLog ? liveBreakTime : stats.breakTime, desc: 'Cumulative break duration', icon: Coffee, color: 'text-rose-500' },
          { label: 'Working Time', value: stats.workingTime, desc: 'Total hours this month', icon: Briefcase, color: 'text-emerald-500' }
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <h4 className="text-base font-extrabold mt-1 text-slate-900 dark:text-white">{stat.value}</h4>
                <span className="text-[9px] text-slate-400 mt-0.5 block">{stat.desc}</span>
              </div>
              <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 ${stat.color}`}>
                <StatIcon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance Logs Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Attendance Logs</h3>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search attendance logs..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-950/20 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
                  <th className="px-5 py-3.5">SR. NO.</th>
                  <th className="px-5 py-3.5">DATE</th>
                  <th className="px-5 py-3.5">DAY</th>
                  <th className="px-5 py-3.5">CURRENT STATUS</th>
                  <th className="px-5 py-3.5">STATUS</th>
                  <th className="px-5 py-3.5">CHECK IN</th>
                  <th className="px-5 py-3.5">CHECK OUT</th>
                  <th className="px-5 py-3.5">BREAK</th>
                  <th className="px-5 py-3.5">LATE</th>
                  <th className="px-5 py-3.5">OVERTIME</th>
                  <th className="px-5 py-3.5">PRODUCTION HOURS</th>
                  <th className="px-5 py-3.5">TOTAL WORKED HOURS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-semibold text-slate-700 dark:text-slate-200">
                {filteredLogs.map((log, idx) => {
                  // Calculate total elapsed working time
                  const checkInMins = parseTimeToMs(log.checkIn);
                  const checkOutMins = log.checkOut ? parseTimeToMs(log.checkOut) : 0;
                  
                  let elapsedMins = 0;
                  if (checkInMins && checkOutMins) {
                    elapsedMins = Math.max(0, Math.floor((checkOutMins - checkInMins) / 60000));
                  } else if (checkInMins && log.date === todayStr) {
                    // Running elapsed
                    elapsedMins = Math.max(0, Math.floor((Date.now() - checkInMins) / 60000));
                  }
                  
                  const elapsedStr = elapsedMins > 0 ? `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m` : '--';
                  
                  const prodH = Math.floor(log.workingHours || 0);
                  const prodM = Math.round(((log.workingHours || 0) % 1) * 60);

                  const overH = Math.floor(log.overtimeHours || 0);
                  const overM = Math.round(((log.overtimeHours || 0) % 1) * 60);

                  return (
                    <tr key={log.id || log.attendance_id || idx} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${log.active ? 'bg-indigo-50/5' : ''}`}>
                      <td className="px-5 py-3.5 text-slate-450">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{log.date}</td>
                      <td className="px-5 py-3.5 text-slate-450">{getDayName(log.date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold ${
                          log.currentStatus === 'punch-in' || log.currentStatus === 'break-out' ? 'text-indigo-600 dark:text-indigo-400' :
                          log.currentStatus === 'break-in' ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {log.currentStatus || 'punch-out'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                          log.status === 'On Time' || log.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/40 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                          log.status === 'Absent' ? 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450' :
                          'bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                          {log.status || 'Present'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-indigo-600 dark:text-indigo-400">{log.checkIn || '--:--'}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-450">{log.checkOut || '--:--'}</td>
                      <td className="px-5 py-3.5 text-slate-450 font-mono">{log.breakDuration || '0h 0m'}</td>
                      <td className="px-5 py-3.5 text-slate-450">-</td>
                      <td className="px-5 py-3.5 text-slate-450 font-mono">
                        {log.overtimeHours > 0 ? `${overH}h ${overM}m` : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          log.workingHours >= 8 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                        }`}>
                          {log.workingHours > 0 ? `${prodH}h ${prodM}m` : '--'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {log.date === todayStr && log.active ? liveWorkedTime : elapsedStr}
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="12" className="text-center py-10 text-slate-400 font-medium">
                      No attendance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recover Time Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Log Manual Punch</h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleManualCorrection} className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Employee</label>
                <select
                  value={correctionFields.employeeId}
                  onChange={e => setCorrectionFields(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full p-2 rounded-xl focus:outline-none"
                  required
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punch Type</label>
                  <select
                    value={correctionFields.type}
                    onChange={e => setCorrectionFields(prev => ({ ...prev, type: e.target.value }))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full p-2 rounded-xl focus:outline-none"
                  >
                    <option value="in">Clock In</option>
                    <option value="out">Clock Out</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punch Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:15 AM"
                    value={correctionFields.time}
                    onChange={e => setCorrectionFields(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full p-2 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punctuality Status</label>
                <select
                  value={correctionFields.status}
                  onChange={e => setCorrectionFields(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full p-2 rounded-xl focus:outline-none"
                >
                  <option value="On Time">On Time</option>
                  <option value="Late">Late Mark</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Work From Home">Work From Home</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-150 cursor-pointer">
                Submit Attendance Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
