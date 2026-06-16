import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  Users, Shield, RefreshCw, Key, ToggleLeft, ToggleRight,
  Plus, Search, Check, X, Trash2, Sliders, ShieldCheck,
  Save, Info, Lock, CheckCircle, PlusCircle, Copy, Layers,
  FileText, Settings as SettingsIcon, AlertCircle
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const MODULES_MATRIX = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'crm', label: 'CRM' },
  { key: 'sales', label: 'Sales' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'call_center', label: 'Call Center' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'automation', label: 'Automation' },
  { key: 'finance', label: 'Finance' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'projects', label: 'Projects' },
  { key: 'support', label: 'Support' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Team Management' },
  { key: 'audit_logs', label: 'Audit Logs' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'settings', label: 'Settings' },
  { key: 'ecommerce', label: 'E-Commerce' },
  { key: 'inventory', label: 'Inventory' }
];

const PRESET_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

// ── Helpers (Module Scope) ──
const ModalShell = ({ title, icon, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" onClick={onClose}>
    <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-md'} bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]`} onClick={e => e.stopPropagation()}>
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
  { key: 'dashboard', name: 'Dashboard', desc: 'Overall metrics and widgets' },
  { key: 'crm', name: 'Lead & Sales CRM', desc: 'Leads, contacts, and customer management' },
  { key: 'sales', name: 'Sales Pipeline', desc: 'Deals, pipelines, and conversions' },
  { key: 'whatsapp', name: 'WhatsApp Integration', desc: 'Shared inbox and business templates' },
  { key: 'marketing', name: 'Marketing Campaigns', desc: 'Bulk messaging campaigns' },
  { key: 'automation', name: 'Workflow Automation', desc: 'Automatic rules and action triggers' },
  { key: 'finance', name: 'Finance & Ledger', desc: 'Invoices, quotes, payments, and expenses' },
  { key: 'hrms', name: 'HRMS Suite', desc: 'Employees, leaves, attendance, and payroll' },
  { key: 'support', name: 'Support Desk', desc: 'Customer support tickets resolution queue' },
  { key: 'projects', name: 'Project Management', desc: 'Projects tracking, milestones, and tasks' },
  { key: 'reports', name: 'Custom Reports', desc: 'Customizable reports and exports' },
  { key: 'settings', name: 'Workspace Settings', desc: 'General configuration and white-label branding' },
  { key: 'users', name: 'Team Management', desc: 'Roles assignment and team setup' },
  { key: 'audit_logs', name: 'Security Audit Logs', desc: 'Security logging and audit timeline' },
  { key: 'integrations', name: 'App Integrations', desc: 'External integrations like Meta and Shopify' },
  { key: 'ecommerce', name: 'E-Commerce', desc: 'Manage orders, products, and catalog listings' }
];

const ALLOWED_ROLES_MAP = {
  "Regular Employee": "employee",
  "Organization Admin": "admin_001"
};

const HIERARCHICAL_PAGES = [
  {
    module: 'CRM',
    pages: [
      { key: 'crm_dashboard', label: 'Dashboard' },
      { key: 'crm_leads', label: 'Leads' },
      { key: 'crm_contacts', label: 'Contacts' },
      { key: 'crm_companies', label: 'Companies' },
      { key: 'crm_activities', label: 'Activities' }
    ]
  },
  {
    module: 'Sales',
    pages: [
      { key: 'sales_pipeline', label: 'Pipeline' },
      { key: 'sales_deals', label: 'Deals' },
      { key: 'sales_quotations', label: 'Quotations' }
    ]
  },
  {
    module: 'WhatsApp',
    pages: [
      { key: 'whatsapp_inbox', label: 'Inbox' },
      { key: 'whatsapp_templates', label: 'Templates' },
      { key: 'whatsapp_campaigns', label: 'Campaigns' },
      { key: 'whatsapp_analytics', label: 'Analytics' }
    ]
  },
  {
    module: 'Marketing',
    pages: [
      { key: 'marketing_campaigns', label: 'Campaigns' },
      { key: 'marketing_analytics', label: 'Analytics' }
    ]
  },
  {
    module: 'Automation',
    pages: [
      { key: 'automation_workflows', label: 'Workflows' }
    ]
  },
  {
    module: 'Finance',
    pages: [
      { key: 'finance_invoices', label: 'Invoices' },
      { key: 'finance_payments', label: 'Payments' },
      { key: 'finance_ledger', label: 'Ledger' }
    ]
  },
  {
    module: 'HRMS',
    pages: [
      { key: 'hrms_dashboard', label: 'HRMS Dashboard' },
      { key: 'hrms_directory', label: 'Directory' },
      { key: 'hrms_attendance', label: 'Attendance' },
      { key: 'hrms_leaves', label: 'Leaves' },
      { key: 'hrms_payroll', label: 'Payroll' }
    ]
  },
  {
    module: 'Projects',
    pages: [
      { key: 'projects_dashboard', label: 'Dashboard' },
      { key: 'projects_taskboard', label: 'Task Board' },
      { key: 'projects_gantt', label: 'Gantt Chart' }
    ]
  },
  {
    module: 'Support',
    pages: [
      { key: 'support_tickets', label: 'Tickets' },
      { key: 'support_sla', label: 'SLA Reports' }
    ]
  },
  {
    module: 'E-Commerce',
    pages: [
      { key: 'ecommerce_orders', label: 'Orders' },
      { key: 'ecommerce_track', label: 'Order Tracking' },
      { key: 'ecommerce_products', label: 'Products' },
      { key: 'ecommerce_inventory', label: 'Inventory' },
      { key: 'ecommerce_abandoned', label: 'Abandoned Carts' }
    ]
  }
];

const MATRIX_COLUMNS = [
  { key: 'canView', label: 'View' },
  { key: 'canCreate', label: 'Create' },
  { key: 'canEdit', label: 'Edit' },
  { key: 'canDelete', label: 'Delete' },
  { key: 'canExport', label: 'Export' },
  { key: 'canImport', label: 'Import' },
  { key: 'canAssign', label: 'Assign' },
  { key: 'canApprove', label: 'Approve' }
];

const BUTTONS_LIST = [
  { key: 'add', label: 'Add Button' },
  { key: 'edit', label: 'Edit Button' },
  { key: 'delete', label: 'Delete Button' },
  { key: 'export', label: 'Export Button' },
  { key: 'import', label: 'Import Button' },
  { key: 'assign', label: 'Assign Button' },
  { key: 'approve', label: 'Approve Button' },
  { key: 'generate_invoice', label: 'Generate Invoice' },
  { key: 'send_campaign', label: 'Send Campaign' },
  { key: 'run_automation', label: 'Run Automation' },
  { key: 'create_project', label: 'Create Project' },
  { key: 'add_employee', label: 'Add Employee' }
];

const DEPARTMENTS = ['Sales', 'Marketing', 'HR', 'Finance', 'Support', 'Operations', 'Projects'];

export default function WorkspaceAdmin() {
  const { addToast, token, tenantId, roles = [], createRole, updateRole, deleteRole, duplicateRole } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';
  const setActiveTab = (tab) => setSearchParams({ tab });

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [rolesSummary, setRolesSummary] = useState([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState([]);
  const [modulesStatus, setModulesStatus] = useState({});
  const [permissionsSearch, setPermissionsSearch] = useState('');

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Custom Permissions Modal States
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsModalTab, setPermissionsModalTab] = useState('pages');
  const [selectedUserPermissions, setSelectedUserPermissions] = useState(null);
  const [userPagesPermissions, setUserPagesPermissions] = useState([]);
  const [userButtonsPermissions, setUserButtonsPermissions] = useState([]);
  const [userDepartmentAccess, setUserDepartmentAccess] = useState([]);
  const [userBranchAccess, setUserBranchAccess] = useState('all');
  const [userLocalPermissions, setUserLocalPermissions] = useState([]);
  const [savingUserPerms, setSavingUserPerms] = useState(false);

  // --- Embedded Roles & Permissions States ---
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showDuplicateRoleModal, setShowDuplicateRoleModal] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleActiveTab, setRoleActiveTab] = useState('pages'); // 'pages', 'modules', 'buttons', 'data'
  
  // New role form state
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    roleColor: '#6366f1',
    status: 'active'
  });
  
  // Duplication target state
  const [duplicateName, setDuplicateName] = useState('');
  
  // Local config states for selected role (synced on role selection)
  const [roleNameState, setRoleNameState] = useState('');
  const [roleDescriptionState, setRoleDescriptionState] = useState('');
  const [roleColorState, setRoleColorState] = useState('');
  const [roleStatusState, setRoleStatusState] = useState('active');
  const [rolePagesPermissions, setRolePagesPermissions] = useState([]);
  const [roleButtonsPermissions, setRoleButtonsPermissions] = useState([]);
  const [roleDepartmentAccess, setRoleDepartmentAccess] = useState([]);
  const [roleBranchAccess, setRoleBranchAccess] = useState('all');
  const [roleLocalPermissions, setRoleLocalPermissions] = useState([]);

  // Forms
  const blankUser = { email: '', full_name: '', role_name: 'Regular Employee', password: '', phone: '' };
  const [newUserForm, setNewUserForm] = useState({ ...blankUser });
  const [passwordForm, setPasswordForm] = useState({ password: '' });

  const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0] || null;

  // Sync selected role to local states
  useEffect(() => {
    if (selectedRole) {
      setRoleNameState(selectedRole.name || '');
      setRoleDescriptionState(selectedRole.description || '');
      setRoleColorState(selectedRole.roleColor || '#6366f1');
      setRoleStatusState(selectedRole.status || 'active');
      
      try {
        setRolePagesPermissions(
          selectedRole.pagesPermissions ? JSON.parse(selectedRole.pagesPermissions) : []
        );
      } catch (e) {
        setRolePagesPermissions([]);
      }

      try {
        setRoleButtonsPermissions(
          selectedRole.buttonsPermissions ? JSON.parse(selectedRole.buttonsPermissions) : []
        );
      } catch (e) {
        setRoleButtonsPermissions([]);
      }

      try {
        setRoleDepartmentAccess(
          selectedRole.departmentAccess ? JSON.parse(selectedRole.departmentAccess) : []
        );
      } catch (e) {
        setRoleDepartmentAccess([]);
      }

      setRoleBranchAccess(selectedRole.branchAccess || 'all');

      const mapped = MODULES_MATRIX.map(m => {
        const existing = (selectedRole.permissions || []).find(p => p.module === m.key);
        return {
          module: m.key,
          canView: existing ? !!existing.canView : false,
          canCreate: existing ? !!existing.canCreate : false,
          canEdit: existing ? !!existing.canEdit : false,
          canDelete: existing ? !!existing.canDelete : false,
          canExport: existing ? !!existing.canExport : false,
          canImport: existing ? !!existing.canImport : false,
          canApprove: existing ? !!existing.canApprove : false,
          canAssign: existing ? !!existing.canAssign : false,
          recordScope: existing ? existing.recordScope || 'all' : 'all'
        };
      });
      setRoleLocalPermissions(mapped);

      if (!selectedRoleId && selectedRole.id) {
        setSelectedRoleId(selectedRole.id);
      }
    } else {
      setRoleLocalPermissions([]);
    }
  }, [selectedRole?.id]);

  const handleToggleRolePage = (pageKey) => {
    if (!selectedRole?.isCustom) return;
    setRolePagesPermissions(prev => 
      prev.includes(pageKey) ? prev.filter(k => k !== pageKey) : [...prev, pageKey]
    );
  };

  const handleToggleAllRolePagesInModule = (modulePages, isAllChecked) => {
    if (!selectedRole?.isCustom) return;
    const pageKeys = modulePages.map(p => p.key);
    if (isAllChecked) {
      setRolePagesPermissions(prev => prev.filter(k => !pageKeys.includes(k)));
    } else {
      setRolePagesPermissions(prev => [...new Set([...prev, ...pageKeys])]);
    }
  };

  const handleToggleRoleMatrixCheckbox = (moduleKey, actionKey) => {
    if (!selectedRole?.isCustom) return;
    setRoleLocalPermissions(prev => prev.map(p => {
      if (p.module === moduleKey) {
        return { ...p, [actionKey]: !p[actionKey] };
      }
      return p;
    }));
  };

  const handleToggleAllRoleMatrixInRow = (moduleKey, isAllChecked) => {
    if (!selectedRole?.isCustom) return;
    setRoleLocalPermissions(prev => prev.map(p => {
      if (p.module === moduleKey) {
        const updated = {};
        MATRIX_COLUMNS.forEach(col => {
          updated[col.key] = !isAllChecked;
        });
        return { ...p, ...updated };
      }
      return p;
    }));
  };

  const handleToggleRoleScopeChange = (moduleKey, scope) => {
    if (!selectedRole?.isCustom) return;
    setRoleLocalPermissions(prev => prev.map(p => {
      if (p.module === moduleKey) {
        return { ...p, recordScope: scope };
      }
      return p;
    }));
  };

  const handleToggleRoleButton = (btnKey) => {
    if (!selectedRole?.isCustom) return;
    setRoleButtonsPermissions(prev => 
      prev.includes(btnKey) ? prev.filter(k => k !== btnKey) : [...prev, btnKey]
    );
  };

  const handleToggleRoleDepartment = (dept) => {
    if (!selectedRole?.isCustom) return;
    setRoleDepartmentAccess(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handleCreateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!newRole.name) {
      addToast('Role name is required.', 'error');
      return;
    }

    const initialPerms = MODULES_MATRIX.map(m => ({
      module: m.key,
      canView: m.key === 'crm' || m.key === 'sales',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canApprove: false,
      canAssign: false,
      recordScope: 'all'
    }));

    const defaultPages = ['crm_dashboard', 'crm_leads', 'sales_pipeline'];

    try {
      const created = await createRole({
        name: newRole.name,
        description: newRole.description,
        roleColor: newRole.roleColor,
        status: newRole.status,
        pagesPermissions: JSON.stringify(defaultPages),
        buttonsPermissions: JSON.stringify(['add', 'edit']),
        departmentAccess: JSON.stringify([]),
        branchAccess: 'all',
        permissions: initialPerms
      });
      if (created) {
        setSelectedRoleId(created.id);
        setShowCreateRoleModal(false);
        setNewRole({ name: '', description: '', roleColor: '#6366f1', status: 'active' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!duplicateName) {
      addToast('Duplicate role name is required.', 'error');
      return;
    }
    try {
      const duplicated = await duplicateRole(selectedRole.id, duplicateName);
      if (duplicated) {
        setSelectedRoleId(duplicated.id);
        setShowDuplicateRoleModal(false);
        setDuplicateName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRoleSettings = async () => {
    if (!selectedRole || !selectedRole.isCustom) return;
    setIsSavingRole(true);
    try {
      await updateRole(selectedRole.id, {
        name: roleNameState,
        description: roleDescriptionState,
        roleColor: roleColorState,
        status: roleStatusState,
        pagesPermissions: JSON.stringify(rolePagesPermissions),
        buttonsPermissions: JSON.stringify(roleButtonsPermissions),
        departmentAccess: JSON.stringify(roleDepartmentAccess),
        branchAccess: roleBranchAccess,
        permissions: roleLocalPermissions
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRoleAction = async (roleId) => {
    if (confirm('Are you sure you want to delete this custom role? This action cannot be undone.')) {
      try {
        const success = await deleteRole(roleId);
        if (success) {
          setSelectedRoleId('');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditUserPermissions = async (user) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.user_id}/permissions`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setSelectedUserPermissions(data);
        setUserPagesPermissions(data.pages_permissions || []);
        setUserButtonsPermissions(data.buttons_permissions || []);
        setUserDepartmentAccess(data.department_access || []);
        setUserBranchAccess(data.branch_access || 'all');
        setUserLocalPermissions(data.permissions || []);
        setPermissionsModalTab('pages');
        setShowPermissionsModal(true);
      } else {
        const d = await res.json();
        addToast(d.detail || 'Failed to fetch employee permissions', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching employee permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserPermissions = async (e) => {
    e.preventDefault();
    setSavingUserPerms(true);
    try {
      const payload = {
        pages_permissions: userPagesPermissions,
        buttons_permissions: userButtonsPermissions,
        department_access: userDepartmentAccess,
        branch_access: userBranchAccess,
        permissions: userLocalPermissions
      };
      const res = await fetch(`${API_BASE}/admin/users/${selectedUserPermissions.user_id}/permissions`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        addToast('Employee permissions updated successfully', 'success');
        setShowPermissionsModal(false);
        try {
          const channel = new BroadcastChannel('crm-auth-channel');
          channel.postMessage({ type: 'REFRESH_PROFILE' });
          channel.close();
        } catch (err) {
          console.error(err);
        }
      } else {
        const d = await res.json();
        addToast(d.detail || 'Failed to update employee permissions', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving permissions', 'error');
    } finally {
      setSavingUserPerms(false);
    }
  };

  const getModulePermission = (moduleKey, field) => {
    const perm = userLocalPermissions.find(p => p.module === moduleKey);
    return perm ? !!perm[field] : false;
  };

  const setModulePermission = (moduleKey, field, value) => {
    setUserLocalPermissions(prev => {
      const existingIndex = prev.findIndex(p => p.module === moduleKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], [field]: value };
        return updated;
      } else {
        return [...prev, {
          module: moduleKey,
          canView: field === 'canView' ? value : false,
          canCreate: field === 'canCreate' ? value : false,
          canEdit: field === 'canEdit' ? value : false,
          canDelete: field === 'canDelete' ? value : false,
          canExport: field === 'canExport' ? value : false,
          canImport: field === 'canImport' ? value : false,
          canAssign: field === 'canAssign' ? value : false,
          canApprove: field === 'canApprove' ? value : false,
          canArchive: false,
          recordScope: 'all'
        }];
      }
    });
  };

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || 'rapidmodel_corp',
  }), [token, tenantId]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = userSearch ? `?search=${encodeURIComponent(userSearch)}` : '';
      const res = await fetch(`${API_BASE}/admin/users${query}`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setUsers(d.data || []);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading workspace users', 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, userSearch, addToast]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/roles-summary`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setRolesSummary(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [getHeaders]);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/permissions`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setPermissionsMatrix(d.data.permissions || []);
        setModulesStatus(d.data.modules_status || {});
      }
    } catch (err) {
      console.error(err);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchRoles();
    } else if (activeTab === 'roles') {
      fetchRoles();
    } else if (activeTab === 'permissions') {
      fetchPermissions();
    }
  }, [activeTab, fetchUsers, fetchRoles, fetchPermissions]);

  // Handle Add User
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newUserForm)
      });
      const d = await res.json();
      if (res.ok) {
        addToast('Employee created successfully', 'success');
        setShowAddUserModal(false);
        setNewUserForm({ ...blankUser });
        fetchUsers();
        if (d.data && d.data.user_id && newUserForm.role_name !== 'Organization Admin') {
          handleEditUserPermissions(d.data);
        }
      } else {
        addToast(d.detail || 'Failed to create employee', 'error');
      }
    } catch (err) {
      addToast('Error creating user', 'error');
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/users/${selectedUser.user_id}/password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(passwordForm)
      });
      if (res.ok) {
        addToast('Password updated successfully', 'success');
        setShowPasswordModal(false);
        setPasswordForm({ password: '' });
      } else {
        const d = await res.json();
        addToast(d.detail || 'Failed to reset password', 'error');
      }
    } catch (err) {
      addToast('Error updating password', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user_id) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this employee?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user_id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addToast('Employee deactivated successfully', 'success');
        fetchUsers();
      } else {
        const d = await res.json();
        addToast(d.detail || 'Failed to deactivate employee', 'error');
      }
    } catch (err) {
      addToast('Error deactivating user', 'error');
    }
  };

  // Matrix checkbox handling
  const toggleCheckbox = (module, feature, col) => {
    setPermissionsMatrix(prev => prev.map(p => {
      if (p.module === module && p.feature === feature) {
        const updated = { ...p };
        if (col === 'can_full') {
          const val = updated.can_full === 1 ? 0 : 1;
          updated.can_full = val;
          updated.can_add = val;
          updated.can_edit = val;
          updated.can_delete = val;
          updated.can_view = val;
        } else {
          updated[col] = updated[col] === 1 ? 0 : 1;
          if (updated[col] === 0) {
            updated.can_full = 0;
          } else if (updated.can_add && updated.can_edit && updated.can_delete && updated.can_view) {
            updated.can_full = 1;
          }
        }
        return updated;
      }
      return p;
    }));
  };

  // Toggle Module Status
  const handleToggleModule = (moduleKey) => {
    const nextVal = !modulesStatus[moduleKey];
    setModulesStatus(prev => ({ ...prev, [moduleKey]: nextVal }));

    // Auto toggle all sub-permissions to match
    setPermissionsMatrix(prev => prev.map(p => {
      if (p.module === moduleKey) {
        const val = nextVal ? 1 : 0;
        return {
          ...p,
          can_add: val,
          can_edit: val,
          can_delete: val,
          can_view: val,
          can_full: val
        };
      }
      return p;
    }));
  };

  // Save Permissions matrix
  const handleSavePermissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/permissions`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          modules_status: modulesStatus,
          permissions: permissionsMatrix
        })
      });
      if (res.ok) {
        addToast('Workspace settings saved successfully', 'success');
        setShowSaveConfirmModal(false);
        try {
          const channel = new BroadcastChannel('crm-auth-channel');
          channel.postMessage({ type: 'REFRESH_PROFILE' });
          channel.close();
        } catch (err) {
          console.error(err);
        }
      } else {
        addToast('Failed to save settings', 'error');
      }
    } catch (err) {
      addToast('Error saving settings', 'error');
    }
  };

  const filteredPermissions = permissionsMatrix.filter(p => {
    const query = permissionsSearch.toLowerCase();
    return p.module.toLowerCase().includes(query) || p.feature.toLowerCase().includes(query);
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Workspace Admin Console" 
        subtitle="Manage employees, configure feature flags, and update workspace access boundaries." 
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
            activeTab === 'users' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5"><Users size={14} /> Employees</span>
        </button>
        <button 
          onClick={() => setActiveTab('roles')} 
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
            activeTab === 'roles' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5"><Shield size={14} /> Roles & Permissions</span>
        </button>
        <button 
          onClick={() => setActiveTab('permissions')} 
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
            activeTab === 'permissions' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5"><Sliders size={14} /> Feature Toggles</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="animate-spin text-indigo-600" size={24} />
        </div>
      ) : (
        <>
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Search size={14} /></span>
                  <input 
                    type="text" 
                    placeholder="Search employees by name, email, or phone..." 
                    value={userSearch} 
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1329] rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setActiveTab('roles');
                      setShowCreateRoleModal(true);
                    }}
                    className="border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle size={14} /> Create Custom Role
                  </button>
                  <button 
                    onClick={() => setShowAddUserModal(true)} 
                    className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> Add Employee
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role Designation</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-600 dark:text-slate-350">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-400">No employees found in this workspace.</td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{u.full_name}</td>
                          <td className="p-4">{u.email}</td>
                          <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">{u.role_name}</span></td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-red-50 text-red-600'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-1.5">
                            {u.role_name !== 'Organization Admin' && u.role_name !== 'Super Admin' && (
                              <ActionBtn title="Edit Permissions" onClick={() => handleEditUserPermissions(u)} className="hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-500">
                                <Shield size={14} />
                              </ActionBtn>
                            )}
                            <ActionBtn title="Reset Password" onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }} className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Key size={14} /></ActionBtn>
                            <ActionBtn title="Deactivate/Delete User" onClick={() => handleDeleteUser(u.user_id)} className="hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"><Trash2 size={14} /></ActionBtn>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Roles & Policy Templates</h3>
                <button 
                  onClick={() => setShowCreateRoleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  <PlusCircle size={15} /> Create Custom Role
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Roles Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider px-1">Access Profiles</h3>
                    
                    <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                      {roles.map(role => (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRoleId(role.id)}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all border flex justify-between items-start ${
                            selectedRoleId === role.id
                              ? 'bg-indigo-55/10 dark:bg-indigo-950/15 border-indigo-200/50 dark:border-indigo-900/30 shadow-xs'
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-transparent'
                          }`}
                        >
                          <div className="space-y-1 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/5" 
                                style={{ backgroundColor: role.roleColor || '#6366f1' }}
                              />
                              <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">{role.name}</span>
                              {!role.isCustom && (
                                <span className="text-[7.5px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 font-extrabold rounded-full uppercase">System</span>
                              )}
                              {role.status === 'archived' && (
                                <span className="text-[7.5px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-extrabold rounded-full uppercase">Archived</span>
                              )}
                              {role.status === 'disabled' && (
                                <span className="text-[7.5px] px-1.5 py-0.2 bg-rose-150/20 text-rose-500 font-extrabold rounded-full uppercase">Disabled</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 leading-relaxed line-clamp-1">{role.description || 'Access policy role.'}</p>
                          </div>
                          {role.isCustom && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedRoleId(role.id); setShowDuplicateRoleModal(true); }}
                                title="Duplicate Role"
                                className="p-1 hover:text-indigo-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-450 cursor-pointer"
                              >
                                <Copy size={12} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteRoleAction(role.id); }}
                                title="Delete Role"
                                className="p-1 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-450 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Workspace Matrix Config */}
                <div className="col-span-12 lg:col-span-8">
                  {selectedRole ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                      
                      {/* Role Header Info */}
                      <div className="p-4.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1 flex-1">
                            {selectedRole.isCustom ? (
                              <input 
                                type="text"
                                value={roleNameState}
                                onChange={(e) => setRoleNameState(e.target.value)}
                                placeholder="Role Name"
                                className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-350 dark:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5"
                              />
                            ) : (
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Lock size={13} className="text-green-600" /> {selectedRole.name}
                              </h3>
                            )}
                            
                            {selectedRole.isCustom ? (
                              <input 
                                type="text"
                                value={roleDescriptionState}
                                onChange={(e) => setRoleDescriptionState(e.target.value)}
                                placeholder="Describe the target audience or scope for this access profile..."
                                className="text-[10px] text-slate-400 bg-transparent border-b border-dashed border-slate-350 dark:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5 w-full block mt-1"
                              />
                            ) : (
                              <p className="text-[10px] text-slate-450 leading-relaxed">{selectedRole.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {selectedRole.isCustom && (
                              <div className="flex items-center gap-2">
                                {/* Status Select */}
                                <select
                                  value={roleStatusState}
                                  onChange={(e) => setRoleStatusState(e.target.value)}
                                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] font-bold focus:outline-none"
                                >
                                  <option value="active">Active</option>
                                  <option value="archived">Archived</option>
                                  <option value="disabled">Disabled</option>
                                </select>

                                {/* Colors preset list */}
                                <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 p-1 rounded-xl bg-slate-50 dark:bg-slate-850">
                                  {PRESET_COLORS.map(c => (
                                    <button
                                      key={c}
                                      onClick={() => setRoleColorState(c)}
                                      className={`w-4 h-4 rounded-full transition-transform border border-black/5 hover:scale-110 cursor-pointer ${
                                        roleColorState === c ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 scale-105' : ''
                                      }`}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedRole.isCustom ? (
                              <button 
                                onClick={handleSaveRoleSettings}
                                disabled={isSavingRole}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Save size={13} /> {isSavingRole ? 'Saving...' : 'Save Settings'}
                              </button>
                            ) : (
                              <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 border border-green-200 dark:border-green-900/30 rounded-xl flex items-center gap-1">
                                <CheckCircle size={10} /> Read-only System Profile
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inner configuration tabs */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-1 mt-2">
                          <button
                            onClick={() => setRoleActiveTab('pages')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                              roleActiveTab === 'pages'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            1. Page-Level Access
                          </button>
                          <button
                            onClick={() => setRoleActiveTab('modules')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                              roleActiveTab === 'modules'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            2. Module Matrices
                          </button>
                          <button
                            onClick={() => setRoleActiveTab('buttons')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                              roleActiveTab === 'buttons'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            3. Button Controls
                          </button>
                          <button
                            onClick={() => setRoleActiveTab('data')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                              roleActiveTab === 'data'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            4. Departments & Branches
                          </button>
                        </div>
                      </div>

                      {/* Tab Content Areas */}
                      <div className="flex-1 overflow-y-auto max-h-[600px] p-6">
                        
                        {/* 1. Page-Level Permissions */}
                        {roleActiveTab === 'pages' && (
                          <div className="space-y-6">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800 rounded-xl text-[10px] text-slate-450 flex items-start gap-2">
                              <AlertCircle size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <span>Select which exact page routes are allowed. Unchecked pages will be automatically hidden from the navigation sidebar and blocked at the router level.</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {HIERARCHICAL_PAGES.map(group => {
                                const allPageKeys = group.pages.map(p => p.key);
                                const checkedKeys = allPageKeys.filter(k => rolePagesPermissions.includes(k));
                                const isAllChecked = checkedKeys.length === allPageKeys.length;

                                return (
                                  <div 
                                    key={group.module} 
                                    className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 bg-slate-50/20 dark:bg-slate-950/10 space-y-3.5"
                                  >
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                                      <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{group.module} Pages</span>
                                      <button
                                        type="button"
                                        disabled={!selectedRole.isCustom}
                                        onClick={() => handleToggleAllRolePagesInModule(group.pages, isAllChecked)}
                                        className={`text-[10px] font-extrabold uppercase hover:underline cursor-pointer disabled:opacity-50 ${
                                          isAllChecked ? 'text-rose-500' : 'text-indigo-600'
                                        }`}
                                      >
                                        {isAllChecked ? 'Deselect All' : 'Select All'}
                                      </button>
                                    </div>

                                    <div className="space-y-2.5">
                                      {group.pages.map(p => {
                                        const isChecked = rolePagesPermissions.includes(p.key);
                                        return (
                                          <label 
                                            key={p.key} 
                                            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                              isChecked
                                                ? 'bg-indigo-50/10 border-indigo-200/40 dark:border-indigo-900/20 text-slate-900 dark:text-white font-bold'
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 text-slate-450 hover:bg-slate-50/50'
                                            } ${selectedRole.isCustom ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                          >
                                            <span className="text-xs">{p.label}</span>
                                            <input 
                                              type="checkbox"
                                              checked={isChecked}
                                              disabled={!selectedRole.isCustom}
                                              onChange={() => handleToggleRolePage(p.key)}
                                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                            />
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 2. Module Actions Matrix */}
                        {roleActiveTab === 'modules' && (
                          <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800 rounded-xl text-[10px] text-slate-450 flex items-start gap-2">
                              <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <span>Salesforce-like actions matrix. Toggle custom operations and specify target record visibility scope for every business module.</span>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-xl">
                              <table className="w-full text-left border-collapse min-w-[950px]">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/40 dark:bg-slate-950/30">
                                    <th className="px-5 py-3">Module</th>
                                    {MATRIX_COLUMNS.map(col => (
                                      <th key={col.key} className="px-2 py-3 text-center">{col.label}</th>
                                    ))}
                                    <th className="px-4 py-3">Record Scope</th>
                                    <th className="px-4 py-3 text-center">Row Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150/40 dark:divide-slate-800/40 text-xs font-semibold">
                                  {roleLocalPermissions.map(p => {
                                    const isRowAllChecked = MATRIX_COLUMNS.every(col => p[col.key]);
                                    return (
                                      <tr key={p.module} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                        <td className="px-5 py-3.5 text-slate-900 dark:text-white font-bold">{p.module.toUpperCase()}</td>
                                        
                                        {MATRIX_COLUMNS.map(col => {
                                          const val = p[col.key];
                                          return (
                                            <td key={col.key} className="px-2 py-3.5 text-center">
                                              <button
                                                type="button"
                                                disabled={!selectedRole.isCustom}
                                                onClick={() => handleToggleRoleMatrixCheckbox(p.module, col.key)}
                                                className={`inline-flex transition-colors cursor-pointer ${
                                                  !selectedRole.isCustom ? 'opacity-60 cursor-not-allowed' : ''
                                                } ${val ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'}`}
                                              >
                                                {val ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                              </button>
                                            </td>
                                          );
                                        })}

                                        <td className="px-4 py-3">
                                          <select
                                            value={p.recordScope}
                                            disabled={!selectedRole.isCustom}
                                            onChange={(e) => handleToggleRoleScopeChange(p.module, e.target.value)}
                                            className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none"
                                          >
                                            <option value="own">My Records Only</option>
                                            <option value="team">Team Records</option>
                                            <option value="department">Department Records</option>
                                            <option value="all">All Organization Records</option>
                                          </select>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                          <button
                                            type="button"
                                            disabled={!selectedRole.isCustom}
                                            onClick={() => handleToggleAllRoleMatrixInRow(p.module, isRowAllChecked)}
                                            className="text-[9px] font-extrabold uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 disabled:opacity-50 cursor-pointer"
                                          >
                                            {isRowAllChecked ? 'Clear' : 'Select All'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 3. Button Level Actions */}
                        {roleActiveTab === 'buttons' && (
                          <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800 rounded-xl text-[10px] text-slate-450 flex items-start gap-2">
                              <AlertCircle size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <span>Decide which actionable buttons are enabled/rendered in forms and dashboards. Untoggled buttons will be hidden from the UI.</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {BUTTONS_LIST.map(btn => {
                                const isChecked = roleButtonsPermissions.includes(btn.key);
                                return (
                                  <label 
                                    key={btn.key}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                      isChecked
                                        ? 'bg-indigo-55/5 border-indigo-200/50 dark:border-indigo-900/30 text-slate-900 dark:text-white font-bold shadow-xs'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-450 hover:bg-slate-50/50'
                                    } ${selectedRole.isCustom ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                  >
                                    <span className="text-xs">{btn.label}</span>
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={!selectedRole.isCustom}
                                      onChange={() => handleToggleRoleButton(btn.key)}
                                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 4. Departments & Branches */}
                        {roleActiveTab === 'data' && (
                          <div className="space-y-6">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800 rounded-xl text-[10px] text-slate-450 flex items-start gap-2">
                              <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <span>Define data-level department membership limits and branch-based visibility restrictions.</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Department Restrictions */}
                              <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 bg-slate-50/20 dark:bg-slate-950/10 space-y-4">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Department Membership Access</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Restrict employees assigned to this role to records of specific departments.</p>
                                </div>

                                <div className="space-y-2">
                                  {DEPARTMENTS.map(dept => {
                                    const isChecked = roleDepartmentAccess.includes(dept);
                                    return (
                                      <label 
                                        key={dept} 
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                          isChecked
                                            ? 'bg-indigo-55/5 border-indigo-200/50 dark:border-indigo-900/30 text-slate-900 dark:text-white font-bold'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/85 text-slate-450 hover:bg-slate-50/50'
                                        } ${selectedRole.isCustom ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                      >
                                        <span className="text-xs">{dept}</span>
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          disabled={!selectedRole.isCustom}
                                          onChange={() => handleToggleRoleDepartment(dept)}
                                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Branch Restrictions */}
                              <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 bg-slate-50/20 dark:bg-slate-950/10 space-y-4">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Branch Restriction Boundaries</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Select general branch scope for visibility borders.</p>
                                </div>

                                <div className="space-y-3.5">
                                  {[
                                    { key: 'all', label: 'All Branches (Global Visibility)', desc: 'Can see records across all geographic corporate locations.' },
                                    { key: 'own', label: 'Own Corporate Branch', desc: 'Restricted solely to records from matching employee branch.' },
                                    { key: 'own_records', label: 'Personal Records Only', desc: 'Most restricted level. Can only see records created by this profile.' }
                                  ].map(b => (
                                    <label 
                                      key={b.key}
                                      className={`flex flex-col p-3 rounded-xl border transition-all ${
                                        roleBranchAccess === b.key
                                          ? 'bg-indigo-55/5 border-indigo-200/50 dark:border-indigo-900/30 text-slate-900 dark:text-white font-bold shadow-xs'
                                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/85 text-slate-450 hover:bg-slate-50/50'
                                      } ${selectedRole.isCustom ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs">{b.label}</span>
                                        <input 
                                          type="radio"
                                          name="branch_access"
                                          value={b.key}
                                          checked={roleBranchAccess === b.key}
                                          disabled={!selectedRole.isCustom}
                                          onChange={(e) => selectedRole.isCustom && setRoleBranchAccess(e.target.value)}
                                          className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                        />
                                      </div>
                                      <span className="text-[9px] text-slate-400 font-semibold mt-1 leading-relaxed">{b.desc}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">No role selected.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PERMISSIONS MATRIX TAB */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Search size={14} /></span>
                  <input 
                    type="text" 
                    placeholder="Search modules or specific features..." 
                    value={permissionsSearch} 
                    onChange={e => setPermissionsSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1329] rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <button 
                  onClick={() => setShowSaveConfirmModal(true)} 
                  className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Save Settings Matrix
                </button>
              </div>

              {/* Module enabling section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {ALL_MODULES.map(m => (
                  <div key={m.key} className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start justify-between shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{m.desc}</p>
                    </div>
                    <button onClick={() => handleToggleModule(m.key)} className="text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors">
                      {modulesStatus[m.key] ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-slate-400" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Grid table */}
              <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Module / Feature</th>
                      <th className="p-4 text-center">ADD</th>
                      <th className="p-4 text-center">EDIT</th>
                      <th className="p-4 text-center">DELETE</th>
                      <th className="p-4 text-center">VIEW</th>
                      <th className="p-4 text-center">FULL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    {filteredPermissions.map(p => (
                      <tr key={`${p.module}-${p.feature}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[9px] font-bold uppercase tracking-wider mr-2">{p.module}</span>
                          <span className="text-slate-900 dark:text-white">{p.feature}</span>
                          <div className="text-[9px] text-slate-400 font-bold mt-0.5">{p.link}</div>
                        </td>
                        {['can_add', 'can_edit', 'can_delete', 'can_view', 'can_full'].map(col => (
                          <td key={col} className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={p[col] === 1} 
                              onChange={() => toggleCheckbox(p.module, p.feature, col)}
                              disabled={!modulesStatus[p.module]}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <ModalShell title="Add New Employee" icon={<Plus className="text-indigo-600" size={18} />} onClose={() => setShowAddUserModal(false)}>
          <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-bold">
            <InputField 
              label="Full Name" 
              required 
              type="text" 
              value={newUserForm.full_name} 
              onChange={e => setNewUserForm(p => ({ ...p, full_name: e.target.value }))} 
              placeholder="e.g. John Doe"
            />
            <InputField 
              label="Email Address" 
              required 
              type="email" 
              value={newUserForm.email} 
              onChange={e => setNewUserForm(p => ({ ...p, email: e.target.value }))} 
              placeholder="e.g. john@company.com"
            />
            <InputField 
              label="Phone Number" 
              type="text" 
              value={newUserForm.phone || ''} 
              onChange={e => setNewUserForm(p => ({ ...p, phone: e.target.value }))} 
              placeholder="Optional"
            />
            <SelectField 
              label="Assign Role Template" 
              value={newUserForm.role_name} 
              onChange={e => setNewUserForm(p => ({ ...p, role_name: e.target.value }))}
            >
              <option value="Regular Employee">Regular Employee (Empty Template)</option>
              <option value="Organization Admin">Organization Admin</option>
              {rolesSummary
                .filter(r => r.role_name !== 'Organization Admin' && r.role_name !== 'Super Admin' && !r.role_id?.startsWith('role_custom_') && !r.role_name?.startsWith('Role for '))
                .map(r => (
                  <option key={r.role_id} value={r.role_name}>{r.role_name}</option>
                ))}
            </SelectField>
            <InputField 
              label="Initial Password" 
              required 
              type="password" 
              value={newUserForm.password} 
              onChange={e => setNewUserForm(p => ({ ...p, password: e.target.value }))} 
              placeholder="Min 6 characters"
            />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowAddUserModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer">Create User</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && selectedUser && (
        <ModalShell title={`Reset Password: ${selectedUser.full_name}`} icon={<Key className="text-slate-500" size={18} />} onClose={() => setShowPasswordModal(false)}>
          <form onSubmit={handlePasswordReset} className="space-y-4 text-xs font-bold">
            <p className="text-slate-400 text-[10px]">Updating password for {selectedUser.email}.</p>
            <InputField 
              label="New Password" 
              required 
              type="password" 
              value={passwordForm.password} 
              onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))} 
              placeholder="Min 6 characters"
            />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer">Save Password</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* SAVE CONFIRM MATRIX MODAL */}
      {showSaveConfirmModal && (
        <ModalShell title="Confirm Bulk Settings Update" icon={<Shield className="text-indigo-600" size={18} />} onClose={() => setShowSaveConfirmModal(false)}>
          <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
            <p>Are you sure you want to save the new module states and granular settings for this organization?</p>
            <p className="text-[10px] text-slate-400">All features of disabled modules will be completely hidden from employee screens immediately.</p>
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowSaveConfirmModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSavePermissions} className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer">Save Settings</button>
            </div>
          </div>
        </ModalShell>
      )}


      {/* USER PERMISSIONS MODAL */}
      {showPermissionsModal && selectedUserPermissions && (
        <ModalShell 
          title={`Edit Permissions: ${selectedUserPermissions.full_name}`} 
          icon={<Shield className="text-indigo-600" size={18} />} 
          onClose={() => setShowPermissionsModal(false)}
          wide
        >
          <form onSubmit={handleSaveUserPermissions} className="space-y-4 text-xs font-semibold">
            {/* Modal tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-4">
              {[
                { key: 'pages', label: 'Pages Access' },
                { key: 'buttons', label: 'Actions / Buttons' },
                { key: 'matrix', label: 'Module Matrix' },
                { key: 'data_scope', label: 'Data Boundaries' }
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setPermissionsModalTab(t.key)}
                  className={`pb-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
                    permissionsModalTab === t.key 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: PAGES */}
            {permissionsModalTab === 'pages' && (
              <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1">
                <p className="text-[10px] text-slate-400 font-semibold mb-2">Select which specific pages this employee has permission to view.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {HIERARCHICAL_PAGES.map(group => (
                    <div key={group.module} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.module} Pages</span>
                        <button
                          type="button"
                          onClick={() => {
                            const groupKeys = group.pages.map(p => p.key);
                            const allSelected = groupKeys.every(k => userPagesPermissions.includes(k));
                            if (allSelected) {
                              setUserPagesPermissions(prev => prev.filter(k => !groupKeys.includes(k)));
                            } else {
                              setUserPagesPermissions(prev => [...new Set([...prev, ...groupKeys])]);
                            }
                          }}
                          className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          Toggle All
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {group.pages.map(page => {
                          const isChecked = userPagesPermissions.includes(page.key);
                          return (
                            <label key={page.key} className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setUserPagesPermissions(prev => prev.filter(k => k !== page.key));
                                  } else {
                                    setUserPagesPermissions(prev => [...prev, page.key]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span>{page.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: BUTTONS */}
            {permissionsModalTab === 'buttons' && (
              <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1">
                <p className="text-[10px] text-slate-400 font-semibold mb-2">Configure specific actionable buttons and operations this employee can trigger.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {BUTTONS_LIST.map(btn => {
                    const isChecked = userButtonsPermissions.includes(btn.key);
                    return (
                      <label key={btn.key} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 cursor-pointer text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setUserButtonsPermissions(prev => prev.filter(k => k !== btn.key));
                            } else {
                              setUserButtonsPermissions(prev => [...prev, btn.key]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>{btn.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: MATRIX */}
            {permissionsModalTab === 'matrix' && (
              <div className="max-h-[350px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Module</th>
                      {MATRIX_COLUMNS.map(col => (
                        <th key={col.key} className="p-3 text-center">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    {ALL_MODULES.map(m => (
                      <tr key={m.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{m.name}</td>
                        {MATRIX_COLUMNS.map(col => {
                          const isChecked = getModulePermission(m.key, col.key);
                          return (
                            <td key={col.key} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => setModulePermission(m.key, col.key, e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: DATA SCOPE */}
            {permissionsModalTab === 'data_scope' && (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Department Restriction</label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">Select which departments this employee belongs to or can view records for.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DEPARTMENTS.map(dept => {
                      const isChecked = userDepartmentAccess.includes(dept);
                      return (
                        <label key={dept} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 cursor-pointer text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setUserDepartmentAccess(prev => prev.filter(d => d !== dept));
                              } else {
                                setUserDepartmentAccess(prev => [...prev, dept]);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Branch Scope</label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">Define the branch boundaries for data visibility.</p>
                  <select
                    value={userBranchAccess}
                    onChange={e => setUserBranchAccess(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Branches (Global Access)</option>
                    <option value="own">Own Branch Only</option>
                    <option value="own_records">Own Records Only (Highest Restriction)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowPermissionsModal(false)} 
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={savingUserPerms}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
              >
                {savingUserPerms ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* CREATE ROLE MODAL */}
      {showCreateRoleModal && (
        <ModalShell title="Create Custom Role" icon={<PlusCircle className="text-indigo-600" size={18} />} onClose={() => setShowCreateRoleModal(false)}>
          <form onSubmit={handleCreateRoleSubmit} className="space-y-4 text-xs font-bold">
            <InputField 
              label="Role Name" 
              required 
              type="text" 
              value={newRole.name} 
              onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))} 
              placeholder="e.g. Sales Team Manager"
            />
            <InputField 
              label="Description" 
              type="text" 
              value={newRole.description} 
              onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))} 
              placeholder="e.g. Handles regional sales pipelines"
            />
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Color Accent</label>
              <div className="flex items-center gap-1.5 p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewRole(p => ({ ...p, roleColor: c }))}
                    className={`w-5 h-5 rounded-full transition-transform border border-black/5 hover:scale-110 cursor-pointer ${
                      newRole.roleColor === c ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 scale-105' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <SelectField 
              label="Status" 
              value={newRole.status} 
              onChange={e => setNewRole(p => ({ ...p, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </SelectField>

            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowCreateRoleModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer">Create Role</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* DUPLICATE ROLE MODAL */}
      {showDuplicateRoleModal && (
        <ModalShell title="Duplicate Role" icon={<Copy className="text-indigo-600" size={18} />} onClose={() => setShowDuplicateRoleModal(false)}>
          <form onSubmit={handleDuplicateRoleSubmit} className="space-y-4 text-xs font-bold">
            <InputField 
              label="New Role Name" 
              required 
              type="text" 
              value={duplicateName} 
              onChange={e => setDuplicateName(e.target.value)} 
              placeholder="e.g. Copy of Sales Lead"
            />
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowDuplicateRoleModal(false)} className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 cursor-pointer">Duplicate Role</button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
