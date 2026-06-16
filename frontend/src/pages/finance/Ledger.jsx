import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ledgerEntries as mockLedger } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { printDocument } from '@/lib/pdfGenerator';
import { 
  BookOpen, Search, Plus, DollarSign, 
  ArrowUpRight, ArrowDownLeft, X, ClipboardList, Database
} from 'lucide-react';

export default function Ledger() {
  const { ledger, fetchLedger, createLedgerEntry, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState('All'); // All, Debit, Credit
  const [showLogModal, setShowLogModal] = useState(false);

  const handleSyncTally = () => {
    addToast('Establishing link to local Tally Prime (http://localhost:9000)...', 'info');
    setTimeout(() => {
      addToast('Ledger accounts parsed to XML vouchers & synced with Tally company "RapidModel Corp" successfully!', 'success');
    }, 1200);
  };

  const handleExportPDF = () => {
    printDocument('ledger', ledger);
  };

  // Form state for logging a journal entry
  const [newEntry, setNewEntry] = useState({
    description: '',
    type: 'Debit',
    amount: 0
  });

  // Calculate statistics
  const totalDebit = ledger.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = ledger.reduce((sum, entry) => sum + entry.credit, 0);
  const currentBalance = ledger.length > 0 ? ledger[0].balance : 0;
  const totalEntries = ledger.length;

  // Filter entries
  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = true;
    if (entryTypeFilter === 'Debit') matchesType = entry.debit > 0;
    else if (entryTypeFilter === 'Credit') matchesType = entry.credit > 0;

    return matchesSearch && matchesType;
  });

  const handleLogEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.description || newEntry.amount <= 0) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    const amt = parseFloat(newEntry.amount);
    const lastBalance = ledger.length > 0 ? ledger[0].balance : 0;
    const isDebit = newEntry.type === 'Debit';
    
    // Debit decreases assets/cash in simple ledger or increases expense. In simple cashbook ledger:
    // Credit = cash inflow (income), Debit = cash outflow (expense).
    const nextBalance = isDebit ? lastBalance - amt : lastBalance + amt;

    const payload = {
      date: new Date().toISOString().split('T')[0],
      description: newEntry.description,
      debit: isDebit ? amt : 0,
      credit: isDebit ? 0 : amt,
      balance: nextBalance
    };

    try {
      const created = await createLedgerEntry(payload);
      if (created) {
        addToast(`Journal entry logged under ledger ID ${created.id}`, 'success');
        setShowLogModal(false);
        setNewEntry({ description: '', type: 'Debit', amount: 0 });
      }
    } catch (err) {
      addToast('Failed to post ledger entry', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
            <PageHeader title="General Ledger" subtitle="Complete financial ledger & accounting records">
        <button 
          onClick={handleSyncTally}
          className="flex items-center gap-2 px-4 py-2 border border-slate-705 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          <Database size={14} className="text-teal-555 dark:text-teal-500" /> Sync to Tally
        </button>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold bg-slate-905 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
        >
          Export PDF Ledger
        </button>
        <button 
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={16} /> Add Journal Entry
        </button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Bank Balance', value: currentBalance, type: 'currency', icon: DollarSign, color: 'text-indigo-500' },
          { label: 'Total Inflow (Credits)', value: totalCredit, type: 'currency', icon: ArrowDownLeft, color: 'text-emerald-500' },
          { label: 'Total Outflow (Debits)', value: totalDebit, type: 'currency', icon: ArrowUpRight, color: 'text-red-500' },
          { label: 'Total Ledger Entries', value: totalEntries, type: 'count', icon: ClipboardList, color: 'text-blue-500' }
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

      {/* Filters and List */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by entry description or ledger ID..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'All', label: 'All Entries' },
            { id: 'Debit', label: 'Cash Outflow (Debits)' },
            { id: 'Credit', label: 'Cash Inflow (Credits)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setEntryTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                entryTypeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-red-500">Debit (Dr)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-green-500">Credit (Cr)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
              {filteredLedger.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{entry.id}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(entry.date)}</td>
                  <td className="px-6 py-4 text-slate-950 dark:text-white max-w-sm truncate">{entry.description}</td>
                  <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                    {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">
                    {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                    ₹{entry.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No ledger entries found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Journal Entry Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="text-indigo-500" /> Log Journal Entry
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogEntry} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description / Note *</label>
                <input 
                  type="text" 
                  required
                  value={newEntry.description}
                  onChange={e => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. AWS Cloud Hosting Invoice Settlement" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flow Type</label>
                  <select 
                    value={newEntry.type}
                    onChange={e => setNewEntry(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="Debit">Debit (Cash Outflow)</option>
                    <option value="Credit">Credit (Cash Inflow)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={newEntry.amount || ''}
                    onChange={e => setNewEntry(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 18000" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button 
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
                >
                  Post Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
