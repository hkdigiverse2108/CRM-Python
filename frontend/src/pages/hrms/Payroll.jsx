import PageHeader from '@/components/ui/PageHeader';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { 
  CircleDollarSign, Download, Filter, Search, Plus, 
  Check, Eye, CreditCard, Sparkles, Building2, User, X
} from 'lucide-react';

export default function Payroll() {
  const { 
    payroll, 
    processPayrollMonth, 
    employees, 
    addToast 
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState('June 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectedRecord, setInspectedRecord] = useState(null);

  // Available months compiled from payroll list
  const months = useMemo(() => {
    return ['June 2026', 'May 2026', 'April 2026'];
  }, []);

  // Filtered payroll entries
  const currentPayroll = useMemo(() => {
    return payroll.filter(p => p.month === selectedMonth);
  }, [payroll, selectedMonth]);

  const filteredEntries = useMemo(() => {
    return currentPayroll.filter(p => {
      const matchesSearch = p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentPayroll, searchQuery, statusFilter]);

  // Aggregate sums
  const aggregates = useMemo(() => {
    return currentPayroll.reduce((acc, row) => ({
      gross: acc.gross + (row.grossPay || 0),
      deductions: acc.deductions + (row.totalDeductions || 0),
      net: acc.net + (row.netPay || 0),
      pendingCount: acc.pendingCount + (row.status === 'Pending' ? 1 : 0)
    }), { gross: 0, deductions: 0, net: 0, pendingCount: 0 });
  }, [currentPayroll]);

  const handleProcessPayroll = () => {
    processPayrollMonth(selectedMonth);
  };

  const handleDownloadPayslip = (row) => {
    addToast(`Exporting payslip for ${row.employeeName}...`, 'success');
    
    const csvContent = [
      ["HK DIGIVERSE CRM - MONTHLY PAYSLIP"],
      ["Employee ID", row.employeeId],
      ["Name", row.employeeName],
      ["Department", row.department],
      ["Designation", row.designation],
      ["Pay Month", row.month],
      ["Status", row.status],
      [""],
      ["EARNINGS COMPONENT", "AMOUNT (INR)"],
      ["Basic Salary", row.basic],
      ["HRA Allowance", row.hra],
      ["Allowances", row.allowances],
      ["Incentives", row.incentives],
      ["Bonus Paid", row.bonus],
      ["Gross Salary", row.grossPay],
      [""],
      ["DEDUCTIONS COMPONENT", "AMOUNT (INR)"],
      ["Provident Fund (PF)", row.pf],
      ["ESI Insurance", row.esi],
      ["Income Tax (TDS)", row.tds],
      ["Loan Deductions", row.loanDeductions],
      ["Total Deductions", row.totalDeductions],
      [""],
      ["NET TAKE HOME PAY", row.netPay]
    ].map(line => line.map(val => `"${val}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Payslip_${row.employeeName}_${row.month.replace(' ', '_')}.csv`);
    a.click();
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Header */}
            <PageHeader title="Payroll Processing" subtitle="Salary computation, payslips & payroll management" />

      {/* Aggregate stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Gross Salaries</span>
            <h4 className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">{formatCurrency(aggregates.gross)}</h4>
          </div>
          <div className="p-2 bg-primary/10 rounded-xl text-primary"><CreditCard size={18} /></div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Deductions (PF/Tax)</span>
            <h4 className="text-lg font-extrabold mt-1 text-danger">{formatCurrency(aggregates.deductions)}</h4>
          </div>
          <div className="p-2 bg-danger/10 rounded-xl text-danger"><X size={18} /></div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Take-Home Paid</span>
            <h4 className="text-lg font-extrabold mt-1 text-success">{formatCurrency(aggregates.net)}</h4>
          </div>
          <div className="p-2 bg-success/10 rounded-xl text-success"><Check size={18} /></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, designation, or ID..."
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

      {/* Payroll Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted text-muted-foreground font-bold border-b border-border/80">
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3 text-right">Basic</th>
                <th className="px-5 py-3 text-right">HRA</th>
                <th className="px-5 py-3 text-right">Allowances</th>
                <th className="px-5 py-3 text-right">Deductions</th>
                <th className="px-5 py-3 text-right">Net Take-Home</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
              {filteredEntries.map(row => (
                <tr key={row.employeeId} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-foreground">
                    <p>{row.employeeName}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{row.employeeId}</p>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row.department}</td>
                  <td className="px-5 py-3.5 text-right font-mono">{formatCurrency(row.basic)}</td>
                  <td className="px-5 py-3.5 text-right font-mono">{formatCurrency(row.hra)}</td>
                  <td className="px-5 py-3.5 text-right font-mono">{formatCurrency(row.allowances)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-danger">-{formatCurrency(row.totalDeductions)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-primary font-bold">{formatCurrency(row.netPay)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      row.status === 'Paid' ? 'bg-success/15 text-success border-success/30' : 'bg-amber-400/10 text-amber-500 border-amber-400/20'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setInspectedRecord(row)}
                      className="p-1 rounded hover:bg-muted text-primary"
                      title="Inspect Details"
                    >
                      <Eye size={14} />
                    </button>
                    
                    <button
                      onClick={() => handleDownloadPayslip(row)}
                      className="p-1 rounded hover:bg-muted text-foreground"
                      title="Download Payslip"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-muted-foreground font-medium">
                    No payroll entries found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTED PAYROLL RECORD DETAILS MODAL */}
      {inspectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Salary Slip Details</h3>
                <p className="text-[10px] text-muted-foreground">{inspectedRecord.employeeName} • {inspectedRecord.month}</p>
              </div>
              <button onClick={() => setInspectedRecord(null)} className="text-muted-foreground"><X size={16} /></button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              {/* Earnings */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-primary tracking-widest border-b border-border pb-1">Earnings Component</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic Pay:</span>
                    <span>{formatCurrency(inspectedRecord.basic)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HRA Allowance:</span>
                    <span>{formatCurrency(inspectedRecord.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Special Allowance:</span>
                    <span>{formatCurrency(inspectedRecord.allowances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Incentives Earned:</span>
                    <span>{formatCurrency(inspectedRecord.incentives || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bonus Disbursed:</span>
                    <span>{formatCurrency(inspectedRecord.bonus || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/20 pt-1 text-foreground font-bold">
                    <span>Gross Salary:</span>
                    <span>{formatCurrency(inspectedRecord.grossPay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-danger tracking-widest border-b border-border pb-1">Deductions Component</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provident Fund (PF):</span>
                    <span className="text-danger">-{formatCurrency(inspectedRecord.pf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ESI Insurance:</span>
                    <span className="text-danger">-{formatCurrency(inspectedRecord.esi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Income Tax (TDS):</span>
                    <span className="text-danger">-{formatCurrency(inspectedRecord.tds)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/20 pt-1 text-foreground font-bold">
                    <span>Total Deductions:</span>
                    <span className="text-danger">-{formatCurrency(inspectedRecord.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Take Home */}
              <div className="bg-muted p-3.5 rounded-xl border border-border/40 flex justify-between items-center text-sm font-extrabold">
                <span className="text-foreground">Net Pay Disbursement:</span>
                <span className="text-success text-base">{formatCurrency(inspectedRecord.netPay)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
