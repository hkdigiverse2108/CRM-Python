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
    user,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('ess-punch');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(hrmsEmployeeId);

  // Sync selected employee ID to app context
  useEffect(() => {
    setHrmsEmployeeId(selectedEmployeeId);
  }, [selectedEmployeeId, setHrmsEmployeeId]);

  // Sync default employee ID to logged-in user's employee record
  useEffect(() => {
    if (user?.email && employees.length > 0) {
      const loggedInEmp = employees.find(e => e.email === user.email);
      if (loggedInEmp) {
        if (hrmsEmployeeId === 'EMP-001' && loggedInEmp.id !== 'EMP-001') {
          setSelectedEmployeeId(loggedInEmp.id);
        }
      }
    }
  }, [user, employees, hrmsEmployeeId]);

  // Selected employee context for self-service
  const currentEmployee = useMemo(() => {
    const found = employees.find(e => e.id === hrmsEmployeeId || e.employee_id === hrmsEmployeeId) ||
                  employees.find(e => e.email === user?.email);
    if (found) return found;

    if (user) {
      return {
        id: user.id || 'EMP-ADMIN',
        name: user.full_name || 'Admin',
        role: user.role_name || user.role || 'Admin',
        department: 'Management',
        email: user.email,
        phone: user.phone || '-',
        status: 'Active',
        joinDate: '2026-06-01',
        bankDetails: { holderName: user.full_name, bankName: '-', accountNumber: '-', ifscCode: '-' },
        familyDetails: { parentName: '-', parentPhone: '-', relationship: '-' }
      };
    }
    return employees[0];
  }, [employees, hrmsEmployeeId, user]);

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
  const [profileSubTab, setProfileSubTab] = useState('personal');

  // Profile Edit Mode States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '', middleName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Male',
    aadhaarNumber: '', panNumber: '', department: '', role: '', joinDate: '',
    bankName: '', accountNumber: '', ifscCode: '', upiId: '',
    parentName: '', parentPhone: '', relationship: 'Father'
  });

  const handleStartEdit = () => {
    setProfileForm({
      firstName: currentEmployee?.name?.split(' ')?.[0] || '',
      middleName: currentEmployee?.name?.split(' ')?.[1] || '',
      lastName: currentEmployee?.name?.split(' ')?.[2] || '',
      email: currentEmployee?.email || '',
      phone: currentEmployee?.phone || '',
      dob: currentEmployee?.dob || '',
      gender: currentEmployee?.gender || 'Male',
      aadhaarNumber: currentEmployee?.aadhaarNumber || '',
      panNumber: currentEmployee?.panNumber || '',
      department: currentEmployee?.department || '',
      role: currentEmployee?.role || '',
      joinDate: currentEmployee?.joinDate || '',
      bankName: currentEmployee?.bankDetails?.bankName || '',
      accountNumber: currentEmployee?.bankDetails?.accountNumber || '',
      ifscCode: currentEmployee?.bankDetails?.ifscCode || '',
      upiId: currentEmployee?.bankDetails?.upiId || '',
      parentName: currentEmployee?.familyDetails?.parentName || '',
      parentPhone: currentEmployee?.familyDetails?.parentPhone || '',
      relationship: currentEmployee?.familyDetails?.relationship || 'Father',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const fullName = [profileForm.firstName, profileForm.middleName, profileForm.lastName].filter(Boolean).join(' ');
    const updatedData = {
      name: fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      dob: profileForm.dob,
      gender: profileForm.gender,
      aadhaarNumber: profileForm.aadhaarNumber,
      panNumber: profileForm.panNumber,
      department: profileForm.department,
      role: profileForm.role,
      joinDate: profileForm.joinDate,
      bankDetails: {
        holderName: fullName,
        bankName: profileForm.bankName,
        accountNumber: profileForm.accountNumber,
        ifscCode: profileForm.ifscCode,
        upiId: profileForm.upiId
      },
      familyDetails: {
        parentName: profileForm.parentName,
        parentPhone: profileForm.parentPhone,
        relationship: profileForm.relationship
      }
    };

    const empId = currentEmployee.id;
    if (empId === 'EMP-ADMIN') {
      await addEmployee({
        id: 'EMP-001',
        ...updatedData
      });
    } else {
      await editEmployee(empId, updatedData);
    }
    setIsEditingProfile(false);
  };

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

  // Local state for breaks loaded/saved from localStorage
  const [localBreaks, setLocalBreaks] = useState(() => {
    const key = `hrms-breaks-${hrmsEmployeeId}-${todayStr}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const key = `hrms-breaks-${hrmsEmployeeId}-${todayStr}`;
    const saved = localStorage.getItem(key);
    setLocalBreaks(saved ? JSON.parse(saved) : []);
  }, [hrmsEmployeeId, todayStr]);

  useEffect(() => {
    const key = `hrms-breaks-${hrmsEmployeeId}-${todayStr}`;
    localStorage.setItem(key, JSON.stringify(localBreaks));
  }, [localBreaks, hrmsEmployeeId, todayStr]);

  const isOnBreak = useMemo(() => {
    return localBreaks.some(b => b.end === null);
  }, [localBreaks]);

  const formattedBreakTime = useMemo(() => {
    const totalMs = localBreaks.reduce((sum, b) => {
      if (b.start) {
        const startMs = new Date(b.start).getTime();
        const endMs = b.end ? new Date(b.end).getTime() : currentTime.getTime();
        return sum + (endMs - startMs);
      }
      return sum;
    }, 0);
    
    const h = Math.floor(totalMs / (1000 * 60 * 60));
    const m = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((totalMs % (1000 * 60)) / 1000);
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }, [localBreaks, currentTime]);

  const elapsedWorkingTime = useMemo(() => {
    if (!currentEmployeeAttendance || !currentEmployeeAttendance.checkIn || currentEmployeeAttendance.checkIn === '-') {
      return '00:00:00';
    }
    
    const parseTimeStr = (tStr) => {
      const today = new Date();
      const parts = tStr.split(' ');
      const [hp, mp] = parts[0].split(':');
      let h = parseInt(hp, 10);
      let m = parseInt(mp, 10);
      const mod = parts[1];
      if (mod === 'PM' && h < 12) h += 12;
      if (mod === 'AM' && h === 12) h = 0;
      return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0);
    };

    if (currentEmployeeAttendance.checkOut && currentEmployeeAttendance.checkOut !== '-') {
      try {
        const inDate = parseTimeStr(currentEmployeeAttendance.checkIn);
        const outDate = parseTimeStr(currentEmployeeAttendance.checkOut);
        const breakMs = localBreaks.reduce((sum, b) => {
          if (b.start && b.end) {
            return sum + (new Date(b.end).getTime() - new Date(b.start).getTime());
          }
          return sum;
        }, 0);
        
        const totalMs = Math.max(0, outDate.getTime() - inDate.getTime() - breakMs);
        const h = Math.floor(totalMs / (1000 * 60 * 60));
        const m = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((totalMs % (1000 * 60)) / 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      } catch (e) {
        return '00:00:00';
      }
    }
    
    try {
      const inDate = parseTimeStr(currentEmployeeAttendance.checkIn);
      const breakMs = localBreaks.reduce((sum, b) => {
        if (b.start) {
          const startMs = new Date(b.start).getTime();
          const endMs = b.end ? new Date(b.end).getTime() : currentTime.getTime();
          return sum + (endMs - startMs);
        }
        return sum;
      }, 0);
      
      const elapsedMs = Math.max(0, currentTime.getTime() - inDate.getTime() - breakMs);
      const diffHrs = Math.floor(elapsedMs / (1000 * 60 * 60));
      const diffMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      
      return `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
    } catch (err) {
      console.log("Error calculating elapsed time", err);
      return '00:00:00';
    }
  }, [currentEmployeeAttendance, currentTime, localBreaks]);

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
      selfie: simSelfie ? 'Captured_Selfie.jpg' : null,
      action: 'punch-in'
    };
    setLocalBreaks([]); // Reset breaks for new punch in
    clockInOut(hrmsEmployeeId, 'in', details);
  };

  const handlePunchOut = () => {
    // End any active break on punch out
    setLocalBreaks(prev => prev.map(b => b.end === null ? { ...b, end: new Date().toISOString() } : b));
    clockInOut(hrmsEmployeeId, 'out', { action: 'punch-out' });
  };

  const handleBreakIn = () => {
    setLocalBreaks(prev => [...prev, { start: new Date().toISOString(), end: null }]);
    clockInOut(hrmsEmployeeId, 'in', { action: 'break-in' });
  };

  const handleBreakOut = () => {
    setLocalBreaks(prev => prev.map(b => b.end === null ? { ...b, end: new Date().toISOString() } : b));
    clockInOut(hrmsEmployeeId, 'in', { action: 'break-out' });
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
                            {currentEmployee?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'EM'}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full animate-pulse"></span>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                          <span>☀️</span> Good morning, {user?.full_name?.split(' ')?.[0] || 'Employee'}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">{currentEmployee?.name || '-'}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{currentEmployee?.role || '-'}</p>
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
                    {!currentEmployeeAttendance?.checkIn || currentEmployeeAttendance.checkIn === '-' || (currentEmployeeAttendance.checkOut && currentEmployeeAttendance.checkOut !== '-') ? (
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
                          onClick={isOnBreak ? handleBreakOut : handleBreakIn}
                          className={`py-3 px-4 border border-border hover:bg-muted/50 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                            isOnBreak
                              ? 'bg-amber-500 text-white hover:bg-amber-600 border-transparent shadow-xs'
                              : 'text-foreground'
                          }`}
                        >
                          <Coffee size={14} /> 
                          {isOnBreak ? 'Resume Work' : 'Take Break'}
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
                        {formattedBreakTime}
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
              <div className="space-y-6">
                {/* Header Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">My Profile</h2>
                    <p className="text-xs text-muted-foreground">
                      Manage your personal details and bank info. Sensitive administrative, identity, and salary parameters are locked for standard employees.
                    </p>
                  </div>
                  <div>
                    {!isEditingProfile ? (
                      <button 
                        onClick={handleStartEdit} 
                        className="bg-primary text-white font-bold flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl hover:bg-primary/95 transition-all"
                      >
                        <Edit3 size={14} /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleSaveProfile} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 px-4 py-2 text-xs rounded-xl transition-all"
                        >
                          <Check size={14} /> Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditingProfile(false)} 
                          className="bg-muted text-foreground font-bold flex items-center gap-1 px-4 py-2 text-xs rounded-xl border border-border hover:bg-muted/80 transition-all"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Column Sidebar */}
                  <div className="lg:col-span-1 bg-card border border-border p-6 rounded-3xl shadow-xs text-center flex flex-col items-center justify-center space-y-5">
                    <div className="relative">
                      {currentEmployee?.avatar_url ? (
                        <img 
                          src={currentEmployee.avatar_url} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border border-border shadow-xs" 
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-2xl uppercase border border-border">
                          {currentEmployee?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{currentEmployee?.name || 'Parth Ashvinbhai Devani'}</h3>
                      <p className="text-xs font-semibold text-primary mt-1">{currentEmployee?.role || 'Python Developer'}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-3">
                        ACTIVE
                      </span>
                    </div>

                    <div className="w-full pt-4 border-t border-border/50 text-left space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/40 rounded-2xl text-[11px] font-semibold text-muted-foreground">
                        <LogIn size={13} className="text-muted-foreground/75" />
                        <span className="truncate">{currentEmployee?.email || 'devaniparth27@gmail.com'}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/40 rounded-2xl text-[11px] font-semibold text-muted-foreground">
                        <Activity size={13} className="text-muted-foreground/75" />
                        <span>{currentEmployee?.phone || '6355809873'}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/40 rounded-2xl text-[11px] font-semibold text-muted-foreground">
                        <Building2 size={13} className="text-muted-foreground/75" />
                        <span>{currentEmployee?.department || 'Development'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column details tab panel */}
                  <div className="lg:col-span-3 bg-card border border-border rounded-3xl shadow-xs overflow-hidden flex flex-col">
                    <div className="flex border-b border-border/50 px-6 pt-5 gap-6">
                      {[
                        { id: 'personal', label: 'Personal & Identity' },
                        { id: 'professional', label: 'Professional Info' },
                        { id: 'bank', label: 'Bank & Family' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setProfileSubTab(tab.id)}
                          className={`pb-3 text-xs font-bold transition-all relative ${
                            profileSubTab === tab.id
                              ? 'text-primary'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {tab.label}
                          {profileSubTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-6">
                      {profileSubTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                              <User size={10} /> First Name
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.firstName}
                                onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.name?.split(' ')?.[0] || 'Parth'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                              <User size={10} /> Middle Name
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.middleName}
                                onChange={e => setProfileForm({ ...profileForm, middleName: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.name?.split(' ')?.[1] || 'Ashvinbhai'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                              <User size={10} /> Last Name
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.lastName}
                                onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.name?.split(' ')?.[2] || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                              <LogIn size={10} /> Email Address
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="email"
                                value={profileForm.email}
                                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.email || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                              <Activity size={10} /> Phone Number
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.phone}
                                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.phone || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                              <Calendar size={10} /> Date of Birth
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="date"
                                value={profileForm.dob}
                                onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground font-mono">{currentEmployee?.dob || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                              <User size={10} /> Gender
                            </span>
                            {isEditingProfile ? (
                              <select 
                                value={profileForm.gender}
                                onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.gender || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><FileText size={10} /> Aadhaar Card Number</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.aadhaarNumber}
                                onChange={e => setProfileForm({ ...profileForm, aadhaarNumber: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground font-mono">{currentEmployee?.aadhaarNumber || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><FileText size={10} /> PAN Card Number</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.panNumber}
                                onChange={e => setProfileForm({ ...profileForm, panNumber: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground font-mono">{currentEmployee?.panNumber || '-'}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {profileSubTab === 'professional' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><Building2 size={10} /> Department</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.department}
                                onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.department || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><Briefcase size={10} /> Designation</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="text"
                                value={profileForm.role}
                                onChange={e => setProfileForm({ ...profileForm, role: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{currentEmployee?.role || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><Activity size={10} /> Status</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            <p className="text-xs font-bold text-foreground">active</p>
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><Calendar size={10} /> Joining Date</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            {isEditingProfile ? (
                              <input 
                                type="date"
                                value={profileForm.joinDate}
                                onChange={e => setProfileForm({ ...profileForm, joinDate: e.target.value })}
                                className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                              />
                            ) : (
                              <p className="text-xs font-bold text-foreground font-mono">{currentEmployee?.joinDate || '-'}</p>
                            )}
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><CircleDollarSign size={10} /> Salary</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            <p className="text-xs font-bold text-foreground">—</p>
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><Clock size={10} /> Start Time</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            <p className="text-xs font-bold text-foreground font-mono">09:30 AM</p>
                          </div>
                          <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1"><Clock size={10} /> End Time</span>
                              <ShieldAlert size={10} className="text-muted-foreground" />
                            </span>
                            <p className="text-xs font-bold text-foreground font-mono">06:30 AM</p>
                          </div>
                        </div>
                      )}

                      {profileSubTab === 'bank' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
                              <CircleDollarSign size={13} /> Bank Account Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <User size={10} /> Account Holder Name
                                </span>
                                <p className="text-xs font-bold text-foreground">{isEditingProfile ? [profileForm.firstName, profileForm.middleName, profileForm.lastName].filter(Boolean).join(' ') : (currentEmployee?.bankDetails?.holderName || '-')}</p>
                              </div>
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <Building2 size={10} /> Bank Name
                                </span>
                                {isEditingProfile ? (
                                  <input 
                                    type="text"
                                    value={profileForm.bankName}
                                    onChange={e => setProfileForm({ ...profileForm, bankName: e.target.value })}
                                    className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                                  />
                                ) : (
                                  <p className="text-xs font-bold text-foreground">{currentEmployee?.bankDetails?.bankName || '-'}</p>
                                )}
                              </div>
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <FileText size={10} /> Account Number
                                </span>
                                {isEditingProfile ? (
                                  <input 
                                    type="text"
                                    value={profileForm.accountNumber}
                                    onChange={e => setProfileForm({ ...profileForm, accountNumber: e.target.value })}
                                    className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                                  />
                                ) : (
                                  <p className="text-xs font-bold text-foreground font-mono">{currentEmployee?.bankDetails?.accountNumber || '-'}</p>
                                )}
                              </div>
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <FileText size={10} /> IFSC Code
                                </span>
                                {isEditingProfile ? (
                                  <input 
                                    type="text"
                                    value={profileForm.ifscCode}
                                    onChange={e => setProfileForm({ ...profileForm, ifscCode: e.target.value })}
                                    className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                                  />
                                ) : (
                                  <p className="text-xs font-bold text-foreground font-mono">{currentEmployee?.bankDetails?.ifscCode || '-'}</p>
                                )}
                              </div>
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <LogIn size={10} /> UPI ID
                                </span>
                                {isEditingProfile ? (
                                  <input 
                                    type="text"
                                    value={profileForm.upiId}
                                    onChange={e => setProfileForm({ ...profileForm, upiId: e.target.value })}
                                    className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                                  />
                                ) : (
                                  <p className="text-xs font-bold text-foreground">{currentEmployee?.bankDetails?.upiId || '-'}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-border/50">
                            <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
                              <Users size={13} /> Parent Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <User size={10} /> Parent Name
                                </span>
                                {isEditingProfile ? (
                                  <input 
                                    type="text"
                                    value={profileForm.parentName}
                                    onChange={e => setProfileForm({ ...profileForm, parentName: e.target.value })}
                                    className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                                  />
                                ) : (
                                  <p className="text-xs font-bold text-foreground">{currentEmployee?.familyDetails?.parentName || '-'}</p>
                                )}
                              </div>
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <Activity size={10} /> Parent Phone Number
                                </span>
                                {isEditingProfile ? (
                                  <input 
                                    type="text"
                                    value={profileForm.parentPhone}
                                    onChange={e => setProfileForm({ ...profileForm, parentPhone: e.target.value })}
                                    className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                                  />
                                ) : (
                                  <p className="text-xs font-bold text-foreground font-mono">{currentEmployee?.familyDetails?.parentPhone || '-'}</p>
                                )}
                              </div>
                              <div className="bg-muted/10 border border-border/40 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                  <User size={10} /> Relationship
                                </span>
                                {isEditingProfile ? (
                                  <select 
                                    value={profileForm.relationship}
                                    onChange={e => setProfileForm({ ...profileForm, relationship: e.target.value })}
                                    className="w-full bg-card border border-border/85 focus:border-primary/85 focus:ring-1 focus:ring-primary/85 rounded-lg px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none transition-all mt-1"
                                  >
                                    <option value="Father">Father</option>
                                    <option value="Mother">Mother</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Guardian">Guardian</option>
                                    <option value="Other">Other</option>
                                  </select>
                                ) : (
                                  <p className="text-xs font-bold text-foreground">{currentEmployee?.familyDetails?.relationship || '-'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
