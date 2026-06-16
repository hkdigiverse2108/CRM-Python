import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';

export default function AnalyticsDashboard() {
  const { addToast, projects = [] } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Transactions are calculated dynamically from projects
  const transactions = projects.map(p => ({
    client: p.name || 'Client project',
    plan: p.category || 'Service contract',
    date: p.date || 'N/A',
    status: p.status === 'Completed' ? 'Success' : 'Pending',
    amount: p.amount || 0,
    initials: (p.name || 'C').slice(0, 2).toUpperCase(),
    color: 'bg-primary/10 text-primary'
  }));

  const filtered = transactions.filter(t => 
    t.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.plan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = projects.reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleExport = () => {
    addToast('PDF report generated and download started.');
  };

  const handleMoreActions = (client) => {
    addToast(`Options opened for ${client}`);
  };

  return (
    <div className="text-on-background space-y-6">
      <PageHeader title="Revenue Overview" subtitle="Real-time performance tracking for Enterprise Sales">
        <button 
          onClick={() => addToast('Time range selection opened')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)', color: '#ffffff' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
          Last 30 Days
        </button>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
          style={{ color: '#ffffff' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
          Export PDF
        </button>
      </PageHeader>

      {/* Glassmorphic Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]">account_balance_wallet</span>
          </div>
          <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Total Revenue</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-headline-lg font-bold text-on-surface">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <span className="text-emerald-600 text-label-md font-bold flex items-center">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              +0%
            </span>
          </div>
          <div className="mt-4 w-full bg-outline-variant h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[0%]"></div>
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">0% of quarterly goal reached</p>
        </div>

        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]">show_chart</span>
          </div>
          <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Net Profit</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-headline-lg font-bold text-on-surface">₹0</h3>
            <span className="text-emerald-600 text-label-md font-bold flex items-center">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              +0%
            </span>
          </div>
          <div className="mt-4 w-full bg-outline-variant h-1 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-[0%]"></div>
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">Margin stable MoM</p>
        </div>

        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]">person_off</span>
          </div>
          <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Churn Rate</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-headline-lg font-bold text-on-surface">0.0%</h3>
            <span className="text-emerald-600 text-label-md font-bold flex items-center">
              <span className="material-symbols-outlined text-[16px]">trending_down</span>
              -0%
            </span>
          </div>
          <div className="mt-4 w-full bg-outline-variant h-1 rounded-full overflow-hidden">
            <div className="bg-error h-full w-[0%]"></div>
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">Below critical threshold of 2.5%</p>
        </div>
      </div>

      {/* Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Growth Chart (MRR & ARR) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-headline-sm font-headline-sm text-on-surface">Growth Dynamics</h4>
              <p className="text-label-md text-on-surface-variant">Monthly vs Annual Recurring Revenue</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-label-md text-on-surface-variant font-semibold">MRR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="text-label-md text-on-surface-variant font-semibold">ARR</span>
              </div>
            </div>
          </div>
          <div className="chart-container h-48 flex items-center justify-center text-slate-400 text-xs">
            No recurring revenue data yet. Set up subscription billing plans to view MRR / ARR trends.
          </div>
        </div>

        {/* Revenue Breakdown by Channel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-headline-sm font-headline-sm text-on-surface mb-6">Channel Attribution</h4>
            <div className="space-y-6">
              <div className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-label-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>
                    WhatsApp CRM
                  </span>
                  <span className="text-label-md font-bold text-on-surface">0%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full">
                  <div className="bg-primary h-full w-[0%] rounded-full"></div>
                </div>
              </div>
              <div className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-label-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">handshake</span>
                    Direct Sales
                  </span>
                  <span className="text-label-md font-bold text-on-surface">0%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full">
                  <div className="bg-[#805ad5] h-full w-[0%] rounded-full"></div>
                </div>
              </div>
              <div className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-label-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">rocket_launch</span>
                    Marketing Ads
                  </span>
                  <span className="text-label-md font-bold text-on-surface">0%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full">
                  <div className="bg-tertiary h-full w-[0%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <section className="bg-white dark:bg-slate-900 border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h4 className="text-headline-sm font-headline-sm text-on-surface">Recent Enterprise Transactions</h4>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field text-xs pl-9 py-1.5 w-full sm:w-48 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <button 
              onClick={() => { setSearchQuery(''); addToast('Filters cleared'); }}
              className="text-primary text-label-md font-bold hover:underline shrink-0"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/40">
              <tr>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase font-bold">Client</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase font-bold">Date</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase font-bold">Status</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase font-bold text-right">Amount</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filtered.length > 0 ? (
                filtered.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-label-md ${t.color}`}>
                          {t.initials}
                        </div>
                        <div>
                          <p className="text-body-sm font-bold text-on-surface">{t.client}</p>
                          <p className="text-label-sm text-on-surface-variant">{t.plan}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface">{t.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${
                        t.status === 'Success' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                        t.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm font-bold text-on-surface text-right">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleMoreActions(t.client)}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-xs text-on-surface-variant">No transactions found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-outline-variant/60 flex justify-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { if (page > 1) { setPage(page - 1); addToast('Page changed'); } }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30" 
              disabled={page === 1}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-label-md font-bold text-on-surface-variant">Page {page} of {Math.max(1, Math.ceil(filtered.length / 10))}</span>
            <button 
              onClick={() => { if (page < Math.ceil(filtered.length / 10)) { setPage(page + 1); addToast('Page changed'); } }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
              disabled={page >= Math.ceil(filtered.length / 10)}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
