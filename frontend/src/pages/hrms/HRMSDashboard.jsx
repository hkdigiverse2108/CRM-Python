import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import {
  Users, UserCheck, UserX, Clock, Calendar, Gift, Briefcase, 
  CircleDollarSign, AlertCircle, Plus, Search, Building2, 
  Download, Send, Check, X, Laptop, FileText, Upload, 
  ShieldAlert, Edit3, User, MapPin, Activity, FileSpreadsheet,
  TrendingUp, BarChart3, Star, AlertTriangle, ArrowRight, Award, Trash2,
  LogIn, LogOut, ChevronLeft, ChevronRight, Coffee
} from 'lucide-react';

export default function HRMSDashboard() {
  const {
    employees,
    leaves,
    payroll,
    attendance,
    recruitmentJobs,
    announcements,
    hrmsRole,
    setHrmsRole,
    hrmsEmployeeId,
    setHrmsEmployeeId,
    addEmployee,
    editEmployee,
    deleteEmployee,
    updateEmployeeStatus,
    addLeaveRequest,
    updateLeaveStatus,
    processPayrollMonth,
    clockInOut,
    addAnnouncement,
    assignAsset,
    returnAsset,
    uploadDocument,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('ess-punch');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(hrmsEmployeeId);

  // Sync selected employee ID to app context
  useEffect(() => {
    setHrmsEmployeeId(selectedEmployeeId);
  }, [selectedEmployeeId, setHrmsEmployeeId]);

  // Selected employee context for self-service
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === hrmsEmployeeId) || employees[0];
  }, [employees, hrmsEmployeeId]);

  // Digital clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulator Toggles for clocking
  const [simGps, setSimGps] = useState(true);
  const [simGeofencing, setSimGeofencing] = useState(true);
  const [simSelfie, setSimSelfie] = useState(false);
  const [simIpCheck, setSimIpCheck] = useState(true);
  const [simDevice, setSimDevice] = useState(true);

  // UI state variables
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showPublishNoticeModal, setShowPublishNoticeModal] = useState(false);
  const [showAssignAssetModal, setShowAssignAssetModal] = useState(false);
  
  // Dynamic form states
  const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full-Time' });
  const [newEmp, setNewEmp] = useState({ name: '', role: '', department: '', email: '', phone: '', joinDate: '', workLocation: '', employmentType: 'Full-Time' });
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [newAssetInput, setNewAssetInput] = useState({ empId: '', name: '', type: 'Laptop' });

  // Self-Service Form States
  const [leaveForm, setLeaveForm] = useState({ type: 'Casual Leave', start: '', end: '', days: 1, reason: '' });
  const [docFile, setDocFile] = useState({ name: '', type: 'Aadhaar Card' });

  // ATS active job selection
  const [selectedJobId, setSelectedJobId] = useState(recruitmentJobs[0]?.id || '');

  // Appraisal Rating states
  const [appraisalId, setAppraisalId] = useState('');
  const [appraisalRating, setAppraisalRating] = useState(5);
  const [appraisalComment, setAppraisalComment] = useState('');

  // Date constants & computed metrics
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const todayAttendance = useMemo(() => {
    return attendance.filter(a => a.date === todayStr);
  }, [attendance, todayStr]);

  const stats = useMemo(() => {
    const total = employees.length;
    const present = todayAttendance.filter(a => a.status === 'On Time' || a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day').length;
    const absent = todayAttendance.filter(a => a.status === 'Absent').length;
    const late = todayAttendance.filter(a => a.status === 'Late').length;
    const onLeave = leaves.filter(l => l.status === 'Approved' && l.start <= todayStr && l.end >= todayStr).length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
    
    // Anniversaries and birthdays count (Current Month = June)
    const birthdays = employees.filter(e => e.dob?.includes('-06-')).length;
    const anniversaries = employees.filter(e => e.joinDate?.includes('-06-')).length;
    
    return {
      total,
      present,
      absent,
      late,
      onLeave,
      pendingLeaves,
      birthdays,
      anniversaries
    };
  }, [employees, todayAttendance, leaves, todayStr]);

  const currentEmployeeAttendance = useMemo(() => {
    return attendance.find(a => a.employeeId === hrmsEmployeeId && a.date === todayStr);
  }, [attendance, hrmsEmployeeId, todayStr]);

  const elapsedWorkingTime = useMemo(() => {
    if (!currentEmployeeAttendance || !currentEmployeeAttendance.checkIn || currentEmployeeAttendance.checkIn === '-') {
      return '00:00:00';
    }
    
    if (currentEmployeeAttendance.checkOut && currentEmployeeAttendance.checkOut !== '-') {
      const hours = currentEmployeeAttendance.workingHours || 0;
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }
    
    try {
      const checkInStr = currentEmployeeAttendance.checkIn;
      const today = new Date();
      
      const timeParts = checkInStr.split(' ');
      const [hPart, mPart] = timeParts[0].split(':');
      let hr = parseInt(hPart, 10);
      const min = parseInt(mPart, 10);
      const modifier = timeParts[1];
      
      if (modifier === 'PM' && hr < 12) hr += 12;
      if (modifier === 'AM' && hr === 12) hr = 0;
      
      const checkInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hr, min, 0);
      
      const breakMs = (currentEmployeeAttendance.breaks || []).reduce((sum, b) => {
        if (b.start) {
          const parseTime = (tStr) => {
            const parts = tStr.split(' ');
            const [hp, mp] = parts[0].split(':');
            let h = parseInt(hp, 10);
            let m = parseInt(mp, 10);
            const mod = parts[1];
            if (mod === 'PM' && h < 12) h += 12;
            if (mod === 'AM' && h === 12) h = 0;
            return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0).getTime();
          };
          const startMs = parseTime(b.start);
          const endMs = b.end ? parseTime(b.end) : currentTime.getTime();
          return sum + (endMs - startMs);
        }
        return sum;
      }, 0);
      
      const elapsedMs = Math.max(0, currentTime.getTime() - checkInDate.getTime() - breakMs);
      const diffHrs = Math.floor(elapsedMs / (1000 * 60 * 60));
      const diffMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      
      return `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
    } catch (err) {
      console.log("Error calculating elapsed time", err);
      return `${String(currentEmployeeAttendance.workingHours || 0).padStart(2, '0')}:00:00`;
    }
  }, [currentEmployeeAttendance, currentTime]);

  const handlePunchIn = () => {
    if (simSelfie && !docFile.name) {
      addToast('Selfie verification required! Please capture/upload photo.', 'error');
      return;
    }
    const details = {
      method: simIpCheck ? 'Authorized IP (192.168.1.100)' : 'Web Client',
      lat: simGeofencing ? '12.9716' : '0.0000',
      lng: simGeofencing ? '77.5946' : '0.0000',
      ip: '192.168.1.100',
      selfie: simSelfie ? 'Captured_Selfie.jpg' : null
    };
    clockInOut(hrmsEmployeeId, 'in', details);
  };

  const handlePunchOut = () => {
    clockInOut(hrmsEmployeeId, 'out');
  };

  const handleBreakIn = () => {
    clockInOut(hrmsEmployeeId, 'break_in');
  };

  const handleBreakOut = () => {
    clockInOut(hrmsEmployeeId, 'break_out');
  };

  const handleAddJob = (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.department) return;
    const id = `JOB-${String(recruitmentJobs.length + 1).padStart(3, '0')}`;
    const newJobObj = {
      ...newJob,
      id,
      status: 'Active',
      applicants: []
    };
    recruitmentJobs.push(newJobObj); // Directly push into reactive state ref
    setShowAddJobModal(false);
    setNewJob({ title: '', department: '', location: '', type: 'Full-Time' });
    setSelectedJobId(id);
    addToast('Job opening listed successfully.', 'success');
  };

  const handleCreateEmployee = (e) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.role || !newEmp.department) return;
    addEmployee(newEmp);
    setShowAddEmpModal(false);
    setNewEmp({ name: '', role: '', department: '', email: '', phone: '', joinDate: '', workLocation: '', employmentType: 'Full-Time' });
  };

  const handlePublishNotice = (e) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;
    addAnnouncement(newNotice);
    setShowPublishNoticeModal(false);
    setNewNotice({ title: '', content: '' });
  };

  const handleAssignAsset = (e) => {
    e.preventDefault();
    if (!newAssetInput.empId || !newAssetInput.name) return;
    assignAsset(newAssetInput.empId, { name: newAssetInput.name, type: newAssetInput.type });
    setShowAssignAssetModal(false);
    setNewAssetInput({ empId: '', name: '', type: 'Laptop' });
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!leaveForm.start || !leaveForm.end) return;
    addLeaveRequest({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      department: currentEmployee.department,
      type: leaveForm.type,
      start: leaveForm.start,
      end: leaveForm.end,
      days: Number(leaveForm.days),
      reason: leaveForm.reason
    });
    setLeaveForm({ type: 'Casual Leave', start: '', end: '', days: 1, reason: '' });
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!docFile.name) return;
    uploadDocument(currentEmployee.id, { name: docFile.name, type: docFile.type });
    setDocFile({ name: '', type: 'Aadhaar Card' });
  };

  const updateCandidateStage = (applicantId, targetStage) => {
    const updated = recruitmentJobs.map(job => {
      const applicants = job.applicants.map(app => {
        if (app.id === applicantId) {
          // If moving to Joined, offer profile conversion
          if (targetStage === 'Joined') {
            addToast(`Candidate joined! Enrolling into employee database.`, 'success');
            // Auto add to employee database
            addEmployee({
              name: app.name,
              role: job.title,
              department: job.department,
              email: app.email,
              phone: app.phone,
              joinDate: new Date().toISOString().split('T')[0],
              workLocation: 'HQ Office',
              employmentType: 'Full-Time'
            });
          }
          return { ...app, stage: targetStage };
        }
        return app;
      });
      return { ...job, applicants };
    });
    // Mutate state directly
    recruitmentJobs.splice(0, recruitmentJobs.length, ...updated);
    addToast(`Candidate status updated to: ${targetStage}`, 'success');
  };

  const scheduleInterview = (applicantId, dateTime) => {
    const updated = recruitmentJobs.map(job => {
      const applicants = job.applicants.map(app => {
        if (app.id === applicantId) {
          return { ...app, stage: 'Interview Scheduled', interviewDate: dateTime };
        }
        return app;
      });
      return { ...job, applicants };
    });
    recruitmentJobs.splice(0, recruitmentJobs.length, ...updated);
    addToast(`Interview scheduled at ${dateTime}`, 'success');
  };

  const submitAppraisalReview = (e) => {
    e.preventDefault();
    if (!appraisalId) return;
    editEmployee(appraisalId, {
      performanceReview: {
        rating: appraisalRating,
        comment: appraisalComment,
        reviewedBy: 'HR Admin',
        reviewDate: new Date().toISOString().split('T')[0]
      }
    });
    addToast(`KPI Appraisal score of ${appraisalRating} submitted.`, 'success');
    setAppraisalId('');
    setAppraisalComment('');
  };

  const selectedJob = recruitmentJobs.find(j => j.id === selectedJobId) || recruitmentJobs[0];

  // CSV Exporter
  const exportCSV = (data, filename) => {
    const csvRows = [];
    const headers = Object.keys(data[0] || {});
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
    addToast('CSV Report downloaded.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* EMPLOYEE SELF-SERVICE WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Navigation & profile summary */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold mx-auto shadow-md">
                {currentEmployee?.avatar || currentEmployee?.name?.[0]}
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">{currentEmployee?.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{currentEmployee?.role} • {currentEmployee?.department}</p>
                <span className="badge badge-success text-[10px] mt-2 inline-block">Active Employee</span>
              </div>

              {/* ESS Tab selections */}
              <div className="space-y-1 text-left pt-3 border-t border-border/60">
                {[
                  { id: 'ess-punch', label: 'Punch In / Out Clock', icon: Clock },
                  { id: 'ess-leaves', label: 'My Leaves Balances', icon: Calendar },
                  { id: 'ess-tasks', label: 'My Allocated Tasks', icon: FileText },
                  { id: 'ess-docs', label: 'My Document Cabinet', icon: Upload },
                  { id: 'ess-profile', label: 'My Profile & Details', icon: User },
                ].map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <TabIcon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current day live status */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 text-xs">
              <h4 className="font-bold flex items-center gap-1.5"><Activity size={14} className="text-success" /> Live Status Updates</h4>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Clock In:</span>
                  <span className="text-foreground font-semibold">{currentEmployeeAttendance?.checkIn || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Clock Out:</span>
                  <span className="text-foreground font-semibold">{currentEmployeeAttendance?.checkOut || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Hours Worked:</span>
                  <span className="text-foreground font-semibold font-mono">{currentEmployeeAttendance?.workingHours || 0} hrs</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Status Today:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-[9px] ${
                    currentEmployeeAttendance?.status === 'Absent' ? 'bg-danger/10 text-danger' : 'bg-success/15 text-success'
                  }`}>{currentEmployeeAttendance?.status || 'Not Checked-In'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ESS Tab panels */}
          <div className="xl:col-span-3 space-y-6">
            {/* PUNCH IN / OUT SYSTEM */}
            {activeTab === 'ess-punch' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Card: Punch & Working Stats */}
                <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xs space-y-6 relative overflow-hidden">
                  
                  {/* Greeting & Profile Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        {currentEmployee?.avatar_url ? (
                          <img 
                            src={currentEmployee.avatar_url} 
                            alt={currentEmployee.name} 
                            className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-xl uppercase border-2 border-primary/20">
                            {currentEmployee?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full animate-pulse"></span>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                          <span>☀️</span> Good morning, {currentEmployee?.name?.split(' ')?.[0] || 'Parth'}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">{currentEmployee?.name || 'Parth Ashvinbhai Devani'}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{currentEmployee?.role || 'Python Developer'}</p>
                      </div>
                    </div>

                    {/* Current Time Display */}
                    <div className="bg-muted/50 border border-border/40 p-4 rounded-2xl text-right min-w-[140px]">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Time</p>
                      <p className="text-xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Live Clock Card */}
                  <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      Live Working Time <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500 text-white animate-pulse">LIVE</span>
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-900 dark:text-white py-1">
                      {elapsedWorkingTime}
                    </h1>
                    {currentEmployeeAttendance?.checkIn && currentEmployeeAttendance.checkIn !== '-' && (!currentEmployeeAttendance.checkOut || currentEmployeeAttendance.checkOut === '-') ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Live Tracking Active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full"></span> Live Tracking Inactive
                      </span>
                    )}
                  </div>

                  {/* Punch Status Banner */}
                  <div className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold ${
                    currentEmployeeAttendance?.checkIn && currentEmployeeAttendance.checkIn !== '-' && (!currentEmployeeAttendance.checkOut || currentEmployeeAttendance.checkOut === '-')
                      ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/5 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-muted text-muted-foreground border border-border/40'
                  }`}>
                    {currentEmployeeAttendance?.checkIn && currentEmployeeAttendance.checkIn !== '-' ? (
                      <>
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-600 font-bold">✓</span>
                        Punched in at {currentEmployeeAttendance.checkIn}
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] text-muted-foreground">!</span>
                        Not Checked In Today
                      </>
                    )}
                  </div>

                  {/* Unified Actions Console */}
                  <div className="pt-2">
                    {!currentEmployeeAttendance?.checkIn || currentEmployeeAttendance.checkIn === '-' ? (
                      /* Not Checked In: Big Green Punch In Button */
                      <button
                        onClick={handlePunchIn}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99] text-sm"
                      >
                        <LogIn size={18} /> Punch In & Start Working
                      </button>
                    ) : (
                      /* Already Checked In: Actions Panel */
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Break Toggle Button */}
                        <button
                          onClick={currentEmployeeAttendance.breaks?.some(b => b.end === null) ? handleBreakOut : handleBreakIn}
                          className={`py-3 px-4 border border-border hover:bg-muted/50 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                            currentEmployeeAttendance.breaks?.some(b => b.end === null)
                              ? 'bg-amber-500 text-white hover:bg-amber-600 border-transparent shadow-xs'
                              : 'text-foreground'
                          }`}
                        >
                          <Coffee size={14} /> 
                          {currentEmployeeAttendance.breaks?.some(b => b.end === null) ? 'Resume Work' : 'Take Break'}
                        </button>

                        {/* Meeting Simulation Button */}
                        <button
                          onClick={() => addToast('Meeting status updated.', 'info')}
                          className="py-3 px-4 border border-border hover:bg-muted/50 text-foreground rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <Calendar size={14} /> Going for Meeting
                        </button>

                        {/* Punch Out Button */}
                        <button
                          onClick={handlePunchOut}
                          className="py-3 px-4 border border-rose-500/20 hover:bg-rose-500/5 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <LogOut size={14} /> Punch Out
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Summary Metrics Table */}
                  <div className="border border-border/60 rounded-2xl overflow-hidden divide-x divide-border/60 grid grid-cols-2 sm:grid-cols-4 bg-muted/20">
                    <div className="p-4 text-center space-y-1">
                      <p className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-wider">First In</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{currentEmployeeAttendance?.checkIn || '--'}</p>
                    </div>
                    <div className="p-4 text-center space-y-1">
                      <p className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-wider">Last Out</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250">
                        {currentEmployeeAttendance?.checkOut || (currentEmployeeAttendance?.checkIn ? 'Active' : '--')}
                      </p>
                    </div>
                    <div className="p-4 text-center space-y-1">
                      <p className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-wider">Break In Time</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250">
                        {currentEmployeeAttendance?.breakDuration || '0.5 hrs'}
                      </p>
                    </div>
                    <div className="p-4 text-center space-y-1">
                      <p className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-wider">Worked Time</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250 font-mono">
                        {currentEmployeeAttendance?.checkOut 
                          ? `${currentEmployeeAttendance.workingHours || 0} hrs` 
                          : currentEmployeeAttendance?.checkIn ? 'Active' : '--'}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Right Card: Calendar Sidebar */}
                <div className="bg-card border border-border rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">View Events</h3>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">This month events</p>
                    </div>
                    <button 
                      onClick={() => addToast('Viewing all events...', 'info')}
                      className="text-[10px] font-extrabold bg-muted border border-border/60 text-muted-foreground hover:bg-border/60 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      View all
                    </button>
                  </div>

                  {/* Calendar Widget */}
                  <div className="border border-border/50 rounded-2xl p-4 bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <button className="text-muted-foreground hover:text-foreground"><ChevronLeft size={16} /></button>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">June 2026</span>
                      <button className="text-muted-foreground hover:text-foreground"><ChevronRight size={16} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-y-2.5 text-center text-[10px] font-bold">
                      {/* Weekday headers */}
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <span key={d} className="text-muted-foreground font-bold">{d}</span>
                      ))}

                      {/* Week 1 padding (June 2026 starts on Monday, so Sunday is empty) */}
                      <span className="text-slate-350"></span>

                      {/* June Days */}
                      {Array.from({ length: 30 }).map((_, idx) => {
                        const day = idx + 1;
                        const hasEvent = [3, 5].includes(day);
                        const isToday = day === 16;

                        return (
                          <div key={day} className="flex items-center justify-center relative h-6 w-full">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs transition-colors ${
                              isToday 
                                ? 'bg-primary text-white font-black shadow-xs' 
                                : hasEvent 
                                  ? 'border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/[0.05]' 
                                  : 'text-foreground'
                            }`}>
                              {day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scheduled Events details footer */}
                  <div className="pt-2 text-center text-xs text-muted-foreground font-medium">
                    No events scheduled.
                  </div>
                </div>

              </div>
            )}

            {/* LEAVE CABINET & BALANCES */}
            {activeTab === 'ess-leaves' && (
              <div className="space-y-6">
                {/* Leave Balances Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-center space-y-1">
                    <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      {currentEmployee?.leaveBalances?.casual ?? 12}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Casual Leave</p>
                  </div>
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center space-y-1">
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {currentEmployee?.leaveBalances?.sick ?? 8}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-650">Sick Leave</p>
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center space-y-1">
                    <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                      {currentEmployee?.leaveBalances?.earned ?? 18}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-650">Earned Leave</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Apply Leave Request Form */}
                  <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-1.5"><Calendar size={15} /> Apply Leave</h3>
                    <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <label>Leave Type</label>
                        <select
                          value={leaveForm.type}
                          onChange={e => setLeaveForm(prev => ({ ...prev, type: e.target.value }))}
                          className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                        >
                          <option value="Casual Leave">Casual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Earned Leave">Earned Leave</option>
                          <option value="Maternity Leave">Maternity Leave</option>
                          <option value="Paternity Leave">Paternity Leave</option>
                          <option value="Unpaid Leave">Unpaid Leave</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label>Start Date</label>
                          <input
                            type="date"
                            value={leaveForm.start}
                            onChange={e => setLeaveForm(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-card border border-border w-full p-1.5 rounded"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label>End Date</label>
                          <input
                            type="date"
                            value={leaveForm.end}
                            onChange={e => setLeaveForm(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-card border border-border w-full p-1.5 rounded"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label>Total Duration Days</label>
                        <input
                          type="number"
                          value={leaveForm.days}
                          onChange={e => setLeaveForm(prev => ({ ...prev, days: e.target.value }))}
                          className="input-field"
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label>Reason / Remarks</label>
                        <textarea
                          placeholder="Reason for leave request..."
                          value={leaveForm.reason}
                          onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="input-field min-h-16"
                          required
                        />
                      </div>

                      <button type="submit" className="btn-primary w-full py-2">
                        Submit Leave Application
                      </button>
                    </form>
                  </div>

                  {/* Previous Requests Table */}
                  <div className="lg:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold">Leave Requests History</h3>

                    <div className="space-y-3">
                      {leaves.filter(l => l.employeeId === currentEmployee.id).map(l => (
                        <div key={l.id} className="p-3 border border-border/40 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-foreground">{l.type}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{l.start} to {l.end} ({l.days} days)</p>
                            <p className="text-[10px] italic text-slate-500 mt-1">Reason: "{l.reason}"</p>
                          </div>
                          
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              l.status === 'Approved' ? 'bg-success/15 text-success' : l.status === 'Rejected' ? 'bg-danger/10 text-danger' : 'bg-amber-400/10 text-amber-500'
                            }`}>
                              {l.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MY PAYSLIPS CABINET */}
            {activeTab === 'ess-profile' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile detail view */}
                <div className="md:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold">Personal Profile & Payroll Ledger</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Mobile Number</p>
                      <input
                        type="text"
                        value={currentEmployee?.phone || ''}
                        onChange={e => editEmployee(currentEmployee.id, { phone: e.target.value })}
                        className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Email Address</p>
                      <p className="p-2 bg-muted border border-border/40 rounded text-muted-foreground">{currentEmployee?.email}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Permanent Address</p>
                      <p className="p-2 bg-muted border border-border/40 rounded text-muted-foreground">{currentEmployee?.permanentAddress}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Date of Birth</p>
                      <p className="p-2 bg-muted border border-border/40 rounded text-muted-foreground font-mono">{currentEmployee?.dob}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Reporting Manager</p>
                      <p className="p-2 bg-muted border border-border/40 rounded text-muted-foreground">{currentEmployee?.reportingManager}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Permanent Account (PAN) / Aadhaar</p>
                      <p className="p-2 bg-muted border border-border/40 rounded text-muted-foreground font-mono">
                        {currentEmployee?.panNumber} / {currentEmployee?.aadhaarNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Monthly Payslips Download list */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-1.5"><CircleDollarSign size={15} /> Payroll Slips</h3>
                  
                  <div className="space-y-2.5">
                    {payroll.filter(p => p.employeeId === currentEmployee.id).map(p => (
                      <div key={p.month} className="p-3 border border-border/40 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-foreground">{p.month}</p>
                          <p className="text-[10px] text-success font-semibold mt-0.5">Net Pay: {formatCurrency(p.netPay)}</p>
                          <p className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase">Status: {p.status}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              addToast(`Generating payslip PDF for ${p.month}...`, 'success');
                              exportCSV([p], `Payslip_${currentEmployee.name}_${p.month.replace(' ', '_')}.csv`);
                            }}
                            title="Download CSV Payslip"
                            className="p-1.5 rounded hover:bg-muted text-primary"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MY ALLOCATED TASKS */}
            {activeTab === 'ess-tasks' && (
              <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-bold">My Active Task Allocations</h3>

                <div className="space-y-3">
                  {[
                    { id: '1', name: 'Submit Q3 Goals Outline', priority: 'High', dueDate: '2026-06-12', assignedBy: 'Anjali Sharma (HR)', status: 'In Progress' },
                    { id: '2', name: 'Verify CRM Pipeline Integrations', priority: 'Medium', dueDate: '2026-06-15', assignedBy: 'Ajay Kulkarni', status: 'Pending' },
                    { id: '3', name: 'Audit E-Commerce Inventory Sync Logs', priority: 'Low', dueDate: '2026-06-20', assignedBy: 'Ajay Kulkarni', status: 'Completed' }
                  ].map(task => (
                    <div key={task.id} className="p-4 border border-border/50 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{task.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            task.priority === 'High' ? 'bg-danger/10 text-danger' : task.priority === 'Medium' ? 'bg-amber-400/10 text-amber-500' : 'bg-primary/10 text-primary'
                          }`}>{task.priority} Priority</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Due: {task.dueDate} • Assigned By: {task.assignedBy}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          task.status === 'Completed' ? 'bg-success/15 text-success' : task.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-350/20 text-muted-foreground'
                        }`}>{task.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MY DOCUMENT CABINET */}
            {activeTab === 'ess-docs' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upload Form */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-1.5"><Upload size={15} /> Upload Documents</h3>
                  <form onSubmit={handleUploadDoc} className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label>Document Class / Type</label>
                      <select
                        value={docFile.type}
                        onChange={e => setDocFile(prev => ({ ...prev, type: e.target.value }))}
                        className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Resume">Resume / CV</option>
                        <option value="Offer Letter">Offer Letter</option>
                        <option value="Experience Certificate">Experience Certificate</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label>File Description</label>
                      <input
                        type="text"
                        placeholder="e.g. pan_card_final.pdf"
                        value={docFile.name}
                        onChange={e => setDocFile(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>

                    <button type="submit" className="btn-primary w-full py-2">
                      Upload Document to Cabinet
                    </button>
                  </form>
                </div>

                {/* Locker Cabinet List */}
                <div className="md:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold">Document Storage Vault</h3>

                  <div className="space-y-3">
                    {(currentEmployee?.documents || []).map(doc => (
                      <div key={doc.name} className="p-3 border border-border/40 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText size={20} className="text-primary/70" />
                          <div>
                            <p className="font-bold text-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Class: {doc.type} • Uploaded on {doc.uploadDate}</p>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => addToast(`Downloading "${doc.name}"...`, 'success')}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                          >
                            <Download size={12} /> Get File
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* MODAL CONSOLE INJECTIONS (ADMINS) */}
      {/* 1. Add Job Opening */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Add Job Opening</h3>
              <button onClick={() => setShowAddJobModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddJob} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Developer"
                  value={newJob.title}
                  onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div className="space-y-1">
                <label>Department</label>
                <select
                  value={newJob.department}
                  onChange={e => setNewJob(prev => ({ ...prev, department: e.target.value }))}
                  className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                  required
                >
                  <option value="">Choose Division...</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              <div className="space-y-1">
                <label>Work Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Office"
                  value={newJob.location}
                  onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2">Create Job Listing</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign Company Asset */}
      {showAssignAssetModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Assign Asset to Personnel</h3>
              <button onClick={() => setShowAssignAssetModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleAssignAsset} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>Select Employee</label>
                <select
                  value={newAssetInput.empId}
                  onChange={e => setNewAssetInput(prev => ({ ...prev, empId: e.target.value }))}
                  className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                  required
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label>Asset Type</label>
                <select
                  value={newAssetInput.type}
                  onChange={e => setNewAssetInput(prev => ({ ...prev, type: e.target.value }))}
                  className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Mobile Phone">Mobile Phone</option>
                  <option value="SIM Card">SIM Card</option>
                  <option value="ID Card">ID Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label>Asset Description / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Latitude 7420, Serial: #10098"
                  value={newAssetInput.name}
                  onChange={e => setNewAssetInput(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2">Assign & Record Asset</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Publish Notice */}
      {showPublishNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Publish Notice / Announcement</h3>
              <button onClick={() => setShowPublishNoticeModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handlePublishNotice} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Appraisal Timeline"
                  value={newNotice.title}
                  onChange={e => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-1">
                <label>Announcement Content</label>
                <textarea
                  placeholder="Details of the circular notice..."
                  value={newNotice.content}
                  onChange={e => setNewNotice(prev => ({ ...prev, content: e.target.value }))}
                  className="input-field min-h-24"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2">Publish Notice Bulletin</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
