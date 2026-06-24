import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import AppLayout from '@/components/layout/AppLayout';

// Dashboards
import MainDashboard from '@/pages/dashboards/MainDashboard';
import SalesDashboard from '@/pages/dashboards/SalesDashboard';
import TeamDashboard from '@/pages/dashboards/TeamDashboard';
import AnalyticsDashboard from '@/pages/dashboards/AnalyticsDashboard';

// CRM
import Leads from '@/pages/crm/Leads';
import Contacts from '@/pages/crm/Contacts';
import Clients from '@/pages/crm/Clients';
import Pipeline from '@/pages/crm/Pipeline';
import Customer360 from '@/pages/crm/Customer360';
import Chat from '@/pages/crm/Chat';

// Omnichannel
import WhatsApp from '@/pages/omnichannel/WhatsApp';
import WhatsAppAutomationDashboard from '@/pages/omnichannel/WhatsAppAutomationDashboard';
import WhatsAppContacts from '@/pages/omnichannel/WhatsAppContacts';
import CallDialer from '@/pages/omnichannel/CallDialer';
import Email from '@/pages/omnichannel/Email';
import SMS from '@/pages/omnichannel/SMS';

// E-commerce
import Orders from '@/pages/ecommerce/Orders';
import OrderTracking from '@/pages/ecommerce/OrderTracking';
import Products from '@/pages/ecommerce/Products';
import Inventory from '@/pages/ecommerce/Inventory';
import AbandonedCarts from '@/pages/ecommerce/AbandonedCarts';

// Finance
import BillingDashboard from '@/pages/finance/BillingDashboard';
import Invoices from '@/pages/finance/Invoices';
import Quotes from '@/pages/finance/Quotes';
import Payments from '@/pages/finance/Payments';
import Ledger from '@/pages/finance/Ledger';
import Expenses from '@/pages/finance/Expenses';
import GSTReports from '@/pages/finance/GSTReports';

// HRMS
import HRMSDashboard from '@/pages/hrms/HRMSDashboard';
import Directory from '@/pages/hrms/Directory';
import Leaves from '@/pages/hrms/Leaves';
import Payroll from '@/pages/hrms/Payroll';
import Attendance from '@/pages/hrms/Attendance';
import Documents from '@/pages/hrms/Documents';

// Projects
import ProjectsDashboard from '@/pages/projects/ProjectsDashboard';
import AllProjects from '@/pages/projects/AllProjects';

// Tasks & Calendar
import TasksCalendar from '@/pages/tasks/TasksCalendar';
import Reminders from '@/pages/tasks/Reminders';

// Marketing & Automation
import Campaigns from '@/pages/marketing/Campaigns';
import WhatsAppCampaigns from '@/pages/omnichannel/WhatsAppCampaigns';
import WhatsAppTemplates from '@/pages/omnichannel/WhatsAppTemplates';
import Automations from '@/pages/marketing/Automations';
import BotBuilder from '@/pages/omnichannel/BotBuilder';

// Support
import Tickets from '@/pages/support/Tickets';

// Admin
import WhiteLabel from '@/pages/admin/WhiteLabel';
import Integrations from '@/pages/admin/Integrations';
import IntegrationCenter from '@/pages/admin/IntegrationCenter';
import MetaIntegrationHub from '@/pages/admin/MetaIntegrationHub';
import MetaOAuthCallback from '@/pages/admin/MetaOAuthCallback';
import ShopifyIntegration from '@/pages/admin/ShopifyIntegration';
import WhatsAppIntegration from '@/pages/admin/WhatsAppIntegration';
import SuperAdmin from '@/pages/admin/SuperAdmin';
import WorkspaceAdmin from '@/pages/admin/WorkspaceAdmin';
import AIAssistantHub from '@/pages/admin/AIAssistantHub';
import AuditLogs from '@/pages/admin/AuditLogs';
import Appearance from '@/pages/admin/Appearance';
import Login from '@/pages/Login';
import { useApp } from '@/context/AppContext';

function AuthGuard({ children }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PermissionGuard({ module, children }) {
  const { user } = useApp();
  if (!user) return children;
  // Super Admin always has full access
  if (user.role === 'super_admin' || user.role_name === 'Super Admin') return children;
  // For all other roles (including admin/Organization Admin), check module permissions
  // user.permissions only contains modules that are enabled in workspace_modules
  const perm = user.permissions?.[module];
  if (perm && (perm.canView || perm.view)) {
    return children;
  }
  return <Navigate to="/first-available" replace />;
}

// Smart redirect: super_admin → /admin/super-admin, others → first available module
function HomeRedirect() {
  const { user } = useApp();
  if (user?.role === 'super_admin') {
    return <Navigate to="/admin/super-admin" replace />;
  }
  // If dashboard module is enabled, show it
  const dashPerm = user?.permissions?.dashboard;
  if (dashPerm && (dashPerm.canView || dashPerm.view)) {
    return <MainDashboard />;
  }
  // Dashboard disabled — redirect to first available module
  return <Navigate to="/first-available" replace />;
}

// Redirect to the first available module the user has access to
const MODULE_PRIMARY_PATHS = [
  { module: 'dashboard', path: '/' },
  { module: 'crm', path: '/crm/leads' },
  { module: 'whatsapp', path: '/omnichannel/whatsapp' },
  { module: 'ecommerce', path: '/ecommerce/orders' },
  { module: 'marketing', path: '/marketing/campaigns' },
  { module: 'support', path: '/support/tickets' },
  { module: 'finance', path: '/finance/billing' },
  { module: 'hrms', path: '/hrms/dashboard' },
  { module: 'projects', path: '/projects/dashboard' },
  { module: 'settings', path: '/admin/whitelabel' },
  { module: 'users', path: '/admin/users' },
];

function FirstAvailableRedirect() {
  const { user } = useApp();
  if (!user?.permissions) return <Navigate to="/login" replace />;
  for (const entry of MODULE_PRIMARY_PATHS) {
    // Skip dashboard — if we're here, dashboard is already disabled or we were redirected from it
    if (entry.module === 'dashboard') continue;
    const perm = user.permissions[entry.module];
    if (perm && (perm.canView || perm.view)) {
      return <Navigate to={entry.path} replace />;
    }
  }
  // Fallback: nothing available, show a message
  return <div style={{ padding: '4rem', textAlign: 'center' }}><h2>No modules available</h2><p>Contact your administrator to enable modules for your workspace.</p></div>;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            {/* Smart Redirects */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/first-available" element={<FirstAvailableRedirect />} />
            {/* Dashboards */}
            <Route path="/dashboard/sales" element={<PermissionGuard module="dashboard"><SalesDashboard /></PermissionGuard>} />
            <Route path="/dashboard/team" element={<PermissionGuard module="dashboard"><TeamDashboard /></PermissionGuard>} />
            <Route path="/dashboard/analytics" element={<PermissionGuard module="dashboard"><AnalyticsDashboard /></PermissionGuard>} />

            {/* CRM & Sales */}
            <Route path="/crm/leads" element={<PermissionGuard module="crm"><Leads /></PermissionGuard>} />
            <Route path="/crm/contacts" element={<PermissionGuard module="crm"><Contacts /></PermissionGuard>} />
            <Route path="/crm/clients" element={<PermissionGuard module="crm"><Clients /></PermissionGuard>} />
            <Route path="/crm/pipeline" element={<PermissionGuard module="crm"><Pipeline /></PermissionGuard>} />
            <Route path="/crm/customer-360" element={<PermissionGuard module="crm"><Customer360 /></PermissionGuard>} />
            <Route path="/crm/chat" element={<PermissionGuard module="crm"><Chat /></PermissionGuard>} />

            {/* Omnichannel Hub */}
            <Route path="/omnichannel/whatsapp" element={<PermissionGuard module="whatsapp"><WhatsApp /></PermissionGuard>} />
            <Route path="/omnichannel/whatsapp/automation" element={<PermissionGuard module="whatsapp"><WhatsAppAutomationDashboard /></PermissionGuard>} />
            <Route path="/omnichannel/whatsapp/contacts" element={<PermissionGuard module="whatsapp"><WhatsAppContacts /></PermissionGuard>} />
            <Route path="/omnichannel/whatsapp/campaigns" element={<PermissionGuard module="whatsapp"><WhatsAppCampaigns /></PermissionGuard>} />
            <Route path="/omnichannel/whatsapp/templates" element={<PermissionGuard module="whatsapp"><WhatsAppTemplates /></PermissionGuard>} />
            <Route path="/omnichannel/whatsapp/bot-builder" element={<PermissionGuard module="whatsapp"><BotBuilder /></PermissionGuard>} />
            <Route path="/omnichannel/calls" element={<PermissionGuard module="whatsapp"><CallDialer /></PermissionGuard>} />
            <Route path="/omnichannel/email" element={<PermissionGuard module="whatsapp"><Email /></PermissionGuard>} />
            <Route path="/omnichannel/sms" element={<PermissionGuard module="whatsapp"><SMS /></PermissionGuard>} />

            {/* E-Commerce */}
            <Route path="/ecommerce/orders" element={<PermissionGuard module="ecommerce"><Orders /></PermissionGuard>} />
            <Route path="/ecommerce/orders/track/:orderId" element={<PermissionGuard module="ecommerce"><OrderTracking /></PermissionGuard>} />
            <Route path="/ecommerce/customers" element={<PermissionGuard module="ecommerce"><Contacts /></PermissionGuard>} />
            <Route path="/ecommerce/products" element={<PermissionGuard module="ecommerce"><Products /></PermissionGuard>} />
            <Route path="/ecommerce/inventory" element={<PermissionGuard module="ecommerce"><Inventory /></PermissionGuard>} />
            <Route path="/ecommerce/abandoned" element={<PermissionGuard module="ecommerce"><AbandonedCarts /></PermissionGuard>} />
            <Route path="/ecommerce/shopify" element={<PermissionGuard module="ecommerce"><Integrations /></PermissionGuard>} />
            <Route path="/ecommerce/woocommerce" element={<PermissionGuard module="ecommerce"><Integrations /></PermissionGuard>} />
            {/* Marketing & Automation */}
            <Route path="/marketing/campaigns" element={<PermissionGuard module="marketing"><Campaigns /></PermissionGuard>} />
            <Route path="/marketing/automations" element={<PermissionGuard module="automation"><Automations /></PermissionGuard>} />

            {/* Support */}
            <Route path="/support/tickets" element={<PermissionGuard module="support"><Tickets /></PermissionGuard>} />

            {/* Finance & Billing */}
            <Route path="/finance/billing" element={<PermissionGuard module="finance"><BillingDashboard /></PermissionGuard>} />
            <Route path="/finance/invoices" element={<PermissionGuard module="finance"><Invoices /></PermissionGuard>} />
            <Route path="/finance/quotes" element={<PermissionGuard module="finance"><Quotes /></PermissionGuard>} />
            <Route path="/finance/payments" element={<PermissionGuard module="finance"><Payments /></PermissionGuard>} />
            <Route path="/finance/ledger" element={<PermissionGuard module="finance"><Ledger /></PermissionGuard>} />
            <Route path="/finance/expenses" element={<PermissionGuard module="finance"><Expenses /></PermissionGuard>} />
            <Route path="/finance/gst" element={<PermissionGuard module="finance"><GSTReports /></PermissionGuard>} />

            {/* HRMS & Payroll */}
            <Route path="/hrms" element={<PermissionGuard module="hrms"><HRMSDashboard /></PermissionGuard>} />
            <Route path="/hrms/dashboard" element={<PermissionGuard module="hrms"><HRMSDashboard /></PermissionGuard>} />
            <Route path="/hrms/directory" element={<PermissionGuard module="hrms"><Directory /></PermissionGuard>} />
            <Route path="/hrms/attendance" element={<PermissionGuard module="hrms"><Attendance /></PermissionGuard>} />
            <Route path="/hrms/leaves" element={<PermissionGuard module="hrms"><Leaves /></PermissionGuard>} />
            <Route path="/hrms/payroll" element={<PermissionGuard module="hrms"><Payroll /></PermissionGuard>} />
            <Route path="/hrms/payroll/payslips" element={<PermissionGuard module="hrms"><Payroll /></PermissionGuard>} />
            <Route path="/hrms/payroll/bonuses-deductions" element={<PermissionGuard module="hrms"><Payroll /></PermissionGuard>} />
            <Route path="/hrms/documents" element={<PermissionGuard module="hrms"><Documents /></PermissionGuard>} />

            {/* Projects */}
            <Route path="/projects" element={<Navigate to="/projects/dashboard" replace />} />
            <Route path="/projects/all" element={<PermissionGuard module="projects"><AllProjects /></PermissionGuard>} />
            <Route path="/projects/:tab" element={<PermissionGuard module="projects"><ProjectsDashboard /></PermissionGuard>} />

            {/* Tasks & Calendar */}
            <Route path="/tasks" element={<PermissionGuard module="projects"><TasksCalendar /></PermissionGuard>} />
            <Route path="/tasks/calendar" element={<PermissionGuard module="projects"><TasksCalendar /></PermissionGuard>} />
            <Route path="/tasks/reminders" element={<PermissionGuard module="projects"><Reminders /></PermissionGuard>} />

            {/* Admin */}
            <Route path="/admin/whitelabel" element={<PermissionGuard module="settings"><WhiteLabel /></PermissionGuard>} />
            <Route path="/admin/integrations" element={<PermissionGuard module="settings"><Integrations /></PermissionGuard>} />
            <Route path="/admin/integrations/whatsapp" element={<PermissionGuard module="settings"><WhatsAppIntegration /></PermissionGuard>} />
            <Route path="/admin/integrations/meta" element={<PermissionGuard module="settings"><MetaIntegrationHub /></PermissionGuard>} />
            <Route path="/admin/integrations/meta/callback" element={<PermissionGuard module="settings"><MetaOAuthCallback /></PermissionGuard>} />
            <Route path="/admin/integrations/shopify" element={<PermissionGuard module="settings"><ShopifyIntegration /></PermissionGuard>} />
            <Route path="/admin/api" element={<PermissionGuard module="settings"><IntegrationCenter /></PermissionGuard>} />
            <Route path="/admin/ai" element={<PermissionGuard module="settings"><AIAssistantHub /></PermissionGuard>} />
            <Route path="/admin/users" element={<PermissionGuard module="users"><WorkspaceAdmin /></PermissionGuard>} />
            <Route path="/admin/audit-logs" element={<PermissionGuard module="audit_logs"><AuditLogs /></PermissionGuard>} />
            <Route path="/admin/appearance" element={<PermissionGuard module="settings"><Appearance /></PermissionGuard>} />
            <Route path="/admin/super-admin" element={<SuperAdmin />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
