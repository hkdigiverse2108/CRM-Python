import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { payments as mockPayments } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { printDocument } from '@/lib/pdfGenerator';
import { 
  CreditCard, Search, Plus, Eye, AlertTriangle, X,
  Clock, DollarSign, Download, Receipt, RefreshCw, Database, PlusCircle
} from 'lucide-react';

export default function Payments() {
  const { payments, fetchPayments, createPayment, updatePayment, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  const handleSyncTally = () => {
    addToast('Parsing payments as Receipt Vouchers (XML) for Tally Prime...', 'info');
    setTimeout(() => {
      addToast(`${payments.length} receipt vouchers synced to Tally company "RapidModel Corp" successfully!`, 'success');
    }, 1200);
  };

  // Form state for logging a payment manually
  const [newPayment, setNewPayment] = useState({
    id: '',
    invoiceId: '',
    client: '',
    amount: '',
    method: 'UPI',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    remarks: ''
  });

  // Calculate statistics
  const totalReceived = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPartial = payments.filter(p => p.status === 'Partial').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalTransactions = payments.length;
  const refundCount = payments.filter(p => p.status === 'Failed').length;

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.client || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.invoiceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.reference || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === 'All' || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleRefund = async (pay) => {
    if (confirm(`Authorize Refund of ${formatCurrency(pay.amount)} to ${pay.client}?`)) {
      try {
        const updated = await updatePayment(pay.id, { status: 'Failed', reference: `REFUNDED/${pay.reference}` });
        if (updated) {
          addToast(`Refund processed for ${pay.id} (${formatCurrency(pay.amount)})`, 'success');
          if (selectedPayment && selectedPayment.id === pay.id) {
            setSelectedPayment(updated);
          }
        }
      } catch (err) {
        addToast('Failed to process refund', 'error');
      }
    }
  };

  const handleLogPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.invoiceId || !newPayment.client || Number(newPayment.amount) <= 0) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    const payload = {
      invoiceId: newPayment.invoiceId,
      client: newPayment.client,
      amount: parseFloat(newPayment.amount),
      method: newPayment.method,
      date: newPayment.date || new Date().toISOString().split('T')[0],
      reference: newPayment.reference || `MANUAL/TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      status: newPayment.status || 'Completed',
      remarks: newPayment.remarks || ''
    };

    try {
      const created = await createPayment(payload);
      if (created) {
        addToast(`Payment transaction ${created.id} logged.`, 'success');
        setShowLogModal(false);
        setNewPayment({ id: '', invoiceId: '', client: '', amount: '', method: 'UPI', reference: '', date: new Date().toISOString().split('T')[0], status: 'Completed', remarks: '' });
      }
    } catch (err) {
      addToast('Failed to log payment', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
            <PageHeader title="Payment Gateway" subtitle="Track incoming payments and reconciliation">
        <button 
          onClick={handleSyncTally}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          <Database size={14} className="text-teal-500 dark:text-teal-500" /> Sync to Tally
        </button>
        <button 
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <PlusCircle size={14} /> Log Offline Payment
        </button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Settled Transactions', value: totalReceived, type: 'currency', icon: DollarSign, color: 'text-indigo-500' },
          { label: 'Partial Receipts', value: totalPartial, type: 'currency', icon: Clock, color: 'text-amber-500' },
          { label: 'Total Logs Audited', value: totalTransactions, type: 'count', icon: Receipt, color: 'text-blue-500' },
          { label: 'Refund Claims Dispatched', value: refundCount, type: 'count', icon: AlertTriangle, color: 'text-red-500' }
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
            placeholder="Search by ID, invoice number, client, or reference..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="All">All Payment Methods</option>
            <option value="Razorpay">Razorpay Gateway</option>
            <option value="UPI">UPI Transfer</option>
            <option value="NEFT">Bank NEFT/RTGS</option>
            <option value="Cheque">Cheque Deposit</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payments List */}
        <div className={`col-span-12 ${selectedPayment ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client & Invoice</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Gateway / Method</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Settlement Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredPayments.map(p => (
                    <tr 
                      key={p.id}
                      onClick={() => setSelectedPayment(p)}
                      className={`cursor-pointer transition-colors ${
                        selectedPayment && selectedPayment.id === p.id 
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/10' 
                          : 'hover:bg-slate-50/45 dark:hover:bg-slate-800/10'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{p.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{p.client}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.invoiceId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-semibold">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(p.date)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          p.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200/50' :
                          p.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200/50' :
                          'bg-amber-50 text-amber-700 border-amber-200/50'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Transaction Details"
                          >
                            <Eye size={14} />
                          </button>
                          {p.status === 'Completed' && (
                            <button 
                              onClick={() => handleRefund(p)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Process Refund"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => addToast(`Receipt PDF printed for ${p.id}`, 'success')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Print Receipt"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        No transactions found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Detail Sidebar Panel */}
        {selectedPayment && (
          <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between animate-[slideLeft_150ms_ease]">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Receipt #{selectedPayment.id}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Settled: {formatDate(selectedPayment.date)}</p>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="p-1 text-slate-455 hover:text-slate-800 dark:hover:text-white rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {/* Transaction details */}
              <div className="py-4 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed Customer</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">{selectedPayment.client}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Reference</span>
                    <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{selectedPayment.invoiceId}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settled Amount</span>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gateway Reference</span>
                    <p className="font-mono text-[10px] text-slate-600 dark:text-slate-350 select-all">{selectedPayment.reference}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Method</span>
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-300">{selectedPayment.method}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remarks / Notes</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{selectedPayment.remarks || 'No remarks provided.'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gateway Status</span>
                  <div className="pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border ${
                      selectedPayment.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200/50' :
                      selectedPayment.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200/50' :
                      'bg-amber-50 text-amber-700 border-amber-200/50'
                    }`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="space-y-2 pt-4 border-t border-slate-150 dark:border-slate-800">
              {selectedPayment.status === 'Completed' && (
                <button
                  onClick={() => handleRefund(selectedPayment)}
                  className="w-full flex items-center justify-center gap-1.5 bg-red-650 hover:bg-red-750 text-white rounded-xl py-2.5 text-xs font-bold shadow-sm shadow-red-550/10 cursor-pointer"
                >
                  <RefreshCw size={14} /> Process Full Refund
                </button>
              )}
              <button
                onClick={() => printDocument('payment', selectedPayment)}
                className="w-full flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                <Download size={14} /> Download Receipt PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Payment Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Receipt className="text-indigo-500" /> Log Offline Payment
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogPayment} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment ID</label>
                  <input 
                    type="text" 
                    value={newPayment.id}
                    onChange={e => setNewPayment(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="Auto-generated" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice ID *</label>
                  <input 
                    type="text" 
                    required
                    value={newPayment.invoiceId}
                    onChange={e => setNewPayment(prev => ({ ...prev, invoiceId: e.target.value }))}
                    placeholder="e.g. INV-2024-040" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed Client *</label>
                  <input 
                    type="text" 
                    required
                    value={newPayment.client}
                    onChange={e => setNewPayment(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="e.g. SwiftPay Fintech" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Received *</label>
                  <input 
                    type="number" 
                    required
                    value={newPayment.amount || ''}
                    onChange={e => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 649000" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Date</label>
                  <input 
                    type="date" 
                    required
                    value={newPayment.date}
                    onChange={e => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</label>
                  <select 
                    value={newPayment.method}
                    onChange={e => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="Razorpay">Razorpay Gateway</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="NEFT">Bank NEFT/RTGS</option>
                    <option value="Cheque">Cheque Deposit</option>
                    <option value="Cash">Cash Settlement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Status</label>
                  <select 
                    value={newPayment.status}
                    onChange={e => setNewPayment(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reference / Transaction ID</label>
                  <input 
                    type="text" 
                    value={newPayment.reference}
                    onChange={e => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="e.g. UPI/928374928" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remarks / Notes</label>
                  <textarea 
                    value={newPayment.remarks}
                    onChange={e => setNewPayment(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Add payment notes here..." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none h-16 resize-none"
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
