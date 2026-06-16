import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { invoices as mockInvoices } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { printDocument } from '@/lib/pdfGenerator';
import { 
  FileText, Search, Plus, Eye, Send, CheckCircle, AlertCircle, X,
  Clock, DollarSign, Download, Trash2, Database
} from 'lucide-react';

export default function Invoices() {
  const { invoices, createInvoice, updateInvoice, deleteInvoiceApi, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSyncTally = () => {
    addToast('Parsing invoices as Sales Vouchers (XML) for Tally Prime...', 'info');
    setTimeout(() => {
      addToast(`${invoices.length} sales vouchers synced to Tally company "RapidModel Corp" successfully!`, 'success');
    }, 1200);
  };
  
  // New invoice form state
  const [newInvoice, setNewInvoice] = useState({
    client: '',
    email: '',
    items: [{ desc: '', qty: 1, rate: 0 }],
    status: 'Pending',
    discount: 0,
    tax: 0,
    paymentMethod: 'UPI',
    notes: '',
    dueDateDays: 30
  });

  // Calculate statistics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.total, 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarkPaid = async (id) => {
    try {
      const updated = await updateInvoice(id, { status: 'Paid' });
      if (updated) {
        addToast(`Invoice ${id} marked as Paid`, 'success');
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice(updated);
        }
      }
    } catch (err) {
      addToast('Failed to mark invoice as paid', 'error');
    }
  };

  const handleSendReminder = (inv) => {
    addToast(`WhatsApp reminder dispatched to ${inv.client} for ${formatCurrency(inv.total)}`, 'success');
  };

  const handleDeleteInvoice = async (id) => {
    if (confirm(`Are you sure you want to delete invoice ${id}?`)) {
      try {
        await deleteInvoiceApi(id);
        addToast(`Invoice ${id} deleted.`, 'info');
        setSelectedInvoice(null);
      } catch (err) {
        addToast('Failed to delete invoice', 'error');
      }
    }
  };

  const handleAddItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { desc: '', qty: 1, rate: 0 }]
    }));
  };

  const handleRemoveItem = (idx) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx, field, value) => {
    setNewInvoice(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoice.client || newInvoice.items.some(i => !i.desc || i.rate <= 0)) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    const subtotal = newInvoice.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const discount = parseFloat(newInvoice.discount) || 0;
    const customTax = parseFloat(newInvoice.tax) || 0;
    const cgst = customTax ? (customTax / 2) : (subtotal * 0.09);
    const sgst = customTax ? (customTax / 2) : (subtotal * 0.09);
    const total = subtotal + (cgst + sgst) - discount;

    const payload = {
      client: newInvoice.client,
      email: newInvoice.email || 'billing@client.com',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + parseInt(newInvoice.dueDateDays, 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: newInvoice.status,
      items: newInvoice.items.map(item => ({
        desc: item.desc,
        hsn: '998314',
        qty: parseInt(item.qty, 10),
        rate: parseFloat(item.rate),
        amount: item.qty * item.rate
      })),
      subtotal,
      cgst,
      sgst,
      tax: cgst + sgst,
      discount,
      total,
      paymentMethod: newInvoice.paymentMethod,
      notes: newInvoice.notes || ''
    };

    try {
      const created = await createInvoice(payload);
      if (created) {
        addToast(`Invoice ${created.id} created successfully!`, 'success');
        setShowCreateModal(false);
        setNewInvoice({ client: '', email: '', items: [{ desc: '', qty: 1, rate: 0 }], status: 'Pending', discount: 0, tax: 0, paymentMethod: 'UPI', notes: '', dueDateDays: 30 });
      }
    } catch (err) {
      addToast('Failed to create invoice', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
            <PageHeader title="Invoice Management" subtitle="Create, track, and manage all invoices">
        <button 
          onClick={handleSyncTally}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          <Database size={14} className="text-teal-500 dark:text-teal-500" /> Sync to Tally
        </button>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={16} /> New Invoice
        </button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: totalInvoiced, icon: DollarSign, color: 'text-indigo-500' },
          { label: 'Collected Revenue', value: totalPaid, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Pending Collections', value: totalPending, icon: Clock, color: 'text-amber-500' },
          { label: 'Overdue Outstanding', value: totalOverdue, icon: AlertCircle, color: 'text-red-500' }
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <h4 className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">{formatCurrency(stat.value)}</h4>
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
            placeholder="Search by client name or invoice ID..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {['All', 'Paid', 'Pending', 'Overdue'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invoice List */}
        <div className={`col-span-12 ${selectedInvoice ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredInvoices.map(inv => (
                    <tr 
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`cursor-pointer transition-colors ${
                        selectedInvoice && selectedInvoice.id === inv.id 
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/10' 
                          : 'hover:bg-slate-50/45 dark:hover:bg-slate-800/10'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{inv.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{inv.client}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{inv.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(inv.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          inv.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200/50' :
                          inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200/50' :
                          'bg-amber-50 text-amber-700 border-amber-200/50'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Invoice Details"
                          >
                            <Eye size={14} />
                          </button>
                          {inv.status !== 'Paid' && (
                            <button 
                              onClick={() => handleMarkPaid(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Mark as Paid"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleSendReminder(inv)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Send WhatsApp Reminder"
                          >
                            <Send size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        No invoices found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invoice Detail Sidebar Panel */}
        {selectedInvoice && (
          <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between animate-[slideLeft_150ms_ease]">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{selectedInvoice.id} Details</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Created on {formatDate(selectedInvoice.date)}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-1 text-slate-450 hover:text-slate-800 dark:hover:text-white rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {/* Client Info */}
              <div className="py-4 space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Account</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50">
                  <p className="font-bold text-slate-900 dark:text-white text-xs">{selectedInvoice.client}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedInvoice.email}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Items</h4>
                <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.desc}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">QTY: {item.qty} x {formatCurrency(item.rate)}</p>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary pricing */}
              <div className="py-4 border-t border-b border-slate-150 dark:border-slate-800 space-y-2.5 text-xs mt-4">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between font-semibold text-green-650">
                    <span className="text-green-550">Discount</span>
                    <span>-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">CGST (9%)</span>
                  <span>{formatCurrency(selectedInvoice.cgst)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">SGST (9%)</span>
                  <span>{formatCurrency(selectedInvoice.sgst)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-semibold">Payment Method</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.paymentMethod || 'UPI'}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-slate-800 dark:text-slate-100">Grand Total</span>
                  <span className="text-indigo-655 dark:text-indigo-400">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>
              {selectedInvoice.notes && (
                <div className="py-2 text-xs text-slate-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Invoice Remarks</span>
                  <p className="italic font-medium">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
              {selectedInvoice.status !== 'Paid' ? (
                <button
                  onClick={() => handleMarkPaid(selectedInvoice.id)}
                  className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2 text-xs font-bold shadow-sm shadow-green-500/10 cursor-pointer"
                >
                  <CheckCircle size={14} /> Mark Paid
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl py-2 text-xs font-bold"
                >
                  <CheckCircle size={14} /> Fully Paid
                </button>
              )}
              <button
                onClick={() => printDocument('invoice', selectedInvoice)}
                className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="text-indigo-500" /> Generate Professional Invoice
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newInvoice.client}
                    onChange={e => setNewInvoice(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="e.g. Acme Labs Inc." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Email</label>
                  <input 
                    type="email"
                    value={newInvoice.email}
                    onChange={e => setNewInvoice(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. billing@acme.com" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discount (₹)</label>
                  <input 
                    type="number"
                    value={newInvoice.discount}
                    onChange={e => setNewInvoice(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g. 500" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tax (₹)</label>
                  <input 
                    type="number"
                    value={newInvoice.tax}
                    onChange={e => setNewInvoice(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                    placeholder="Leave 0 for auto 18% GST" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</label>
                  <select 
                    value={newInvoice.paymentMethod}
                    onChange={e => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="NetBanking">NetBanking</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Period</label>
                  <select 
                    value={newInvoice.dueDateDays}
                    onChange={e => setNewInvoice(prev => ({ ...prev, dueDateDays: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="15">15 Days</option>
                    <option value="30">30 Days</option>
                    <option value="45">45 Days</option>
                    <option value="60">60 Days</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment Status</label>
                  <select 
                    value={newInvoice.status}
                    onChange={e => setNewInvoice(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items *</label>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {newInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center text-xs font-semibold">
                      <input 
                        type="text" 
                        required
                        value={item.desc}
                        onChange={e => handleItemChange(idx, 'desc', e.target.value)}
                        placeholder="Description" 
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2 text-xs focus:outline-none font-semibold text-slate-905 dark:text-white"
                      />
                      <input 
                        type="number" 
                        required
                        value={item.qty}
                        onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                        placeholder="QTY" 
                        className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2 text-xs focus:outline-none text-slate-905 dark:text-white"
                      />
                      <input 
                        type="number" 
                        required
                        value={item.rate}
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                        placeholder="Rate" 
                        className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2 text-xs focus:outline-none text-slate-905 dark:text-white"
                      />
                      {newInvoice.items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notes</label>
                <textarea 
                  value={newInvoice.notes}
                  onChange={e => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or internal remarks..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 text-xs focus:outline-none text-slate-905 dark:text-white font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
                >
                  Generate & Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
