import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Customer360() {
  const { addToast } = useApp();
  const [score, setScore] = useState(84);

  const handleAction = (action) => {
    addToast(`Action triggered: ${action}`);
  };

  return (
    <div className="text-on-surface bg-background">
      {/* Main Content Canvas: 3-Pane Layout styled for a unified view */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Side: Profile & Details */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
              <img 
                alt="Alex Rivera"
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxwzLfCInSJ5gQENs6aezwVo4s14CAQKzfXUOcY_1Ozx_aLg6sOhEef3snh87KCL7JacSrq3S-KMwGdDevHeXaBYex2ePRxO3kh1UHGp8s8hLTHUBpp-ZvSQqZNg80lK06fbY02VgIZvWQAYTIjvjG1tw1-utAd4B6TvXrH-qhWwi3ZP_CPiIbWQrImXirnADXQz9HuUAFYfe4TWRAdrOB2CB2z4yM3HNJAuiXCuGcYKljb7k___rCAij8SBvXeSXd_2LILLr5fUA"
              />
            </div>
            <h2 className="text-headline-md font-bold text-on-surface">Alex Rivera</h2>
            <p className="text-body-sm text-on-surface-variant">Head of Operations, NexaPulse</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-3 py-1 rounded-full text-label-sm font-bold">VIP Customer</span>
              <span className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 px-3 py-1 rounded-full text-label-sm font-bold">Hot Lead</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-6 shadow-sm">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase mb-4 tracking-wider">Contact Details</h4>
            <div className="space-y-4 text-body-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">mail</span>
                <span className="text-on-surface font-semibold">a.rivera@nexapulse.io</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">phone</span>
                <span className="text-on-surface font-semibold">+1 (555) 234-5678</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <span className="text-on-surface font-semibold">San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">public</span>
                <span className="text-primary font-bold hover:underline cursor-pointer">nexapulse.io</span>
              </div>
            </div>
          </div>

          {/* Lead Score */}
          <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-6 shadow-sm text-center">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase mb-2 tracking-wider">Lead Score</h4>
            <div className="text-[32px] font-black text-primary">
              {score}
              <span className="text-headline-sm text-on-surface-variant font-normal">/100</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }}></div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Actions & Timeline */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-6 shadow-sm">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase mb-4 tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => handleAction('Create Task')}
                className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-outline-variant p-4 rounded-xl hover:bg-primary/5 hover:border-primary/30 dark:hover:bg-slate-700/50 transition-all group font-semibold text-body-sm text-on-surface"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">task_alt</span>
                <span>Create Task</span>
              </button>
              <button 
                onClick={() => handleAction('Create Invoice')}
                className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-outline-variant p-4 rounded-xl hover:bg-primary/5 hover:border-primary/30 dark:hover:bg-slate-700/50 transition-all group font-semibold text-body-sm text-on-surface"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">receipt_long</span>
                <span>Create Invoice</span>
              </button>
              <button 
                onClick={() => handleAction('Send Quote')}
                className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-outline-variant p-4 rounded-xl hover:bg-primary/5 hover:border-primary/30 dark:hover:bg-slate-700/50 transition-all group font-semibold text-body-sm text-on-surface"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">request_quote</span>
                <span>Send Quote</span>
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-xl p-6 shadow-sm">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase mb-6 tracking-wider">Activity Timeline</h4>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant/60">
              
              <div className="relative pl-8">
                <div className="absolute left-0 top-0.5 w-[24px] h-[24px] bg-primary text-white rounded-full flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-outline-variant/30">
                  <p className="text-body-sm font-bold text-on-surface">WhatsApp Inquiry Received</p>
                  <p className="text-body-xs text-on-surface-variant mt-1">"How soon can we finalize the subscription for the Enterprise tier?"</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">Today, 10:42 AM</p>
                </div>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-0 top-0.5 w-[24px] h-[24px] bg-secondary text-white rounded-full flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-outline-variant/30">
                  <p className="text-body-sm font-bold text-on-surface">Quote Email Opened</p>
                  <p className="text-body-xs text-on-surface-variant mt-1">Pricing details v2 was opened by the recipient.</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">Yesterday, 4:15 PM</p>
                </div>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-0 top-0.5 w-[24px] h-[24px] bg-tertiary text-white rounded-full flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-outline-variant/30">
                  <p className="text-body-sm font-bold text-on-surface">Demo Call Completed</p>
                  <p className="text-body-xs text-on-surface-variant mt-1">Discussed custom API integration parameters with lead developer.</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">Aug 12, 11:30 AM</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
