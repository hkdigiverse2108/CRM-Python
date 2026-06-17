import PageHeader from '@/components/ui/PageHeader';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import { 
  Check, X, Calendar, Plus, Filter, Search, UserCheck, AlertCircle, 
  Upload, Sparkles, RefreshCw, Eye, Download, Info, Clock
} from 'lucide-react';

export default function Leaves() {
  const { 
    leaves, 
    updateLeaveStatus, 
    addLeaveRequest, 
    employees, 
    addToast,
    user,
    token,
    tenantId
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [search, setSearch] = useState('');
  
  const [activeSubTab, setActiveSubTab] = useState('history'); // 'history' | 'upcoming'
  const [showApplyModal, setShowApplyModal] = useState(false);

  // New leave request form state
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    type: 'Monthly Leave',
    start: '',
    end: '',
    dayType: 'Full Day',
    days: 1,
    reason: '',
    proofOfLeave: ''
  });

  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const currentEmp = useMemo(() => {
    return employees.find(e => e.email === user?.email);
  }, [employees, user]);

  const isUserAdmin = useMemo(() => {
    return user?.role === 'super_admin' || 
           user?.role_name === 'Organization Admin' || 
           user?.role_name === 'Super Admin' ||
           user?.role_name === 'Admin';
  }, [user]);

  const isHR = useMemo(() => {
    return currentEmp?.department?.toUpperCase() === 'HR' || 
           currentEmp?.role?.toUpperCase() === 'HR' || 
           currentEmp?.role?.toUpperCase().includes('HR') ||
           user?.role_name?.toUpperCase().includes('HR');
  }, [currentEmp, user]);

  // Leaves visible to the current logged-in user
  const myLeaves = useMemo(() => {
    return leaves.filter(l => {
      const emp = employees.find(e => e.id === l.employeeId);
      
      // Admins and HR see all leaves in the workspace
      if (!isUserAdmin && !isHR) {
        const isOwnLeave = l.employeeId === currentEmp?.id;
        const isDirectReport = emp && (
          emp.reportingManager === currentEmp?.id ||
          emp.reportingManager === currentEmp?.name ||
          emp.reportingManager === user?.full_name
        );
        if (!isOwnLeave && !isDirectReport) {
          return false;
        }
      }
      return true;
    });
  }, [leaves, employees, currentEmp, isUserAdmin, isHR, user]);

  // Calculate statistics & balances based on myLeaves
  const stats = useMemo(() => {
    const total = myLeaves.length;
    const pending = myLeaves.filter(l => l.status === 'Pending').length;
    const approved = myLeaves.filter(l => l.status === 'Approved').length;
    const rejected = myLeaves.filter(l => l.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [myLeaves]);

  // Leaves owned by the current employee specifically
  const ownLeaves = useMemo(() => {
    return leaves.filter(l => l.employeeId === currentEmp?.id);
  }, [leaves, currentEmp]);

  // Calculate Dynamic Balance Cards metrics (for the current employee)
  const balances = useMemo(() => {
    const juneLeaves = ownLeaves.filter(l => {
      if (l.status !== 'Approved') return false;
      const start = l.startDate || l.start || '';
      return start.includes('-06-'); // June
    });

    const getDaysForType = (type) => {
      return juneLeaves
        .filter(l => (l.type || '').toLowerCase() === type.toLowerCase())
        .reduce((sum, l) => sum + Number(l.days || 1), 0);
    };

    const getPendingDaysForType = (type) => {
      return ownLeaves
        .filter(l => l.status === 'Pending' && (l.type || '').toLowerCase() === type.toLowerCase())
        .reduce((sum, l) => sum + Number(l.days || 1), 0);
    };

    const monthlyApproved = getDaysForType('Monthly Leave');
    const monthlyPending = getPendingDaysForType('Monthly Leave');
    
    // Monthly Leave has 1 Free day allowance. Over that is Unpaid.
    const freeAllowanceRemaining = Math.max(0, 1 - monthlyApproved);
    const monthlyUnpaid = Math.max(0, monthlyApproved - 1);

    return {
      monthly: {
        taken: monthlyApproved,
        pending: monthlyPending,
        freeAllowance: freeAllowanceRemaining,
        unpaid: monthlyUnpaid
      },
      sick: {
        taken: getDaysForType('Sick Leave'),
        pending: getPendingDaysForType('Sick Leave'),
        overall: getDaysForType('Sick Leave')
      },
      casual: {
        taken: getDaysForType('Casual Leave'),
        pending: getPendingDaysForType('Casual Leave'),
        overall: getDaysForType('Casual Leave')
      },
      unpaid: {
        taken: getDaysForType('Unpaid Leave'),
        pending: getPendingDaysForType('Unpaid Leave'),
        overall: getDaysForType('Unpaid Leave')
      },
      other: {
        taken: getDaysForType('Other Leave'),
        pending: getPendingDaysForType('Other Leave'),
        overall: getDaysForType('Other Leave')
      }
    };
  }, [myLeaves]);

  // Filter requests
  const filteredLeaves = useMemo(() => {
    return myLeaves.filter(l => {
      // 1. Name/Department Search
      const name = l.employeeName || l.employee || '';
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                            (l.department || '').toLowerCase().includes(search.toLowerCase()) ||
                            (l.reason || '').toLowerCase().includes(search.toLowerCase());

      // 2. Status Filter
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;

      // 3. Leave Type Filter
      const matchesType = typeFilter === 'All' || l.type === typeFilter;

      // 4. Date Range Filters
      let matchesDate = true;
      const startVal = l.startDate || l.start;
      const endVal = l.endDate || l.end;
      
      if (startDateFilter && startVal < startDateFilter) {
        matchesDate = false;
      }
      if (endDateFilter && endVal > endDateFilter) {
        matchesDate = false;
      }

      // 5. Sub Tab filter (Upcoming Time Off vs History)
      if (activeSubTab === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        if (startVal <= today) {
          return false;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [myLeaves, search, statusFilter, typeFilter, startDateFilter, endDateFilter, activeSubTab]);

  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!newLeave.start || !newLeave.end) return;

    // Resolve employee
    let emp = currentEmp;
    if (isUserAdmin && newLeave.employeeId) {
      emp = employees.find(e => e.id === newLeave.employeeId) || currentEmp;
    }

    if (!emp) {
      addToast('No active employee profile associated.', 'error');
      return;
    }

    // Calculate days duration
    const sDate = new Date(newLeave.start);
    const eDate = new Date(newLeave.end);
    let diffDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
    if (newLeave.dayType === 'Half Day') {
      diffDays = 0.5;
    }

    addLeaveRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      type: newLeave.type,
      start: newLeave.start,
      end: newLeave.end,
      days: diffDays,
      reason: newLeave.reason,
      dayType: newLeave.dayType,
      proofOfLeave: newLeave.proofOfLeave
    });

    setShowApplyModal(false);
    setSimulatedFileName('');
    setNewLeave({
      employeeId: '',
      type: 'Monthly Leave',
      start: '',
      end: '',
      dayType: 'Full Day',
      days: 1,
      reason: '',
      proofOfLeave: ''
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check: max 200MB
    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addToast('File size exceeds the maximum limit of 200MB.', 'error');
      return;
    }

    setIsUploading(true);
    setSimulatedFileName(file.name);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch(`${API_BASE}/leaves/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || 'rapidmodel_corp',
        },
        body: formData,
      });

      if (!resp.ok) {
        throw new Error('Upload failed');
      }

      const data = await resp.json();
      if (data.success && data.data?.url) {
        setNewLeave(prev => ({ ...prev, proofOfLeave: data.data.url }));
        addToast(`File ${file.name} uploaded successfully!`, 'success');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error uploading file.', 'error');
      setSimulatedFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Leave
          </h1>
          <p className="text-xs text-muted-foreground">View your leave balances, history, and upcoming time off.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="bg-card hover:bg-muted/80 text-foreground border border-border px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
            <Calendar size={13} /> View Calendar
          </button>
          <button 
            onClick={() => {
              setNewLeave(prev => ({ ...prev, employeeId: currentEmp?.id || '' }));
              setShowApplyModal(true);
            }} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} /> Request Leave
          </button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Monthly Leave */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Monthly Leave</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Sparkles size={13} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{balances.monthly.taken}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Days Taken (June)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50 text-[10px] font-bold">
              <div className="space-y-0.5 text-left">
                <span className="text-muted-foreground block uppercase text-[8px]">Pending</span>
                <span className="text-foreground">{balances.monthly.pending} Days</span>
              </div>
              <div className="space-y-0.5 text-center">
                <span className="text-muted-foreground block uppercase text-[8px]">Free Allowance</span>
                <span className="text-emerald-500">{balances.monthly.freeAllowance} Free Day</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-muted-foreground block uppercase text-[8px]">Unpaid (Jun)</span>
                <span className="text-amber-500">{balances.monthly.unpaid} Day(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sick Leave */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Sick Leave</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <AlertCircle size={13} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{balances.sick.taken}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Days Taken (June)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-[10px] font-bold">
              <div className="space-y-0.5 text-left">
                <span className="text-muted-foreground block uppercase text-[8px]">Pending</span>
                <span className="text-foreground">{balances.sick.pending} Days</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-muted-foreground block uppercase text-[8px]">Overall</span>
                <span className="text-amber-500">{balances.sick.overall} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Casual Leave */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Casual Leave</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Calendar size={13} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{balances.casual.taken}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Days Taken (June)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-[10px] font-bold">
              <div className="space-y-0.5 text-left">
                <span className="text-muted-foreground block uppercase text-[8px]">Pending</span>
                <span className="text-foreground">{balances.casual.pending} Days</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-muted-foreground block uppercase text-[8px]">Overall</span>
                <span className="text-indigo-500">{balances.casual.overall} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unpaid Leave */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Unpaid Leave</span>
            <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500">
              <Clock size={13} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{balances.unpaid.taken}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Days Taken (June)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-[10px] font-bold">
              <div className="space-y-0.5 text-left">
                <span className="text-muted-foreground block uppercase text-[8px]">Pending</span>
                <span className="text-foreground">{balances.unpaid.pending} Days</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-muted-foreground block uppercase text-[8px]">Overall</span>
                <span className="text-slate-500">{balances.unpaid.overall} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Other Leave */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Other Leave</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Plus size={13} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{balances.other.taken}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Days Taken (June)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-[10px] font-bold">
              <div className="space-y-0.5 text-left">
                <span className="text-muted-foreground block uppercase text-[8px]">Pending</span>
                <span className="text-foreground">{balances.other.pending} Days</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-muted-foreground block uppercase text-[8px]">Overall</span>
                <span className="text-orange-500">{balances.other.overall} Days</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold">
          
          {/* Leave Type Select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Leave Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none"
            >
              <option value="All">All Leave Types</option>
              <option value="Monthly Leave">Monthly Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Other Leave">Other Leave</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Date Range input */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDateFilter}
                onChange={e => setStartDateFilter(e.target.value)}
                className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none"
              />
              <span className="text-muted-foreground">→</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={e => setEndDateFilter(e.target.value)}
                className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none"
              />
            </div>
          </div>

        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee, department or reason..."
              className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleResetFilters}
              className="bg-muted hover:bg-border/60 text-foreground font-extrabold px-5 py-2 rounded-xl text-xs transition-all flex items-center gap-1 border border-border"
            >
              <RefreshCw size={13} /> Reset
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-6 py-2 rounded-xl text-xs transition-all flex items-center gap-1 shadow-sm">
              <Search size={13} /> Search
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switch & Table Block */}
      <div className="space-y-4">
        
        {/* Sub Tabs */}
        <div className="flex border-b border-border/50 gap-6">
          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 text-xs font-black transition-all relative uppercase tracking-wider ${
              activeSubTab === 'history'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Leave History
          </button>
          <button
            onClick={() => setActiveSubTab('upcoming')}
            className={`pb-3 text-xs font-black transition-all relative uppercase tracking-wider ${
              activeSubTab === 'upcoming'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upcoming Time Off
          </button>
        </div>

        {/* Leave Requests Table Container */}
        <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Leave Requests</h3>
            <span className="text-xs font-bold text-muted-foreground">{filteredLeaves.length} records found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted text-muted-foreground font-black border-b border-border/80 uppercase tracking-wider text-[9px]">
                  <th className="px-6 py-3.5 text-center">Sr. No.</th>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Day Type</th>
                  <th className="px-6 py-3.5 text-center font-mono">From</th>
                  <th className="px-6 py-3.5 text-center font-mono">To</th>
                  <th className="px-6 py-3.5 text-center">No of Days</th>
                  <th className="px-6 py-3.5">Approved By</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
                {filteredLeaves.map((l, index) => {
                  const name = l.employeeName || l.employee || 'Staff Member';
                  const start = l.startDate || l.start || '-';
                  const end = l.endDate || l.end || '-';
                  
                  const emp = employees.find(e => e.id === l.employeeId);
                  const isOwnLeave = l.employeeId === currentEmp?.id;
                  const isManager = emp && currentEmp && (
                    emp.reportingManager === currentEmp.id || 
                    emp.reportingManager === currentEmp.name || 
                    emp.reportingManager === user?.full_name
                  );
                  const showApproveReject = l.status === 'Pending' && (isUserAdmin || isHR || isManager) && !isOwnLeave;

                  return (
                    <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-muted-foreground whitespace-nowrap">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{name}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">{l.department}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold whitespace-nowrap">{l.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-muted border border-border/50 text-[10px] whitespace-nowrap">
                          {l.dayType || 'Full Day'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-muted-foreground whitespace-nowrap">{formatDate(start)}</td>
                      <td className="px-6 py-4 text-center font-mono text-muted-foreground whitespace-nowrap">{formatDate(end)}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{l.days} days</td>
                      <td className="px-6 py-4 text-muted-foreground font-medium whitespace-nowrap">
                        {l.approvedBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${
                          l.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          l.status === 'Rejected' ? 'bg-danger/10 text-danger border-danger/20' :
                          'bg-amber-400/10 text-amber-500 border-amber-400/20'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2.5">
                          {l.proofOfLeave && (
                            <a 
                              href={
                                l.proofOfLeave.startsWith('/') 
                                  ? `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '')}${l.proofOfLeave}` 
                                  : l.proofOfLeave.startsWith('http') 
                                    ? l.proofOfLeave 
                                    : '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (!l.proofOfLeave.startsWith('/') && !l.proofOfLeave.startsWith('http')) {
                                  e.preventDefault();
                                  addToast(`Opening file: ${l.proofOfLeave}`, 'info');
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/30 transition-all shadow-2xs whitespace-nowrap"
                            >
                              <Eye size={12} /> View Proof
                            </a>
                          )}
                          {showApproveReject && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateLeaveStatus(l.id, 'Approved', user?.full_name || 'Admin')}
                                className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/25 transition-colors border border-emerald-500/10 shadow-2xs"
                                title="Approve Leave"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => updateLeaveStatus(l.id, 'Rejected', user?.full_name || 'Admin')}
                                className="w-7 h-7 rounded-lg bg-danger/15 text-danger flex items-center justify-center hover:bg-danger/25 transition-colors border border-danger/10 shadow-2xs"
                                title="Reject Leave"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLeaves.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-muted-foreground font-bold">
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* REQUEST LEAVE MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Request Leave</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-semibold">
              
              {/* Select Employee (Admin Only) */}
              {isUserAdmin && (
                <div className="space-y-1">
                  <label className="text-muted-foreground block text-[10px] uppercase">Select Employee</label>
                  <select
                    value={newLeave.employeeId}
                    onChange={e => setNewLeave(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none"
                    required
                  >
                    <option value="">Choose Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Leave Type */}
              <div className="space-y-1">
                <label className="text-muted-foreground block text-[10px] uppercase">Leave Type</label>
                <select
                  value={newLeave.type}
                  onChange={e => setNewLeave(prev => ({ ...prev, type: e.target.value }))}
                  className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none"
                >
                  <option value="Monthly Leave">Monthly Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                  <option value="Other Leave">Other Leave</option>
                </select>
                {newLeave.type === 'Monthly Leave' && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                    <Info size={10} /> Free Leave Allowance: 1 Free Day(s) per Month (Remaining: {balances.monthly.freeAllowance} Day(s))
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-muted-foreground block text-[10px] uppercase">Start Date</label>
                <input
                  type="date"
                  value={newLeave.start}
                  onChange={e => setNewLeave(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none font-medium"
                  required
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-muted-foreground block text-[10px] uppercase">End Date</label>
                <input
                  type="date"
                  value={newLeave.end}
                  onChange={e => setNewLeave(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none font-medium"
                  required
                />
              </div>

              {/* Day Type */}
              <div className="space-y-1">
                <label className="text-muted-foreground block text-[10px] uppercase">Day Type</label>
                <select
                  value={newLeave.dayType}
                  onChange={e => setNewLeave(prev => ({ ...prev, dayType: e.target.value }))}
                  className="bg-card border border-border w-full p-2.5 rounded-xl focus:outline-none"
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-muted-foreground block text-[10px] uppercase">Reason</label>
                <textarea
                  placeholder="Reason for leave..."
                  value={newLeave.reason}
                  onChange={e => setNewLeave(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none transition-all min-h-20"
                  required
                />
              </div>

              {/* Proof of Leave drag upload zone */}
              <div className="space-y-1">
                <label className="text-muted-foreground block text-[10px] uppercase">Proof of Leave (Optional)</label>
                <div className="border border-dashed border-border/80 rounded-xl p-4 text-center cursor-pointer hover:bg-muted/30 transition-all relative">
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <div className="space-y-1 flex flex-col items-center justify-center">
                    <Upload className="text-muted-foreground w-6 h-6" />
                    <span className="text-[10px] text-muted-foreground block">
                      {isUploading ? 'Uploading...' : simulatedFileName ? `Selected: ${simulatedFileName}` : 'Click to upload leave proof image'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <button 
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="bg-muted hover:bg-border/60 text-foreground font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all border border-border"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className={`bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? 'Uploading...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
