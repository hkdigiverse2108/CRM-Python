import PageHeader from '@/components/ui/PageHeader';
import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { 
  CircleDollarSign, Download, Filter, Search, Plus, 
  Check, Eye, CreditCard, Sparkles, Building2, User, X, Trash2, Calendar, Play
} from 'lucide-react';

export default function Payroll() {
  const { 
    payroll, 
    processPayrollMonth, 
    employees, 
    attendance,
    leaves,
    payrollAdjustments,
    addPayrollAdjustment,
    deletePayrollAdjustment,
    hrmsRole,
    hrmsEmployeeId,
    user,
    addToast 
  } = useApp();

  const location = useLocation();
  const view = location.pathname.endsWith('/payslips')
    ? 'payslips'
    : location.pathname.endsWith('/bonuses-deductions')
      ? 'bonuses'
      : 'processing';

  const activeView = hrmsRole === 'Employee' ? 'payslips' : view;

  const currentEmployee = useMemo(() => {
    return employees.find(emp => emp.id === hrmsEmployeeId || emp.employee_id === hrmsEmployeeId) ||
           employees.find(emp => emp.email === user?.email) ||
           null;
  }, [employees, hrmsEmployeeId, user]);

  // State for selectors
  const [selectedMonthName, setSelectedMonthName] = useState('June');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectedRecord, setInspectedRecord] = useState(null);

  // Payslip filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const activeEmployeeId = useMemo(() => {
    if (hrmsRole === 'Employee') {
      return currentEmployee?.id || '';
    }
    return selectedEmployeeId || currentEmployee?.id || employees[0]?.id || '';
  }, [hrmsRole, currentEmployee, selectedEmployeeId, employees]);

  const [payslipMonth, setPayslipMonth] = useState('June');
  const [payslipYear, setPayslipYear] = useState('2026');

  // Bonus/Deduction filters & modal
  const [adjSearchQuery, setAdjSearchQuery] = useState('');
  const [adjTypeFilter, setAdjTypeFilter] = useState('All');
  const [adjPeriodFilter, setAdjPeriodFilter] = useState('All Time');
  const [isAddAdjOpen, setIsAddAdjOpen] = useState(false);
  
  // New adjustment form state
  const [newAdjEmpId, setNewAdjEmpId] = useState('');
  const [newAdjType, setNewAdjType] = useState('DEDUCTION');
  const [newAdjAmount, setNewAdjAmount] = useState('');
  const [newAdjDate, setNewAdjDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAdjReason, setNewAdjReason] = useState('');

  const selectedMonth = useMemo(() => {
    return `${selectedMonthName} ${selectedYear}`;
  }, [selectedMonthName, selectedYear]);

  // Derived calculations for the Payroll Processing table
  const processedTableData = useMemo(() => {
    return employees.map(emp => {
      // 1. Calculate working days (e.g. 26)
      const workingDays = 26;

      // 2. Count worked days from attendance records for the selected month/year
      // Format of date in attendance is YYYY-MM-DD
      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        .indexOf(selectedMonthName) + 1;
      const monthPrefix = `${selectedYear}-${String(monthIndex).padStart(2, '0')}`;
      
      const empAttendance = attendance.filter(a => 
        a.employeeId === emp.id && 
        a.date && 
        a.date.startsWith(monthPrefix)
      );
      const worked = empAttendance.filter(a => a.checkIn || a.status === 'Present').length;

      // 3. Count leaves in the selected month
      const empLeaves = leaves.filter(l => 
        l.employeeId === emp.id && 
        l.status === 'Approved' &&
        l.startDate && 
        l.startDate.startsWith(monthPrefix)
      );
      const totalLeaves = empLeaves.reduce((sum, l) => sum + (l.days || 0), 0);

      // 4. Monthly leave balance / allocated
      const monthlyLeave = emp.leaveBalance || 0;

      // 5. Basic pay & adjustments
      const sal = emp.salaryStructure || {};
      const baseSalary = parseFloat(sal.basic || 45000);
      const hra = parseFloat(sal.hra || 18000);
      const allowances = parseFloat(sal.allowances || 7000);
      
      // Calculate actual basic based on worked days
      const earnedBasic = worked > 0 ? (baseSalary * (worked / workingDays)) : 0;

      // Fetch adjustments for this employee in this month
      const empAdjustments = payrollAdjustments.filter(adj => 
        adj.employeeId === emp.id && 
        adj.date && 
        adj.date.startsWith(monthPrefix)
      );
      
      const bonus = empAdjustments
        .filter(adj => adj.type === 'BONUS')
        .reduce((sum, adj) => sum + adj.amount, 0);

      const adhocDeductions = empAdjustments
        .filter(adj => adj.type === 'DEDUCTION')
        .reduce((sum, adj) => sum + adj.amount, 0);

      // Unpaid absence calculation
      const absentDays = Math.max(0, workingDays - worked - totalLeaves);
      const unpaidAbsenceDeduction = worked > 0 ? (baseSalary / workingDays) * absentDays : baseSalary;

      const totalDeductions = parseFloat(sal.pf || 1800) + parseFloat(sal.esi || 0) + parseFloat(sal.tds || 2500) + adhocDeductions + unpaidAbsenceDeduction;
      const netPay = Math.max(0, earnedBasic + hra + allowances + bonus - totalDeductions);

      // Find matching payroll slip if processed
      const slip = payroll.find(p => p.employeeId === emp.id && p.month === selectedMonth);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department || 'General',
        designation: emp.role || 'Staff',
        workingDays,
        worked,
        totalLeaves,
        monthlyLeave,
        basic: earnedBasic,
        bonus: bonus + parseFloat(sal.incentives || 0),
        deductions: totalDeductions,
        unpaidAbsence: unpaidAbsenceDeduction,
        absentDays,
        netPay: slip ? slip.netPay : netPay,
        status: slip ? slip.status : 'Pending',
        slipId: slip?.id
      };
    });
  }, [employees, selectedMonthName, selectedYear, attendance, leaves, payrollAdjustments, payroll, selectedMonth]);

  const filteredProcessedData = useMemo(() => {
    return processedTableData.filter(p => {
      const matchesSearch = p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [processedTableData, searchQuery, statusFilter]);

  // Aggregate values for cards
  const aggregates = useMemo(() => {
    return processedTableData.reduce((acc, row) => ({
      gross: acc.gross + (row.basic + row.bonus),
      deductions: acc.deductions + row.deductions,
      net: acc.net + row.netPay,
      paidCount: acc.paidCount + (row.status === 'Paid' ? 1 : 0),
      toProcessCount: acc.toProcessCount + (row.status === 'Pending' ? 1 : 0)
    }), { gross: 0, deductions: 0, net: 0, paidCount: 0, toProcessCount: 0 });
  }, [processedTableData]);

  const handleProcessPayroll = () => {
    processPayrollMonth(selectedMonth);
  };

  const handleDownloadPayslip = (row) => {
    setInspectedRecord(row);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Payslips view logic
  const selectedEmpPayslips = useMemo(() => {
    if (!activeEmployeeId) return [];
    
    // Returns simulated pay periods for the selected employee
    const targetEmp = employees.find(e => e.id === activeEmployeeId);
    if (!targetEmp) return [];

    const periods = ['May 2026', 'April 2026', 'June 2026', 'July 2026'];
    return periods.map(period => {
      const slip = payroll.find(p => p.employeeId === activeEmployeeId && p.month === period);
      return {
        period,
        netSalary: slip ? slip.netPay : 0,
        status: slip ? slip.status : 'DRAFT',
        employeeName: targetEmp.name,
        employeeId: targetEmp.id,
        department: targetEmp.department || 'General',
        designation: targetEmp.role || 'Staff',
        basic: parseFloat(targetEmp.salaryStructure?.basic || 45000),
        hra: parseFloat(targetEmp.salaryStructure?.hra || 18000),
        allowances: parseFloat(targetEmp.salaryStructure?.allowances || 7000),
        pf: parseFloat(targetEmp.salaryStructure?.pf || 1800),
        esi: parseFloat(targetEmp.salaryStructure?.esi || 0),
        tds: parseFloat(targetEmp.salaryStructure?.tds || 2500),
        bonus: 0,
        totalDeductions: parseFloat(targetEmp.salaryStructure?.pf || 1800) + parseFloat(targetEmp.salaryStructure?.tds || 2500)
      };
    });
  }, [activeEmployeeId, payroll, employees]);

  // Adjustments view logic
  const filteredAdjustments = useMemo(() => {
    return payrollAdjustments.filter(adj => {
      const matchesSearch = adj.reason.toLowerCase().includes(adjSearchQuery.toLowerCase()) || 
                            adj.employeeName.toLowerCase().includes(adjSearchQuery.toLowerCase());
      const matchesType = adjTypeFilter === 'All' || adj.type === adjTypeFilter;
      
      let matchesPeriod = true;
      if (adjPeriodFilter === 'This Month') {
        const thisMonthStr = `2026-06`;
        matchesPeriod = adj.date && adj.date.startsWith(thisMonthStr);
      } else if (adjPeriodFilter === 'Last Month') {
        const lastMonthStr = `2026-05`;
        matchesPeriod = adj.date && adj.date.startsWith(lastMonthStr);
      }

      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [payrollAdjustments, adjSearchQuery, adjTypeFilter, adjPeriodFilter]);

  const handleAddAdjustmentSubmit = async (e) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newAdjEmpId);
    if (!emp) {
      addToast('Please select a valid employee.', 'error');
      return;
    }

    const payload = {
      employeeId: emp.id,
      employeeName: emp.name,
      type: newAdjType,
      amount: parseFloat(newAdjAmount) || 0,
      date: newAdjDate,
      reason: newAdjReason
    };

    const res = await addPayrollAdjustment(payload);
    if (res) {
      setIsAddAdjOpen(false);
      setNewAdjAmount('');
      setNewAdjReason('');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Dynamic Header */}
      {activeView === 'processing' && (
        <PageHeader title="Payroll Processing" subtitle="Calculate and manage monthly salaries." />
      )}
      {activeView === 'payslips' && (
        <PageHeader title="Employee Payslip" subtitle="Detailed monthly salary breakdown and payment proof." />
      )}
      {activeView === 'bonuses' && (
        <PageHeader title="Bonuses & Deductions" subtitle="Add ad-hoc salary adjustments for specific months." />
      )}

      {/* RENDER VIEW: PAYROLL PROCESSING */}
      {activeView === 'processing' && (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  value={selectedMonthName} 
                  onChange={e => setSelectedMonthName(e.target.value)}
                  className="bg-muted border border-border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                    .map(m => <option key={m} value={m}>{m}</option>)
                  }
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(e.target.value)}
                  className="bg-muted border border-border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
                >
                  {['2025', '2026', '2027', '2028'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <button 
              onClick={handleProcessPayroll}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/10 shrink-0"
            >
              <Play size={14} className="fill-current" />
              <span>Run Processing</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Payout</span>
                <h4 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{formatCurrency(aggregates.net)}</h4>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl text-primary"><CircleDollarSign size={20} /></div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Employees</span>
                <h4 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{employees.length}</h4>
              </div>
              <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-500"><User size={20} /></div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Paid</span>
                <h4 className="text-xl font-extrabold mt-1 text-success">{aggregates.paidCount}</h4>
              </div>
              <div className="p-3 bg-success/10 rounded-2xl text-success"><Check size={20} /></div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">To Process</span>
                <h4 className="text-xl font-extrabold mt-1 text-amber-500">{aggregates.toProcessCount}</h4>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Calendar size={20} /></div>
            </div>
          </div>

          {/* Table Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto shrink-0">
              {['All', 'Paid', 'Pending'].map(tab => (
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

          {/* Payroll Processing Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted text-muted-foreground font-bold border-b border-border/80">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3 text-center">Working Days</th>
                    <th className="px-5 py-3 text-center">Worked</th>
                    <th className="px-5 py-3 text-center">Total Leaves</th>
                    <th className="px-5 py-3 text-center">Monthly Leave</th>
                    <th className="px-5 py-3 text-right">Basic</th>
                    <th className="px-5 py-3 text-right">Bonus / Incentives</th>
                    <th className="px-5 py-3 text-right">Deductions</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
                  {filteredProcessedData.map(row => (
                    <tr key={row.employeeId} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        <p>{row.employeeName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono">{row.workingDays}</td>
                      <td className="px-5 py-3.5 text-center font-mono">{row.worked}</td>
                      <td className="px-5 py-3.5 text-center font-mono">{row.totalLeaves}</td>
                      <td className="px-5 py-3.5 text-center font-mono">{row.monthlyLeave}</td>
                      <td className="px-5 py-3.5 text-right font-mono">{formatCurrency(row.basic)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-success">+{formatCurrency(row.bonus)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-danger">
                        <p>-{formatCurrency(row.deductions)}</p>
                        {row.absentDays > 0 && (
                          <p className="text-[10px] text-muted-foreground font-normal">
                            Unpaid Absence - {row.absentDays}.0 day(s): {formatCurrency(row.unpaidAbsence)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right flex items-center justify-end gap-1.5 mt-2">
                        <button
                          onClick={() => setInspectedRecord(row)}
                          className="p-1.5 rounded hover:bg-muted text-primary"
                          title="Inspect Details"
                        >
                          <Eye size={14} />
                        </button>
                        
                        <button
                          onClick={() => handleDownloadPayslip(row)}
                          className="p-1.5 rounded hover:bg-muted text-foreground"
                          title="Download Payslip"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredProcessedData.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-muted-foreground font-medium">
                        No employees found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* RENDER VIEW: PAYSLIPS */}
      {activeView === 'payslips' && (
        <div className="space-y-6">
          {/* Selector Bar */}
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-center bg-card border border-border p-4 rounded-2xl shadow-xs">
            <div className="flex-1 min-w-[200px]">
              <select 
                value={activeEmployeeId} 
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                disabled={hrmsRole === 'Employee'}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="relative w-36">
              <select 
                value={payslipMonth} 
                onChange={e => setPayslipMonth(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                  .map(m => <option key={m} value={m}>{m}</option>)
                }
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative w-28">
              <select 
                value={payslipYear} 
                onChange={e => setPayslipYear(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
              >
                {['2025', '2026', '2027', '2028'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            <button 
              onClick={() => {
                const emp = employees.find(e => e.id === activeEmployeeId);
                if (emp) {
                  handleDownloadPayslip({
                    employeeId: emp.id,
                    employeeName: emp.name,
                    department: emp.department || 'General',
                    designation: emp.role || 'Staff',
                    basic: parseFloat(emp.salaryStructure?.basic || 45000),
                    bonus: 0,
                    deductions: parseFloat(emp.salaryStructure?.pf || 1800) + parseFloat(emp.salaryStructure?.tds || 2500),
                    netPay: parseFloat(emp.salaryStructure?.basic || 45000) - parseFloat(emp.salaryStructure?.pf || 1800) - parseFloat(emp.salaryStructure?.tds || 2500),
                    status: 'DRAFT'
                  });
                }
              }}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-slate-700 dark:text-slate-200 transition-all shadow-xs"
              title="Download Payslip"
            >
              <Download size={14} />
            </button>
          </div>

          {/* Payslips Period Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted text-muted-foreground font-bold border-b border-border/80">
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Net Salary</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
                  {selectedEmpPayslips.map(row => (
                    <tr key={row.period} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-primary">
                        {row.period}
                      </td>
                      <td className="px-5 py-3.5 font-mono">{formatCurrency(row.netSalary)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          row.status === 'Paid' 
                            ? 'bg-success/15 text-success border-success/30' 
                            : 'bg-amber-400/10 text-amber-600 border-amber-400/20'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center flex items-center justify-center gap-1.5 mt-1">
                        <button
                          onClick={() => handleDownloadPayslip({
                            employeeId: row.employeeId,
                            employeeName: row.employeeName,
                            department: row.department,
                            designation: row.designation,
                            basic: row.basic,
                            bonus: row.bonus,
                            deductions: row.totalDeductions,
                            netPay: row.netSalary,
                            status: row.status
                          })}
                          className="p-1.5 rounded hover:bg-muted text-foreground"
                          title="Download Payslip File"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {selectedEmpPayslips.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-10 text-muted-foreground font-medium">
                        No payslips generated for this employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: BONUSES & DEDUCTIONS */}
      {activeView === 'bonuses' && (
        <div className="space-y-6">
          {/* Header Action & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={adjSearchQuery}
                  onChange={e => setAdjSearchQuery(e.target.value)}
                  placeholder="Search by reason..."
                  className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <select
                value={adjTypeFilter}
                onChange={e => setAdjTypeFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="All">Type: All</option>
                <option value="BONUS">Type: Bonus</option>
                <option value="DEDUCTION">Type: Deduction</option>
              </select>

              <select
                value={adjPeriodFilter}
                onChange={e => setAdjPeriodFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="All Time">All Time</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setNewAdjEmpId(employees[0]?.id || '');
                setIsAddAdjOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Plus size={14} />
              <span>Add Adjustment</span>
            </button>
          </div>

          {/* Adjustments Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted text-muted-foreground font-bold border-b border-border/80">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
                  {filteredAdjustments.map(row => (
                    <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        {row.employeeName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          row.type === 'BONUS' 
                            ? 'bg-success/15 text-success border-success/30' 
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">{formatCurrency(row.amount)}</td>
                      <td className="px-5 py-3.5">
                        {row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground max-w-md truncate" title={row.reason}>
                        {row.reason}
                      </td>
                      <td className="px-5 py-3.5 text-right flex items-center justify-end gap-1.5 mt-1">
                        <button
                          onClick={() => deletePayrollAdjustment(row.id)}
                          className="p-1.5 rounded hover:bg-muted text-danger"
                          title="Delete Adjustment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAdjustments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-muted-foreground font-medium">
                        No adjustments found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTED DETAILS MODAL */}
      {inspectedRecord && (() => {
        const emp = employees.find(e => e.id === inspectedRecord.employeeId);
        const sal = emp?.salaryStructure || {};
        
        // Resolve dynamic tenant details
        const isHk = activeOrg === 'HK Digiverse LLP' || activeOrg === 'HK Digiverse' || String(activeOrg).toLowerCase().includes('hk');
        const companyName = isHk ? 'HARIKRUSHN DIGIVERSE LLP' : 'RAPIDMODEL CORP';
        const companyAddress = isHk ? 'SURAT, GUJARAT, INDIA' : 'BANGALORE, KARNATAKA, INDIA';
        const companyGstin = isHk ? '24APQPN3916P1Z4' : '29AAFCR1234A1Z1';
        const companyLoc = isHk ? 'SURAT' : 'BANGALORE';
        const bankName = emp?.bankDetails?.bankName || (isHk ? 'THE VARACHA CO-OP' : 'HDFC BANK');
        const accNo = emp?.bankDetails?.accountNumber || '100160136007';
        const ifsc = emp?.bankDetails?.ifscCode || (isHk ? 'VARA0289016' : 'HDFC0000123');
        const pan = emp?.panNumber || 'JEPPD0579P';
        const joinDateVal = emp?.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-GB') : '20/05/2026';
        
        const basicAmt = Math.round(inspectedRecord.basic);
        const hraAmt = Math.round(inspectedRecord.basic > 0 ? parseFloat(sal.hra || 18000) : 0);
        const allowancesAmt = Math.round(inspectedRecord.basic > 0 ? parseFloat(sal.allowances || 7000) : 0);
        const bonusAmt = Math.round(inspectedRecord.bonus);
        const totalEarnings = basicAmt + hraAmt + allowancesAmt + bonusAmt;

        const unpaidAbsence = Math.round(inspectedRecord.unpaidAbsence);
        const secDeposit = 0;
        const leaveDeduction = unpaidAbsence;
        const penaltyDeduction = Math.max(0, Math.round(inspectedRecord.deductions) - unpaidAbsence);
        const totalDeductions = secDeposit + penaltyDeduction + leaveDeduction;
        
        const netAmt = Math.max(0, totalEarnings - totalDeductions);
        const netInWords = numberToWords(netAmt);

        return (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white text-black border border-slate-350 rounded-xl p-5 w-full max-w-2xl shadow-2xl space-y-4 print:p-0 print:border-none print:shadow-none">
              
              {/* Modal controls - hidden in print */}
              <div className="flex justify-between items-center border-b pb-2 print:hidden">
                <span className="text-xs font-bold text-slate-500">Salary Slip Preview</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()} 
                    className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={13} /> Print / Save PDF
                  </button>
                  <button 
                    onClick={() => setInspectedRecord(null)} 
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* PRINT AREA */}
              <div id="payslip-print-area" className="border-2 border-black p-4 space-y-4 font-sans text-xs bg-white text-black">
                
                {/* Header info */}
                <div className="text-center border-b-2 border-black pb-2 space-y-0.5">
                  <h2 className="text-sm font-extrabold tracking-wider">{companyName}</h2>
                  <p className="text-[10px] font-bold text-slate-700">{companyAddress}</p>
                  <p className="text-[10px] font-bold text-slate-700">GSTIN: {companyGstin}</p>
                  <div className="border-t border-black mt-2 pt-1 font-extrabold text-[11px] uppercase">
                    Salary Slip
                  </div>
                  <p className="text-[10px] font-bold">For {selectedMonth.toUpperCase()}</p>
                </div>

                <div className="text-center font-extrabold border-b-2 border-black pb-1.5 text-[11px] uppercase">
                  {inspectedRecord.employeeName}
                </div>

                {/* Employee details grid */}
                <div className="grid grid-cols-2 border-b-2 border-black text-[10px]">
                  <div className="border-r border-black divide-y divide-black">
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">Emplyoee ID</span>
                      <span className="font-semibold">{inspectedRecord.employeeId}</span>
                    </div>
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">Income Tax Number (PAN)</span>
                      <span className="font-semibold font-mono">{pan}</span>
                    </div>
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">Designation</span>
                      <span className="font-semibold">{inspectedRecord.designation}</span>
                    </div>
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">Date of Joining</span>
                      <span className="font-semibold">{joinDateVal}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-black">
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">Location</span>
                      <span className="font-semibold">{companyLoc}</span>
                    </div>
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">Bank Details</span>
                      <span className="font-semibold">{bankName}</span>
                    </div>
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">A/C.NO:</span>
                      <span className="font-semibold font-mono">{accNo}</span>
                    </div>
                    <div className="grid grid-cols-2 p-1.5">
                      <span className="font-bold">IFSC</span>
                      <span className="font-semibold font-mono">{ifsc}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance details */}
                <div className="border-b-2 border-black text-[10px]">
                  <div className="p-1 font-bold bg-slate-100 border-b border-black uppercase tracking-wider">Attendance Details</div>
                  <div className="flex justify-between p-1.5">
                    <span className="font-bold">Present Days</span>
                    <span className="font-extrabold">{inspectedRecord.worked}.0</span>
                  </div>
                </div>

                {/* Earnings & Deductions Details grid */}
                <table className="w-full text-left border-collapse border-b-2 border-black text-[10px]">
                  <thead>
                    <tr className="border-b border-black bg-slate-100 uppercase font-bold text-center">
                      <th className="px-3 py-1.5 border-r border-black w-1/4">Earnings</th>
                      <th className="px-3 py-1.5 border-r border-black text-right w-1/4">Amount</th>
                      <th className="px-3 py-1.5 border-r border-black w-1/4">Deduction</th>
                      <th className="px-3 py-1.5 text-right w-1/4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-semibold">
                    <tr>
                      <td className="px-3 py-1.5 border-r border-black">Basic</td>
                      <td className="px-3 py-1.5 border-r border-black text-right font-mono">{basicAmt}</td>
                      <td className="px-3 py-1.5 border-r border-black">Security Deposit</td>
                      <td className="px-3 py-1.5 text-right font-mono">{secDeposit}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 border-r border-black">H.R.A</td>
                      <td className="px-3 py-1.5 border-r border-black text-right font-mono">{hraAmt}</td>
                      <td className="px-3 py-1.5 border-r border-black text-danger">Penalty Deduction</td>
                      <td className="px-3 py-1.5 text-right font-mono text-danger">{penaltyDeduction}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 border-r border-black">Conveyance Allowance</td>
                      <td className="px-3 py-1.5 border-r border-black text-right font-mono">{allowancesAmt}</td>
                      <td className="px-3 py-1.5 border-r border-black text-danger">Leave Deduction</td>
                      <td className="px-3 py-1.5 text-right font-mono text-danger">{leaveDeduction}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 border-r border-black">C.C.A</td>
                      <td className="px-3 py-1.5 border-r border-black text-right font-mono">0</td>
                      <td className="px-3 py-1.5 border-r border-black"></td>
                      <td className="px-3 py-1.5 text-right font-mono"></td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 border-r border-black">Education Allowance</td>
                      <td className="px-3 py-1.5 border-r border-black text-right font-mono">0</td>
                      <td className="px-3 py-1.5 border-r border-black"></td>
                      <td className="px-3 py-1.5 text-right font-mono"></td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 border-r border-black">Bonus / Incentives</td>
                      <td className="px-3 py-1.5 border-r border-black text-right font-mono">{bonusAmt}</td>
                      <td className="px-3 py-1.5 border-r border-black"></td>
                      <td className="px-3 py-1.5 text-right font-mono"></td>
                    </tr>
                    <tr className="border-t-2 border-black font-extrabold bg-slate-50">
                      <td className="px-3 py-2 border-r border-black uppercase">Total Earnings</td>
                      <td className="px-3 py-2 border-r border-black text-right font-mono">{totalEarnings}</td>
                      <td className="px-3 py-2 border-r border-black uppercase">Total Deduction</td>
                      <td className="px-3 py-2 text-right font-mono">{totalDeductions}</td>
                    </tr>
                    <tr className="border-t border-black font-extrabold bg-slate-100">
                      <td colSpan="2" className="border-r border-black"></td>
                      <td className="px-3 py-2 border-r border-black text-teal-650 uppercase">Net Amount</td>
                      <td className="px-3 py-2 text-right font-mono text-teal-650 text-xs">{netAmt}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer and Mode of Payment */}
                <div className="grid grid-cols-2 gap-4 text-[10px] pt-2 bg-white">
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-500 uppercase tracking-wider text-[8px]">Amount (in words)</p>
                      <p className="font-extrabold italic text-slate-800">{netInWords} Rupees Only</p>
                    </div>

                    <table className="w-full text-center border-collapse border border-black">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black font-bold">
                          <th className="px-2 py-1 border-r border-black">Mode</th>
                          <th className="px-2 py-1 border-r border-black">Chq.No.</th>
                          <th className="px-2 py-1">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black font-semibold bg-white text-black">
                        <tr>
                          <td className="px-2 py-1 border-r border-black">Cheque</td>
                          <td className="px-2 py-1 border-r border-black">0</td>
                          <td className="px-2 py-1 font-mono">0</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 border-r border-black">Cash</td>
                          <td className="px-2 py-1 border-r border-black">-</td>
                          <td className="px-2 py-1 font-mono">{netAmt}.00</td>
                        </tr>
                        <tr className="border-t border-black font-bold bg-slate-50">
                          <td colSpan="2" className="px-2 py-1 border-r border-black text-right">TOTAL</td>
                          <td className="px-2 py-1 font-mono">{netAmt}.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col justify-between items-center py-2 text-center h-full">
                    <p className="font-extrabold uppercase text-[9px] tracking-wide">FOR {companyName}</p>
                    <div className="w-32 border-b border-black border-dashed mt-12"></div>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Authorized Signatory</p>
                  </div>
                </div>

              </div>

              {/* Print stylesheet */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #payslip-print-area, #payslip-print-area * {
                    visibility: visible;
                  }
                  #payslip-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: 2px solid black !important;
                    padding: 16px !important;
                    background-color: white !important;
                    color: black !important;
                  }
                }
              `}} />

            </div>
          </div>
        );
      })()}

      {/* ADD ADJUSTMENT MODAL */}
      {isAddAdjOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleAddAdjustmentSubmit} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-foreground">Add Ad-hoc Adjustment</h3>
              <button type="button" onClick={() => setIsAddAdjOpen(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Select Employee</label>
                <select
                  value={newAdjEmpId}
                  onChange={e => setNewAdjEmpId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4.5 py-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Adjustment Type</label>
                  <select
                    value={newAdjType}
                    onChange={e => setNewAdjType(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4.5 py-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="BONUS">Bonus</option>
                    <option value="DEDUCTION">Deduction</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Amount (INR)</label>
                  <input
                    type="number"
                    value={newAdjAmount}
                    onChange={e => setNewAdjAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-muted border border-border rounded-xl px-4.5 py-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Adjustment Date</label>
                <input
                  type="date"
                  value={newAdjDate}
                  onChange={e => setNewAdjDate(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4.5 py-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Reason / Remark</label>
                <textarea
                  value={newAdjReason}
                  onChange={e => setNewAdjReason(e.target.value)}
                  placeholder="Enter detailed reason..."
                  rows="3"
                  className="w-full bg-muted border border-border rounded-xl px-4.5 py-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-border pt-3">
              <button 
                type="button" 
                onClick={() => setIsAddAdjOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const g = [
    '', 'Thousand', 'Million', 'Billion', 'Trillion'
  ];

  const helper = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
  };

  let str = '';
  let i = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      str = helper(num % 1000) + (g[i] ? ' ' + g[i] : '') + (str ? ' ' + str : '');
    }
    num = Math.floor(num / 1000);
    i++;
  }
  return str.trim();
}
