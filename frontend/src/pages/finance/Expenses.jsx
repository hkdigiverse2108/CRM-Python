import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  DollarSign, Search, Plus, CheckCircle2, XCircle, X,
  Clock, PieChart, TrendingUp, Database, PlusCircle
} from 'lucide-react';

const initialExpenses = [];

export default function Expenses() {
  const { expenses, fetchExpenses, createExpense, updateExpense, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showLogModal, setShowLogModal] = useState(false);

  const handleSyncTally = () => {
    addToast('Parsing expenses as Payment Vouchers (XML) for Tally Prime...', 'info');
    setTimeout(() => {
      addToast(`${expenses.length} payment vouchers synced to Tally company "RapidModel Corp" successfully!`, 'success');
    }, 1200);
  };

  // Log expense form state
  const [newExpense, setNewExpense] = useState({
    payee: '',
    category: 'Cloud Infrastructure',
    method: 'Corporate Card',
    amount: 0
  });

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedTotal = expenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'Pending Review').length;
  
  // Categorized expenses object
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  // Filter expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleApprove = async (id) => {
    try {
      const updated = await updateExpense(id, { status: 'Approved' });
      if (updated) {
        addToast(`Expense ${id} approved successfully`, 'success');
      }
    } catch (err) {
      addToast('Failed to approve expense', 'error');
    }
  };

  const handleDecline = async (id) => {
    if (confirm(`Decline and delete expense ${id}?`)) {
      try {
        const updated = await updateExpense(id, { status: 'Declined' });
        if (updated) {
          addToast(`Expense ${id} declined.`, 'info');
        }
      } catch (err) {
        addToast('Failed to decline expense', 'error');
      }
    }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.payee || newExpense.amount <= 0) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    const payload = {
      date: new Date().toISOString().split('T')[0],
      payee: newExpense.payee,
      category: newExpense.category,
      method: newExpense.method,
      amount: parseFloat(newExpense.amount),
      status: 'Pending Review'
    };

    try {
      const created = await createExpense(payload);
      if (created) {
        addToast(`Expense recorded under tracker ${created.id}`, 'success');
        setShowLogModal(false);
        setNewExpense({ payee: '', category: 'Cloud Infrastructure', method: 'Corporate Card', amount: 0 });
      }
    } catch (err) {
      addToast('Failed to log expense', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
            <PageHeader title="Expense Tracker" subtitle="Monitor and categorize business expenses">
        <button 
          onClick={handleSyncTally}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          <Database size={14} className="text-teal-555 dark:text-teal-500" /> Sync to Tally
        </button>
        <button 
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <PlusCircle size={14} /> File Expense Claim
        </button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Expense Claims', value: totalExpenses, type: 'currency', icon: DollarSign, color: 'text-indigo-500' },
          { label: 'Approved & Settled', value: approvedTotal, type: 'currency', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pending Approvals', value: pendingCount, type: 'count', icon: Clock, color: 'text-amber-500' },
          { label: 'Corporate Budget Utilized', value: '48%', type: 'text', icon: TrendingUp, color: 'text-blue-500' }
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <h4 className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">
                  {stat.type === 'currency' ? formatCurrency(stat.value) : stat.value}
                </h4>
              </div>
              <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${stat.color}`}>
                <StatIcon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Expenses List (Left 8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search expenses by payee or ID..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Cloud Infrastructure">Cloud Infrastructure</option>
              <option value="Marketing & Ads">Marketing & Ads</option>
              <option value="Office Rent">Office Rent</option>
              <option value="SaaS Tool Subscriptions">SaaS Tool Subscriptions</option>
              <option value="Meals & Catering">Meals & Catering</option>
              <option value="Office Supplies">Office Supplies</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Payee & ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{exp.payee}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{exp.id} · {exp.method}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-655 dark:text-slate-350">{exp.category}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(exp.date)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(exp.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          exp.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200/50' : 'bg-amber-50 text-amber-700 border-amber-200/50'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {exp.status === 'Pending Review' ? (
                            <>
                              <button 
                                onClick={() => handleApprove(exp.id)}
                                className="p-1.5 text-slate-400 hover:text-green-650 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Approve Claim"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDecline(exp.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Decline Claim"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 pr-2.5">N/A</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        No expenses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expenses by Category (Right 4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Department Categories</h3>
            
            <div className="space-y-4">
              {Object.keys(categoryTotals).length > 0 ? (
                Object.keys(categoryTotals).map(category => {
                  const amount = categoryTotals[category];
                  const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                  let colorClass = 'bg-indigo-500';
                  if (category.includes('Rent')) colorClass = 'bg-red-500';
                  else if (category.includes('Cloud')) colorClass = 'bg-blue-500';
                  else if (category.includes('Marketing')) colorClass = 'bg-amber-500';
                  else if (category.includes('Meals')) colorClass = 'bg-emerald-500';

                  return (
                    <div key={category} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{category}</span>
                        <span className="text-slate-500">{formatCurrency(amount)} ({percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No categories recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Expense Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PieChart className="text-indigo-500" /> Log Expense Claim
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payee / Vendor Name *</label>
                <input 
                  type="text" 
                  required
                  value={newExpense.payee}
                  onChange={e => setNewExpense(prev => ({ ...prev, payee: e.target.value }))}
                  placeholder="e.g. AWS Cloud Services" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expense Category</label>
                <select 
                  value={newExpense.category}
                  onChange={e => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                >
                  <option>Cloud Infrastructure</option>
                  <option>Marketing & Ads</option>
                  <option>Office Rent</option>
                  <option>SaaS Tool Subscriptions</option>
                  <option>Meals & Catering</option>
                  <option>Office Supplies</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Method</label>
                  <select 
                    value={newExpense.method}
                    onChange={e => setNewExpense(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option>Corporate Card</option>
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>UPI</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 8400" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button 
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
                >
                  File Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
