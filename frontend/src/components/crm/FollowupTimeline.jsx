import React from 'react';
import { Calendar, Phone, MessageCircle, Mail, Users, AlertCircle } from 'lucide-react';

const getIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'call':
      return <Phone size={12} className="text-blue-500" />;
    case 'whatsapp':
      return <MessageCircle size={12} className="text-emerald-500" />;
    case 'email':
      return <Mail size={12} className="text-purple-500" />;
    case 'f2f meeting':
    case 'meeting':
      return <Users size={12} className="text-amber-500" />;
    default:
      return <AlertCircle size={12} className="text-slate-500" />;
  }
};

export default function FollowupTimeline({ followups, loading }) {
  if (loading) {
    return <div className="text-xs text-slate-400 italic py-4">Loading timeline logs...</div>;
  }

  if (!followups || followups.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No follow-up history logged yet.
      </div>
    );
  }

  // Reverse timeline to show newest first
  const sorted = [...followups].reverse();

  return (
    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-5 space-y-4 py-2">
      {sorted.map((item, index) => {
        const isLatest = index === 0;
        return (
          <div key={item.id || index} className="relative">
            {/* Timeline Dot */}
            <span className={`absolute -left-[27px] top-1.5 flex items-center justify-center w-5 h-5 rounded-full border bg-white dark:bg-slate-900 ${
              isLatest 
                ? 'border-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-950/40 shadow-sm' 
                : 'border-slate-200 dark:border-slate-800'
            }`}>
              {getIcon(item.followup_type)}
            </span>

            {/* Content card */}
            <div className={`p-3 rounded-xl border transition-all duration-200 ${
              isLatest 
                ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-200/60 dark:border-indigo-900/40 shadow-xs' 
                : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {item.followup_type} {isLatest && <span className="ml-1 text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">Latest</span>}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">{item.followup_date}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                {item.remarks}
              </p>
              
              {item.next_followup_date && (
                <div className="mt-2 text-[9px] text-amber-600 dark:text-amber-400 font-bold border-t border-dashed border-slate-200/60 dark:border-slate-800/60 pt-1.5 flex items-center gap-1">
                  <Calendar size={10} />
                  <span>Next: {item.next_followup_date} {item.next_followup_remarks && `(${item.next_followup_remarks})`}</span>
                </div>
              )}
              <div className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 text-right">
                Logged by: {item.created_by || 'Agent'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
