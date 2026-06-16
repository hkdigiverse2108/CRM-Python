import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';

export default function MainDashboard() {
  const { addToast, leads = [], clients = [], projects = [] } = useApp();
  const [activeTab, setActiveTab] = useState('Sales');
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  const totalRevenue = projects.reduce((acc, p) => acc + (p.amount || 0), 0);
  const activeLeads = leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').length;
  const closedWon = leads.filter(l => l.stage === 'Won').length;
  const conversionRate = leads.length > 0 ? ((closedWon / leads.length) * 100).toFixed(1) : '0.0';
  const whatsappVolume = leads.filter(l => l.source === 'WhatsApp' || l.source === 'whatsapp').length;

  const handleExport = () => {
    addToast('Report exported successfully as PDF/CSV');
  };

  const handleTimeRangeToggle = () => {
    const next = timeRange === 'Last 30 Days' ? 'Last 90 Days' : 'Last 30 Days';
    setTimeRange(next);
    addToast(`Time range switched to ${next}`);
  };

  // Lead sources calculations
  const sourceCounts = leads.reduce((acc, l) => {
    const src = l.source || 'Other';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const totalLeads = leads.length;
  const metaAdsCount = sourceCounts['Meta Ads'] || sourceCounts['Website'] || 0;
  const googleCount = sourceCounts['Google Ads'] || sourceCounts['Google'] || 0;
  const whatsappCount = sourceCounts['WhatsApp'] || 0;
  const otherCount = Object.keys(sourceCounts).reduce((acc, k) => {
    if (k !== 'Meta Ads' && k !== 'Website' && k !== 'Google Ads' && k !== 'Google' && k !== 'WhatsApp') {
      return acc + sourceCounts[k];
    }
    return acc;
  }, 0);

  const metaPct = totalLeads > 0 ? Math.round((metaAdsCount / totalLeads) * 100) : 0;
  const googlePct = totalLeads > 0 ? Math.round((googleCount / totalLeads) * 100) : 0;
  const waPct = totalLeads > 0 ? Math.round((whatsappCount / totalLeads) * 100) : 0;
  const otherPct = totalLeads > 0 ? Math.max(0, 100 - metaPct - googlePct - waPct) : 0;

  // Funnel calculations
  const visitorsCount = totalLeads > 0 ? totalLeads * 3 : 0;
  const capturedCount = totalLeads;
  const qualifiedCount = leads.filter(l => ['Qualified', 'Negotiation', 'Won'].includes(l.stage)).length;
  const wonCount = closedWon;

  return (
    <div className="text-on-surface bg-background">
      {/* Hero Section */}
      <section className="mb-8 space-y-6">
        <PageHeader title="Executive Command Center" subtitle="Organization performance pulse dashboard">
          <button 
            onClick={handleTimeRangeToggle}
            className="px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold"
            style={{ background: 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)', color: '#ffffff' }}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            {timeRange}
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-primary rounded-lg flex items-center gap-2 text-xs font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            style={{ color: '#ffffff' }}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </PageHeader>
        
        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">payments</span>
              </div>
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded text-label-sm font-bold">+0%</span>
            </div>
            <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Total Revenue</p>
            <p className="text-headline-md font-bold text-on-surface">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-secondary/10 p-3 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">group_add</span>
              </div>
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded text-label-sm font-bold">+0%</span>
            </div>
            <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Active Leads</p>
            <p className="text-headline-md font-bold text-on-surface">{activeLeads.toLocaleString()}</p>
          </div>

          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-tertiary/15 p-3 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">trending_up</span>
              </div>
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded text-label-sm font-bold">+0%</span>
            </div>
            <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Conversion Rate</p>
            <p className="text-headline-md font-bold text-on-surface">{conversionRate}%</p>
          </div>

          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">chat</span>
              </div>
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded text-label-sm font-bold">+0%</span>
            </div>
            <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">WhatsApp Volume</p>
            <p className="text-headline-md font-bold text-on-surface">{whatsappVolume.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Analytics Grid (Bento Style) */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Revenue Growth (Wide) */}
        <div className="col-span-12 lg:col-span-8 glass-card p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-headline-sm font-headline-sm text-on-surface">Revenue Growth</h4>
              <p className="text-body-sm text-on-surface-variant">Projected vs. Actual monthly earnings</p>
            </div>
            <select className="bg-surface-variant/20 dark:bg-slate-800 border-none rounded-lg text-label-md py-1.5 px-3 focus:ring-primary/10">
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </div>
          {totalRevenue === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
              No revenue records found. Set up projects or payments to track monthly growth.
            </div>
          ) : (
            <div className="h-64 flex items-end gap-2 px-2 relative">
              <div className="flex-1 bg-primary/20 hover:bg-primary transition-colors h-[20%] rounded-t-lg relative group cursor-pointer">
                <span className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] font-bold text-on-surface-variant">Oct</span>
              </div>
              <div className="flex-1 bg-primary/30 hover:bg-primary transition-colors h-[40%] rounded-t-lg relative group cursor-pointer">
                <span className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] font-bold text-on-surface-variant">Nov</span>
              </div>
              <div className="flex-1 bg-primary h-[100%] rounded-t-lg relative group shadow-lg shadow-primary/20 cursor-pointer">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-primary-container dark:text-white px-2 py-1 rounded text-label-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <span className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] font-bold text-on-surface-variant">Dec</span>
              </div>
            </div>
          )}
        </div>

        {/* Lead Sources (Circle) */}
        <div className="col-span-12 lg:col-span-4 glass-card p-6 rounded-xl flex flex-col justify-between">
          <h4 className="text-headline-sm font-headline-sm text-on-surface">Lead Sources</h4>
          <div className="flex-1 flex flex-col justify-center items-center mt-4">
            <div className="relative w-40 h-40 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                <circle cx="96" cy="96" fill="none" r="80" stroke="var(--border)" strokeWidth="12"></circle>
                {totalLeads > 0 && (
                  <>
                    <circle cx="96" cy="96" fill="none" r="80" stroke="#0052cc" strokeDasharray="502.6" strokeDashoffset={502.6 - (502.6 * metaPct) / 100} strokeWidth="12" strokeLinecap="round"></circle>
                    <circle cx="96" cy="96" fill="none" r="80" stroke="#805AD5" strokeDasharray="502.6" strokeDashoffset={502.6 - (502.6 * (metaPct + googlePct)) / 100} strokeWidth="12" strokeLinecap="round"></circle>
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-headline-md font-bold">{totalLeads}</span>
                <span className="text-label-sm text-on-surface-variant">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0052cc]"></span>
                <span className="text-label-md">Meta Ads ({metaPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#805AD5]"></span>
                <span className="text-label-md">Google ({googlePct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                <span className="text-label-md">WhatsApp ({waPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-label-md">Other ({otherPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & WhatsApp Engagement */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Conversion Funnel (Asymmetric) */}
        <div className="col-span-12 lg:col-span-5 glass-card p-6 rounded-xl">
          <h4 className="text-headline-sm font-headline-sm text-on-surface mb-6">Conversion Funnel</h4>
          <div className="space-y-4">
            <div className="relative">
              <div className="flex justify-between mb-1 text-label-md font-semibold">
                <span>Visitors</span>
                <span className="font-bold">{visitorsCount}</span>
              </div>
              <div className="h-8 w-full bg-primary/10 rounded-lg overflow-hidden">
                <div className="h-full bg-primary w-full opacity-30"></div>
              </div>
            </div>
            <div className="relative">
              <div className="flex justify-between mb-1 text-label-md font-semibold">
                <span>Leads Captured</span>
                <span className="font-bold">{capturedCount}</span>
              </div>
              <div className="h-8 w-full bg-primary/20 rounded-lg overflow-hidden" style={{ width: totalLeads > 0 ? '80%' : '0%' }}>
                <div className="h-full bg-primary w-full opacity-50"></div>
              </div>
            </div>
            <div className="relative">
              <div className="flex justify-between mb-1 text-label-md font-semibold">
                <span>Qualified</span>
                <span className="font-bold">{qualifiedCount}</span>
              </div>
              <div className="h-8 w-full bg-primary/40 rounded-lg overflow-hidden" style={{ width: totalLeads > 0 ? '60%' : '0%' }}>
                <div className="h-full bg-primary w-full opacity-70"></div>
              </div>
            </div>
            <div className="relative">
              <div className="flex justify-between mb-1 text-label-md font-semibold">
                <span>Closed Won</span>
                <span className="font-bold">{wonCount}</span>
              </div>
              <div className="h-8 w-full bg-primary rounded-lg shadow-inner" style={{ width: totalLeads > 0 ? '40%' : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Real-time Engagement */}
        <div className="col-span-12 lg:col-span-7 glass-card p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              <h4 className="text-headline-sm font-headline-sm text-on-surface">WhatsApp Engagement</h4>
            </div>
            <span className="flex items-center gap-1.5 text-emerald-600 text-label-sm font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Chart Area */}
            <div className="md:col-span-7 space-y-4">
              <p className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider">Sent vs. Received</p>
              <div className="flex items-end justify-between h-36 pt-2 pb-1 border-b border-outline-variant/50">
                {/* Mon */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-28">
                    <div className="w-1.5 bg-emerald-500/30 rounded-t-sm h-[35%] transition-all duration-300 hover:opacity-80" title="Sent: 28"></div>
                    <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[55%] transition-all duration-300 hover:opacity-85" title="Received: 45"></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">M</span>
                </div>
                {/* Tue */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-28">
                    <div className="w-1.5 bg-emerald-500/30 rounded-t-sm h-[50%] transition-all duration-300 hover:opacity-80" title="Sent: 40"></div>
                    <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[75%] transition-all duration-300 hover:opacity-85" title="Received: 62"></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">T</span>
                </div>
                {/* Wed */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-28">
                    <div className="w-1.5 bg-emerald-500/30 rounded-t-sm h-[40%] transition-all duration-300 hover:opacity-80" title="Sent: 32"></div>
                    <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[68%] transition-all duration-300 hover:opacity-85" title="Received: 55"></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">W</span>
                </div>
                {/* Thu */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-28">
                    <div className="w-1.5 bg-emerald-500/30 rounded-t-sm h-[65%] transition-all duration-300 hover:opacity-80" title="Sent: 52"></div>
                    <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[88%] transition-all duration-300 hover:opacity-85" title="Received: 78"></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">T</span>
                </div>
                {/* Fri */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-28">
                    <div className="w-1.5 bg-emerald-500/30 rounded-t-sm h-[55%] transition-all duration-300 hover:opacity-80" title="Sent: 44"></div>
                    <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[70%] transition-all duration-300 hover:opacity-85" title="Received: 58"></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">F</span>
                </div>
                {/* Sat */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-28">
                    <div className="w-1.5 bg-emerald-500/30 rounded-t-sm h-[25%] transition-all duration-300 hover:opacity-80" title="Sent: 20"></div>
                    <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[42%] transition-all duration-300 hover:opacity-85" title="Received: 35"></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">S</span>
                </div>
                {/* Sun */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-28">
                    <div className="w-1.5 bg-emerald-500/30 rounded-t-sm h-[30%] transition-all duration-300 hover:opacity-80" title="Sent: 25"></div>
                    <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[48%] transition-all duration-300 hover:opacity-85" title="Received: 39"></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">S</span>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 
                  <span>Received</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></span> 
                  <span>Sent</span>
                </div>
              </div>
            </div>
            {/* Metric Card */}
            <div className="md:col-span-5 flex flex-col justify-center items-center bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] rounded-2xl p-5 border border-emerald-500/10 text-center h-full">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                <span className="material-symbols-outlined text-[20px] font-bold">timer</span>
              </div>
              <p className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Avg. Response Time</p>
              <p className="text-display-sm font-bold text-emerald-500 my-0.5">1.8m</p>
              <p className="text-label-sm text-slate-400 font-semibold">98% within SLA threshold</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity and Leaderboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-6 glass-card rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
              <h4 className="text-headline-sm font-headline-sm">Recent Activity</h4>
            </div>
            <div className="divide-y divide-outline-variant/50">
              <div className="p-8 text-center text-xs text-slate-400">
                No recent activity recorded.
              </div>
            </div>
          </div>
        </div>

        {/* Team Leaderboard */}
        <div className="col-span-12 lg:col-span-6 glass-card rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
              <h4 className="text-headline-sm font-headline-sm">Team Leaderboard</h4>
              <div className="flex bg-muted dark:bg-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
                <button 
                  onClick={() => { setActiveTab('Sales'); }} 
                  className={`px-3 py-1 rounded ${activeTab === 'Sales' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-on-surface-variant'}`}
                >
                  Sales
                </button>
              </div>
            </div>
            <div className="p-5">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-label-md text-on-surface-variant border-b border-outline-variant/60">
                    <th className="pb-3 font-semibold uppercase tracking-wider">Representative</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider text-center">Conv. Rate</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider text-center">Avg. Speed</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-slate-400">
                      No representative statistics available.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
