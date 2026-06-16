import PageHeader from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  History, Search, ShieldAlert, User, ShieldCheck, Clock
} from 'lucide-react';

export default function AuditLogs() {
  const { auditLogs = [], fetchAuditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Filters list
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = (log.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.recordId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = ['All', ...new Set(auditLogs.map(l => l.action))];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
      <PageHeader title="Audit Logs" subtitle="Security tracking of employee actions, record updates, and permission changes" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by user email, details, or ID..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
          >
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action === 'All' ? 'All Actions' : action}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Module</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
              {filteredLogs.map(log => {
                const isSecurityAction = log.action.includes('DELETE') || log.action.includes('ROLE') || log.action.includes('PERMISSION');
                return (
                  <tr key={log.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-450 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-bold">{log.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                        isSecurityAction ? 'bg-red-50 text-red-700 border-red-200/50' : 'bg-blue-50 text-blue-700 border-blue-200/50'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-550 border font-bold text-[10px] uppercase">
                        {log.module || 'System'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-655 dark:text-slate-350" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-slate-450 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
