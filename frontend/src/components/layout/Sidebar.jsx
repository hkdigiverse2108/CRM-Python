import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, Target, MessageSquare, ShoppingCart, FileText,
  Users, ClipboardList, Settings, Briefcase, Building2, Shield, KeyRound, ToggleRight,
  ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, Megaphone, LifeBuoy
} from 'lucide-react';

// ─── Super Admin sidebar (only org management) ─────────────────────
const superAdminSidebarGroups = [
  {
    title: 'Platform Control',
    icon: Shield,
    items: [
      { label: 'Super Admin Dashboard', path: '/admin/super-admin', icon: LayoutDashboard },
      { label: 'Organizations', path: '/admin/super-admin?tab=organizations', icon: Building2 },
      { label: 'User Management', path: '/admin/super-admin?tab=users', icon: Users },
      { label: 'Audit Logs', path: '/admin/super-admin?tab=logs', icon: KeyRound },
    ]
  },
];

// ─── Regular CRM sidebar ───────────────────────────────────────────
const sidebarGroups = [
  {
    title: 'Dashboards',
    icon: LayoutDashboard,
    module: 'dashboard',
    items: [
      { label: 'Main KPI', path: '/', module: 'dashboard', pageKey: 'crm_dashboard' },
      { label: 'Sales', path: '/dashboard/sales', module: 'dashboard', pageKey: 'crm_dashboard' },
      { label: 'Team', path: '/dashboard/team', module: 'dashboard', pageKey: 'crm_dashboard' },
      { label: 'Analytics', path: '/dashboard/analytics', module: 'dashboard', pageKey: 'crm_dashboard' },
    ]
  },
  {
    title: 'CRM & Sales',
    icon: Target,
    module: 'crm',
    items: [
      { label: 'Leads', path: '/crm/leads', module: 'crm', pageKey: 'crm_leads' },
      { label: 'Contacts', path: '/crm/contacts', module: 'crm', pageKey: 'crm_contacts' },
      { label: 'Clients', path: '/crm/clients', module: 'crm', pageKey: 'crm_companies' },
      { label: 'Pipeline', path: '/crm/pipeline', module: 'crm', pageKey: 'sales_pipeline' },
    ]
  },
  {
    title: 'Projects',
    icon: Briefcase,
    module: 'projects',
    items: [
      { label: 'Dashboard', path: '/projects/dashboard', module: 'projects', pageKey: 'projects_dashboard' },
      { label: 'All Projects', path: '/projects/all', module: 'projects', pageKey: 'projects_all' },
      { label: 'Pipeline Board', path: '/projects/pipeline', module: 'projects', pageKey: 'projects_pipeline' },
      { label: 'Gantt Chart', path: '/projects/gantt', module: 'projects', pageKey: 'projects_gantt' },
      { label: 'Reports', path: '/projects/reports', module: 'projects', pageKey: 'projects_reports' },
    ]
  },
  {
    title: 'Omnichannel Hub',
    icon: MessageSquare,
    module: 'whatsapp',
    items: [
      {
        label: 'WhatsApp',
        path: '/omnichannel/whatsapp',
        module: 'whatsapp',
        pageKey: 'whatsapp_inbox',
        subItems: [
          { label: 'Inbox', path: '/omnichannel/whatsapp' },
          { label: 'Automation Dashboard', path: '/omnichannel/whatsapp/automation' }
        ]
      },
      { label: 'Call Dialer', path: '/omnichannel/calls', module: 'whatsapp', pageKey: 'whatsapp_calls' },
      { label: 'Email Inbox', path: '/omnichannel/email', module: 'whatsapp', pageKey: 'email_inbox' },
      { label: 'SMS Inbox', path: '/omnichannel/sms', module: 'whatsapp', pageKey: 'sms_inbox' },
    ]
  },
  {
    title: 'E-Commerce',
    icon: ShoppingCart,
    module: 'ecommerce',
    items: [
      { label: 'Orders', path: '/ecommerce/orders', module: 'ecommerce', pageKey: 'ecommerce_orders' },
      { label: 'Customers', path: '/ecommerce/customers', module: 'ecommerce', pageKey: 'ecommerce_track' },
      { label: 'Products', path: '/ecommerce/products', module: 'ecommerce', pageKey: 'ecommerce_products' },
      { label: 'Inventory', path: '/ecommerce/inventory', module: 'ecommerce', pageKey: 'ecommerce_inventory' },
      { label: 'Abandoned Carts', path: '/ecommerce/abandoned', module: 'ecommerce', pageKey: 'ecommerce_abandoned' },
    ]
  },
  {
    title: 'Marketing Suite',
    icon: Megaphone,
    module: 'marketing',
    items: [
      { label: 'Campaigns', path: '/marketing/campaigns', module: 'marketing', pageKey: 'marketing_campaigns' },
      { label: 'Templates', path: '/marketing/templates', module: 'marketing', pageKey: 'marketing_campaigns' },
    ]
  },
  {
    title: 'Automation',
    icon: Bot,
    module: 'whatsapp',
    items: [
      { label: 'Bot Builder', path: '/omnichannel/bot-builder', module: 'whatsapp', pageKey: 'whatsapp_inbox' },
      { label: 'Workflows', path: '/marketing/automations', module: 'automation', pageKey: 'automation_workflows' },
    ]
  },
  {
    title: 'Support Center',
    icon: LifeBuoy,
    module: 'support',
    items: [
      { label: 'Tickets', path: '/support/tickets', module: 'support', pageKey: 'support_tickets' },
    ]
  },
  {
    title: 'Finance & Billing',
    icon: FileText,
    module: 'finance',
    items: [
      { label: 'Billing Dashboard', path: '/finance/billing', module: 'finance', pageKey: 'finance_dashboard' },
      { label: 'Invoices', path: '/finance/invoices', module: 'finance', pageKey: 'finance_invoices' },
      { label: 'Quotes', path: '/finance/quotes', module: 'finance', pageKey: 'sales_quotations' },
      { label: 'Payments', path: '/finance/payments', module: 'finance', pageKey: 'finance_payments' },
      { label: 'Ledger', path: '/finance/ledger', module: 'finance', pageKey: 'finance_ledger' },
      { label: 'Expenses', path: '/finance/expenses', module: 'finance', pageKey: 'finance_expenses' },
      { label: 'GST Reports', path: '/finance/gst', module: 'finance', pageKey: 'finance_gst' },
    ]
  },
  {
    title: 'HRMS & Payroll',
    icon: Users,
    module: 'hrms',
    items: [
      { label: 'HRMS Dashboard', path: '/hrms/dashboard', module: 'hrms', pageKey: 'hrms_dashboard' },
      { label: 'Directory', path: '/hrms/directory', module: 'hrms', pageKey: 'hrms_directory' },
      { label: 'Attendance', path: '/hrms/attendance', module: 'hrms', pageKey: 'hrms_attendance' },
      { label: 'Leaves', path: '/hrms/leaves', module: 'hrms', pageKey: 'hrms_leaves' },
      {
        label: 'Payroll',
        path: '/hrms/payroll',
        module: 'hrms',
        pageKey: 'hrms_payroll',
        subItems: [
          { label: 'Payroll Processing', path: '/hrms/payroll' },
          { label: 'Payslips', path: '/hrms/payroll/payslips' },
          { label: 'Bonuses & Deductions', path: '/hrms/payroll/bonuses-deductions' }
        ]
      },
      { label: 'Documents', path: '/hrms/documents', module: 'hrms', pageKey: 'hrms_documents' },
    ]
  },
  {
    title: 'Tasks & Calendar',
    icon: ClipboardList,
    module: 'projects',
    items: [
      { label: 'Task Board', path: '/tasks', module: 'projects', pageKey: 'projects_taskboard' },
      { label: 'Reminders', path: '/tasks/reminders', module: 'projects', pageKey: 'projects_reminders' },
    ]
  },
  {
    title: 'Admin Console',
    icon: Settings,
    module: 'settings',
    items: [
      { label: 'AI Assistant Hub', path: '/admin/ai', icon: 'smart_toy', module: 'settings' },
      { label: 'White Label Settings', path: '/admin/whitelabel', module: 'settings' },
      {
        label: 'Integrations Hub',
        path: '/admin/integrations',
        module: 'settings',
        subItems: [
          { label: 'All Integrations', path: '/admin/integrations' },
          { label: 'WhatsApp Integration', path: '/admin/integrations/whatsapp' },
          { label: 'Shopify Integration', path: '/admin/integrations/shopify' },
          { label: 'Meta Platforms', path: '/admin/integrations/meta' }
        ]
      },
      { label: 'API Management', path: '/admin/api', module: 'settings' },
      { label: 'User Management', path: '/admin/users', module: 'users' },
      { label: 'Audit Logs', path: '/admin/audit-logs', module: 'audit_logs' },
      { label: 'Appearance & Theme', path: '/admin/appearance', module: 'settings' }
    ]
  }
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user, workspaceSettings, employees = [] } = useApp();
  const location = useLocation();

  const isSuperAdmin = user?.role === 'super_admin';

  // Track expanded groups (Dashboards & CRM open by default)
  const [expandedGroups, setExpandedGroups] = useState({
    'Dashboards': true,
    'CRM & Sales': true,
    'Projects': true,
    'Omnichannel Hub': true,
    'E-Commerce': false,
    'Finance & Billing': false,
    'HRMS & Payroll': false,
    'Tasks & Calendar': false,
    'Support Center': false,
    'Marketing Suite': false,
    'Automation': false,
    'Admin Console': false,
    'Platform Control': true,
  });

  const [expandedSubItems, setExpandedSubItems] = useState({
    '/omnichannel/whatsapp': true,
  });

  const toggleGroup = (groupTitle) => {
    setExpandedGroups(prev => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
  };

  const toggleSubItem = (path) => {
    setExpandedSubItems(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const hasPermission = (moduleKey, path) => {
    if (!user) return true; // Default to true if not loaded
    if (!user.permissions) return true; // Default to true for legacy/admin
    
    // Check if path is disabled at the workspace/SaaS level
    if (path && user.disabled_links && user.disabled_links.includes(path)) {
      return false;
    }
    
    const perm = user.permissions[moduleKey];
    if (!perm || (!perm.canView && !perm.view)) return false;
    
    // Org Admin and Super Admin bypass granular role checks if the module is enabled
    if (user.role === 'admin' || user.role_name === 'Organization Admin' || user.role_name === 'Super Admin' || user.role_name === 'Admin') return true;
    
    return perm ? (!!perm.canView || !!perm.view) : false;
  };

  const hasPagePermission = (pageKey, path) => {
    if (!user) return true;
    if (path && user.disabled_links && user.disabled_links.includes(path)) {
      return false;
    }
    // Admin roles bypass granular page-level checks (module-level already enforced by hasPermission)
    if (user.role === 'super_admin' || user.role === 'admin' || user.role_name === 'Organization Admin' || user.role_name === 'Super Admin' || user.role_name === 'Admin') return true;

    let allowedPages = [];
    try {
      allowedPages = user.pages_permissions ? JSON.parse(user.pages_permissions) : [];
    } catch (e) {
      allowedPages = [];
    }
    return allowedPages.includes(pageKey);
  };

  // Super Admin sees only the Super Admin sidebar
  // Regular users see the CRM sidebar filtered by permissions
  const allowedGroups = isSuperAdmin
    ? superAdminSidebarGroups
    : sidebarGroups.map(group => {
        const allowedItems = group.items.map(item => {
          if (item.label === 'Payroll' && item.subItems) {
            const loggedInEmp = employees?.find(e => e.email === user?.email);
            const isAdminUser = user?.role === 'super_admin' || user?.role_name === 'Super Admin' || 
                                user?.role === 'admin' || user?.role_name === 'Admin' || 
                                user?.role_name === 'Workspace Admin' || user?.role_name === 'Organization Admin' || 
                                user?.role?.includes('admin') || user?.role_name?.toLowerCase()?.includes('admin') ||
                                user?.role_name === 'HR Manager';

            const isManagerUser = !isAdminUser && loggedInEmp && employees?.some(e => e.reportingManager && 
              (e.reportingManager === loggedInEmp.id ||
               e.reportingManager === loggedInEmp.employee_id ||
               e.reportingManager.toLowerCase().trim() === loggedInEmp.name?.toLowerCase().trim() ||
               e.reportingManager.toLowerCase().trim() === user?.full_name?.toLowerCase()?.trim()));

            const hasProcessingAccess = isAdminUser || isManagerUser;
            const filteredSubItems = item.subItems.filter(sub => {
              if (sub.label === 'Payroll Processing' || sub.label === 'Bonuses & Deductions') {
                return hasProcessingAccess;
              }
              return true;
            });
            return { ...item, subItems: filteredSubItems };
          }
          return item;
        }).filter(item => {
          const mOk = !item.module || hasPermission(item.module, item.path);
          const pOk = !item.pageKey || hasPagePermission(item.pageKey, item.path);
          return mOk && pOk;
        });
        return { ...group, items: allowedItems };
      }).filter(group => group.items.length > 0 && (!group.module || hasPermission(group.module)));

  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-[var(--sidebar)] border-r border-[var(--border)] z-40 flex flex-col transition-all duration-300 ease-in-out select-none"
      style={{ width: sidebarCollapsed ? '68px' : 'var(--sidebar-width, 260px)' }}
    >
      <div className="flex items-center h-[57px] px-4 border-b border-[var(--border)] shrink-0 bg-[var(--sidebar)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          {workspaceSettings?.logo_url ? (
            <img 
              src={workspaceSettings.logo_url.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${workspaceSettings.logo_url}` : workspaceSettings.logo_url} 
              alt="Logo" 
              className="w-8 h-8 rounded-xl object-contain shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/10">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-black dark:text-slate-100 tracking-tight whitespace-nowrap truncate">
              {workspaceSettings?.company_name || 'AIO CRM Platform'}
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="ml-auto btn-ghost p-1.5 shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-2.5 custom-scrollbar">
        {allowedGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups[group.title];
          const hasActiveChild = group.items.some(item => {
            const itemPath = item.path.split('?')[0];
            const itemSearch = item.path.split('?')[1] || '';
            const isParamMatch = !itemSearch || location.search.includes(itemSearch);
            const isDashboardDefault = item.path === '/admin/super-admin' && (location.search === '' || location.search === '?tab=dashboard');
            return (location.pathname === itemPath && (isParamMatch || isDashboardDefault)) || (itemPath !== '/' && location.pathname.startsWith(itemPath) && (isParamMatch || isDashboardDefault));
          });

          return (
            <div key={group.title} className="space-y-1">
              {/* Group Header Button */}
              {sidebarCollapsed ? (
                <button
                  onClick={toggleSidebar}
                  className={`sidebar-item justify-center px-0 w-full ${hasActiveChild ? 'bg-sidebar-hover text-primary' : 'text-sidebar-foreground/70'}`}
                  title={group.title}
                >
                  <GroupIcon size={18} />
                </button>
              ) : (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                    hasActiveChild 
                      ? 'text-primary' 
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-hover hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <GroupIcon size={14} className="shrink-0" />
                  <span className="flex-1 truncate">{group.title}</span>
                  {isExpanded ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
                </button>
              )}

              {/* Group Nested Items */}
              {!sidebarCollapsed && isExpanded && (
                <div className="pl-4 border-l border-[var(--border)]/60 space-y-0.5 ml-3">
                  {group.items.map((item) => {
                    const hasSubItems = !!item.subItems;
                    const isSubExpanded = !!expandedSubItems[item.path];
                    const isChildActive = hasSubItems && item.subItems.some(sub => location.pathname === sub.path);
                    const itemPath = item.path.split('?')[0];
                    const itemSearch = item.path.split('?')[1] || '';
                    const isParamMatch = !itemSearch || location.search.includes(itemSearch);
                    const isDashboardDefault = item.path === '/admin/super-admin' && (location.search === '' || location.search === '?tab=dashboard');
                    const isActive = ((location.pathname === itemPath) && (isParamMatch || isDashboardDefault)) || isChildActive;

                    if (hasSubItems) {
                      return (
                        <div key={item.path} className="space-y-0.5">
                          <button
                            onClick={() => toggleSubItem(item.path)}
                            className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                              isActive && !isSubExpanded
                                ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
                                : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-slate-950 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {item.icon && (
                                typeof item.icon === 'string' ? (
                                  <span className="material-symbols-outlined text-[16px] shrink-0">
                                    {item.icon}
                                  </span>
                                ) : (
                                  <item.icon size={16} className="shrink-0" />
                                )
                              )}
                              <span>{item.label}</span>
                            </div>
                            {isSubExpanded ? (
                              <ChevronDown size={12} className="shrink-0 text-slate-450" />
                            ) : (
                              <ChevronRight size={12} className="shrink-0 text-slate-450" />
                            )}
                          </button>
                          {isSubExpanded && (
                            <div className="pl-4 border-l border-[var(--border)]/40 space-y-0.5 ml-2 mt-0.5">
                              {item.subItems.map((sub) => {
                                const isSubActive = location.pathname === sub.path;
                                return (
                                  <NavLink
                                    key={sub.path}
                                    to={sub.path}
                                    end={sub.path === '/omnichannel/whatsapp' || sub.path === '/hrms/payroll'}
                                    className={`flex items-center gap-2 py-1 px-2.5 rounded-lg text-[11px] font-medium transition-all ${
                                      isSubActive
                                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
                                        : 'text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-slate-950 dark:hover:text-white'
                                    }`}
                                  >
                                    <span>{sub.label}</span>
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                          isActive 
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10' 
                            : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {item.icon && (
                          typeof item.icon === 'string' ? (
                            <span className="material-symbols-outlined text-[16px] shrink-0">
                              {item.icon}
                            </span>
                          ) : (
                            <item.icon size={16} className="shrink-0" />
                          )
                        )}
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

const navSections = sidebarGroups.map(g => ({
  title: g.title,
  items: g.items.map(i => ({
    label: i.label,
    path: i.path,
    icon: g.icon
  }))
}));

// eslint-disable-next-line react-refresh/only-export-components
export { navSections };
