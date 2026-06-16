import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import CommandPalette from './CommandPalette';
import {
  Search, Bell, Plus, ChevronDown, LogOut,
  Target, FileText, ClipboardList, Check,
  Settings, PanelLeft, Palette, Sun, Moon
} from 'lucide-react';

const quickCreateItems = [
  { label: 'New Lead', icon: Target, path: '/crm/leads' },
  { label: 'New Invoice', icon: FileText, path: '/finance/invoices' },
  { label: 'New Task', icon: ClipboardList, path: '/tasks' },
];



export default function Header() {
  const { 
    user,
    logout,
    sidebarCollapsed,
    toggleSidebar,
    notifications, 
    unreadCount, 
    markAllRead, 
    addToast,
    activeOrg,
    setActiveOrg,
    darkMode,
    toggleDarkMode
  } = useApp();
  
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [waConnected, setWaConnected] = useState(true);

  const notifRef = useRef(null);
  const quickRef = useRef(null);
  const profileRef = useRef(null);
  const orgRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target)) setQuickCreateOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (orgRef.current && !orgRef.current.contains(e.target)) setOrgOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K or Cmd+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="h-[72px] bg-white/95 dark:bg-[#0F172A]/95 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-md select-none transition-colors">
        
        {/* LEFT SECTION: Collapsible Toggle, Logo & High Contrast Title */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft size={20} />
          </button>
          
          {sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <span className="text-white text-sm font-black tracking-tighter">A</span>
              </div>
              <span className="text-sm font-bold text-black dark:text-white tracking-tight whitespace-nowrap hidden sm:block">
                AIO CRM Platform
              </span>
            </div>
          )}
        </div>

        {/* CENTER SECTION: Premium Search Bar */}
        <div className="relative hidden lg:block flex-1 max-w-[380px] min-w-[200px] mx-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-400 pointer-events-none">
            <Search size={20} />
          </span>
          <button
            onClick={() => setCmdOpen(true)}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/30 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 rounded-[16px] py-2.5 pl-11 pr-4 text-xs text-left flex items-center justify-between transition-all duration-200 group hover:shadow-md hover:shadow-indigo-500/5 outline-none"
          >
            <span className="truncate pr-2">Search CRM (contacts, leads, bills...)</span>
            <kbd className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-550 dark:text-slate-400 shadow-sm shrink-0">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* RIGHT SECTION: Compact Pills, Switchers, Utilities and Profile */}
        <div className="flex items-center gap-4">
          
          {/* WhatsApp API Status Pill */}
          <button
            onClick={() => {
              const nextState = !waConnected;
              setWaConnected(nextState);
              addToast(nextState ? 'WhatsApp API connection restored.' : 'WhatsApp API disconnected.', nextState ? 'success' : 'warning');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full select-none text-[10px] font-bold transition-all border shrink-0 outline-none ${
              waConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 dark:hover:bg-emerald-900/40' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/40 dark:hover:bg-slate-700/40'
            }`}
            title="Click to toggle WhatsApp connection status"
          >
            <span className="flex h-1.5 w-1.5 relative">
              {waConnected && (
                <span className="pulse-active absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${waConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className="hidden xs:inline">WA API: {waConnected ? 'Connected' : 'Offline'}</span>
            {!waConnected && <span className="xs:hidden">WA API</span>}
          </button>


          {/* Quick Action Button */}
          <div className="relative" ref={quickRef}>
            <button
              onClick={() => setQuickCreateOpen(!quickCreateOpen)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 shrink-0 outline-none"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Quick Action</span>
              <ChevronDown size={14} className="opacity-80" />
            </button>
            
            {quickCreateOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-[slideUp_150ms_ease]">
                <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-400 dark:text-slate-455 uppercase tracking-widest">
                  Create New
                </div>
                {quickCreateItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(item.path);
                        setQuickCreateOpen(false);
                        addToast(`${item.label} opened`);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-705 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Icon size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* UTILITY ICONS: Apps, Bell notifications, settings */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Notifications with Badge */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 text-slate-550 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 rounded-xl transition-all relative"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[#0F172A] shrink-0"></span>
                )}
              </button>
              
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-[slideUp_150ms_ease]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">System Activity</span>
                    <button
                      onClick={() => { markAllRead(); addToast('Cleared all notifications', 'info'); }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/55 transition-colors ${
                          !n.read ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{n.text}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-550 hover:text-slate-800 hover:bg-slate-105 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 rounded-xl transition-all"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Settings */}
            <button 
              onClick={() => { navigate('/admin/settings'); addToast('Settings console opened'); }}
              className="p-2 text-slate-550 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 rounded-xl transition-all"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block shrink-0"></div>

          {/* USER PROFILE SECTION */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors border border-transparent"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                  </div>
                )}
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-xs font-bold text-slate-700 dark:text-white leading-none">{user?.full_name || 'CRM User'}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-455 mt-0.5 leading-none capitalize">{user?.role || 'user'}</p>
              </div>
              <ChevronDown size={14} className="text-slate-500 dark:text-slate-400 shrink-0 hidden sm:block" />
            </button>
            
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl py-1 z-50 animate-[slideUp_150ms_ease]">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{user?.full_name || 'CRM User'}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{user?.email || ''}</p>
                </div>
                <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => { navigate('/admin/appearance'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-705 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-semibold"
                  >
                    <Palette size={14} className="text-slate-500 shrink-0" />
                    <span>Appearance & Theme</span>
                  </button>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => { 
                      setProfileOpen(false); 
                      logout(); 
                      navigate('/login'); 
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left font-bold"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
