import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { quotes as mockQuotes } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { printDocument } from '@/lib/pdfGenerator';
import { 
  FileText, Search, Plus, Eye, CheckCircle, XCircle, X,
  Clock, DollarSign, Download, Play, Trash2, Calendar, Database
} from 'lucide-react';

export default function Quotes() {
  const { quotes, createQuote, updateQuote, deleteQuote, createInvoice, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSyncTally = () => {
    addToast('Parsing quotation proposals as Sales Vouchers (XML) for Tally Prime...', 'info');
    setTimeout(() => {
      addToast(`${quotes.length} proposal entries synced to Tally company "RapidModel Corp" successfully!`, 'success');
    }, 1200);
  };

  // New quote form state
  const [newQuote, setNewQuote] = useState({
    client: '',
    total: 0,
    validDays: 30,
    productName: '',
    quantity: 1,
    price: 0,
    discount: 0,
    tax: 0,
    notes: '',
    status: 'Sent'
  });

  // Calculate statistics
  const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
  const acceptedValue = quotes.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + q.total, 0);
  const sentCount = quotes.filter(q => q.status === 'Sent').length;
  const acceptedRatio = Math.round((quotes.filter(q => q.status === 'Accepted').length / quotes.length) * 100) || 0;

  // Filter quotes
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updated = await updateQuote(id, { status: newStatus });
      if (updated) {
        addToast(`Quote ${id} updated to ${newStatus}`, newStatus === 'Accepted' ? 'success' : 'info');
        if (selectedQuote && selectedQuote.id === id) {
          setSelectedQuote(updated);
        }
      }
    } catch (err) {
      addToast('Failed to update quote status', 'error');
    }
  };

  const handleConvertToInvoice = async (quote) => {
    try {
      // Create invoice from quote
      const invoicePayload = {
        client: quote.client,
        email: 'billing@client.com',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Pending',
        items: [{
          desc: quote.productName,
          hsn: '998314',
          qty: quote.quantity,
          rate: quote.price,
          amount: quote.quantity * quote.price
        }],
        subtotal: quote.quantity * quote.price,
        cgst: quote.tax / 2,
        sgst: quote.tax / 2,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        paymentMethod: 'UPI',
        notes: quote.notes || ''
      };

      const createdInvoice = await createInvoice(invoicePayload);
      if (createdInvoice) {
        await handleUpdateStatus(quote.id, 'Accepted');
        addToast(`Quote ${quote.id} successfully converted to Invoice!`, 'success');
      }
    } catch (err) {
      addToast('Failed to convert quote to invoice', 'error');
    }
  };

  const handleDeleteQuote = async (id) => {
    if (confirm(`Are you sure you want to delete quote ${id}?`)) {
      try {
        await deleteQuote(id);
        addToast(`Quote ${id} deleted.`, 'info');
        setSelectedQuote(null);
      } catch (err) {
        addToast('Failed to delete quote', 'error');
      }
    }
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!newQuote.client) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    const price = parseFloat(newQuote.price) || 0;
    const qty = parseInt(newQuote.quantity, 10) || 1;
    const discount = parseFloat(newQuote.discount) || 0;
    const tax = parseFloat(newQuote.tax) || 0;
    const calculatedTotal = (price * qty) - discount + tax;

    const payload = {
      client: newQuote.client,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + parseInt(newQuote.validDays, 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: newQuote.status || 'Sent',
      productName: newQuote.productName || 'General Proposal',
      quantity: qty,
      price: price,
      discount: discount,
      tax: tax,
      total: calculatedTotal || parseFloat(newQuote.total) || 0,
      notes: newQuote.notes || ''
    };

    try {
      const created = await createQuote(payload);
      if (created) {
        addToast(`Quote proposal ${created.id} sent to ${newQuote.client}!`, 'success');
        setShowCreateModal(false);
        setNewQuote({ client: '', total: 0, validDays: 30, productName: '', quantity: 1, price: 0, discount: 0, tax: 0, notes: '', status: 'Sent' });
      }
    } catch (err) {
      addToast('Failed to create quote', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
            <PageHeader title="Quotation Engine" subtitle="Generate and manage client proposals & quotes">
        <button 
          onClick={handleSyncTally}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          <Database size={14} className="text-teal-500 dark:text-teal-500" /> Sync to Tally
        </button>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={16} /> New Quotation
        </button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Value Estimated', value: totalValue, type: 'currency', icon: DollarSign, color: 'text-indigo-500' },
          { label: 'Accepted Bookings', value: acceptedValue, type: 'currency', icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Pending Proposals', value: sentCount, type: 'count', icon: Clock, color: 'text-amber-500' },
          { label: 'Proposal Win Ratio', value: `${acceptedRatio}%`, type: 'text', icon: Play, color: 'text-blue-500' }
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
            placeholder="Search quotes by client name or ID..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {['All', 'Draft', 'Sent', 'Accepted', 'Expired', 'Rejected'].map(tab => (
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
        {/* Quote List */}
        <div className={`col-span-12 ${selectedQuote ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quote ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date Sent</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Valid Until</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredQuotes.map(q => (
                    <tr 
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      className={`cursor-pointer transition-colors ${
                        selectedQuote && selectedQuote.id === q.id 
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/10' 
                          : 'hover:bg-slate-50/45 dark:hover:bg-slate-800/10'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{q.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{q.client}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(q.date)}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(q.validUntil)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(q.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          q.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200/50' :
                          q.status === 'Expired' || q.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200/50' :
                          q.status === 'Draft' ? 'bg-slate-100 text-slate-655 border-slate-200' :
                          'bg-amber-50 text-amber-700 border-amber-200/50'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedQuote(q)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Proposal Details"
                          >
                            <Eye size={14} />
                          </button>
                          {q.status === 'Sent' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(q.id, 'Accepted')}
                                className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Accept Quote"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(q.id, 'Rejected')}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Reject Quote"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {q.status === 'Accepted' && (
                            <button 
                              onClick={() => handleConvertToInvoice(q)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Convert to Invoice"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteQuote(q.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredQuotes.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        No quotes found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quote Detail Sidebar Panel */}
        {selectedQuote && (
          <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between animate-[slideLeft_150ms_ease]">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{selectedQuote.id} Details</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Estimated on {formatDate(selectedQuote.date)}</p>
                </div>
                <button onClick={() => setSelectedQuote(null)} className="p-1 text-slate-450 hover:text-slate-800 dark:hover:text-white rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {/* Estimate Details */}
              <div className="py-4 space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prospect Client</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">{selectedQuote.client}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validity Date</span>
                    <p className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar size={13} /> {formatDate(selectedQuote.validUntil)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposal Value</span>
                    <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedQuote.total)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposed Line Item</span>
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] font-bold space-y-1">
                    <div className="flex justify-between text-slate-800 dark:text-white">
                      <span>{selectedQuote.productName || 'General Proposal'}</span>
                      <span>Qty: {selectedQuote.quantity || 1}</span>
                    </div>
                    <div className="flex justify-between text-slate-450 mt-1 font-semibold">
                      <span>Unit Price:</span>
                      <span>₹{(selectedQuote.price || selectedQuote.total).toLocaleString()}</span>
                    </div>
                    {selectedQuote.tax !== undefined && (
                      <div className="flex justify-between text-slate-450 font-semibold">
                        <span>Tax:</span>
                        <span>₹{selectedQuote.tax.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedQuote.discount !== undefined && (
                      <div className="flex justify-between text-slate-450 font-semibold">
                        <span>Discount:</span>
                        <span className="text-green-500">-₹{selectedQuote.discount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Agreement Status</span>
                  <div className="pt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      selectedQuote.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200/50' :
                      selectedQuote.status === 'Expired' || selectedQuote.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200/50' :
                      selectedQuote.status === 'Draft' ? 'bg-slate-100 text-slate-655 border-slate-200' :
                      'bg-amber-50 text-amber-700 border-amber-200/50'
                    }`}>
                      {selectedQuote.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedQuote.notes && (
                <div className="border-t border-slate-150 dark:border-slate-800 pt-4 text-xs text-slate-500 leading-normal">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Proposal Remarks</span>
                  <p className="italic font-medium">{selectedQuote.notes}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
              {selectedQuote.status === 'Sent' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, 'Accepted')}
                    className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2 text-xs font-bold shadow-sm shadow-green-500/10 cursor-pointer"
                  >
                    <CheckCircle size={14} /> Accept Proposal
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, 'Rejected')}
                    className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-350 rounded-xl py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    <XCircle size={14} /> Decline Proposal
                  </button>
                </>
              )}
              {selectedQuote.status === 'Accepted' && (
                <button
                  onClick={() => handleConvertToInvoice(selectedQuote)}
                  className="col-span-2 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <Play size={14} /> Convert Quote to Invoice
                </button>
              )}
              {selectedQuote.status === 'Draft' && (
                <button
                  onClick={() => handleUpdateStatus(selectedQuote.id, 'Sent')}
                  className="col-span-2 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold cursor-pointer"
                >
                  Dispatch Proposal Link
                </button>
              )}
              {(selectedQuote.status === 'Expired' || selectedQuote.status === 'Rejected') && (
                <button
                  onClick={() => {
                    const clonedQuote = { ...selectedQuote, id: `QT-2026-${Math.floor(100 + Math.random() * 900)}`, date: new Date().toISOString().split('T')[0], status: 'Sent' };
                    setQuotes(prev => [clonedQuote, ...prev]);
                    addToast(`Re-drafted quote proposal generated as ${clonedQuote.id}`, 'success');
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold cursor-pointer"
                >
                  Clone & Resend Proposal
                </button>
              )}
              <button
                onClick={() => printDocument('quote', selectedQuote)}
                className="col-span-2 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                <Download size={14} /> Download Proposal PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Quote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="text-indigo-500" /> Create Estimation Proposal
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prospect Client *</label>
                  <input 
                    type="text" 
                    required
                    value={newQuote.client}
                    onChange={e => setNewQuote(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="e.g. Skyline Logistics" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newQuote.productName}
                    onChange={e => setNewQuote(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="e.g. Enterprise SLA Package" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unit Price (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={newQuote.price || ''}
                    onChange={e => setNewQuote(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 150000" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity *</label>
                  <input 
                    type="number" 
                    required
                    value={newQuote.quantity}
                    onChange={e => setNewQuote(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g. 2" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discount (₹)</label>
                  <input 
                    type="number" 
                    value={newQuote.discount}
                    onChange={e => setNewQuote(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="e.g. 10000" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tax (₹)</label>
                  <input 
                    type="number" 
                    value={newQuote.tax}
                    onChange={e => setNewQuote(prev => ({ ...prev, tax: e.target.value }))}
                    placeholder="e.g. 27000" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validity period</label>
                  <select 
                    value={newQuote.validDays}
                    onChange={e => setNewQuote(prev => ({ ...prev, validDays: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="15">15 Days</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                  <select 
                    value={newQuote.status}
                    onChange={e => setNewQuote(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    value={newQuote.notes}
                    onChange={e => setNewQuote(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Provide special clauses, terms or notes..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
                >
                  Send Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
