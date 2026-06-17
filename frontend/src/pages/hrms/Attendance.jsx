import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Clock, CheckCircle, AlertCircle, Calendar, Coffee, Briefcase, Search, Plus, X, Watch, User, RefreshCw, Activity
} from 'lucide-react';

export default function Attendance() {
  const { 
    attendance = [], 
    employees = [], 
    clockInOut,
    user,
    hrmsEmployeeId,
    hrmsRole,
    addToast,
    workspaceSettings
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [liveWorkedTime, setLiveWorkedTime] = useState('0h 0m');
  const [liveBreakTime, setLiveBreakTime] = useState('0h 0m');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Digital clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manual correction form fields
  const [correctionFields, setCorrectionFields] = useState({
    employeeId: '',
    type: 'in',
    time: '',
    status: 'On Time',
    method: 'Manual Entry'
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Find corresponding employee record - ALWAYS prioritize logged-in user's email
  const currentEmployee = useMemo(() => {
    // First: match by logged-in user's email (most reliable)
    const byEmail = employees.find(emp => emp.email === user?.email);
    if (byEmail) return byEmail;
    // Fallback: match by hrmsEmployeeId (for simulator/admin switching)
    const byId = employees.find(emp => emp.employee_id === hrmsEmployeeId || emp.id === hrmsEmployeeId);
    if (byId) return byId;
    return employees[0] || null;
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

  // Helper: parse string time (e.g. "08:44 AM" or "12:55") into milliseconds from today start
  const parseTimeToMs = (timeStr) => {
    if (!timeStr) return 0;
    try {
      const cleaned = timeStr.trim().toUpperCase();
      const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/);
      if (!match) return 0;
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const modifier = match[3] || '';
      
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

    const updateTimer = () => {
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
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

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

  // Filter and search logs based on role
  const filteredLogs = useMemo(() => {
    const logs = hrmsRole === 'Admin' ? attendance : myAttendance;
    return logs.filter(a => {
      const matchesSearch = searchQuery === '' || 
                            a.date.includes(searchQuery) ||
                            (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (a.currentStatus || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [attendance, myAttendance, searchQuery, hrmsRole]);

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

  const getLateDuration = (log) => {
    if (log.status !== 'Late') return '-';
    if (!log.checkIn) return '-';
    
    const shiftStart = workspaceSettings?.shift_start || '09:00';
    try {
      const parseMins = (ts) => {
        const str = ts.trim().toUpperCase();
        if (str.includes('AM') || str.includes('PM')) {
          const parts = str.split(' ');
          const [h, m] = parts[0].split(':').map(Number);
          let hours = h;
          if (parts[1] === 'PM' && h < 12) hours += 12;
          if (parts[1] === 'AM' && h === 12) hours = 0;
          return hours * 60 + m;
        } else {
          const [h, m] = str.split(':').map(Number);
          return h * 60 + m;
        }
      };
      
      const checkInMins = parseMins(log.checkIn);
      const shiftStartMins = parseMins(shiftStart);
      
      if (checkInMins > shiftStartMins) {
        const diff = checkInMins - shiftStartMins;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h ${m}m` : `${m} mins`;
      }
    } catch (e) {
      console.error(e);
    }
    return 'Yes';
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
                {todayLog ? (
                  <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    todayLog.status === 'Late' 
                      ? 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30' 
                      : 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30'
                  }`}>
                    <CheckCircle size={10} /> {todayLog.status || 'Present'} today
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full text-slate-500 bg-slate-50 border border-slate-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-800">
                    <AlertCircle size={10} /> Not checked in today
                  </span>
                )}
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

          {/* Beautiful Glassmorphic Digital Clock & Live Timeline Widget */}
          <div className="my-6 p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-900/30 shadow-lg shadow-indigo-950/25 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Clock Widget Column */}
            <div className="md:col-span-4 flex flex-col justify-center text-center md:text-left">
              <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Tracking Clock
              </span>
              <span className="text-3xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 mt-1 drop-shadow-[0_2px_8px_rgba(99,102,241,0.25)]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1.5">
                <Calendar size={11} className="text-indigo-400" />
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            {/* Timeline Column */}
            <div className="md:col-span-8 flex flex-col justify-center space-y-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest">Shift Timeline & Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Activity size={10} className="animate-pulse" /> Active Session
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock size={11} className="text-indigo-400" /> 
                  Shift: <strong className="text-white">{workspaceSettings?.shift_start || '09:00 AM'} - {workspaceSettings?.shift_end || '06:30 PM'}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Coffee size={11} className="text-amber-400" /> 
                  Break Window: <strong className="text-white">{workspaceSettings?.break_start || '02:05 PM'} - {workspaceSettings?.break_end || '02:10 PM'}</strong>
                </span>
              </div>

              {/* Enhanced timeline graphic */}
              <div className="space-y-1">
                <div className="relative h-2.5 bg-white/5 dark:bg-black/20 rounded-full border border-white/10 overflow-hidden">
                  {/* Standard Shift background fill */}
                  <div className="absolute left-[10%] right-[15%] bg-indigo-500/20 h-full rounded-full"></div>
                  {/* Break Zone fill */}
                  <div className="absolute left-[58%] w-[8%] bg-amber-500/40 h-full border-x border-amber-500/30"></div>
                  {/* Current Progress Indicator */}
                  <div 
                    className="absolute bg-gradient-to-r from-indigo-500 to-indigo-300 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-1000"
                    style={{
                      width: (() => {
                        const shiftStartMs = parseTimeToMs(workspaceSettings?.shift_start || '09:00 AM');
                        const shiftEndMs = parseTimeToMs(workspaceSettings?.shift_end || '06:30 PM');
                        if (!shiftStartMs || !shiftEndMs) return '0%';
                        const totalShift = shiftEndMs - shiftStartMs;
                        const elapsed = currentTime.getTime() - shiftStartMs;
                        return `${Math.min(100, Math.max(0, Math.round((elapsed / totalShift) * 100)))}%`;
                      })()
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Start</span>
                  <span className="text-amber-400">Lunch Break</span>
                  <span>End</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons & Details */}
          <div className="mt-5 space-y-4">
            {todayLog && todayLog.currentStatus !== 'punch-out' ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                  {todayBreaks.length > 0 ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mr-1">Today's Breaks:</span>
                      {todayBreaks.map((b, idx) => (
                        <span key={idx} className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-800 text-slate-500 flex items-center gap-1">
                          <Coffee size={9} className="text-amber-500" /> {b.start} - {b.end || 'Active'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">No breaks taken today.</span>
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
                  {hrmsRole === 'Admin' && <th className="px-5 py-3.5">EMPLOYEE</th>}
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
                      {hrmsRole === 'Admin' && (
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{log.name || 'Staff'}</td>
                      )}
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
                      <td className="px-5 py-3.5 text-amber-600 dark:text-amber-400 font-mono">{getLateDuration(log)}</td>
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
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full p-2 rounded-xl focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  required
                  disabled={hrmsRole !== 'Admin'}
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
