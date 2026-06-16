import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { 
  Search, Mail, Phone, Building2, Plus, Edit3, Trash2, 
  ShieldAlert, ShieldCheck, RefreshCw, Award, Eye, X, 
  MapPin, Calendar, CreditCard, Laptop, FileText, UserPlus
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Directory() {
  const { 
    employees, 
    addEmployee, 
    editEmployee, 
    deleteEmployee, 
    updateEmployeeStatus,
    addToast 
  } = useApp();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  // Modal states
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  const [formFields, setFormFields] = useState({
    id: '', name: '', role: '', department: 'Engineering', email: '', password: '', phone: '',
    gender: 'Male', dob: '', bloodGroup: 'O+', maritalStatus: 'Single',
    emergencyContact: '', currentAddress: '', permanentAddress: '',
    aadhaarNumber: '', panNumber: '', bankName: 'HDFC Bank', 
    accountNumber: '', ifscCode: '', uanNumber: '', pfNumber: '',
    reportingManager: '', employmentType: 'Full-Time', joinDate: '',
    shiftAssignment: 'General Shift', workLocation: 'Bangalore Office',
    basic: 50000, hra: 20000, allowances: 5000, incentives: 0, bonus: 0,
    pf: 6000, esi: 375, tds: 2500, loanDeductions: 0,
    attendanceStatus: 'Present'
  });

  // Action states
  const [transferFields, setTransferFields] = useState({ department: '', workLocation: '' });
  const [promoteFields, setPromoteFields] = useState({ role: '', basic: 60000, hra: 24000 });

  const departments = useMemo(() => {
    return ['All', ...new Set(employees.map(e => e.department))];
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter(e =>
      (deptFilter === 'All' || e.department === deptFilter) &&
      (e.name.toLowerCase().includes(search.toLowerCase()) || 
       e.role.toLowerCase().includes(search.toLowerCase()) ||
       e.id.toLowerCase().includes(search.toLowerCase()))
    );
  }, [employees, deptFilter, search]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formFields.name || !formFields.email) return;

    const payload = {
      name: formFields.name,
      role: formFields.role,
      department: formFields.department,
      email: formFields.email,
      password: formFields.password,
      phone: formFields.phone,
      gender: formFields.gender,
      dob: formFields.dob,
      bloodGroup: formFields.bloodGroup,
      maritalStatus: formFields.maritalStatus,
      emergencyContact: formFields.emergencyContact,
      currentAddress: formFields.currentAddress,
      permanentAddress: formFields.permanentAddress,
      aadhaarNumber: formFields.aadhaarNumber,
      panNumber: formFields.panNumber,
      bankDetails: {
        bankName: formFields.bankName,
        accountNumber: formFields.accountNumber,
        ifscCode: formFields.ifscCode
      },
      uanNumber: formFields.uanNumber,
      pfNumber: formFields.pfNumber,
      reportingManager: formFields.reportingManager,
      employmentType: formFields.employmentType,
      joinDate: formFields.joinDate,
      shiftAssignment: formFields.shiftAssignment,
      workLocation: formFields.workLocation,
      attendanceStatus: formFields.attendanceStatus,
      salaryStructure: {
        basic: Number(formFields.basic),
        hra: Number(formFields.hra),
        allowances: Number(formFields.allowances),
        incentives: Number(formFields.incentives),
        bonus: Number(formFields.bonus),
        pf: Number(formFields.pf),
        esi: Number(formFields.esi),
        tds: Number(formFields.tds),
        loanDeductions: Number(formFields.loanDeductions)
      }
    };

    if (formFields.id) {
      payload.id = formFields.id;
    }

    addEmployee(payload);
    setShowAddModal(false);
    // Reset Form Fields
    setFormFields({
      id: '', name: '', role: '', department: 'Engineering', email: '', password: '', phone: '',
      gender: 'Male', dob: '', bloodGroup: 'O+', maritalStatus: 'Single',
      emergencyContact: '', currentAddress: '', permanentAddress: '',
      aadhaarNumber: '', panNumber: '', bankName: 'HDFC Bank', 
      accountNumber: '', ifscCode: '', uanNumber: '', pfNumber: '',
      reportingManager: '', employmentType: 'Full-Time', joinDate: '',
      shiftAssignment: 'General Shift', workLocation: 'Bangalore Office',
      basic: 50000, hra: 20000, allowances: 5000, incentives: 0, bonus: 0,
      pf: 6000, esi: 375, tds: 2500, loanDeductions: 0,
      attendanceStatus: 'Present'
    });
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    updateEmployeeStatus(selectedEmp.id, 'Transferred', {
      department: transferFields.department,
      workLocation: transferFields.workLocation
    });
    // refresh modal context
    setSelectedEmp(prev => prev ? { ...prev, department: transferFields.department, workLocation: transferFields.workLocation } : null);
    setShowTransferModal(false);
  };

  const handlePromoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    updateEmployeeStatus(selectedEmp.id, 'Promoted', {
      role: promoteFields.role,
      salaryStructure: {
        basic: Number(promoteFields.basic),
        hra: Number(promoteFields.hra)
      }
    });
    // refresh modal context
    setSelectedEmp(prev => prev ? { ...prev, role: promoteFields.role } : null);
    setShowPromoteModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Employee Directory" subtitle="Complete employee database & profile management" />
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 btn-primary text-xs px-3 py-2 font-bold"
        >
          <UserPlus size={14} /> Add New Employee
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, ID or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
        
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                deptFilter === d 
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs' 
                  : 'bg-muted text-muted-foreground hover:bg-border/60'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white text-base font-extrabold shadow-sm">
                  {emp.avatar || emp.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-foreground">{emp.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                </div>
                <span className={`badge ml-auto text-[9px] font-bold ${
                  emp.status === 'Active' ? 'badge-success' : 'badge-warning'
                }`}>
                  {emp.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                <div className="flex items-center gap-2">
                  <Building2 size={12} className="text-primary/75" />
                  <span>{emp.department} • {emp.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={12} />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} />
                  <span>{emp.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
              <button
                onClick={() => setSelectedEmp(emp)}
                className="flex-1 flex items-center justify-center gap-1 btn-outline text-[10px] py-1.5 font-bold"
              >
                <Eye size={12} /> View Profile
              </button>
              
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete profile for ${emp.name}?`)) {
                    deleteEmployee(emp.id);
                  }
                }}
                className="btn-outline text-danger hover:bg-danger/10 border-danger/30 p-1.5"
                title="Delete Employee"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EMPLOYEE PROFILE DETAIL MODAL */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-extrabold">
                  {selectedEmp.avatar || selectedEmp.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selectedEmp.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedEmp.role} • {selectedEmp.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
              {/* Actions row */}
              <div className="flex items-center gap-2 flex-wrap border-b border-border/40 pb-4">
                {selectedEmp.status === 'Active' ? (
                  <button
                    onClick={() => {
                      updateEmployeeStatus(selectedEmp.id, 'Suspended');
                      setSelectedEmp(prev => prev ? { ...prev, status: 'Suspended' } : null);
                    }}
                    className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-bold px-3 py-1.5 rounded-lg"
                  >
                    <ShieldAlert size={13} /> Suspend Employee
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updateEmployeeStatus(selectedEmp.id, 'Active');
                      setSelectedEmp(prev => prev ? { ...prev, status: 'Active' } : null);
                    }}
                    className="flex items-center gap-1 bg-success/15 hover:bg-success/20 text-success font-bold px-3 py-1.5 rounded-lg"
                  >
                    <ShieldCheck size={13} /> Activate Employee
                  </button>
                )}

                <button
                  onClick={() => {
                    setTransferFields({ department: selectedEmp.department, workLocation: selectedEmp.workLocation || 'Bangalore Office' });
                    setShowTransferModal(true);
                  }}
                  className="flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-bold px-3 py-1.5 rounded-lg"
                >
                  <RefreshCw size={13} /> Transfer Employee
                </button>

                <button
                  onClick={() => {
                    setPromoteFields({ role: selectedEmp.role, basic: selectedEmp.salaryStructure?.basic || 50000, hra: selectedEmp.salaryStructure?.hra || 20000 });
                    setShowPromoteModal(true);
                  }}
                  className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1.5 rounded-lg"
                >
                  <Award size={13} /> Promote Employee
                </button>
              </div>

              {/* Grid content panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal & Employment Details */}
                <div className="bg-muted/40 border border-border/40 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Calendar size={14} className="text-primary" /> Personal & Contract Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3.5 font-medium">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Gender</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.gender || 'Male'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Date of Birth</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.dob || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Blood Group</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.bloodGroup || 'O+'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Marital Status</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.maritalStatus || 'Single'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Emergency Contact</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.emergencyContact || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Joining Date</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.joinDate || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Shift / Location</p>
                      <p className="text-foreground font-semibold mt-0.5 truncate">{selectedEmp.shiftAssignment} / {selectedEmp.workLocation}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Reporting Manager</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.reportingManager || 'Self'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Attendance Status</p>
                      <p className="text-foreground font-semibold mt-0.5">{selectedEmp.attendanceStatus || 'Present'}</p>
                    </div>
                  </div>
                </div>

                {/* Identity Registrations & Bank Info */}
                <div className="bg-muted/40 border border-border/40 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <CreditCard size={14} className="text-primary" /> Identity & Bank Accounts
                  </h4>

                  <div className="grid grid-cols-2 gap-3.5 font-medium">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Aadhaar Card Number</p>
                      <p className="text-foreground font-mono font-semibold mt-0.5">{selectedEmp.aadhaarNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">PAN Card Number</p>
                      <p className="text-foreground font-mono font-semibold mt-0.5">{selectedEmp.panNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">UAN Code</p>
                      <p className="text-foreground font-mono font-semibold mt-0.5">{selectedEmp.uanNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">PF Registration Number</p>
                      <p className="text-foreground font-mono font-semibold mt-0.5">{selectedEmp.pfNumber || '-'}</p>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase">Bank Account Ledger</p>
                      <p className="text-foreground font-semibold mt-0.5">
                        {selectedEmp.bankDetails?.bankName} - A/C: {selectedEmp.bankDetails?.accountNumber} (IFSC: {selectedEmp.bankDetails?.ifscCode})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Salary breakdown structure */}
                <div className="bg-muted/40 border border-border/40 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <CreditCard size={14} className="text-primary" /> Monthly Salary Breakdown
                  </h4>
                  
                  {selectedEmp.salaryStructure ? (
                    <div className="space-y-1.5 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Basic Salary:</span>
                        <span>{formatCurrency(selectedEmp.salaryStructure.basic)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HRA Allowance:</span>
                        <span>{formatCurrency(selectedEmp.salaryStructure.hra)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Special Allowances:</span>
                        <span>{formatCurrency(selectedEmp.salaryStructure.allowances)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PF Deduction:</span>
                        <span className="text-danger">-{formatCurrency(selectedEmp.salaryStructure.pf)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/40 pt-1.5 font-bold">
                        <span className="text-foreground">Estimated Net Pay:</span>
                        <span className="text-success">
                          {formatCurrency(
                            selectedEmp.salaryStructure.basic + 
                            selectedEmp.salaryStructure.hra + 
                            selectedEmp.salaryStructure.allowances - 
                            selectedEmp.salaryStructure.pf - 
                            selectedEmp.salaryStructure.tds
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-muted-foreground">Salary structure not assigned.</p>
                  )}
                </div>

                {/* Cabinet Files & Assets List */}
                <div className="bg-muted/40 border border-border/40 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Laptop size={14} className="text-primary" /> Assets & Files Cabinet
                  </h4>

                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Assigned Company Assets:</p>
                    {selectedEmp.assets && selectedEmp.assets.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEmp.assets.map(ast => (
                          <span key={ast.id} className="bg-card border border-border px-2 py-0.5 rounded text-[10px] font-semibold">
                            💻 {ast.name} ({ast.status})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-[10px] text-muted-foreground">No assets currently assigned.</p>
                    )}

                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-3 pt-1 border-t border-border/20">Stored Identity Documents:</p>
                    {selectedEmp.documents && selectedEmp.documents.length > 0 ? (
                      <div className="space-y-1 text-[10px]">
                        {selectedEmp.documents.map(doc => (
                          <div key={doc.name} className="flex justify-between text-muted-foreground">
                            <span>📄 {doc.name}</span>
                            <span className="font-bold">({doc.type})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-[10px] text-muted-foreground">No document files uploaded.</p>
                    )}
                  </div>
                </div>

                {/* Historical Tracking logs */}
                <div className="md:col-span-2 bg-muted/40 border border-border/40 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <FileText size={14} className="text-primary" /> Personnel History Tracking Logs
                  </h4>
                  
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedEmp.history && selectedEmp.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 text-[10.5px]">
                        <span className="font-mono text-primary font-bold">{h.date}:</span>
                        <span className="text-muted-foreground">{h.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INJECTIONS */}
      {/* 1. Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <UserPlus size={16} className="text-primary" /> Create Employee Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-5 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={formFields.id}
                    onChange={e => setFormFields(prev => ({ ...prev, id: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Arjun Mehta"
                    value={formFields.name}
                    onChange={e => setFormFields(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="arjun@company.com"
                    value={formFields.email}
                    onChange={e => setFormFields(prev => ({ ...prev, email: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label>Account Password</label>
                  <input
                    type="password"
                    placeholder="Enter login password"
                    value={formFields.password || ''}
                    onChange={e => setFormFields(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 99887 76655"
                    value={formFields.phone}
                    onChange={e => setFormFields(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label>Designation / Role</label>
                  <input
                    type="text"
                    placeholder="Senior Developer"
                    value={formFields.role}
                    onChange={e => setFormFields(prev => ({ ...prev, role: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label>Department</label>
                  <select
                    value={formFields.department}
                    onChange={e => setFormFields(prev => ({ ...prev, department: e.target.value }))}
                    className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={formFields.joinDate}
                    onChange={e => setFormFields(prev => ({ ...prev, joinDate: e.target.value }))}
                    className="bg-card border border-border w-full p-1.5 rounded"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label>Manager / Reporter</label>
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={formFields.reportingManager}
                    onChange={e => setFormFields(prev => ({ ...prev, reportingManager: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label>Attendance Status</label>
                  <select
                    value={formFields.attendanceStatus}
                    onChange={e => setFormFields(prev => ({ ...prev, attendanceStatus: e.target.value }))}
                    className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {/* Personal Details accordion divider */}
              <div className="border-t border-border/60 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-primary">Personal & Emergency Contact</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label>Gender</label>
                    <select
                      value={formFields.gender}
                      onChange={e => setFormFields(prev => ({ ...prev, gender: e.target.value }))}
                      className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={formFields.dob}
                      onChange={e => setFormFields(prev => ({ ...prev, dob: e.target.value }))}
                      className="bg-card border border-border w-full p-1.5 rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <label>Blood Group</label>
                    <input
                      type="text"
                      placeholder="O+"
                      value={formFields.bloodGroup}
                      onChange={e => setFormFields(prev => ({ ...prev, bloodGroup: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Structure configuration */}
              <div className="border-t border-border/60 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-primary">Salary Structure Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label>Basic Salary (Monthly)</label>
                    <input
                      type="number"
                      value={formFields.basic}
                      onChange={e => setFormFields(prev => ({ ...prev, basic: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label>HRA Allowance</label>
                    <input
                      type="number"
                      value={formFields.hra}
                      onChange={e => setFormFields(prev => ({ ...prev, hra: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label>Special Allowances</label>
                    <input
                      type="number"
                      value={formFields.allowances}
                      onChange={e => setFormFields(prev => ({ ...prev, allowances: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 font-bold mt-2">
                Save & Enlist Employee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-bold text-foreground">Transfer Employee</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>Destination Department</label>
                <select
                  value={transferFields.department}
                  onChange={e => setTransferFields(prev => ({ ...prev, department: e.target.value }))}
                  className="bg-card border border-border w-full p-2 rounded focus:outline-none"
                  required
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Customer Support">Customer Support</option>
                </select>
              </div>

              <div className="space-y-1">
                <label>Destination Work Location</label>
                <input
                  type="text"
                  value={transferFields.workLocation}
                  onChange={e => setTransferFields(prev => ({ ...prev, workLocation: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2 font-bold">Confirm Transfer</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-bold text-foreground">Promote Employee</h3>
              <button onClick={() => setShowPromoteModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handlePromoteSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>New Designation / Role</label>
                <input
                  type="text"
                  value={promoteFields.role}
                  onChange={e => setPromoteFields(prev => ({ ...prev, role: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-1">
                <label>New Basic Salary (Monthly)</label>
                <input
                  type="number"
                  value={promoteFields.basic}
                  onChange={e => setPromoteFields(prev => ({ ...prev, basic: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-1">
                <label>New HRA Allowance</label>
                <input
                  type="number"
                  value={promoteFields.hra}
                  onChange={e => setPromoteFields(prev => ({ ...prev, hra: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2 font-bold">Confirm Promotion</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
