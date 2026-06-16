import { dashboardStats } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Target, DollarSign, Award } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function SalesDashboard() {
  const { salesByRep, monthlyRevenue } = dashboardStats;
  const totalTarget = salesByRep.reduce((a, b) => a + b.target, 0);
  const totalAchieved = salesByRep.reduce((a, b) => a + b.revenue, 0);
  const overallPct = Math.round((totalAchieved / totalTarget) * 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Dashboard" subtitle="Track team performance and revenue targets" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(totalAchieved)}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Total Target</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(totalTarget)}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Achievement</p>
          <p className="text-2xl font-semibold mt-1">{overallPct}%</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Avg. Deal Size</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(dashboardStats.avgDealSize)}</p>
        </div>
      </div>

      {/* Sales by Rep */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Sales by Representative</h2>
        <div className="space-y-4">
          {salesByRep.map((rep) => {
            const pct = Math.round((rep.revenue / rep.target) * 100);
            return (
              <div key={rep.name} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-emerald-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {rep.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{rep.name}</span>
                    <span className="text-sm text-[var(--color-muted-foreground)]">
                      {formatCurrency(rep.revenue)} / {formatCurrency(rep.target)}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-muted)] rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-[var(--color-primary)]' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[var(--color-muted-foreground)]">{rep.deals} deals closed</span>
                    <span className="text-xs font-medium" style={{ color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }}>{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Monthly Revenue Trend</h2>
        <div className="flex items-end gap-4 h-44">
          {monthlyRevenue.map((m, i) => {
            const maxVal = Math.max(...monthlyRevenue.map(r => r.value));
            const heightPct = (m.value / maxVal) * 100;
            const prevVal = i > 0 ? monthlyRevenue[i - 1].value : m.value;
            const growth = ((m.value - prevVal) / prevVal * 100).toFixed(1);
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-[var(--color-muted-foreground)]">{formatCurrency(m.value)}</span>
                {i > 0 && (
                  <span className={`text-[9px] font-medium ${Number(growth) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {Number(growth) >= 0 ? '+' : ''}{growth}%
                  </span>
                )}
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-300"
                  style={{ height: `${heightPct}%`, minHeight: '16px' }}
                />
                <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
