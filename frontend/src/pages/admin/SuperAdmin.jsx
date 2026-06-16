import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Building2, Users, CreditCard, Shield, RefreshCw, BarChart,
  HardDrive, Activity, Server, AlertCircle, Plus, Search, Check,
  X, Trash2, Key, Lock, Unlock, Play, Sliders, Globe, Palette, Layers,
  Edit3, ArrowRightLeft, Clock, Eye, ChevronRight, UserCheck, UserX,
  ShieldCheck, ShieldOff, ToggleLeft, ToggleRight as ToggleRightIcon,
  TrendingUp, Database, Zap, CalendarClock
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ── Helpers (Module Scope) ──
const StatusBadge = ({ status, locked }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
    status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
    status === 'trial' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400' :
    status === 'suspended' ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' :
    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
  }`}>
    {status} {locked ? '🔒' : ''}
  </span>
);

const UsageBar = ({ current, max, label }) => {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{current.toLocaleString()} / {max >= 999999 ? '∞' : max.toLocaleString()}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ModalShell = ({ title, icon, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" onClick={onClose}>
    <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]`} onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">{icon} {title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"><X size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label} {required && '*'}</label>
    <input {...props} required={required} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
    <select {...props} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">{children}</select>
  </div>
);

const ActionBtn = ({ title, onClick, className, children }) => (
  <button title={title} onClick={onClick} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${className}`}>{children}</button>
);

const ALL_MODULES = [
  { key: 'dashboard', name: 'Dashboards', desc: 'Main KPI, Sales, Team, and Analytics dashboards' },
  { key: 'crm', name: 'CRM & Sales', desc: 'Leads, contacts, clients, and pipeline management' },
  { key: 'whatsapp', name: 'Omnichannel Hub', desc: 'WhatsApp, Call Dialer, Email, and SMS inbox' },
  { key: 'ecommerce', name: 'E-Commerce', desc: 'Orders, customers, products, inventory, and abandoned carts' },
  { key: 'marketing', name: 'Marketing Suite', desc: 'Campaigns and email/SMS marketing' },
  { key: 'automation', name: 'Workflow Automation', desc: 'Automatic rules and action triggers' },
  { key: 'support', name: 'Support Center', desc: 'Customer support tickets resolution queue' },
  { key: 'finance', name: 'Finance & Billing', desc: 'Invoices, quotes, payments, ledger, and expenses' },
  { key: 'hrms', name: 'HRMS & Payroll', desc: 'Employees, leaves, attendance, and payroll' },
  { key: 'projects', name: 'Projects & Tasks', desc: 'Projects, task board, gantt chart, and reminders' },
  { key: 'settings', name: 'Admin Console', desc: 'White-label, API, AI assistant, and appearance' },
  { key: 'users', name: 'User Management', desc: 'Roles assignment and team setup' },
  { key: 'audit_logs', name: 'Security Audit Logs', desc: 'Security logging and audit timeline' },
  { key: 'integrations', name: 'App Integrations', desc: 'External integrations like Meta, Shopify, and payment gateways' },
];

export default function SuperAdmin() {
  const { addToast, token, tenantId } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab) => setSearchParams({ tab });
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // Search state
  const [orgSearch, setOrgSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('all');
  const [userWsFilter, setUserWsFilter] = useState('all');
  
  // Modals state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExtendTrialModal, setShowExtendTrialModal] = useState(false);
  const [showUserPasswordModal, setShowUserPasswordModal] = useState(false);
  const [showOrgDetailDrawer, setShowOrgDetailDrawer] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [orgDetailTab, setOrgDetailTab] = useState('usage');
  const [orgUsage, setOrgUsage] = useState(null);
  const [orgAnalytics, setOrgAnalytics] = useState(null);
  const [orgBilling, setOrgBilling] = useState(null);
  const [rolesSummary, setRolesSummary] = useState([]);
  const [workspacePermissions, setWorkspacePermissions] = useState([]);
  const [permissionsSearch, setPermissionsSearch] = useState('');
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Form Fields
  const blankOrg = {
    workspace_id: '', workspace_name: '', business_name: '',
    admin_name: '', admin_email: '', admin_password: '', confirm_password: '',
    mobile_number: '', company_name: '', industry: 'Technology',
    country: 'India', state: '', city: '', currency: 'INR',
    timezone: 'Asia/Kolkata', plan_id: 'professional', trial_days: 14, status: 'active'
  };
  const [newOrg, setNewOrg] = useState({ ...blankOrg });

  const handleOpenCreateOrgModal = () => {
    const code = String(Math.floor(10000 + Math.random() * 90000));
    setNewOrg({ ...blankOrg, workspace_id: code });
    setShowOrgModal(true);
  };

  const [editOrgForm, setEditOrgForm] = useState({
    workspace_name: '', business_name: '', country: '', state: '', city: '',
    currency: '', timezone: '', billing_email: ''
  });

  const [featureForm, setFeatureForm] = useState({ module: 'crm', enabled: true });
  const [planForm, setPlanForm] = useState({ plan_id: 'professional' });
  const [passwordForm, setPasswordForm] = useState({ password: '' });
  const [transferForm, setTransferForm] = useState({ new_admin_email: '', new_admin_name: '' });
  const [extendTrialForm, setExtendTrialForm] = useState({ extra_days: 14 });
  const [userPasswordForm, setUserPasswordForm] = useState({ password: '' });

  // Headers helper
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || 'rapidmodel_corp',
  }), [token, tenantId]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, orgRes, logRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/super-admin/dashboard-kpis`, { headers: getHeaders() }),
        fetch(`${API_BASE}/super-admin/organizations`, { headers: getHeaders() }),
        fetch(`${API_BASE}/super-admin/audit-logs`, { headers: getHeaders() }),
        fetch(`${API_BASE}/super-admin/users`, { headers: getHeaders() }),
      ]);
      if (kpiRes.ok) { const d = await kpiRes.json(); setKpis(d.data); }
      if (orgRes.ok) { const d = await orgRes.json(); setOrganizations(d.data); }
      if (logRes.ok) { const d = await logRes.json(); setAuditLogs(d.data); }
      if (userRes.ok) { const d = await userRes.json(); setAllUsers(d.data); }
    } catch (err) {
      console.error('[!] Failed to fetch super admin data:', err);
      addToast('Error loading administrative data', 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Org Detail Drawer data fetcher ──
  const fetchOrgDetails = useCallback(async (wsId) => {
    try {
      const [usageRes, analyticsRes, billingRes, rolesRes, permissionsRes] = await Promise.all([
        fetch(`${API_BASE}/super-admin/organizations/${wsId}/usage`, { headers: getHeaders() }),
        fetch(`${API_BASE}/super-admin/organizations/${wsId}/analytics`, { headers: getHeaders() }),
        fetch(`${API_BASE}/super-admin/organizations/${wsId}/billing`, { headers: getHeaders() }),
        fetch(`${API_BASE}/super-admin/organizations/${wsId}/roles-summary`, { headers: getHeaders() }),
        fetch(`${API_BASE}/super-admin/organizations/${wsId}/permissions`, { headers: getHeaders() }),
      ]);
      if (usageRes.ok) { const d = await usageRes.json(); setOrgUsage(d.data); }
      if (analyticsRes.ok) { const d = await analyticsRes.json(); setOrgAnalytics(d.data); }
      if (billingRes.ok) { const d = await billingRes.json(); setOrgBilling(d.data); }
      if (rolesRes.ok) { const d = await rolesRes.json(); setRolesSummary(d.data); }
      if (permissionsRes.ok) { const d = await permissionsRes.json(); setWorkspacePermissions(d.data); }
    } catch (err) {
      console.error('[!] Failed to fetch org details:', err);
    }
  }, [getHeaders]);

  const handleToggleModule = async (wsId, moduleKey, currentStatus) => {
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${wsId}/modules/${moduleKey}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ enabled: !currentStatus })
      });
      if (resp.ok) {
        addToast(`Module '${moduleKey}' updated successfully`, 'success');
        // Update local organization state
        setOrganizations(prev => prev.map(org => {
          if (org.workspace_id === wsId) {
            return {
              ...org,
              modules: {
                ...org.modules,
                [moduleKey]: !currentStatus
              }
            };
          }
          return org;
        }));
        // Update selectedOrg if active
        if (selectedOrg && selectedOrg.workspace_id === wsId) {
          setSelectedOrg(prev => ({
            ...prev,
            modules: {
              ...prev.modules,
              [moduleKey]: !currentStatus
            }
          }));
        }

        // If disabling, set all granular permissions for this module to false locally
        if (currentStatus) {
          setWorkspacePermissions(prev => prev.map(item => {
            if (item.module === moduleKey) {
              return {
                ...item,
                can_add: false,
                can_edit: false,
                can_delete: false,
                can_view: false,
                can_full: false
              };
            }
            return item;
          }));
        } else {
          // If enabling, reload fresh permissions
          const freshRes = await fetch(`${API_BASE}/super-admin/organizations/${wsId}/permissions`, { headers: getHeaders() });
          if (freshRes.ok) {
            const d = await freshRes.json();
            setWorkspacePermissions(d.data);
          }
        }
      } else {
        addToast('Failed to toggle module', 'error');
      }
    } catch {
      addToast('Network error toggling module', 'error');
    }
  };

  const handlePermissionCheckboxChange = (permissionId, field, value) => {
    setWorkspacePermissions(prev => prev.map(item => {
      if (item.id === permissionId) {
        let updated = { ...item, [field]: value };
        if (field === 'can_full') {
          if (value) {
            updated.can_add = true;
            updated.can_edit = true;
            updated.can_delete = true;
            updated.can_view = true;
          } else {
            updated.can_add = false;
            updated.can_edit = false;
            updated.can_delete = false;
            updated.can_view = false;
          }
        } else {
          if (!value) {
            updated.can_full = false;
          } else {
            if (updated.can_add && updated.can_edit && updated.can_delete && updated.can_view) {
              updated.can_full = true;
            }
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedOrg) return;
    setIsSavingPermissions(true);
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${selectedOrg.workspace_id}/permissions`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ permissions: workspacePermissions })
      });
      if (resp.ok) {
        addToast('Workspace permissions matrix updated successfully', 'success');
        setShowSaveConfirmModal(false);
      } else {
        addToast('Failed to save permissions', 'error');
      }
    } catch {
      addToast('Network error saving permissions', 'error');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleRole = async (wsId, roleSuffix, currentStatus) => {
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${wsId}/roles`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role_suffix: roleSuffix, enabled: !currentStatus })
      });
      if (resp.ok) {
        addToast(`Role suffix '${roleSuffix}' updated successfully`, 'success');
        fetchOrgDetails(wsId);
      } else {
        addToast('Failed to toggle role', 'error');
      }
    } catch {
      addToast('Network error toggling role', 'error');
    }
  };

  // ── Actions ─────────────────────────────────────────────
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (newOrg.admin_password !== newOrg.confirm_password) { addToast('Passwords do not match', 'error'); return; }
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(newOrg) });
      const data = await resp.json();
      if (resp.ok) { addToast('Organization created successfully', 'success'); setShowOrgModal(false); setNewOrg({ ...blankOrg }); fetchData(); }
      else { addToast(data.detail || 'Failed to create organization', 'error'); }
    } catch { addToast('Network error creating organization', 'error'); }
  };

  const handleEditOrg = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${selectedOrg.workspace_id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(editOrgForm)
      });
      if (resp.ok) { addToast('Organization updated successfully', 'success'); setShowEditOrgModal(false); fetchData(); }
      else { addToast('Failed to update organization', 'error'); }
    } catch { addToast('Network error updating organization', 'error'); }
  };

  const handleUpdateStatus = async (wsId, currentStatus, actionType) => {
    let newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    if (actionType === 'lock') newStatus = 'lock';
    else if (actionType === 'unlock') newStatus = 'active';
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${wsId}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: newStatus }) });
      if (resp.ok) { addToast(`Organization status → ${newStatus}`, 'success'); fetchData(); }
      else { addToast('Failed to update status', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handleDeleteOrg = async (wsId, name) => {
    if (!confirm(`Delete organization "${name}"? This is irreversible.`)) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${wsId}`, { method: 'DELETE', headers: getHeaders() });
      if (resp.ok) { addToast('Organization deleted', 'success'); fetchData(); }
      else { addToast('Failed to delete', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handleImpersonate = async (wsId) => {
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${wsId}/impersonate`, { method: 'POST', headers: getHeaders() });
      const data = await resp.json();
      if (resp.ok && data.access_token) { localStorage.setItem('crm_access_token', data.access_token); window.location.href = '/'; }
      else { addToast(data.detail || 'Impersonation failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handleFeatureToggleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${selectedOrg.workspace_id}/features`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(featureForm) });
      if (resp.ok) { addToast('Feature updated', 'success'); setShowFeatureModal(false); fetchData(); }
      else { addToast('Failed to update feature', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${selectedOrg.workspace_id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ plan_id: planForm.plan_id }) });
      if (resp.ok) { addToast('Plan upgraded', 'success'); setShowPlanModal(false); fetchData(); }
      else { addToast('Failed to update plan', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${selectedOrg.workspace_id}/password`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(passwordForm) });
      if (resp.ok) { addToast('Admin password reset', 'success'); setShowPasswordModal(false); setPasswordForm({ password: '' }); }
      else { addToast('Failed to reset', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${selectedOrg.workspace_id}/transfer-ownership`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(transferForm) });
      const data = await resp.json();
      if (resp.ok) { addToast(data.message || 'Ownership transferred', 'success'); setShowTransferModal(false); setTransferForm({ new_admin_email: '', new_admin_name: '' }); fetchData(); }
      else { addToast(data.detail || 'Transfer failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handleExtendTrialSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/organizations/${selectedOrg.workspace_id}/extend-trial`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(extendTrialForm) });
      const data = await resp.json();
      if (resp.ok) { addToast(data.message || 'Trial extended', 'success'); setShowExtendTrialModal(false); setExtendTrialForm({ extra_days: 14 }); fetchData(); }
      else { addToast(data.detail || 'Failed to extend trial', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  // ── User Actions ──
  const handleUserLockToggle = async (userId, isLocked) => {
    const status = isLocked ? 'unlock' : 'lock';
    try {
      const resp = await fetch(`${API_BASE}/super-admin/users/${userId}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }) });
      if (resp.ok) { addToast(`User ${status}ed`, 'success'); fetchData(); }
      else { addToast('Failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handleUser2FAToggle = async (userId, currentlyEnabled) => {
    try {
      const resp = await fetch(`${API_BASE}/super-admin/users/${userId}/2fa`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ enabled: !currentlyEnabled }) });
      if (resp.ok) { addToast(`2FA ${!currentlyEnabled ? 'enabled' : 'disabled'}`, 'success'); fetchData(); }
      else { addToast('Failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  const handleUserPasswordReset = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const resp = await fetch(`${API_BASE}/super-admin/users/${selectedUser.user_id}/password`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(userPasswordForm) });
      if (resp.ok) { addToast('Password reset', 'success'); setShowUserPasswordModal(false); setUserPasswordForm({ password: '' }); }
      else { addToast('Failed to reset', 'error'); }
    } catch { addToast('Network error', 'error'); }
  };

  // ── Filtered data ──
  const filteredOrgs = organizations.filter(o => {
    const matchesSearch = (o.workspace_id || '').toLowerCase().includes(orgSearch.toLowerCase()) ||
      (o.workspace_name || '').toLowerCase().includes(orgSearch.toLowerCase());
    const matchesStatus = orgStatusFilter === 'all' || o.plan_status === orgStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesWs = userWsFilter === 'all' || u.workspace_id === userWsFilter;
    return matchesSearch && matchesWs;
  });

  const filteredLogs = auditLogs.filter(l =>
    (l.action || '').toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.user_email || '').toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(logSearch.toLowerCase())
  );

  // ── Helpers ──
  // Moved to module scope above to avoid unmounting on re-render.


  // ═══════════════════ RENDER ═══════════════════
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <PageHeader title="Super Admin Dashboard" subtitle="Control Center for Multi-Tenant CRM Platform" />
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
        </div>
      )}

      {/* ════════════ DASHBOARD TAB ════════════ */}
      {!loading && activeTab === 'dashboard' && kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: <Building2 size={24} />, bg: 'indigo', label: 'Total Organizations', value: kpis.totalOrganizations, sub: `${kpis.activeOrganizations} Active`, subColor: 'emerald' },
              { icon: <Users size={24} />, bg: 'violet', label: 'Total Users', value: kpis.totalUsers, sub: 'System accounts', subColor: 'slate' },
              { icon: <CreditCard size={24} />, bg: 'emerald', label: 'Monthly Revenue', value: formatCurrency(kpis.monthlyRevenue), sub: `ARR: ${formatCurrency(kpis.totalRevenue)}`, subColor: 'emerald' },
              { icon: <Shield size={24} />, bg: 'amber', label: 'Trial Orgs', value: kpis.trialOrganizations, sub: `${kpis.suspendedOrganizations} Suspended`, subColor: 'amber' },
            ].map((card, i) => (
              <div key={i} className="glass-card p-5 flex items-center gap-4">
                <div className={`p-3 bg-${card.bg}-50 dark:bg-${card.bg}-950/20 text-${card.bg}-500 rounded-xl`}>{card.icon}</div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{card.label}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                  <span className={`text-[10px] text-${card.subColor}-500 font-semibold`}>{card.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* System Health */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <Server size={18} className="text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Host Node Health</h3>
              </div>
              <div className="space-y-4 text-xs font-semibold">
                {[{ label: 'CPU Core Utilization', pct: 18, color: 'indigo' }, { label: 'Active RAM Usage', pct: 25.6, color: 'violet', info: '4.1 GB / 16 GB' }, { label: 'Storage (SSD)', pct: 18, color: 'emerald', info: '94 GB / 512 GB' }].map(h => (
                  <div key={h.label}>
                    <div className="flex justify-between mb-1"><span>{h.label}</span><span>{h.info || `${h.pct}%`}</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full">
                      <div className={`bg-${h.color}-500 h-2 rounded-full`} style={{ width: `${h.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Usage */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <Activity size={18} className="text-emerald-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module Popularity</h3>
              </div>
              <div className="space-y-3.5 text-xs font-semibold">
                {Object.entries(kpis.featureUsage).map(([name, pct]) => (
                  <div key={name} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                    <span className="text-slate-600 dark:text-slate-300">{name} Integration:</span>
                    <span className="font-bold text-indigo-500">{pct}% usage</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            <div className="glass-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <AlertCircle size={18} className="text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gateway Warnings</h3>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Active API Channels Healthy</p>
                    <p className="text-[10px] opacity-80 mt-0.5">SMTP Gateways, WhatsApp endpoints, and Webhooks are responding normally.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ ORGANIZATIONS TAB ════════════ */}
      {!loading && activeTab === 'organizations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" value={orgSearch} onChange={e => setOrgSearch(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400" />
              </div>
              <select value={orgStatusFilter} onChange={e => setOrgStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <button onClick={handleOpenCreateOrgModal}
              className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-xl py-2 px-4 text-xs font-bold shadow-md cursor-pointer hover:bg-indigo-700">
              <Plus size={14} /> Create Organization
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Workspace Name</th><th>Plan</th><th>Country</th><th>Limits</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map(org => (
                  <tr key={org.workspace_id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30" onClick={() => { setSelectedOrg(org); setOrgDetailTab('usage'); setShowOrgDetailDrawer(true); fetchOrgDetails(org.workspace_id); }}>
                    <td className="text-xs font-bold text-slate-400">{org.workspace_id}</td>
                    <td className="text-xs font-bold text-slate-800 dark:text-white">{org.workspace_name}</td>
                    <td className="text-xs capitalize font-semibold text-indigo-500">{org.plan_id}</td>
                    <td className="text-xs text-slate-500">{org.country || 'India'}</td>
                    <td className="text-xs text-slate-500 space-y-0.5">
                      <div>Users: <span className="font-bold text-slate-700 dark:text-slate-350">{org.max_users}</span></div>
                      <div>Contacts: <span className="font-bold text-slate-700 dark:text-slate-350">{org.max_contacts}</span></div>
                    </td>
                    <td><StatusBadge status={org.plan_status} locked={org.is_locked} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn title="Edit" onClick={() => { setSelectedOrg(org); setEditOrgForm({ workspace_name: org.workspace_name || '', business_name: org.business_name || '', country: org.country || '', state: org.state || '', city: org.city || '', currency: org.currency || 'INR', timezone: org.timezone || 'Asia/Kolkata', billing_email: org.billing_email || '' }); setShowEditOrgModal(true); }} className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 hover:bg-blue-100"><Edit3 size={13} /></ActionBtn>
                        <ActionBtn title="Impersonate" onClick={() => handleImpersonate(org.workspace_id)} className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 hover:bg-indigo-100"><Play size={13} /></ActionBtn>
                        <ActionBtn title="Transfer Ownership" onClick={() => { setSelectedOrg(org); setShowTransferModal(true); }} className="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/20 dark:text-cyan-400 hover:bg-cyan-100"><ArrowRightLeft size={13} /></ActionBtn>
                        <ActionBtn title="Extend Trial" onClick={() => { setSelectedOrg(org); setShowExtendTrialModal(true); }} className="bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 hover:bg-amber-100"><CalendarClock size={13} /></ActionBtn>
                        <ActionBtn title="Features" onClick={() => { setSelectedOrg(org); setShowFeatureModal(true); }} className="bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 hover:bg-violet-100"><Sliders size={13} /></ActionBtn>
                        <ActionBtn title="Plan" onClick={() => { setSelectedOrg(org); setShowPlanModal(true); }} className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100"><TrendingUp size={13} /></ActionBtn>
                        <ActionBtn title="Reset Admin Password" onClick={() => { setSelectedOrg(org); setShowPasswordModal(true); }} className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200"><Key size={13} /></ActionBtn>
                        <ActionBtn title={org.plan_status === 'suspended' ? 'Activate' : 'Suspend'} onClick={() => handleUpdateStatus(org.workspace_id, org.plan_status)} className={org.plan_status === 'suspended' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-100'}>
                          {org.plan_status === 'suspended' ? <Unlock size={13} /> : <Lock size={13} />}
                        </ActionBtn>
                        <ActionBtn title="Delete" onClick={() => handleDeleteOrg(org.workspace_id, org.workspace_name)} className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-100"><Trash2 size={13} /></ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrgs.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-12 text-slate-400 font-semibold">No organizations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ USERS TAB ════════════ */}
      {!loading && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400" />
              </div>
              <select value={userWsFilter} onChange={e => setUserWsFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none max-w-[200px]">
                <option value="all">All Workspaces</option>
                {[...new Set(allUsers.map(u => u.workspace_id))].map(ws => (
                  <option key={ws} value={ws}>{ws}</option>
                ))}
              </select>
            </div>
            <div className="text-xs font-semibold text-slate-400">{filteredUsers.length} users</div>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Workspace</th><th>Role</th><th>Status</th><th>2FA</th><th>Last Login</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.user_id}>
                    <td className="text-xs font-bold text-slate-800 dark:text-white">{u.full_name}</td>
                    <td className="text-xs text-slate-500">{u.email}</td>
                    <td className="text-xs font-semibold text-indigo-500">{u.workspace_name || u.workspace_id}</td>
                    <td className="text-xs text-slate-600 dark:text-slate-400">{u.role_name || '—'}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active' && !u.is_locked ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      }`}>
                        {u.is_locked ? 'Locked' : u.status}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleUser2FAToggle(u.user_id, u.two_factor_enabled)} className="cursor-pointer" title={u.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}>
                        {u.two_factor_enabled ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldOff size={16} className="text-slate-300 dark:text-slate-600" />}
                      </button>
                    </td>
                    <td className="text-[11px] text-slate-400">{u.last_login ? formatDate(u.last_login) : 'Never'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn title={u.is_locked ? 'Unlock User' : 'Lock User'} onClick={() => handleUserLockToggle(u.user_id, u.is_locked)}
                          className={u.is_locked ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 hover:bg-amber-100'}>
                          {u.is_locked ? <Unlock size={13} /> : <Lock size={13} />}
                        </ActionBtn>
                        <ActionBtn title="Reset Password" onClick={() => { setSelectedUser(u); setShowUserPasswordModal(true); }}
                          className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200"><Key size={13} /></ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-12 text-slate-400 font-semibold">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ AUDIT LOGS TAB ════════════ */}
      {!loading && activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)}
              placeholder="Search logs by action or user..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400" />
          </div>
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead><tr><th>Timestamp</th><th>Action</th><th>Workspace</th><th>Triggered By</th><th>IP Address</th><th>Details</th></tr></thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.log_id}>
                    <td className="text-xs text-slate-400">{formatDate(log.created_at)}</td>
                    <td className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.action}</td>
                    <td className="text-xs font-bold text-indigo-500">{log.workspace_id || 'Global'}</td>
                    <td className="text-xs text-slate-600 dark:text-slate-400">{log.user_email}</td>
                    <td className="text-xs text-slate-400 font-mono">{log.ip_address}</td>
                    <td className="text-xs text-slate-500 max-w-sm truncate" title={log.details}>{log.details}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">No logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ ORG DETAIL DRAWER ════════════ */}
      {showOrgDetailDrawer && selectedOrg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs" onClick={() => setShowOrgDetailDrawer(false)}>
          <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] border-l border-slate-200 dark:border-slate-700 shadow-2xl h-full overflow-y-auto animate-[slideInRight_200ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-[#1E293B] z-10 p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Building2 size={16} className="text-indigo-500" />{selectedOrg.workspace_name}</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedOrg.workspace_id} · <StatusBadge status={selectedOrg.plan_status} locked={selectedOrg.is_locked} /></p>
                </div>
                <button onClick={() => setShowOrgDetailDrawer(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"><X size={18} /></button>
              </div>
              <div className="flex gap-1 mt-3">
                {['usage', 'features', 'analytics', 'billing'].map(t => (
                  <button key={t} onClick={() => setOrgDetailTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${orgDetailTab === t ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Usage Tab */}
              {orgDetailTab === 'usage' && orgUsage && (
                <div className="space-y-5">
                  <div className="glass-card p-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Database size={14} /> Resource Usage</h4>
                    <UsageBar current={orgUsage.users?.current || 0} max={orgUsage.users?.max || 1} label="Users" />
                    <UsageBar current={orgUsage.leads?.current || 0} max={orgUsage.leads?.max || 1} label="Leads" />
                    <UsageBar current={orgUsage.contacts?.current || 0} max={orgUsage.contacts?.max || 1} label="Contacts" />
                    <UsageBar current={orgUsage.clients?.current || 0} max={orgUsage.clients?.max || 1} label="Clients" />
                    <UsageBar current={orgUsage.projects?.current || 0} max={orgUsage.projects?.max || 1} label="Projects" />
                  </div>
                  <div className="glass-card p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Zap size={14} /> Enabled Modules</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(orgUsage.enabled_features || []).map(f => (
                        <span key={f} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-lg">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {orgDetailTab === 'features' && (
                <div className="space-y-6">
                  {/* Search and Save Control */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text" 
                        value={permissionsSearch} 
                        onChange={e => setPermissionsSearch(e.target.value)}
                        placeholder="Search modules or features..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-450" 
                      />
                    </div>
                    <button 
                      onClick={() => setShowSaveConfirmModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md cursor-pointer shrink-0"
                    >
                      Save Matrix
                    </button>
                  </div>

                  {/* Modules Group Accordion Grid */}
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {ALL_MODULES.filter(m => {
                      const searchLower = permissionsSearch.toLowerCase();
                      const moduleMatch = m.name.toLowerCase().includes(searchLower) || m.key.toLowerCase().includes(searchLower);
                      const featuresMatch = workspacePermissions.some(p => p.module === m.key && p.feature.toLowerCase().includes(searchLower));
                      return moduleMatch || featuresMatch || !permissionsSearch;
                    }).map(m => {
                      const isEnabled = selectedOrg.modules ? (selectedOrg.modules[m.key] !== false) : true;
                      const modulePermissions = workspacePermissions.filter(p => p.module === m.key && (!permissionsSearch || p.feature.toLowerCase().includes(permissionsSearch.toLowerCase())));

                      return (
                        <div key={m.key} className="glass-card overflow-hidden">
                          {/* Module Header */}
                          <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-1.5 capitalize">
                                <Zap size={13} className="text-indigo-500" />
                                {m.name}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isEnabled ? 'Active' : 'Disabled'}</span>
                              <button
                                onClick={() => handleToggleModule(selectedOrg.workspace_id, m.key, isEnabled)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                              >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </div>

                          {/* Sub-features Matrix Table */}
                          {isEnabled && modulePermissions.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50/20 dark:bg-slate-800/10 text-slate-400 font-bold uppercase text-[8px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-2 px-4">Feature</th>
                                    <th className="py-2 px-2">Link</th>
                                    <th className="py-2 px-2 text-center w-12">ADD</th>
                                    <th className="py-2 px-2 text-center w-12">EDIT</th>
                                    <th className="py-2 px-2 text-center w-12">DEL</th>
                                    <th className="py-2 px-2 text-center w-12">VIEW</th>
                                    <th className="py-2 px-2 text-center w-12">FULL</th>
                                  </tr>
                                </thead>
                                <tbody className="font-semibold text-slate-700 dark:text-slate-300">
                                  {modulePermissions.map(p => (
                                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/30 last:border-0 hover:bg-slate-50/30 dark:hover:bg-slate-850/10">
                                      <td className="py-2 px-4 text-xs font-bold text-slate-750 dark:text-slate-200">{p.feature}</td>
                                      <td className="py-2 px-2 text-slate-400 font-mono text-[9px] truncate max-w-[120px]" title={p.link}>{p.link || '—'}</td>
                                      {[
                                        { field: 'can_add', key: 'add' },
                                        { field: 'can_edit', key: 'edit' },
                                        { field: 'can_delete', key: 'delete' },
                                        { field: 'can_view', key: 'view' },
                                        { field: 'can_full', key: 'full' }
                                      ].map(col => (
                                        <td key={col.field} className="py-2 px-2 text-center">
                                          <input 
                                            type="checkbox"
                                            checked={!!p[col.field]}
                                            onChange={e => handlePermissionCheckboxChange(p.id, col.field, e.target.checked)}
                                            className="w-3.5 h-3.5 text-indigo-600 border-slate-350 dark:border-slate-700 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {isEnabled && modulePermissions.length === 0 && (
                            <div className="p-4 text-center text-[10px] text-slate-400 font-semibold">No sub-features found in this module.</div>
                          )}
                          {!isEnabled && (
                            <div className="p-4 bg-slate-50/20 dark:bg-slate-900/10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">Module disabled (permissions blocked)</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Roles Control */}
                  <div className="glass-card p-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Shield size={14} /> Role Management</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                            <th className="py-2">Role Name</th>
                            <th className="py-2">Suffix</th>
                            <th className="py-2 text-center">Users</th>
                            <th className="py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700 dark:text-slate-300">
                          {rolesSummary.map(r => (
                            <tr key={r.role_suffix} className="border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                              <td className="py-2">{r.role_name}</td>
                              <td className="py-2 text-slate-400 font-mono text-[10px]">{r.role_suffix}</td>
                              <td className="py-2 text-center text-indigo-500 font-bold">{r.user_count}</td>
                              <td className="py-2 text-right">
                                <button
                                  onClick={() => handleToggleRole(selectedOrg.workspace_id, r.role_suffix, !!r.is_enabled)}
                                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${r.is_enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                                >
                                  <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${r.is_enabled ? 'translate-x-3' : 'translate-x-0'}`} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {orgDetailTab === 'analytics' && orgAnalytics && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Users', value: orgAnalytics.total_users, color: 'indigo' },
                      { label: 'Active Users', value: orgAnalytics.active_users, color: 'emerald' },
                      { label: 'Logins (30d)', value: orgAnalytics.recent_logins_30d, color: 'violet' },
                      { label: 'New Leads (30d)', value: orgAnalytics.new_leads_30d, color: 'amber' },
                    ].map(s => (
                      <div key={s.label} className="glass-card p-4 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{s.label}</p>
                        <p className={`text-2xl font-bold text-${s.color}-500`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module Activity (30d)</h4>
                    {Object.entries(orgAnalytics.module_usage_30d || {}).map(([mod, cnt]) => (
                      <div key={mod} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-slate-600 dark:text-slate-300 uppercase">{mod}</span>
                        <span className="text-indigo-500 font-bold">{cnt} actions</span>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs font-semibold text-slate-500">Audit Actions (30d): <span className="text-indigo-500 font-bold">{orgAnalytics.audit_actions_30d}</span></p>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {orgDetailTab === 'billing' && orgBilling && (
                <div className="space-y-5">
                  <div className="glass-card p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><CreditCard size={14} /> Subscription Details</h4>
                    {[
                      { label: 'Plan', value: orgBilling.plan_id?.toUpperCase() },
                      { label: 'Status', value: orgBilling.plan_status?.toUpperCase() },
                      { label: 'Monthly Price', value: `${orgBilling.currency || '$'} ${orgBilling.monthly_price}` },
                      { label: 'Annual Price', value: `${orgBilling.currency || '$'} ${orgBilling.annual_price}` },
                      { label: 'Billing Cycle', value: orgBilling.billing_cycle },
                      { label: 'Max Users', value: orgBilling.max_users },
                      { label: 'Max Contacts', value: orgBilling.max_contacts?.toLocaleString() },
                      { label: 'Trial Days', value: orgBilling.trial_days },
                      { label: 'Trial Ends', value: orgBilling.trial_ends_at || 'N/A' },
                      { label: 'Created', value: orgBilling.created_at ? formatDate(orgBilling.created_at) : '—' },
                      { label: 'Next Renewal', value: orgBilling.next_renewal ? formatDate(orgBilling.next_renewal) : '—' },
                      { label: 'Billing Email', value: orgBilling.billing_email || 'Not set' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-slate-400">{r.label}</span>
                        <span className="text-slate-700 dark:text-slate-300">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!orgUsage && orgDetailTab === 'usage' && <div className="flex justify-center py-8"><RefreshCw className="animate-spin text-indigo-500 w-6 h-6" /></div>}
              {!orgAnalytics && orgDetailTab === 'analytics' && <div className="flex justify-center py-8"><RefreshCw className="animate-spin text-indigo-500 w-6 h-6" /></div>}
              {!orgBilling && orgDetailTab === 'billing' && <div className="flex justify-center py-8"><RefreshCw className="animate-spin text-indigo-500 w-6 h-6" /></div>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ MODALS ════════════ */}

      {/* CREATE ORG */}
      {showOrgModal && (
        <ModalShell title="Create Organization" icon={<Building2 className="text-indigo-500" size={18} />} onClose={() => setShowOrgModal(false)} wide>
          <form onSubmit={handleCreateOrg} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <InputField label="Organization Code" required type="text" value={newOrg.workspace_id} onChange={e => setNewOrg(p => ({ ...p, workspace_id: e.target.value }))} placeholder="5-digit code" />
                </div>
                <button type="button" onClick={() => setNewOrg(p => ({ ...p, workspace_id: String(Math.floor(10000 + Math.random() * 90000)) }))} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider h-[38px] px-3 rounded-xl cursor-pointer hover:bg-slate-250 dark:hover:bg-slate-700 flex items-center justify-center shrink-0">
                  Gen
                </button>
              </div>
              <InputField label="Display Name" required type="text" value={newOrg.workspace_name} onChange={e => setNewOrg(p => ({ ...p, workspace_name: e.target.value }))} placeholder="e.g. RapidModel Corp" />
              <InputField label="Company Name" type="text" value={newOrg.company_name} onChange={e => setNewOrg(p => ({ ...p, company_name: e.target.value }))} placeholder="Legal name" />
              <InputField label="Industry" type="text" value={newOrg.industry} onChange={e => setNewOrg(p => ({ ...p, industry: e.target.value }))} placeholder="Tech, Finance..." />
              <InputField label="Country" type="text" value={newOrg.country} onChange={e => setNewOrg(p => ({ ...p, country: e.target.value }))} />
              <InputField label="State" type="text" value={newOrg.state} onChange={e => setNewOrg(p => ({ ...p, state: e.target.value }))} placeholder="e.g. Karnataka" />
              <InputField label="City" type="text" value={newOrg.city} onChange={e => setNewOrg(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Bangalore" />
              <InputField label="Mobile" type="text" value={newOrg.mobile_number} onChange={e => setNewOrg(p => ({ ...p, mobile_number: e.target.value }))} placeholder="+91 ..." />
              <SelectField label="Plan" value={newOrg.plan_id} onChange={e => setNewOrg(p => ({ ...p, plan_id: e.target.value }))}>
                <option value="starter">Starter (5 Users)</option><option value="growth">Growth (20 Users)</option><option value="professional">Professional (100 Users)</option><option value="enterprise">Enterprise (Unlimited)</option>
              </SelectField>
              <InputField label="Trial Days" type="number" value={newOrg.trial_days} onChange={e => setNewOrg(p => ({ ...p, trial_days: parseInt(e.target.value) }))} />
              <InputField label="Currency" type="text" value={newOrg.currency} onChange={e => setNewOrg(p => ({ ...p, currency: e.target.value }))} />
              <InputField label="Timezone" type="text" value={newOrg.timezone} onChange={e => setNewOrg(p => ({ ...p, timezone: e.target.value }))} />
              <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800"><h4 className="font-bold text-slate-700 dark:text-slate-300">Admin Setup</h4></div>
              <InputField label="Admin Name" required type="text" value={newOrg.admin_name} onChange={e => setNewOrg(p => ({ ...p, admin_name: e.target.value }))} placeholder="Full name" />
              <InputField label="Admin Email" required type="email" value={newOrg.admin_email} onChange={e => setNewOrg(p => ({ ...p, admin_email: e.target.value }))} placeholder="admin@org.com" />
              <InputField label="Password" required type="password" value={newOrg.admin_password} onChange={e => setNewOrg(p => ({ ...p, admin_password: e.target.value }))} placeholder="Min 6 chars" />
              <InputField label="Confirm Password" required type="password" value={newOrg.confirm_password} onChange={e => setNewOrg(p => ({ ...p, confirm_password: e.target.value }))} placeholder="Repeat" />
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowOrgModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-indigo-700 cursor-pointer">Provision Tenant</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* EDIT ORG */}
      {showEditOrgModal && selectedOrg && (
        <ModalShell title={`Edit: ${selectedOrg.workspace_name}`} icon={<Edit3 className="text-blue-500" size={18} />} onClose={() => setShowEditOrgModal(false)}>
          <form onSubmit={handleEditOrg} className="space-y-4 text-xs font-semibold">
            <InputField label="Display Name" type="text" value={editOrgForm.workspace_name} onChange={e => setEditOrgForm(p => ({ ...p, workspace_name: e.target.value }))} />
            <InputField label="Business Name" type="text" value={editOrgForm.business_name} onChange={e => setEditOrgForm(p => ({ ...p, business_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Country" type="text" value={editOrgForm.country} onChange={e => setEditOrgForm(p => ({ ...p, country: e.target.value }))} />
              <InputField label="State" type="text" value={editOrgForm.state} onChange={e => setEditOrgForm(p => ({ ...p, state: e.target.value }))} />
              <InputField label="City" type="text" value={editOrgForm.city} onChange={e => setEditOrgForm(p => ({ ...p, city: e.target.value }))} />
              <InputField label="Currency" type="text" value={editOrgForm.currency} onChange={e => setEditOrgForm(p => ({ ...p, currency: e.target.value }))} />
            </div>
            <InputField label="Timezone" type="text" value={editOrgForm.timezone} onChange={e => setEditOrgForm(p => ({ ...p, timezone: e.target.value }))} />
            <InputField label="Billing Email" type="email" value={editOrgForm.billing_email} onChange={e => setEditOrgForm(p => ({ ...p, billing_email: e.target.value }))} />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowEditOrgModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-blue-700 cursor-pointer">Save Changes</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* TRANSFER OWNERSHIP */}
      {showTransferModal && selectedOrg && (
        <ModalShell title={`Transfer: ${selectedOrg.workspace_name}`} icon={<ArrowRightLeft className="text-cyan-500" size={18} />} onClose={() => setShowTransferModal(false)}>
          <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs font-semibold">
            <p className="text-slate-400 text-[10px]">Transfer admin ownership to a new user. The old admin will be demoted to Sales Manager.</p>
            <InputField label="New Admin Name" required type="text" value={transferForm.new_admin_name} onChange={e => setTransferForm(p => ({ ...p, new_admin_name: e.target.value }))} placeholder="Full name" />
            <InputField label="New Admin Email" required type="email" value={transferForm.new_admin_email} onChange={e => setTransferForm(p => ({ ...p, new_admin_email: e.target.value }))} placeholder="email@example.com" />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-cyan-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-cyan-700 cursor-pointer">Transfer Ownership</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* EXTEND TRIAL */}
      {showExtendTrialModal && selectedOrg && (
        <ModalShell title={`Extend Trial: ${selectedOrg.workspace_name}`} icon={<CalendarClock className="text-amber-500" size={18} />} onClose={() => setShowExtendTrialModal(false)}>
          <form onSubmit={handleExtendTrialSubmit} className="space-y-4 text-xs font-semibold">
            <p className="text-slate-400 text-[10px]">Current trial: {selectedOrg.trial_days || 0} days · Status: {selectedOrg.plan_status}</p>
            <InputField label="Extra Days to Add" required type="number" min="1" max="365" value={extendTrialForm.extra_days} onChange={e => setExtendTrialForm(p => ({ ...p, extra_days: parseInt(e.target.value) || 1 }))} />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowExtendTrialModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-amber-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-amber-700 cursor-pointer">Extend Trial</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* FEATURE MODAL */}
      {showFeatureModal && selectedOrg && (
        <ModalShell title="Manage Features" icon={<Sliders className="text-violet-500" size={18} />} onClose={() => setShowFeatureModal(false)}>
          <form onSubmit={handleFeatureToggleSubmit} className="space-y-4 text-xs font-semibold">
            <p className="text-slate-400 text-[10px]">Toggle module permissions for {selectedOrg.workspace_name}.</p>
            <SelectField label="Module" value={featureForm.module} onChange={e => setFeatureForm(p => ({ ...p, module: e.target.value }))}>
              {['crm', 'sales', 'whatsapp', 'marketing', 'automation', 'finance', 'hrms', 'support', 'projects', 'ecommerce', 'inventory'].map(m => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </SelectField>
            <SelectField label="Status" value={featureForm.enabled ? 'true' : 'false'} onChange={e => setFeatureForm(p => ({ ...p, enabled: e.target.value === 'true' }))}>
              <option value="true">Enabled</option><option value="false">Disabled</option>
            </SelectField>
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowFeatureModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-violet-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-violet-700 cursor-pointer">Apply</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* PLAN MODAL */}
      {showPlanModal && selectedOrg && (
        <ModalShell title="Upgrade Plan" icon={<TrendingUp className="text-emerald-500" size={18} />} onClose={() => setShowPlanModal(false)}>
          <form onSubmit={handlePlanSubmit} className="space-y-4 text-xs font-semibold">
            <p className="text-slate-400 text-[10px]">Current plan: {selectedOrg.plan_id} for {selectedOrg.workspace_name}.</p>
            <SelectField label="Select Tier" value={planForm.plan_id} onChange={e => setPlanForm(p => ({ ...p, plan_id: e.target.value }))}>
              <option value="starter">Starter</option><option value="growth">Growth</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option>
            </SelectField>
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowPlanModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-emerald-700 cursor-pointer">Update Plan</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ADMIN PASSWORD MODAL */}
      {showPasswordModal && selectedOrg && (
        <ModalShell title="Reset Admin Password" icon={<Key className="text-slate-500" size={18} />} onClose={() => setShowPasswordModal(false)}>
          <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-xs font-semibold">
            <p className="text-slate-400 text-[10px]">Overwrites the admin password for {selectedOrg.workspace_name}.</p>
            <InputField label="New Password" required type="password" value={passwordForm.password} onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 chars" />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-slate-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-slate-700 cursor-pointer">Reset Password</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* USER PASSWORD MODAL */}
      {showUserPasswordModal && selectedUser && (
        <ModalShell title={`Reset: ${selectedUser.full_name}`} icon={<Key className="text-slate-500" size={18} />} onClose={() => setShowUserPasswordModal(false)}>
          <form onSubmit={handleUserPasswordReset} className="space-y-4 text-xs font-semibold">
            <p className="text-slate-400 text-[10px]">Reset password for {selectedUser.email} ({selectedUser.workspace_id}).</p>
            <InputField label="New Password" required type="password" value={userPasswordForm.password} onChange={e => setUserPasswordForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 chars" />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowUserPasswordModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-slate-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-slate-700 cursor-pointer">Reset Password</button>
            </div>
          </form>
        </ModalShell>
      )}
      {/* SAVE PERMISSIONS CONFIRMATION */}
      {showSaveConfirmModal && selectedOrg && (
        <ModalShell title="Confirm Matrix Save" icon={<Shield className="text-indigo-500" size={18} />} onClose={() => setShowSaveConfirmModal(false)}>
          <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
            <p>Are you sure you want to save the granular feature permissions matrix for <span className="text-indigo-500 font-bold">{selectedOrg.workspace_name}</span>?</p>
            <p className="text-[10px] text-slate-400">This will immediately update default access rights across all users in this tenant.</p>
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowSaveConfirmModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button 
                type="button" 
                onClick={handleSavePermissions} 
                disabled={isSavingPermissions}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSavingPermissions ? <RefreshCw size={12} className="animate-spin" /> : null}
                Save Matrix
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
