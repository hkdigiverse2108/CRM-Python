import { Outlet } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function AppLayout() {
  const { sidebarCollapsed, toasts, removeToast } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className="transition-all duration-305 ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? '68px' : 'var(--sidebar-width, 260px)' }}
      >
        <Header />
        <main className="p-[var(--layout-padding,1.25rem)] transition-all duration-305">
          <Outlet />
        </main>
      </div>


      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-lg shadow-lg text-sm animate-[slideUp_200ms_ease]"
            style={{ minWidth: '280px' }}
          >
            {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-red-500 shrink-0" />}
            {toast.type === 'info' && <Info size={16} className="text-blue-500 shrink-0" />}
            <span className="flex-1 text-slate-700 dark:text-slate-200">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
