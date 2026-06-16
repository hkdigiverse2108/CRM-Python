import PageHeader from '@/components/ui/PageHeader';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import { Check, X, Calendar, Plus, Filter, Search, UserCheck, AlertCircle } from 'lucide-react';

export default function Leaves() {
  const { 
    leaves, 
    updateLeaveStatus, 
    addLeaveRequest, 
    employees, 
    addToast,
    user
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  // New leave request form state
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    type: 'Casual Leave',
    start: '',
    end: '',
    days: 1,
    reason: ''
  });

  const currentEmp = useMemo(() => {
    return employees.find(e => e.email === user?.email);
  }, [employees, user]);

  const isUserAdmin = useMemo(() => {
    return user?.role === 'super_admin' || 
           user?.role_name === 'Organization Admin' || 
           user?.role_name === 'Super Admin' ||
           user?.role_name === 'Admin';
  }, [user]);

  // Leaves visible to the current logged-in user
  const myLeaves = useMemo(() => {
    return leaves.filter(l => {
      // Find the employee who requested the leave
      const emp = employees.find(e => e.id === l.employeeId);
      
      // If user is not admin, only show leaves where they are the reporting manager
      if (!isUserAdmin) {
        if (!emp || emp.reportingManager !== currentEmp?.id) {
          return false;
        }
      }
      return true;
    });
  }, [leaves, employees, currentEmp, isUserAdmin]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = myLeaves.length;
    const pending = myLeaves.filter(l => l.status === 'Pending').length;
    const approved = myLeaves.filter(l => l.status === 'Approved').length;
    const rejected = myLeaves.filter(l => l.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [myLeaves]);

  // Filter requests
  const filteredLeaves = useMemo(() => {
    return myLeaves.filter(l => {
      const name = l.employeeName || l.employee || '';
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                            (l.department || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myLeaves, search, statusFilter]);

  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!newLeave.employeeId || !newLeave.start || !newLeave.end) return;

    const emp = employees.find(e => e.id === newLeave.employeeId);
    if (!emp) return;

    addLeaveRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      type: newLeave.type,
      start: newLeave.start,
      end: newLeave.end,
      days: Number(newLeave.days),
      reason: newLeave.reason
    });

    setShowApplyModal(false);
    setNewLeave({
      employeeId: '',
      type: 'Casual Leave',
      start: '',
      end: '',
      days: 1,
      reason: ''
    });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Header */}
            <PageHeader title="Leave Management" subtitle="Manage employee leave requests & approvals" />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Approvals', value: stats.pending, icon: AlertCircle, color: 'text-amber-500' },
          { label: 'Total Approved Leaves', value: stats.approved, icon: CheckCircleComponent, color: 'text-success' },
          { label: 'Total Rejected Leaves', value: stats.rejected, icon: XCircleComponent, color: 'text-danger' },
          { label: 'Total Leave Requests', value: stats.total, icon: Calendar, color: 'text-primary' }
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

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee or department..."
            className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto shrink-0">
          {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
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

      {/* Requests table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted text-muted-foreground font-bold border-b border-border/80">
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Leave Type</th>
                <th className="px-5 py-3">From Date</th>
                <th className="px-5 py-3">To Date</th>
                <th className="px-5 py-3 text-center">Duration</th>
                <th className="px-5 py-3">Reason / remarks</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
              {filteredLeaves.map(l => {
                const name = l.employeeName || l.employee || 'Staff Member';
                const start = l.start || l.from || '-';
                const end = l.end || l.to || '-';
                return (
                  <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-foreground">{name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{l.department}</td>
                    <td className="px-5 py-3.5">{l.type}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(start)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(end)}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold">{l.days} days</td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-muted-foreground" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        l.status === 'Approved' ? 'bg-success/15 text-success border-success/30' :
                        l.status === 'Rejected' ? 'bg-danger/10 text-danger border-danger/20' :
                        'bg-amber-400/10 text-amber-500 border-amber-400/20'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {l.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updateLeaveStatus(l.id, 'Approved')}
                            className="w-7 h-7 rounded-md bg-success/15 text-success flex items-center justify-center hover:bg-success/25 transition-colors"
                            title="Approve Leave"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => updateLeaveStatus(l.id, 'Rejected')}
                            className="w-7 h-7 rounded-md bg-danger/15 text-danger flex items-center justify-center hover:bg-danger/25 transition-colors"
                            title="Reject Leave"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-muted-foreground font-medium">
                    No leave requests match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUEST LEAVE DIALOG */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-foreground">File Leave on Staff's Behalf</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>Select Employee</label>
                <select
                  value={newLeave.employeeId}
                  onChange={e => setNewLeave(prev => ({ ...prev, employeeId: e.target.value }))}
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
                <label>Leave Category</label>
                <select
                  value={newLeave.type}
                  onChange={e => setNewLeave(prev => ({ ...prev, type: e.target.value }))}
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
                    value={newLeave.start}
                    onChange={e => setNewLeave(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-card border border-border w-full p-1.5 rounded"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newLeave.end}
                    onChange={e => setNewLeave(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-card border border-border w-full p-1.5 rounded"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label>Total Duration Days</label>
                <input
                  type="number"
                  value={newLeave.days}
                  onChange={e => setNewLeave(prev => ({ ...prev, days: e.target.value }))}
                  className="input-field"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-1">
                <label>Reason / Commentary</label>
                <textarea
                  placeholder="Reason for leave application..."
                  value={newLeave.reason}
                  onChange={e => setNewLeave(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-field min-h-16"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2 font-bold mt-2">
                Save Leave Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline fallback components
function CheckCircleComponent(props) {
  return <UserCheck {...props} />;
}

function XCircleComponent(props) {
  return <X {...props} />;
}
