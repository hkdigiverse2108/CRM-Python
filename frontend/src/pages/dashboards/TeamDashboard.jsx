import { dashboardStats } from '@/data/mockData';
import { Trophy, CheckCircle, Clock, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function TeamDashboard() {
  const { teamMembers } = dashboardStats;
  const totalTasks = teamMembers.reduce((a, b) => a + b.tasks, 0);
  const totalCompleted = teamMembers.reduce((a, b) => a + b.completed, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Team Dashboard" subtitle="Team performance and task completion overview" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Users size={20} /></div>
          <div><p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">Team Size</p><p className="text-2xl font-semibold">{teamMembers.length}</p></div>
        </div>
        <div className="kpi-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle size={20} /></div>
          <div><p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">Tasks Completed</p><p className="text-2xl font-semibold">{totalCompleted}/{totalTasks}</p></div>
        </div>
        <div className="kpi-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><Trophy size={20} /></div>
          <div><p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">Completion Rate</p><p className="text-2xl font-semibold">{Math.round((totalCompleted / totalTasks) * 100)}%</p></div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Team Leaderboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.sort((a, b) => (b.completed / b.tasks) - (a.completed / a.tasks)).map((member, i) => {
            const pct = Math.round((member.completed / member.tasks) * 100);
            return (
              <div key={member.name} className="border border-[var(--color-border)] rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                      {member.avatar}
                    </div>
                    {i === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Trophy size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-[var(--color-muted-foreground)]">Tasks</span>
                  <span className="font-medium">{member.completed}/{member.tasks}</span>
                </div>
                <div className="w-full bg-[var(--color-muted)] rounded-full h-2">
                  <div className="h-2 rounded-full bg-[var(--color-primary)] transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1.5 text-right">{pct}% complete</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
