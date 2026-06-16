import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';

export default function BillingDashboard() {
  const { addToast } = useApp();
  const [isGstIncl, setIsGstIncl] = useState(true);
  const [invoices, setInvoices] = useState([]);

  const handleToggleGst = () => {
    setIsGstIncl(!isGstIncl);
    addToast(`Price views changed to GST ${!isGstIncl ? 'Included' : 'Excluded'}`);
  };

  const handleCreateInvoice = () => {
    addToast('New invoice generation wizard opened');
  };

  const handleAction = (invoiceId) => {
    addToast(`Actions menu opened for ${invoiceId}`);
  };

  return (
    <div className="text-on-surface space-y-6">
      <PageHeader title="Billing Dashboard" subtitle="Financial overview, invoices, and payment tracking">
        <div className="flex items-center bg-slate-900/50 border border-slate-700/50 p-1 rounded-lg">
          <span className={`text-label-sm px-3 ${!isGstIncl ? 'font-bold text-indigo-400' : 'text-slate-400'}`}>GST Excl.</span>
          <button 
            onClick={handleToggleGst}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isGstIncl ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGstIncl ? 'translate-x-6' : 'translate-x-1'}`}></span>
          </button>
          <span className={`text-label-sm px-3 ${isGstIncl ? 'font-bold text-indigo-400' : 'text-slate-400'}`}>GST Incl.</span>
        </div>
        <button 
          onClick={handleCreateInvoice}
          className="bg-indigo-600 text-white text-label-md font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-indigo-500/20 shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Create Invoice
        </button>
      </PageHeader>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Total Receivables</span>
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">₹0</div>
          <div className="mt-2 flex items-center gap-1 text-label-sm text-slate-400 font-bold">
            <span>No receivables currently pending</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Overdue Invoices</span>
            <span className="material-symbols-outlined text-red-500">priority_high</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">₹0</div>
          <div className="mt-2 flex items-center gap-1 text-label-sm text-slate-400 font-bold">
            <span>0 invoices require action</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Monthly Recurring (MRR)</span>
            <span className="material-symbols-outlined text-secondary">repeat</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">₹0</div>
          <div className="mt-2 flex items-center gap-1 text-label-sm text-slate-450 font-bold">
            <span>0.0% collection rate</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Pending Payments</span>
            <span className="material-symbols-outlined text-tertiary">pending_actions</span>
          </div>
          <div className="text-headline-md font-bold text-on-surface">₹0</div>
          <div className="mt-2 flex items-center gap-1 text-label-sm text-on-surface-variant font-bold">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>Average cycle: 0 days</span>
          </div>
        </div>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Table & Analytics (Left 9 cols) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* Main Invoice Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-headline-sm font-bold text-on-surface">Recent Invoices</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-on-surface-variant" onClick={() => addToast('Filter invoices triggered')}>
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-on-surface-variant" onClick={() => addToast('Invoices downloaded')}>
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/20 border-b border-outline-variant/60">
                  <tr>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Invoice #</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Customer</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Date</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Amount</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Status</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Method</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {invoices.length > 0 ? (
                    invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">{inv.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${inv.color}`}>
                              {inv.initials}
                            </div>
                            <span className="text-body-sm font-semibold">{inv.customer}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-on-surface-variant">{inv.date}</td>
                        <td className="px-6 py-4 font-bold">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-bold ${
                            inv.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                            inv.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === 'Paid' ? 'bg-green-700 dark:bg-green-400' :
                              inv.status === 'Overdue' ? 'bg-red-700 dark:bg-red-400' :
                              'bg-slate-700 dark:bg-slate-400'
                            }`}></span>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-body-sm">{inv.method}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleAction(inv.id)} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_horiz</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-xs text-slate-400 font-semibold">
                        <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 block mb-2 font-normal">receipt_long</span>
                        No invoices generated yet. Click Create Invoice to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-outline-variant bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <span className="text-label-sm text-on-surface-variant font-semibold">
                Showing {invoices.length > 0 ? '1-' + invoices.length : '0'} of {invoices.length} results
              </span>
              <div className="flex items-center gap-2">
                <button className="p-1 border border-outline-variant rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="p-1 border border-outline-variant rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subscription & Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-headline-sm font-bold mb-4">Upcoming Renewals</h3>
                <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                  <span className="material-symbols-outlined text-3xl">subscriptions</span>
                  No upcoming renewals found.
                </div>
              </div>
              <button 
                onClick={() => addToast('Redirecting to subscription renewals list')}
                className="w-full mt-4 text-label-md font-bold text-primary py-2 hover:bg-primary/5 rounded-lg transition-colors"
              >
                View All Renewals
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-headline-sm font-bold mb-4">Churn Rate Analytics</h3>
                <div className="h-24 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                  <span className="material-symbols-outlined text-3xl">show_chart</span>
                  No churn analytics data available.
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">arrow_downward</span>
                <p className="text-label-sm text-slate-500 font-semibold">
                  Churn rate stable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets (Right 3 cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Quick Billing Widget */}
          <div className="bg-primary text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-headline-sm font-bold mb-4 relative z-10">Quick Billing</h3>
            <div className="space-y-4 relative z-10 text-xs font-bold">
              <button onClick={() => addToast('Quote sheet generated')} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 py-3 rounded-lg flex items-center justify-between px-4 transition-all">
                <span>Generate Quote</span>
                <span className="material-symbols-outlined">request_quote</span>
              </button>
              <button onClick={() => addToast('Reconciling accounts...')} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 py-3 rounded-lg flex items-center justify-between px-4 transition-all">
                <span>Bulk Reconcile</span>
                <span className="material-symbols-outlined">account_tree</span>
              </button>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-label-sm opacity-80 mb-2 font-bold uppercase tracking-wider">Billing Health Score</p>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="w-[100%] h-full bg-white rounded-full"></div>
              </div>
              <p className="text-display-lg font-black mt-2">100%</p>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-outline-variant shadow-sm">
            <h3 className="text-headline-sm font-bold mb-4">Expense Categories</h3>
            <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <span className="material-symbols-outlined text-3xl">pie_chart</span>
              No expense categories configured.
            </div>
            <button onClick={() => addToast('Add category drawer opened')} className="w-full mt-6 py-2 border border-outline-variant rounded-lg text-label-md font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              Add Category
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
            </button>
          </div>

          {/* Tax Compliance */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <span className="material-symbols-outlined">gavel</span>
              <h3 className="font-bold text-label-md uppercase tracking-wider">Tax Compliance</h3>
            </div>
            <p className="text-body-sm mb-4 leading-normal">
              No pending quarterly filing due.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => addToast('GSTR-1 prefilled successfully')} className="text-label-md font-bold bg-white dark:bg-slate-900 text-on-surface py-2 rounded-lg border border-outline-variant shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Pre-fill GSTR-1
              </button>
              <button onClick={() => addToast('Form-16A PDF downloaded')} className="text-label-md font-bold text-primary py-2 hover:underline">
                Download Form-16A
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
