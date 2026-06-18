import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { enhancedOrders, initialProductsExtended, inventoryMovement } from '@/data/ecommerceData';
import { leads as initialLeads, contacts as initialContacts, companies as initialCompanies, employees as initialEmployees, leaveRequests as initialLeaves, payrollData as initialPayroll } from '@/data/mockData';

const AppContext = createContext(null);

// Synchronously purge old static mock data from localStorage before components render/initialize state
const purgedKey = 'mock-data-purged-v3';
if (typeof window !== 'undefined') {
  if (!localStorage.getItem(purgedKey)) {
    const keysToClear = [
      'crm-leads', 'crm-clients', 'hrms-employees', 'hrms-leaves', 
      'hrms-payroll', 'hrms-attendance', 'hrms-recruitment', 
      'hrms-announcements', 'crm-projects'
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(purgedKey, 'true');
  }
}


export const PRESET_THEMES = {
  default: {
    primary: '#0052cc',
    secondary: '#3b82f6',
    accent: '#805ad5',
    sidebar: '#e5eeff',
    header: '#0F172A',
    card: '#ffffff',
    tableHeader: '#eff4ff',
    link: '#0052cc',
    icon: '#4f46e5',
    border: '#c3c6d6',
    background: '#f8f9ff',
    hover: '#eff4ff',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ba1a1a',
    info: '#0c56d0',
    density: 'comfortable',
    borderRadius: 20,
    fontSize: 'base',
    fontFamily: 'Inter',
    shadowIntensity: 'light',
    animationsEnabled: true,
    sidebarWidth: 260
  },
  'modern-blue': {
    primary: '#0284c7',
    secondary: '#0ea5e9',
    accent: '#06b6d4',
    sidebar: '#f0f9ff',
    header: '#0f172a',
    card: '#ffffff',
    tableHeader: '#e0f2fe',
    link: '#0284c7',
    icon: '#0284c7',
    border: '#e2e8f0',
    background: '#f8fafc',
    hover: '#f1f5f9',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    density: 'comfortable',
    borderRadius: 12,
    fontSize: 'base',
    fontFamily: 'Inter',
    shadowIntensity: 'light',
    animationsEnabled: true,
    sidebarWidth: 240
  },
  'corporate-dark': {
    primary: '#38bdf8',
    secondary: '#3b82f6',
    accent: '#818cf8',
    sidebar: '#0f172a',
    header: '#0b121f',
    card: '#1e293b',
    tableHeader: '#1e293b',
    link: '#38bdf8',
    icon: '#818cf8',
    border: '#334155',
    background: '#0f172a',
    hover: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    density: 'comfortable',
    borderRadius: 8,
    fontSize: 'base',
    fontFamily: 'Roboto',
    shadowIntensity: 'medium',
    animationsEnabled: true,
    sidebarWidth: 260
  },
  'purple-professional': {
    primary: '#7c3aed',
    secondary: '#a78bfa',
    accent: '#db2777',
    sidebar: '#f5f3ff',
    header: '#1e1b4b',
    card: '#ffffff',
    tableHeader: '#ede9fe',
    link: '#7c3aed',
    icon: '#7c3aed',
    border: '#e9e3ff',
    background: '#faf9ff',
    hover: '#f4f0ff',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#6366f1',
    density: 'comfortable',
    borderRadius: 18,
    fontSize: 'base',
    fontFamily: 'Outfit',
    shadowIntensity: 'light',
    animationsEnabled: true,
    sidebarWidth: 250
  },
  'emerald-green': {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#0d9488',
    sidebar: '#ecfdf5',
    header: '#064e3b',
    card: '#ffffff',
    tableHeader: '#d1fae5',
    link: '#059669',
    icon: '#059669',
    border: '#d1fae5',
    background: '#f9fbf9',
    hover: '#f0fdf4',
    success: '#059669',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0d9488',
    density: 'comfortable',
    borderRadius: 16,
    fontSize: 'base',
    fontFamily: 'Inter',
    shadowIntensity: 'light',
    animationsEnabled: true,
    sidebarWidth: 240
  },
  'orange-business': {
    primary: '#d97706',
    secondary: '#f59e0b',
    accent: '#ea580c',
    sidebar: '#fffbeb',
    header: '#78350f',
    card: '#ffffff',
    tableHeader: '#fef3c7',
    link: '#d97706',
    icon: '#d97706',
    border: '#fde68a',
    background: '#fffdf5',
    hover: '#fef3c7',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    density: 'comfortable',
    borderRadius: 20,
    fontSize: 'base',
    fontFamily: 'Inter',
    shadowIntensity: 'light',
    animationsEnabled: true,
    sidebarWidth: 260
  },
  'luxury-gold': {
    primary: '#d4af37',
    secondary: '#b89626',
    accent: '#e6c65e',
    sidebar: '#141414',
    header: '#0a0a0a',
    card: '#1a1a1a',
    tableHeader: '#222222',
    link: '#d4af37',
    icon: '#d4af37',
    border: '#333333',
    background: '#121212',
    hover: '#2a2a2a',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    density: 'comfortable',
    borderRadius: 6,
    fontSize: 'base',
    fontFamily: 'Outfit',
    shadowIntensity: 'medium',
    animationsEnabled: true,
    sidebarWidth: 250
  },
  'minimal-white': {
    primary: '#334155',
    secondary: '#64748b',
    accent: '#475569',
    sidebar: '#ffffff',
    header: '#ffffff',
    card: '#ffffff',
    tableHeader: '#f8fafc',
    link: '#334155',
    icon: '#475569',
    border: '#e2e8f0',
    background: '#ffffff',
    hover: '#f8fafc',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    density: 'comfortable',
    borderRadius: 0,
    fontSize: 'base',
    fontFamily: 'Inter',
    shadowIntensity: 'none',
    animationsEnabled: false,
    sidebarWidth: 230
  },
  'startup-gradient': {
    primary: '#db2777',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    sidebar: '#faf5ff',
    header: '#3b0764',
    card: '#ffffff',
    tableHeader: '#f3e8ff',
    link: '#db2777',
    icon: '#8b5cf6',
    border: '#f3e8ff',
    background: '#fdfbfe',
    hover: '#f5f3ff',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    density: 'comfortable',
    borderRadius: 24,
    fontSize: 'base',
    fontFamily: 'Outfit',
    shadowIntensity: 'high',
    animationsEnabled: true,
    sidebarWidth: 260
  },
  'enterprise-gray': {
    primary: '#4b5563',
    secondary: '#9ca3af',
    accent: '#374151',
    sidebar: '#f3f4f6',
    header: '#1f2937',
    card: '#ffffff',
    tableHeader: '#e5e7eb',
    link: '#4b5563',
    icon: '#4b5563',
    border: '#d1d5db',
    background: '#f9fafb',
    hover: '#f3f4f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    density: 'comfortable',
    borderRadius: 10,
    fontSize: 'base',
    fontFamily: 'system-ui',
    shadowIntensity: 'light',
    animationsEnabled: true,
    sidebarWidth: 250
  }
};

const mapCompanyToClient = (co, idx) => ({});
const seedClients = [];
const enrichEmployee = (emp, idx) => ({});
const seedEmployees = [];
const seedPayroll = [];
const seedLeaves = [];
const seedAttendance = [];
const seedRecruitmentJobs = [];
const seedAnnouncements = [];
const seedProjects = [];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';


export const getTenantId = () => {
  const saved = localStorage.getItem('auth-tenant-id');
  if (saved && saved !== 'rapidmodel_corp') return saved;
  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0];
  }
  return import.meta.env.VITE_DEFAULT_TENANT_ID || '96722';
};

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeOrg, setActiveOrg] = useState(() => {
    const savedTenant = localStorage.getItem('auth-tenant-id');
    if (savedTenant && savedTenant !== 'rapidmodel_corp') {
      return 'HK Digiverse LLP';
    }
    return 'HK Digiverse LLP';
  });
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Auth States
  const [token, setToken] = useState(() => localStorage.getItem('auth-token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tenantId, setTenantId] = useState(() => getTenantId());

  const [workspaceSettings, setWorkspaceSettings] = useState(() => {
    const saved = localStorage.getItem('crm-workspace-settings');
    return saved ? JSON.parse(saved) : null;
  });

  const refreshWorkspaceSettings = useCallback(async () => {
    const currentToken = localStorage.getItem('auth-token') || token;
    const currentTenant = localStorage.getItem('auth-tenant-id') || tenantId || getTenantId();
    if (!currentToken) return;
    try {
      const resp = await fetch(`${API_BASE}/admin/settings`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'X-Tenant-ID': currentTenant,
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.data) {
          setWorkspaceSettings(data.data);
          localStorage.setItem('crm-workspace-settings', JSON.stringify(data.data));
          if (data.data.company_name) {
            setActiveOrg(data.data.company_name);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspace settings:', err);
    }
  }, [token, tenantId]);


  const hasModulePermission = useCallback((moduleKey) => {
    if (!user) return true;
    if (!user.permissions) return true;
    if (user.role === 'admin' || user.role_name === 'Organization Admin' || user.role_name === 'Super Admin' || user.role_name === 'Admin' || user.role === 'super_admin') return true;
    const perm = user.permissions[moduleKey];
    return perm ? (!!perm.canView || !!perm.view) : false;
  }, [user]);

  // Purged mock data handled synchronously at module load

  const login = useCallback(async (email, password, workspaceId) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (workspaceId) {
        headers['X-Tenant-ID'] = workspaceId;
      }
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      const { access_token, user: userInfo } = data.data;
      const resolvedTenantId = userInfo.tenant_id;
      setToken(access_token);
      setUser(userInfo);
      setTenantId(resolvedTenantId);
      
      localStorage.setItem('auth-token', access_token);
      localStorage.setItem('auth-user', JSON.stringify(userInfo));
      localStorage.setItem('auth-tenant-id', resolvedTenantId);

      // fetch workspace settings immediately
      try {
        const respSettings = await fetch(`${API_BASE}/admin/settings`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
            'X-Tenant-ID': resolvedTenantId,
          }
        });
        if (respSettings.ok) {
          const sData = await respSettings.json();
          if (sData.success && sData.data) {
            setWorkspaceSettings(sData.data);
            localStorage.setItem('crm-workspace-settings', JSON.stringify(sData.data));
            if (sData.data.company_name) {
              setActiveOrg(sData.data.company_name);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load settings on login:', err);
      }

      addToast(`Welcome back, ${userInfo.full_name}!`, 'success');
      return userInfo;
    } catch (error) {
      addToast(error.message, 'error');
      throw error;
    }
  }, [addToast]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setTenantId(null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-tenant-id');
    localStorage.removeItem('hrms-active-employee-id');
    addToast('Logged out successfully', 'info');
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!localStorage.getItem('auth-token')) return;
    try {
      const currentToken = localStorage.getItem('auth-token');
      const currentTenant = localStorage.getItem('auth-tenant-id') || getTenantId();
      const resp = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'X-Tenant-ID': currentTenant,
        }
      });
      if (resp.status === 401) {
        logout();
        return;
      }
      const data = await resp.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('auth-user', JSON.stringify(data.data));
        refreshWorkspaceSettings();
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  }, [logout, refreshWorkspaceSettings]);

  useEffect(() => {
    if (!token) return;
    refreshUserProfile();
    refreshWorkspaceSettings();
    const interval = setInterval(() => {
      refreshUserProfile();
      refreshWorkspaceSettings();
    }, 30000);

    const channel = new BroadcastChannel('crm-auth-channel');
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'REFRESH_PROFILE') {
        refreshUserProfile();
        refreshWorkspaceSettings();
      }
    };
    channel.addEventListener('message', handleMessage);

    const handleFocus = () => {
      refreshUserProfile();
      refreshWorkspaceSettings();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      channel.removeEventListener('message', handleMessage);
      channel.close();
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, refreshUserProfile, refreshWorkspaceSettings]);


  
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('crm-leads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialLeads;
      }
    }
    return initialLeads;
  });

  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('crm-contacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialContacts;
      }
    }
    return initialContacts;
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('crm-clients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return seedClients;
      }
    }
    return seedClients;
  });

  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [letterRequests, setLetterRequests] = useState([]);
  const [flatDocs, setFlatDocs] = useState([]);
  const [payrollAdjustments, setPayrollAdjustments] = useState([]);

  const [recruitmentJobs, setRecruitmentJobs] = useState(() => {
    const saved = localStorage.getItem('hrms-recruitment');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return seedRecruitmentJobs;
      }
    }
    return seedRecruitmentJobs;
  });

  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('hrms-announcements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return seedAnnouncements;
      }
    }
    return seedAnnouncements;
  });

  const [hrmsRole, setHrmsRole] = useState(() => {
    return localStorage.getItem('hrms-active-role') || 'Super Admin';
  });

  const [hrmsEmployeeId, setHrmsEmployeeId] = useState(() => {
    return localStorage.getItem('hrms-active-employee-id') || 'EMP-001';
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('crm-projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return seedProjects;
      }
    }
    return seedProjects;
  });

  const [quotes, setQuotes] = useState(() => {
    const saved = localStorage.getItem('crm-quotes');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('crm-invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('crm-payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [campaigns, setCampaigns] = useState(() => {
    const saved = localStorage.getItem('marketing-campaigns');
    return saved ? JSON.parse(saved) : [];
  });

  const [adminUsers, setAdminUsers] = useState(() => {
    const saved = localStorage.getItem('admin-users');
    return saved ? JSON.parse(saved) : [
      { id: 'USR-001', name: 'CRM Admin', email: 'admin@company.com', phone: '+91 98765 43210', role: 'Super Admin', department: 'Management', status: 'Active', lastLogin: '2026-06-10 10:30' }
    ];
  });

  // Finance & Billing states
  const [expenses, setExpenses] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [gstRecords, setGstRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Reactive e-commerce states
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('ecommerce-orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return enhancedOrders;
      }
    }
    return enhancedOrders;
  });
  const [productsExtended, setProductsExtended] = useState(() => {
    const saved = localStorage.getItem('ecommerce-products-extended');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialProductsExtended;
      }
    }
    return initialProductsExtended;
  });
  const [movementLogs, setMovementLogs] = useState(() => {
    const saved = localStorage.getItem('ecommerce-inventory-movement');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return inventoryMovement;
      }
    }
    return inventoryMovement;
  });

  const [inventoryItems, setInventoryItems] = useState(() => {
    const saved = localStorage.getItem('ecommerce-inventory-items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const resolvedProductsExtended = useMemo(() => {
    const next = { ...productsExtended };
    inventoryItems.forEach(item => {
      if (!next[item.id] || !next[item.id].platforms || Object.keys(next[item.id].platforms).length === 0) {
        const platforms = {};
        const PLATFORMS_LIST = ['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'];
        
        PLATFORMS_LIST.forEach(p => {
          platforms[p] = {
            active: false,
            stock: 0,
            threshold: p === 'Warehouse' ? 1 : 5,
            sku: `${p.slice(0, 3).toUpperCase()}-${item.sku || item.id}`,
            prodId: `${p.slice(0, 3).toUpperCase()}-${Date.now()}`,
            price: item.price || 0,
            status: 'Inactive',
            syncStatus: 'Synced',
            lastSync: 'Just now'
          };
        });

        let itemPlats = [];
        if (Array.isArray(item.platforms)) {
          itemPlats = item.platforms;
        } else if (typeof item.platforms === 'string') {
          try {
            itemPlats = JSON.parse(item.platforms);
          } catch (e) {
            itemPlats = [];
          }
        }

        const normalizedPlats = itemPlats.map(p => p.toLowerCase());
        
        let assigned = false;
        PLATFORMS_LIST.forEach(p => {
          if (normalizedPlats.includes(p.toLowerCase())) {
            platforms[p].active = true;
            platforms[p].status = 'Active';
            if (!assigned) {
              platforms[p].stock = item.stock || 0;
              assigned = true;
            }
          }
        });

        if (!assigned && item.stock > 0) {
          platforms['Warehouse'].active = true;
          platforms['Warehouse'].status = 'Active';
          platforms['Warehouse'].stock = item.stock;
        }

        next[item.id] = {
          brand: item.brand || 'Generic',
          platforms,
          metrics: {
            totalSales: 0,
            platformSales: { Amazon: 0, Flipkart: 0, Meesho: 0, Shopify: 0, WooCommerce: 0, Myntra: 0, Ajio: 0 },
            revenue: 0,
            conversionRate: 0.0,
            returnRate: 0.0,
            bestPerforming: 'N/A'
          }
        };
      }
    });
    return next;
  }, [inventoryItems, productsExtended]);

  useEffect(() => {
    localStorage.setItem('crm-leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('crm-contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('crm-clients', JSON.stringify(clients));
  }, [clients]);

  // hrms local storage synchronization removed in favor of backend API

  useEffect(() => {
    localStorage.setItem('hrms-recruitment', JSON.stringify(recruitmentJobs));
  }, [recruitmentJobs]);

  useEffect(() => {
    localStorage.setItem('hrms-announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('hrms-active-role', hrmsRole);
  }, [hrmsRole]);

  useEffect(() => {
    localStorage.setItem('hrms-active-employee-id', hrmsEmployeeId);
  }, [hrmsEmployeeId]);

  // Auto-sync tenantId to the logged-in user's tenant_id
  // This prevents stale localStorage tenant IDs from loading other tenants' data
  useEffect(() => {
    if (user?.tenant_id && tenantId !== user.tenant_id) {
      setTenantId(user.tenant_id);
      localStorage.setItem('auth-tenant-id', user.tenant_id);
    }
  }, [user, tenantId]);

  // Auto-sync hrmsEmployeeId to the logged-in user's employee record
  // This prevents stale localStorage values from showing the wrong employee
  useEffect(() => {
    if (user?.email && employees.length > 0) {
      const loggedInEmp = employees.find(e => e.email === user.email);
      if (loggedInEmp && loggedInEmp.id !== hrmsEmployeeId) {
        // Only auto-correct if current hrmsEmployeeId doesn't belong to logged-in user
        const currentEmp = employees.find(e => e.id === hrmsEmployeeId);
        if (!currentEmp || currentEmp.email !== user.email) {
          setHrmsEmployeeId(loggedInEmp.id);
        }
      }
    }
  }, [user, employees]);

  useEffect(() => {
    localStorage.setItem('crm-projects', JSON.stringify(projects));
  }, [projects]);

  const fetchProjects = useCallback(async () => {
    if (!token || !hasModulePermission('projects')) return;
    try {
      const resp = await fetch(`${API_BASE}/projects`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) {
        logout();
        return;
      }
      const data = await resp.json();
      if (data.success && data.data) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, [token, tenantId, logout, hasModulePermission]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Product API CRUD ─────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!token || !hasModulePermission('ecommerce')) return;
    try {
      const resp = await fetch(`${API_BASE}/products`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) {
        logout();
        return;
      }
      const data = await resp.json();
      if (data.success && data.data) {
        setInventoryItems(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [token, tenantId, logout, hasModulePermission]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (productData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(productData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setInventoryItems(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create product');
      }
    } catch (err) {
      console.error('Failed to create product:', err);
      throw err;
    }
  }, [token, tenantId]);

  const updateProduct = useCallback(async (productId, updateData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(updateData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setInventoryItems(prev => prev.map(item => item.id === productId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      throw err;
    }
  }, [token, tenantId]);

  const deleteProductApi = useCallback(async (productId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        setInventoryItems(prev => prev.filter(item => item.id !== productId));
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      throw err;
    }
  }, [token, tenantId]);


  // ── Invoice API CRUD ─────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    if (!token || !hasModulePermission('finance')) return;
    try {
      const resp = await fetch(`${API_BASE}/invoices`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  }, [token, tenantId, logout, hasModulePermission]);

  const createInvoice = useCallback(async (invoiceData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...invoiceData };
      if ('dueDate' in backendPayload) {
        backendPayload.due_date = backendPayload.dueDate;
        delete backendPayload.dueDate;
      }
      if ('paymentMethod' in backendPayload) {
        backendPayload.payment_method = backendPayload.paymentMethod;
        delete backendPayload.paymentMethod;
      }
      const resp = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setInvoices(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('Failed to create invoice:', err);
      throw err;
    }
  }, [token, tenantId]);

  const updateInvoice = useCallback(async (invoiceId, updateData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...updateData };
      if ('dueDate' in backendPayload) {
        backendPayload.due_date = backendPayload.dueDate;
        delete backendPayload.dueDate;
      }
      if ('paymentMethod' in backendPayload) {
        backendPayload.payment_method = backendPayload.paymentMethod;
        delete backendPayload.paymentMethod;
      }
      const resp = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setInvoices(prev => prev.map(item => item.id === invoiceId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update invoice');
      }
    } catch (err) {
      console.error('Failed to update invoice:', err);
      throw err;
    }
  }, [token, tenantId]);

  const deleteInvoiceApi = useCallback(async (invoiceId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        setInvoices(prev => prev.filter(item => item.id !== invoiceId));
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      throw err;
    }
  }, [token, tenantId]);

  // ── Quote API CRUD ─────────────────────────────────────────
  const fetchQuotes = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/quotes`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setQuotes(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    }
  }, [token, tenantId, logout]);

  const createQuote = useCallback(async (quoteData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...quoteData };
      if ('validUntil' in backendPayload) {
        backendPayload.valid_until = backendPayload.validUntil;
        delete backendPayload.validUntil;
      }
      if ('productName' in backendPayload) {
        backendPayload.product_name = backendPayload.productName;
        delete backendPayload.productName;
      }
      const resp = await fetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setQuotes(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create quote');
      }
    } catch (err) {
      console.error('Failed to create quote:', err);
      throw err;
    }
  }, [token, tenantId]);

  const updateQuote = useCallback(async (quoteId, updateData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...updateData };
      if ('validUntil' in backendPayload) {
        backendPayload.valid_until = backendPayload.validUntil;
        delete backendPayload.validUntil;
      }
      if ('productName' in backendPayload) {
        backendPayload.product_name = backendPayload.productName;
        delete backendPayload.productName;
      }
      const resp = await fetch(`${API_BASE}/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setQuotes(prev => prev.map(item => item.id === quoteId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update quote');
      }
    } catch (err) {
      console.error('Failed to update quote:', err);
      throw err;
    }
  }, [token, tenantId]);

  const deleteQuote = useCallback(async (quoteId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        setQuotes(prev => prev.filter(item => item.id !== quoteId));
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete quote');
      }
    } catch (err) {
      console.error('Failed to delete quote:', err);
      throw err;
    }
  }, [token, tenantId]);

  // ── Payment API CRUD ─────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/payments`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setPayments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  }, [token, tenantId, logout]);

  const createPayment = useCallback(async (paymentData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...paymentData };
      if ('invoiceId' in backendPayload) {
        backendPayload.invoice_id = backendPayload.invoiceId;
        delete backendPayload.invoiceId;
      }
      const resp = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setPayments(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create payment');
      }
    } catch (err) {
      console.error('Failed to create payment:', err);
      throw err;
    }
  }, [token, tenantId]);

  const updatePayment = useCallback(async (paymentId, updateData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...updateData };
      if ('invoiceId' in backendPayload) {
        backendPayload.invoice_id = backendPayload.invoiceId;
        delete backendPayload.invoiceId;
      }
      const resp = await fetch(`${API_BASE}/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setPayments(prev => prev.map(item => item.id === paymentId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update payment');
      }
    } catch (err) {
      console.error('Failed to update payment:', err);
      throw err;
    }
  }, [token, tenantId]);

  // ── Ledger API CRUD ─────────────────────────────────────────
  const fetchLedger = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/ledger`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setLedger(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    }
  }, [token, tenantId, logout]);

  const createLedgerEntry = useCallback(async (entryData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/ledger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(entryData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setLedger(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to post ledger entry');
      }
    } catch (err) {
      console.error('Failed to post ledger entry:', err);
      throw err;
    }
  }, [token, tenantId]);

  // ── Expense API CRUD ─────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    if (!token || !hasModulePermission('finance')) return;
    try {
      const resp = await fetch(`${API_BASE}/expenses`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setExpenses(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  }, [token, tenantId, logout, hasModulePermission]);

  const createExpense = useCallback(async (expenseData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(expenseData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setExpenses(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create expense claim');
      }
    } catch (err) {
      console.error('Failed to create expense claim:', err);
      throw err;
    }
  }, [token, tenantId]);

  const updateExpense = useCallback(async (expenseId, updateData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(updateData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setExpenses(prev => prev.map(item => item.id === expenseId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update expense');
      }
    } catch (err) {
      console.error('Failed to update expense:', err);
      throw err;
    }
  }, [token, tenantId]);

  // ── GST API CRUD ─────────────────────────────────────────
  const fetchGstRecords = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/gst`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setGstRecords(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch GST records:', err);
    }
  }, [token, tenantId, logout]);

  const createGstRecord = useCallback(async (gstData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...gstData };
      if ('netDue' in backendPayload) {
        backendPayload.net_due = backendPayload.netDue;
        delete backendPayload.netDue;
      }
      if ('filedOn' in backendPayload) {
        backendPayload.filed_on = backendPayload.filedOn;
        delete backendPayload.filedOn;
      }
      const resp = await fetch(`${API_BASE}/gst`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setGstRecords(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create GST record');
      }
    } catch (err) {
      console.error('Failed to create GST record:', err);
      throw err;
    }
  }, [token, tenantId]);

  const updateGstRecord = useCallback(async (recordId, updateData) => {
    if (!token) return null;
    try {
      const backendPayload = { ...updateData };
      if ('netDue' in backendPayload) {
        backendPayload.net_due = backendPayload.netDue;
        delete backendPayload.netDue;
      }
      if ('filedOn' in backendPayload) {
        backendPayload.filed_on = backendPayload.filedOn;
        delete backendPayload.filedOn;
      }
      const resp = await fetch(`${API_BASE}/gst/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setGstRecords(prev => prev.map(item => item.id === recordId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update GST record');
      }
    } catch (err) {
      console.error('Failed to update GST record:', err);
      throw err;
    }
  }, [token, tenantId]);

  // ── HRMS API Fetchers ─────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    if (!token || !hasModulePermission('hrms')) return;
    try {
      const resp = await fetch(`${API_BASE}/employees`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  }, [token, tenantId, logout, hasModulePermission]);

  const fetchLeaves = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/leaves`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setLeaves(prev => {
          if (prev && prev.length > 0) {
            data.data.forEach(newLeave => {
              const oldLeave = prev.find(l => l.id === newLeave.id);
              if (!oldLeave) {
                // New Leave Request
                if (newLeave.status === 'Pending') {
                  const emp = employees.find(e => e.id === newLeave.employeeId);
                  const currentEmp = employees.find(e => e.email === user?.email);
                  const isManager = emp && currentEmp && (
                    emp.reportingManager === currentEmp.id ||
                    emp.reportingManager === currentEmp.name ||
                    emp.reportingManager === user?.full_name
                  );
                   const isAdmin = user?.role === 'super_admin' || user?.role_name === 'Organization Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Admin';
                  const isHR = currentEmp?.department?.toUpperCase() === 'HR' || 
                               currentEmp?.role?.toUpperCase() === 'HR' || 
                               currentEmp?.role?.toUpperCase().includes('HR') ||
                               user?.role_name?.toUpperCase().includes('HR');
                  
                  if (isManager || isAdmin || isHR) {
                    const msg = `New leave request submitted by ${newLeave.employeeName || 'Employee'}`;
                    addToast(msg, 'info');
                    setNotifications(nPrev => {
                      if (nPrev.some(n => n.text === msg)) return nPrev;
                      return [
                        { id: Date.now() + Math.random(), text: msg, time: 'Just now', read: false },
                        ...nPrev
                      ];
                    });
                  }
                }
              } else {
                // Status Changed
                if (oldLeave.status !== newLeave.status) {
                  const currentEmp = employees.find(e => e.email === user?.email);
                  if (currentEmp && newLeave.employeeId === currentEmp.id) {
                    const msg = `Your leave request has been ${newLeave.status.toLowerCase()} by ${newLeave.approvedBy || 'Manager'}`;
                    addToast(msg, newLeave.status === 'Approved' ? 'success' : 'warning');
                    setNotifications(nPrev => {
                      if (nPrev.some(n => n.text === msg)) return nPrev;
                      return [
                        { id: Date.now() + Math.random(), text: msg, time: 'Just now', read: false },
                        ...nPrev
                      ];
                    });
                  }
                }
              }
            });
          }
          return data.data;
        });
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    }
  }, [token, tenantId, logout, employees, user, addToast]);

  const fetchPayroll = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/payroll`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setPayroll(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err);
    }
  }, [token, tenantId, logout]);

  const fetchAttendance = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/attendance`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setAttendance(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  }, [token, tenantId, logout]);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, [token, tenantId, logout]);

  const fetchReminders = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/reminders`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setReminders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    }
  }, [token, tenantId, logout]);

  const fetchRoles = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/roles`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setRoles(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, [token, tenantId, logout]);

  const createRole = useCallback(async (roleData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(roleData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setRoles(prev => [...prev, data.data]);
        addToast(`Role "${roleData.name}" created successfully.`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create role');
      }
    } catch (err) {
      console.error('Failed to create role:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const updateRole = useCallback(async (roleId, roleData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(roleData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setRoles(prev => prev.map(r => r.id === roleId ? data.data : r));
        addToast(`Role updated successfully.`, 'success');
        try {
          const channel = new BroadcastChannel('crm-auth-channel');
          channel.postMessage({ type: 'REFRESH_PROFILE' });
          channel.close();
        } catch (e) {
          console.error('BroadcastChannel failed:', e);
        }
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update role');
      }
    } catch (err) {
      console.error('Failed to update role:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const deleteRole = useCallback(async (roleId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      const data = await resp.json();
      if (data.success) {
        setRoles(prev => prev.filter(r => r.id !== roleId));
        addToast('Role deleted successfully.', 'info');
        try {
          const channel = new BroadcastChannel('crm-auth-channel');
          channel.postMessage({ type: 'REFRESH_PROFILE' });
          channel.close();
        } catch (e) {
          console.error('BroadcastChannel failed:', e);
        }
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Failed to delete role:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const duplicateRole = useCallback(async (roleId, newName) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/roles/${roleId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify({ name: newName })
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setRoles(prev => [...prev, data.data]);
        addToast(`Role duplicated successfully as "${newName}".`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to duplicate role');
      }
    } catch (err) {
      console.error('Failed to duplicate role:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const fetchAuditLogs = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/audit-logs`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, [token, tenantId, logout]);

  const fetchContacts = useCallback(async () => {
    if (!token || !hasModulePermission('crm')) return;
    try {
      const resp = await fetch(`${API_BASE}/contacts`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setContacts(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  }, [token, tenantId, logout, hasModulePermission]);

  const fetchClients = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/clients`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) { logout(); return; }
      const data = await resp.json();
      if (data.success && data.data) {
        setClients(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, [token, tenantId, logout]);

  const fetchLetters = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/documents/letters`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setLetterRequests(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch letter requests:', err);
    }
  }, [token, tenantId]);

  const fetchSubmissions = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/documents/submissions`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setFlatDocs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  }, [token, tenantId]);

  const fetchPayrollAdjustments = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/payroll/adjustments`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setPayrollAdjustments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch adjustments:', err);
    }
  }, [token, tenantId]);

  useEffect(() => {
    if (token) {
      fetchInvoices();
      fetchQuotes();
      fetchPayments();
      fetchLedger();
      fetchExpenses();
      fetchGstRecords();
      fetchEmployees();
      fetchLeaves();
      fetchPayroll();
      fetchAttendance();
      fetchTasks();
      fetchReminders();
      fetchRoles();
      fetchAuditLogs();
      fetchContacts();
      fetchClients();
      fetchLetters();
      fetchSubmissions();
      fetchPayrollAdjustments();
    }
  }, [token, fetchInvoices, fetchQuotes, fetchPayments, fetchLedger, fetchExpenses, fetchGstRecords, fetchEmployees, fetchLeaves, fetchPayroll, fetchAttendance, fetchTasks, fetchReminders, fetchRoles, fetchAuditLogs, fetchContacts, fetchClients, fetchLetters, fetchSubmissions, fetchPayrollAdjustments]);
  useEffect(() => {
    if (!token) return;
    const leavesInterval = setInterval(fetchLeaves, 3000);

    const handleFocus = () => {
      fetchLeaves();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(leavesInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, fetchLeaves]);
  useEffect(() => {
    localStorage.setItem('marketing-campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('admin-users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem('ecommerce-orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ecommerce-products-extended', JSON.stringify(productsExtended));
  }, [productsExtended]);

  useEffect(() => {
    localStorage.setItem('ecommerce-inventory-movement', JSON.stringify(movementLogs));
  }, [movementLogs]);

  useEffect(() => {
    localStorage.setItem('ecommerce-inventory-items', JSON.stringify(inventoryItems));
  }, [inventoryItems]);

  const addClient = useCallback(async (clientData) => {
    if (!token) return null;
    try {
      const payload = {
        name: clientData.name,
        industry: clientData.industry,
        businessType: clientData.businessName || clientData.businessType,
        gstNumber: clientData.gstNumber,
        panNumber: clientData.panNumber,
        website: clientData.website,
        email: clientData.email,
        phone: clientData.phone,
        altPhone: clientData.altPhone,
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        country: clientData.country || "India",
        postalCode: clientData.postalCode,
        annualRevenue: Number(clientData.annualRevenue) || 0.0,
        employeesCount: Number(clientData.employeesCount) || 0,
        companySize: clientData.companySize || "1-10",
        ownerName: clientData.ownerName || clientData.contactPerson,
        accountManager: clientData.accountManager,
        notes: clientData.notes,
        status: clientData.status || "Active",
      };
      const resp = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setClients(prev => [data.data, ...prev]);
        addToast(`Client "${data.data.name}" created successfully.`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create client');
      }
    } catch (err) {
      console.error('Failed to create client:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const addContact = useCallback(async (contactData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(contactData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setContacts(prev => [data.data, ...prev]);
        addToast(`Contact "${data.data.name}" created successfully.`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create contact');
      }
    } catch (err) {
      console.error('Failed to create contact:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const updateContact = useCallback(async (contactId, updatedData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(updatedData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setContacts(prev => prev.map(c => c.id === contactId ? data.data : c));
        addToast(`Contact updated successfully`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update contact');
      }
    } catch (err) {
      console.error('Failed to update contact:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const deleteContact = useCallback(async (contactId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        setContacts(prev => prev.filter(c => c.id !== contactId));
        addToast(`Contact deleted successfully`, 'info');
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete contact');
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const updateClient = useCallback(async (clientId, updatedData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(updatedData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setClients(prev => prev.map(c => c.id === clientId ? data.data : c));
        addToast(`Client updated successfully`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update client');
      }
    } catch (err) {
      console.error('Failed to update client:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const deleteClient = useCallback(async (clientId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        addToast(`Client deleted successfully`, 'info');
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete client');
      }
    } catch (err) {
      console.error('Failed to delete client:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const addQuote = useCallback((quoteData) => {
    const newQuote = {
      id: `QT-2026-${String(quotes.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      ...quoteData
    };
    setQuotes(prev => [newQuote, ...prev]);
    addToast(`Quote proposal "${newQuote.id}" created successfully.`, 'success');
    return newQuote.id;
  }, [quotes, addToast]);

  const addInvoice = useCallback((invoiceData) => {
    const newInvoice = {
      id: `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      ...invoiceData
    };
    setInvoices(prev => [newInvoice, ...prev]);
    addToast(`Invoice "${newInvoice.id}" created successfully.`, 'success');
    return newInvoice.id;
  }, [invoices, addToast]);

  const addPayment = useCallback((paymentData) => {
    const newPayment = {
      id: `PAY-${String(payments.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      ...paymentData
    };
    setPayments(prev => [newPayment, ...prev]);
    addToast(`Payment "${newPayment.id}" logged successfully.`, 'success');
    return newPayment.id;
  }, [payments, addToast]);

  const addCampaign = useCallback((campaignData) => {
    const newCampaign = {
      id: `CMP-${String(campaigns.length + 1).padStart(3, '0')}`,
      reach: 0,
      clicks: 0,
      conversions: 0,
      ...campaignData
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    addToast(`Campaign "${newCampaign.name}" created successfully.`, 'success');
    return newCampaign.id;
  }, [campaigns, addToast]);

  const addAdminUser = useCallback((userData) => {
    const newUser = {
      id: `USR-${String(adminUsers.length + 1).padStart(3, '0')}`,
      lastLogin: 'Never',
      ...userData
    };
    setAdminUsers(prev => [...prev, newUser]);
    addToast(`User "${newUser.name}" added successfully.`, 'success');
    return newUser.id;
  }, [adminUsers, addToast]);

  const updateLead = useCallback((leadId, updatedData) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updatedData, lastActivity: new Date().toISOString().split('T')[0] } : l));
    addToast(`Lead updated successfully`, 'success');
  }, [addToast]);

  const deleteLead = useCallback((leadId) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    addToast(`Lead deleted successfully`, 'info');
  }, [addToast]);

  const convertLeadToClient = useCallback((leadId) => {
    let leadName = '';
    setLeads(prevLeads => {
      const idx = prevLeads.findIndex(l => l.id === leadId);
      if (idx === -1) return prevLeads;
      const nextLeads = [...prevLeads];
      nextLeads[idx] = { ...nextLeads[idx], stage: 'Won' };
      leadName = nextLeads[idx].name;
      
      const lead = nextLeads[idx];
      setClients(prevClients => {
        if (prevClients.some(c => c.email === lead.email || (c.name === lead.name && c.businessName === lead.company))) {
          return prevClients;
        }
        const newClient = {
          id: `CL-${String(prevClients.length + 1).padStart(3, '0')}`,
          name: lead.name,
          businessName: lead.company,
          contactPerson: lead.name,
          phone: lead.phone || '',
          email: lead.email || '',
          website: '',
          industry: 'Enterprise',
          city: 'Unknown',
          state: 'Unknown',
          country: 'India',
          address: 'Converted from Lead profile',
          gstNumber: '',
          notes: `Lead converted automatically. Deal Value: ₹${lead.value}`,
          status: 'Active',
          projects: [
            {
              id: `PRJ-${String(Date.now()).slice(-4)}`,
              name: `Initial Lead Deal - ${lead.company}`,
              service: 'Initial Service',
              amount: Number(lead.value) || 0,
              received: 0,
              status: 'In Progress',
              date: new Date().toISOString().split('T')[0]
            }
          ],
          activities: [
            { type: 'lead_created', text: `Lead originally created.`, date: lead.createdAt || 'N/A' },
            { type: 'lead_converted', text: `Lead converted to Client profile successfully.`, date: new Date().toISOString().replace('T', ' ').substring(0, 16) }
          ],
          tasks: [],
          files: []
        };
        return [newClient, ...prevClients];
      });
      return nextLeads;
    });
    addToast(`Lead "${leadName}" converted to Client successfully!`, 'success');
  }, [addToast]);

  const addClientProject = useCallback(async (clientId, projectData) => {
    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return;
    const newProject = {
      id: `PRJ-${String(Date.now()).slice(-4)}`,
      received: 0,
      status: 'Active',
      date: new Date().toISOString().split('T')[0],
      ...projectData
    };
    const nextProjects = [...(targetClient.projects || []), newProject];
    const nextActivities = [
      {
        type: 'project_added',
        text: `Project "${newProject.name}" added for ₹${newProject.amount}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...(targetClient.activities || [])
    ];
    await updateClient(clientId, { projects: nextProjects, activities: nextActivities });
  }, [clients, updateClient]);

  const updateClientProjectStatus = useCallback(async (clientId, projectId, nextStatus) => {
    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return;
    const nextProjects = (targetClient.projects || []).map(p => {
      if (p.id === projectId) {
        return { ...p, status: nextStatus };
      }
      return p;
    });
    const targetProj = (targetClient.projects || []).find(p => p.id === projectId);
    const nextActivities = [
      {
        type: 'project_updated',
        text: `Project "${targetProj?.name}" status updated to: ${nextStatus}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...(targetClient.activities || [])
    ];
    await updateClient(clientId, { projects: nextProjects, activities: nextActivities });
  }, [clients, updateClient]);

  const addClientTask = useCallback(async (clientId, taskData) => {
    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return;
    const newTask = {
      id: `TSK-${String(Date.now()).slice(-4)}`,
      status: 'In Progress',
      ...taskData
    };
    const nextTasks = [...(targetClient.tasks || []), newTask];
    const nextActivities = [
      {
        type: 'task_assigned',
        text: `Task "${newTask.title}" assigned to ${newTask.assignee}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...(targetClient.activities || [])
    ];
    await updateClient(clientId, { tasks: nextTasks, activities: nextActivities });
  }, [clients, updateClient]);

  const uploadClientFile = useCallback(async (clientId, fileData) => {
    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return;
    const newFile = {
      date: new Date().toISOString().split('T')[0],
      ...fileData
    };
    const nextFiles = [...(targetClient.files || []), newFile];
    await updateClient(clientId, { files: nextFiles });
  }, [clients, updateClient]);

  const recordClientPayment = useCallback(async (clientId, projectId, paymentAmount) => {
    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return;
    let projName = '';
    const nextProjects = (targetClient.projects || []).map(p => {
      if (p.id === projectId) {
        projName = p.name;
        const newReceived = Number(p.received || 0) + Number(paymentAmount);
        return { ...p, received: Math.min(p.amount, newReceived) };
      }
      return p;
    });
    const nextActivities = [
      {
        type: 'payment_received',
        text: `Payment of ₹${paymentAmount} received for project: ${projName}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...(targetClient.activities || [])
    ];
    await updateClient(clientId, { projects: nextProjects, activities: nextActivities });
  }, [clients, updateClient]);

  // =================== PROJECT MANAGEMENT ACTIONS ===================
  const addProject = useCallback(async (data) => {
    try {
      const resp = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(data)
      });
      if (resp.status === 401) {
        logout();
        return;
      }
      const resData = await resp.json();
      if (resData.success && resData.data) {
        setProjects(prev => [resData.data, ...prev]);
        addToast(`Project "${resData.data.name}" created successfully.`, 'success');
        return resData.data.id;
      } else {
        addToast(resData.message || 'Failed to create project', 'error');
      }
    } catch (error) {
      addToast('Error communicating with backend', 'error');
      console.error(error);
    }
  }, [token, tenantId, logout, addToast]);

  const editProject = useCallback(async (projectId, data) => {
    try {
      const resp = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(data)
      });
      if (resp.status === 401) {
        logout();
        return;
      }
      const resData = await resp.json();
      if (resData.success && resData.data) {
        setProjects(prev => prev.map(p => p.id === projectId ? resData.data : p));
        addToast('Project updated successfully.', 'success');
      } else {
        addToast(resData.message || 'Failed to update project', 'error');
      }
    } catch (error) {
      addToast('Error communicating with backend', 'error');
      console.error(error);
    }
  }, [token, tenantId, logout, addToast]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      const resp = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      if (resp.status === 401) {
        logout();
        return;
      }
      const resData = await resp.json();
      if (resData.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        addToast('Project deleted.', 'success');
      } else {
        addToast(resData.message || 'Failed to delete project', 'error');
      }
    } catch (error) {
      addToast('Error communicating with backend', 'error');
      console.error(error);
    }
  }, [token, tenantId, logout, addToast]);


  const updateProjectStage = useCallback((projectId, newStage) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newStatus = (newStage === 'Completed') ? 'Completed' : (newStage === 'On Hold') ? 'On Hold' : (newStage === 'Cancelled') ? 'Cancelled' : 'Active';
        const entry = { date: now, event: `Stage moved to ${newStage}`, type: 'stage', user: 'CRM Admin' };
        return { ...p, stage: newStage, status: newStatus, timeline: [...(p.timeline || []), entry], lastModifiedAt: now, lastModifiedBy: 'CRM Admin' };
      }
      return p;
    }));
    addToast(`Project stage updated to: ${newStage}`, 'success');
  }, [addToast]);

  const addProjectTask = useCallback((projectId, task) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const taskId = `TSK-P${p.id.split('-')[1]}-${String((p.tasks || []).length + 1).padStart(2, '0')}`;
        const newTask = { id: taskId, status: 'Pending', progress: 0, ...task };
        const entry = { date: now, event: `Task "${newTask.name}" added`, type: 'task', user: 'CRM Admin' };
        return { ...p, tasks: [...(p.tasks || []), newTask], timeline: [...(p.timeline || []), entry], lastModifiedAt: now };
      }
      return p;
    }));
    addToast('Task added successfully.', 'success');
  }, [addToast]);

  const updateProjectTask = useCallback((projectId, taskId, data) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const tasks = (p.tasks || []).map(t => t.id === taskId ? { ...t, ...data } : t);
        const timelineEntries = [...(p.timeline || [])];
        if (data.status === 'Completed') {
          const taskName = (p.tasks || []).find(t => t.id === taskId)?.name || 'Task';
          timelineEntries.push({ date: now, event: `Task "${taskName}" completed`, type: 'task', user: 'CRM Admin' });
        }
        return { ...p, tasks, timeline: timelineEntries, lastModifiedAt: now };
      }
      return p;
    }));
    addToast('Task updated.', 'success');
  }, [addToast]);

  const addProjectComment = useCallback((projectId, comment) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const cmtId = `CMT-P${p.id.split('-')[1]}-${String((p.comments || []).length + 1).padStart(2, '0')}`;
        const newComment = { id: cmtId, date: now, ...comment };
        return { ...p, comments: [...(p.comments || []), newComment], lastModifiedAt: now };
      }
      return p;
    }));
    addToast('Comment added.', 'success');
  }, [addToast]);

  const addProjectDocument = useCallback((projectId, doc) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const docId = `DOC-P${p.id.split('-')[1]}-${String((p.documents || []).length + 1).padStart(2, '0')}`;
        const newDoc = { id: docId, uploadDate: now.split(' ')[0], ...doc };
        const entry = { date: now, event: `Document "${doc.name}" uploaded`, type: 'document', user: doc.uploadedBy || 'CRM Admin' };
        return { ...p, documents: [...(p.documents || []), newDoc], timeline: [...(p.timeline || []), entry], lastModifiedAt: now };
      }
      return p;
    }));
    addToast('Document uploaded.', 'success');
  }, [addToast]);

  const recordProjectPayment = useCallback((projectId, amount) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newReceived = (p.financials?.received || 0) + Number(amount);
        const entry = { date: now, event: `Payment of ₹${Number(amount).toLocaleString('en-IN')} received`, type: 'payment', user: 'CRM Admin' };
        return { ...p, financials: { ...p.financials, received: newReceived }, timeline: [...(p.timeline || []), entry], lastModifiedAt: now };
      }
      return p;
    }));
    addToast(`Payment of ₹${Number(amount).toLocaleString('en-IN')} recorded.`, 'success');
  }, [addToast]);

  const addEmployee = useCallback(async (emp) => {
    if (!token) return;
    try {
      const sanitizedEmp = { ...emp };
      if (sanitizedEmp.dob === '') sanitizedEmp.dob = null;
      if (sanitizedEmp.joinDate === '') sanitizedEmp.joinDate = null;

      const resp = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(sanitizedEmp),
      });
      const data = await resp.json();
      if (data.success) {
        fetchEmployees();
        addToast(`Employee "${emp.name}" added successfully.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to add employee');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchEmployees, addToast]);

  const editEmployee = useCallback(async (empId, updatedData) => {
    if (!token) return;
    try {
      const sanitizedData = { ...updatedData };
      if (sanitizedData.dob === '') sanitizedData.dob = null;
      if (sanitizedData.joinDate === '') sanitizedData.joinDate = null;

      const resp = await fetch(`${API_BASE}/employees/${empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(sanitizedData),
      });
      const data = await resp.json();
      if (data.success) {
        fetchEmployees();
        addToast(`Employee profile updated.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to edit employee');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchEmployees, addToast]);

  const deleteEmployee = useCallback(async (empId) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/employees/${empId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        fetchEmployees();
        addToast(`Employee profile deleted.`, 'info');
      } else {
        throw new Error(data.message || 'Failed to delete employee');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchEmployees, addToast]);

  const updateEmployeeStatus = useCallback(async (empId, status, details = {}) => {
    if (!token) return;
    try {
      let payload = { status };
      if (status === 'Promoted') {
        payload = {
          role: details.role,
          salaryStructure: details.salaryStructure
        };
      } else if (status === 'Transferred') {
        payload = {
          department: details.department,
          workLocation: details.workLocation
        };
      }
      const resp = await fetch(`${API_BASE}/employees/${empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (data.success) {
        fetchEmployees();
        addToast(`Employee records updated.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to update employee status');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchEmployees, addToast]);

  const addLeaveRequest = useCallback(async (req) => {
    if (!token) return;
    try {
      const backendPayload = {
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        department: req.department,
        type: req.type,
        startDate: req.start,
        endDate: req.end,
        days: req.days,
        reason: req.reason,
        status: req.status || 'Pending',
        dayType: req.dayType || 'Full Day',
        proofOfLeave: req.proofOfLeave || ''
      };
      const resp = await fetch(`${API_BASE}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(backendPayload),
      });
      const data = await resp.json();
      if (data.success) {
        fetchLeaves();
        addToast(`Leave request submitted.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to submit leave request');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchLeaves, addToast]);

  const updateLeaveStatus = useCallback(async (leaveId, nextStatus, approverName = null) => {
    if (!token) return;
    try {
      const body = { status: nextStatus };
      if (approverName) {
        body.approvedBy = approverName;
      }
      const resp = await fetch(`${API_BASE}/leaves/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (data.success) {
        fetchLeaves();
        fetchEmployees(); // balances might change
        addToast(`Leave request ${nextStatus.toLowerCase()}.`, nextStatus === 'Approved' ? 'success' : 'info');
      } else {
        throw new Error(data.message || 'Failed to update leave request status');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchLeaves, fetchEmployees, addToast]);

  const processPayrollMonth = useCallback(async (month) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/payroll/process?month=${encodeURIComponent(month)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        fetchPayroll();
        addToast(`Payroll processed for ${month}.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to process payroll');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchPayroll, addToast]);

  const updatePayrollStatus = useCallback(async (payrollId, status) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/payroll/${payrollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify({ status })
      });
      const data = await resp.json();
      if (data.success) {
        fetchPayroll();
        addToast(`Payroll status updated to ${status}.`, 'success');
        return true;
      } else {
        throw new Error(data.message || 'Failed to update payroll status');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
      return false;
    }
  }, [token, tenantId, fetchPayroll, addToast]);

  const updateOrCreatePayrollStatus = useCallback(async (employeeId, month, status, extraFields = {}) => {
    if (!token) return;
    try {
      const existing = payroll.find(p => p.employeeId === employeeId && p.month === month);
      if (existing) {
        return await updatePayrollStatus(existing.id, status);
      } else {
        const resp = await fetch(`${API_BASE}/payroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || getTenantId(),
          },
          body: JSON.stringify({
            employeeId,
            employeeName: extraFields.employeeName || '',
            department: extraFields.department || 'General',
            designation: extraFields.designation || 'Staff',
            month,
            status,
            basic: parseFloat(extraFields.basic || 0),
            hra: parseFloat(extraFields.hra || 0),
            allowances: parseFloat(extraFields.allowances || 0),
            incentives: parseFloat(extraFields.incentives || 0),
            bonus: parseFloat(extraFields.bonus || 0),
            pf: parseFloat(extraFields.pf || 0),
            esi: parseFloat(extraFields.esi || 0),
            tds: parseFloat(extraFields.tds || 0),
            loanDeductions: parseFloat(extraFields.loanDeductions || 0),
          })
        });
        const data = await resp.json();
        if (data.success) {
          fetchPayroll();
          addToast(`Payroll status updated to ${status}.`, 'success');
          return true;
        } else {
          throw new Error(data.message || 'Failed to update payroll status');
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
      return false;
    }
  }, [token, tenantId, payroll, updatePayrollStatus, fetchPayroll, addToast]);

  const clockInOut = useCallback(async (empId, type, details = {}) => {
    if (!token) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (details.method === 'Manual Entry' || details.method === 'Manual Correction') {
        const payload = {
          employeeId: empId,
          name: employees.find(e => e.id === empId)?.name || 'Staff Member',
          role: employees.find(e => e.id === empId)?.role || 'Staff',
          date: todayStr,
          checkIn: type === 'in' ? details.time : null,
          checkOut: type === 'out' ? details.time : null,
          workingHours: type === 'out' ? 8.0 : 0.0,
          status: details.status || 'Present',
          method: details.method || 'Manual Entry',
          active: false
        };
        const resp = await fetch(`${API_BASE}/attendance/manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || getTenantId(),
          },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data.success) {
          fetchAttendance();
          addToast('Manual attendance logged successfully.', 'success');
        } else {
          throw new Error(data.message || 'Failed to log manual attendance');
        }
        return;
      }

      const payload = {
        employeeId: empId,
        name: employees.find(e => e.id === empId)?.name || 'Staff Member',
        role: employees.find(e => e.id === empId)?.role || 'Staff',
        date: todayStr,
        checkIn: type === 'in' ? timeStr : (details.action === 'punch-in' ? timeStr : null),
        checkOut: type === 'out' ? timeStr : (details.action === 'punch-out' ? timeStr : null),
        status: details.status || 'Present',
        method: details.method || 'Web Portal',
        active: type === 'in' || details.action === 'punch-in',
        action: details.action || null
      };

      const resp = await fetch(`${API_BASE}/attendance/clock-in-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data.success) {
        fetchAttendance();
        let msg = 'Attendance status updated.';
        if (details.action === 'punch-in') msg = 'Clocked In successfully.';
        else if (details.action === 'punch-out') msg = 'Clocked Out successfully.';
        else if (details.action === 'break-in') msg = 'Break started successfully.';
        else if (details.action === 'break-out') msg = 'Break ended successfully.';
        else msg = type === 'in' ? 'Clocked In successfully.' : 'Clocked Out successfully.';
        addToast(msg, 'success');
      } else {
        throw new Error(data.message || 'Failed to check-in/out');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, employees, fetchAttendance, addToast]);

  const createTask = useCallback(async (taskData) => {
    if (!token) return null;
    try {
      const cleaned = { ...taskData };
      if (cleaned.startDate === "") cleaned.startDate = null;
      if (cleaned.dueDate === "") cleaned.dueDate = null;
      if (cleaned.reminderDate === "") cleaned.reminderDate = null;

      const resp = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(cleaned),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setTasks(prev => [data.data, ...prev]);
        addToast(`Task "${data.data.title}" created successfully`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const updateTask = useCallback(async (taskId, updateData) => {
    if (!token) return null;
    try {
      const cleaned = { ...updateData };
      if (cleaned.startDate === "") cleaned.startDate = null;
      if (cleaned.dueDate === "") cleaned.dueDate = null;
      if (cleaned.reminderDate === "") cleaned.reminderDate = null;

      const resp = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(cleaned),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setTasks(prev => prev.map(item => item.id === taskId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update task');
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const deleteTask = useCallback(async (taskId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        setTasks(prev => prev.filter(item => item.id !== taskId));
        addToast('Task deleted.', 'info');
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const createReminder = useCallback(async (reminderData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(reminderData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setReminders(prev => [data.data, ...prev]);
        addToast('New reminder scheduled successfully.', 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to schedule reminder');
      }
    } catch (err) {
      console.error('Failed to create reminder:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const updateReminder = useCallback(async (reminderId, updateData) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(updateData),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setReminders(prev => prev.map(item => item.id === reminderId ? data.data : item));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update reminder');
      }
    } catch (err) {
      console.error('Failed to update reminder:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const deleteReminder = useCallback(async (reminderId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
      });
      const data = await resp.json();
      if (data.success) {
        setReminders(prev => prev.filter(item => item.id !== reminderId));
        addToast('Reminder deleted.', 'info');
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete reminder');
      }
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      addToast(err.message, 'error');
      throw err;
    }
  }, [token, tenantId, addToast]);

  const addAnnouncement = useCallback((ann) => {
    const newAnn = {
      id: `ANN-${String(announcements.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      author: 'HR Dept',
      ...ann
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    addToast('Announcement published.', 'success');
  }, [announcements, addToast]);

  const assignAsset = useCallback((empId, assetData) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === empId) {
        const newAsset = {
          id: `AST-${String(Date.now()).slice(-4)}`,
          assignedDate: new Date().toISOString().split('T')[0],
          status: 'Assigned',
          ...assetData
        };
        const nextAssets = [...(e.assets || []), newAsset];
        const nextHistory = [
          ...(e.history || []),
          { date: new Date().toISOString().split('T')[0], event: `Assigned Asset: ${assetData.name} (${assetData.type})` }
        ];
        return { ...e, assets: nextAssets, history: nextHistory };
      }
      return e;
    }));
    addToast('Asset assigned successfully.', 'success');
  }, [addToast]);

  const returnAsset = useCallback((empId, assetId) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === empId) {
        let assetName = '';
        const nextAssets = (e.assets || []).map(ast => {
          if (ast.id === assetId) {
            assetName = ast.name;
            return { ...ast, status: 'Returned', returnDate: new Date().toISOString().split('T')[0] };
          }
          return ast;
        });
        const nextHistory = [
          ...(e.history || []),
          { date: new Date().toISOString().split('T')[0], event: `Returned Asset: ${assetName}` }
        ];
        return { ...e, assets: nextAssets, history: nextHistory };
      }
      return e;
    }));
    addToast('Asset returned.', 'success');
  }, [addToast]);

  const createLetterRequest = useCallback(async (reqPayload) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/documents/letters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(reqPayload)
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setLetterRequests(prev => [data.data, ...prev]);
        addToast('Letter request submitted successfully.', 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
      return null;
    }
  }, [token, tenantId, addToast]);

  const updateLetterRequestStatus = useCallback(async (requestId, status, actionsTaken) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/documents/letters/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify({ status, actionsTaken })
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setLetterRequests(prev => prev.map(item => item.id === requestId ? data.data : item));
        addToast(`Request status updated to: ${status}`, 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update request');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
      return null;
    }
  }, [token, tenantId, addToast]);

  const addPayrollAdjustment = useCallback(async (payload) => {
    if (!token) return null;
    try {
      const resp = await fetch(`${API_BASE}/payroll/adjustments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setPayrollAdjustments(prev => [data.data, ...prev]);
        addToast('Payroll adjustment added successfully.', 'success');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to add adjustment');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
      return null;
    }
  }, [token, tenantId, addToast]);

  const deletePayrollAdjustment = useCallback(async (adjustmentId) => {
    if (!token) return false;
    try {
      const resp = await fetch(`${API_BASE}/payroll/adjustments/${adjustmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        }
      });
      const data = await resp.json();
      if (data.success) {
        setPayrollAdjustments(prev => prev.filter(item => item.id !== adjustmentId));
        addToast('Payroll adjustment deleted successfully.', 'success');
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete adjustment');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
      return false;
    }
  }, [token, tenantId, addToast]);

  const uploadDocument = useCallback(async (empId, docData) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/documents/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId(),
        },
        body: JSON.stringify({
          employeeId: empId,
          name: docData.name,
          type: docData.type
        })
      });
      const data = await resp.json();
      if (data.success && data.data) {
        fetchSubmissions();
        fetchEmployees();
        addToast(`Document uploaded successfully.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  }, [token, tenantId, fetchSubmissions, fetchEmployees, addToast]);

  // Dark mode initialization
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved === 'dark';
  });

  // Sync dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme-mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme-mode', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // UX4G Theme Customization states
  const [activeThemeName, setActiveThemeName] = useState(() => {
    return localStorage.getItem('ux4g-active-theme-name') || 'default';
  });

  const [themeConfig, setThemeConfig] = useState(() => {
    const saved = localStorage.getItem('ux4g-theme-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PRESET_THEMES.default;
      }
    }
    return PRESET_THEMES.default;
  });

  const [customThemes, setCustomThemes] = useState(() => {
    const saved = localStorage.getItem('ux4g-custom-themes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('ux4g-active-theme-name', activeThemeName);
  }, [activeThemeName]);

  useEffect(() => {
    localStorage.setItem('ux4g-theme-config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  // Synchronize CSS custom variables live on root node
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const isSuperAdmin = user?.role === 'super_admin';
    const wsPrimary = workspaceSettings?.brand_color;
    const primaryColor = wsPrimary || themeConfig.primary || (isDark ? (isSuperAdmin ? '#2563eb' : '#6366f1') : (isSuperAdmin ? '#0052cc' : '#6366f1'));
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-hover', primaryColor);

    if (isDark) {
      if (isSuperAdmin) {
        // Super Admin - Dark Blue Theme
        root.style.setProperty('--background', '#090e1a');
        root.style.setProperty('--card', '#121b2d');
        root.style.setProperty('--sidebar', '#0d1527');
        root.style.setProperty('--border', '#1e293b');
        root.style.setProperty('--hover', '#1e293b');
        root.style.setProperty('--table-header', '#1a2333');
        root.style.setProperty('--primary', primaryColor);
        root.style.setProperty('--accent', '#818cf8');
      } else {
        // Regular User / Admin - Dark Slate/White-compatible Theme
        root.style.setProperty('--background', '#0f172a');
        root.style.setProperty('--card', '#1e293b');
        root.style.setProperty('--sidebar', '#0f172a');
        root.style.setProperty('--border', '#334155');
        root.style.setProperty('--hover', '#1e293b');
        root.style.setProperty('--table-header', '#1e293b');
        root.style.setProperty('--primary', primaryColor);
        root.style.setProperty('--accent', '#a855f7');
      }
    } else {
      if (isSuperAdmin) {
        // Super Admin - Light Blue Theme
        root.style.setProperty('--background', '#f0f5ff');
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--sidebar', '#e5eeff');
        root.style.setProperty('--border', '#cbd5e1');
        root.style.setProperty('--hover', '#dbeafe');
        root.style.setProperty('--table-header', '#dbeafe');
        root.style.setProperty('--primary', primaryColor);
        root.style.setProperty('--accent', '#805ad5');
      } else {
        // Regular User / Admin - Clean White Theme
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--sidebar', '#f8fafc'); // White/Grey sidebar instead of blue
        root.style.setProperty('--border', '#e2e8f0');
        root.style.setProperty('--hover', '#f1f5f9');
        root.style.setProperty('--table-header', '#f8fafc');
        root.style.setProperty('--primary', primaryColor);
        root.style.setProperty('--accent', '#a855f7');
      }
    }
    
    // Status color overrides
    root.style.setProperty('--success', themeConfig.success);
    root.style.setProperty('--warning', themeConfig.warning);
    root.style.setProperty('--danger', themeConfig.danger);
    root.style.setProperty('--info', themeConfig.info);

    // Border radius modifiers
    const radius = themeConfig.borderRadius;
    root.style.setProperty('--radius-sm', `${Math.max(0, radius - 6)}px`);
    root.style.setProperty('--radius-md', `${Math.max(0, radius - 4)}px`);
    root.style.setProperty('--radius-lg', `${radius}px`);
    root.style.setProperty('--radius-xl', `${Math.round(radius * 1.25)}px`);
    root.style.setProperty('--radius-2xl', `${Math.round(radius * 1.5)}px`);
    root.style.setProperty('--radius-3xl', `${Math.round(radius * 2)}px`);

    // Font size styling
    let fontSizeVal = '16px';
    if (themeConfig.fontSize === 'sm') fontSizeVal = '14px';
    else if (themeConfig.fontSize === 'lg') fontSizeVal = '18px';
    else if (themeConfig.fontSize === 'xl') fontSizeVal = '20px';
    root.style.setProperty('font-size', fontSizeVal);

    // Font Family selector
    let fontFamilyVal = "'Inter', ui-sans-serif, system-ui, sans-serif";
    if (themeConfig.fontFamily === 'Roboto') fontFamilyVal = "'Roboto', sans-serif";
    else if (themeConfig.fontFamily === 'Outfit') fontFamilyVal = "'Outfit', sans-serif";
    else if (themeConfig.fontFamily === 'system-ui') fontFamilyVal = "system-ui, -apple-system, sans-serif";
    root.style.setProperty('--font-sans', fontFamilyVal);

    // Card shadow controls
    let shadowVal = '0 1px 3px rgba(0,0,0,0.02)';
    if (themeConfig.shadowIntensity === 'none') shadowVal = 'none';
    else if (themeConfig.shadowIntensity === 'medium') shadowVal = '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.02)';
    else if (themeConfig.shadowIntensity === 'high') shadowVal = '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';
    root.style.setProperty('--card-shadow', shadowVal);

    // Enable/disable keyframe animations
    if (themeConfig.animationsEnabled) {
      root.classList.remove('no-animations');
    } else {
      root.classList.add('no-animations');
    }

    // Sidebar width and density spacings
    root.style.setProperty('--sidebar-width', `${themeConfig.sidebarWidth}px`);
    
    let densityPadding = '1.25rem';
    let densityGap = '1.5rem';
    if (themeConfig.density === 'compact') {
      densityPadding = '0.75rem';
      densityGap = '0.75rem';
    } else if (themeConfig.density === 'wide') {
      densityPadding = '1.75rem';
      densityGap = '2rem';
    }
    root.style.setProperty('--layout-padding', densityPadding);
    root.style.setProperty('--layout-gap', densityGap);

  }, [themeConfig, activeThemeName, user, darkMode]);

  const applyThemeConfig = useCallback((config) => {
    setThemeConfig(prev => ({ ...prev, ...config }));
  }, []);

  const saveCustomTheme = useCallback((name, config) => {
    setCustomThemes(prev => {
      const existingIdx = prev.findIndex(t => t.name === name);
      const newTheme = { name, config };
      let next;
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = newTheme;
      } else {
        next = [...prev, newTheme];
      }
      localStorage.setItem('ux4g-custom-themes', JSON.stringify(next));
      return next;
    });
    addToast(`Theme "${name}" saved successfully.`, 'success');
  }, [addToast]);

  const deleteCustomTheme = useCallback((name) => {
    setCustomThemes(prev => {
      const next = prev.filter(t => t.name !== name);
      localStorage.setItem('ux4g-custom-themes', JSON.stringify(next));
      return next;
    });
    addToast(`Theme "${name}" deleted.`, 'info');
  }, [addToast]);

  const duplicateCustomTheme = useCallback((name, newName) => {
    setCustomThemes(prev => {
      const src = prev.find(t => t.name === name);
      if (!src) return prev;
      const next = [...prev, { name: newName, config: { ...src.config } }];
      localStorage.setItem('ux4g-custom-themes', JSON.stringify(next));
      return next;
    });
    addToast(`Duplicated "${name}" as "${newName}".`, 'success');
  }, [addToast]);

  const exportTheme = useCallback((config) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ux4g-theme-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addToast('Theme settings exported successfully.', 'success');
    } catch (err) {
      addToast('Failed to export theme.', 'error');
    }
  }, [addToast]);

  const importTheme = useCallback((jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && parsed.primary) {
        setThemeConfig(prev => ({ ...prev, ...parsed }));
        setActiveThemeName('custom-imported');
        addToast('Theme imported and applied successfully.', 'success');
        return true;
      } else {
        addToast('Invalid theme JSON schema.', 'error');
        return false;
      }
    } catch (err) {
      addToast('Failed to parse theme file.', 'error');
      return false;
    }
  }, [addToast]);

  const resetTheme = useCallback(() => {
    setThemeConfig(PRESET_THEMES.default);
    setActiveThemeName('default');
    addToast('Theme settings reset to default.', 'info');
  }, [addToast]);

  const [notifications, setNotifications] = useState([]);



  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);



  // Auto-synchronize total stock in inventoryItems when productsExtended changes
  useEffect(() => {
    setInventoryItems(prevItems => {
      let changed = false;
      const nextItems = prevItems.map(item => {
        const ext = productsExtended[item.id];
        if (ext) {
          const totalStock = Object.values(ext.platforms).reduce((sum, p) => sum + (p.stock || 0), 0);
          if (item.stock !== totalStock) {
            changed = true;
            return { ...item, stock: totalStock };
          }
        }
        return item;
      });
      return changed ? nextItems : prevItems;
    });
  }, [productsExtended]);

  // Modify stock of a product on a specific platform and log it
  const adjustProductPlatformStock = useCallback((productId, platform, qty, type = 'set', reason = 'Manual Update') => {
    setProductsExtended(prev => {
      const product = prev[productId];
      if (!product || !product.platforms[platform]) return prev;

      const oldStock = product.platforms[platform].stock;
      let newStock = oldStock;
      if (type === 'add') newStock = oldStock + qty;
      else if (type === 'deduct') newStock = Math.max(0, oldStock - qty);
      else if (type === 'set') newStock = Math.max(0, qty);

      if (newStock === oldStock) return prev;

      const updatedPlatform = {
        ...product.platforms[platform],
        stock: newStock
      };

      const next = {
        ...prev,
        [productId]: {
          ...product,
          platforms: {
            ...product.platforms,
            [platform]: updatedPlatform
          }
        }
      };

      const difference = newStock - oldStock;
      const skuCode = updatedPlatform.sku;
      const prodName = inventoryItems.find(i => i.id === productId)?.name || 'Product';
      
      // Trigger low-stock alerts if stock drops below threshold
      const threshold = updatedPlatform.threshold || 5;
      if (newStock <= threshold) {
        const warnMsg = `⚠ ${platform} Stock Low for ${prodName}: Remaining: ${newStock} Units`;
        setNotifications(prevNotifs => {
          if (prevNotifs.some(n => n.text === warnMsg && n.time === 'Just now')) return prevNotifs;
          return [
            { id: Date.now() + Math.random(), text: warnMsg, time: 'Just now', read: false },
            ...prevNotifs
          ];
        });
        addToast(warnMsg, 'warning');
      }

      if (difference !== 0) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        setMovementLogs(prevLogs => [
          {
            time: timestamp,
            sku: skuCode || `SKU-${productId}`,
            product: prodName || 'Product',
            platform: platform,
            action: reason,
            qty: difference > 0 ? `+${difference}` : `${difference}`,
            user: 'System CRM'
          },
          ...prevLogs
        ]);
      }
      return next;
    });
  }, [inventoryItems, addToast]);

  // Transfer stock between two platforms
  const transferPlatformStock = useCallback((productId, fromPlatform, toPlatform, qty) => {
    adjustProductPlatformStock(productId, fromPlatform, qty, 'deduct', `Transfer to ${toPlatform}`);
    adjustProductPlatformStock(productId, toPlatform, qty, 'add', `Transfer from ${fromPlatform}`);
    addToast(`Transferred ${qty} units from ${fromPlatform} to ${toPlatform} successfully.`, 'success');
  }, [adjustProductPlatformStock, addToast]);

  // Set platform safety stock limit threshold
  const setPlatformThreshold = useCallback((productId, platform, threshold) => {
    setProductsExtended(prev => {
      const product = prev[productId];
      if (!product || !product.platforms[platform]) return prev;

      const parsedThreshold = parseInt(threshold, 10) || 0;
      if (product.platforms[platform].threshold === parsedThreshold) return prev;

      return {
        ...prev,
        [productId]: {
          ...product,
          platforms: {
            ...product.platforms,
            [platform]: {
              ...product.platforms[platform],
              threshold: parsedThreshold
            }
          }
        }
      };
    });
    addToast(`Set custom threshold of ${threshold} units for ${platform}.`, 'success');
  }, [addToast]);

  // Update order status and adjust stock levels accordingly
  const updateOrderStatus = useCallback((orderId, nextStatus) => {
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id === orderId) {
          const prevStatus = order.status;
          if (prevStatus === nextStatus) return order;

          const isPrevReturnedOrCancelled = prevStatus === 'Cancelled' || prevStatus === 'Returned';
          const isNextReturnedOrCancelled = nextStatus === 'Cancelled' || nextStatus === 'Returned';

          // Return stock back to corresponding marketplace if cancelled/returned
          if (!isPrevReturnedOrCancelled && isNextReturnedOrCancelled) {
            adjustProductPlatformStock(order.productId, order.source, order.qty, 'add', `Order ${orderId} ${nextStatus} (Return)`);
          } 
          // Deduct stock if order is restored to fulfillment
          else if (isPrevReturnedOrCancelled && !isNextReturnedOrCancelled) {
            adjustProductPlatformStock(order.productId, order.source, order.qty, 'deduct', `Order ${orderId} Restored`);
          }

          return { ...order, status: nextStatus };
        }
        return order;
      });
    });
  }, [adjustProductPlatformStock]);

  return (
    <AppContext.Provider value={{
      token,
      user,
      tenantId,
      isAuthenticated: !!token,
      login,
      logout,
      refreshUserProfile,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      notifications,
      setNotifications,
      unreadCount,
      markAllRead,
      toasts,
      addToast,
      removeToast,
      darkMode,
      toggleDarkMode,
      activeOrg,
      setActiveOrg,
      aiAssistantOpen,
      setAiAssistantOpen,
      inventoryItems,
      setInventoryItems,
      orders,
      setOrders,
      productsExtended: resolvedProductsExtended,
      setProductsExtended,
      movementLogs,
      setMovementLogs,
      adjustProductPlatformStock,
      transferPlatformStock,
      setPlatformThreshold,
      updateOrderStatus,
      activeThemeName,
      setActiveThemeName,
      themeConfig,
      setThemeConfig,
      customThemes,
      setCustomThemes,
      applyThemeConfig,
      saveCustomTheme,
      deleteCustomTheme,
      duplicateCustomTheme,
      exportTheme,
      importTheme,
      resetTheme,
      leads,
      setLeads,
      updateLead,
      deleteLead,
      contacts,
      setContacts,
      addContact,
      updateContact,
      deleteContact,
      clients,
      setClients,
      addClient,
      updateClient,
      deleteClient,
      convertLeadToClient,
      addClientProject,
      updateClientProjectStatus,
      addClientTask,
      uploadClientFile,
      recordClientPayment,
      employees,
      setEmployees,
      addEmployee,
      editEmployee,
      deleteEmployee,
      updateEmployeeStatus,
      leaves,
      setLeaves,
      addLeaveRequest,
      updateLeaveStatus,
      payroll,
      setPayroll,
      processPayrollMonth,
      updatePayrollStatus,
      updateOrCreatePayrollStatus,
      attendance,
      setAttendance,
      clockInOut,
      recruitmentJobs,
      setRecruitmentJobs,
      announcements,
      setAnnouncements,
      addAnnouncement,
      assignAsset,
      returnAsset,
      uploadDocument,
      letterRequests,
      setLetterRequests,
      flatDocs,
      setFlatDocs,
      createLetterRequest,
      updateLetterRequestStatus,
      payrollAdjustments,
      addPayrollAdjustment,
      deletePayrollAdjustment,
      hrmsRole,
      setHrmsRole,
      hrmsEmployeeId,
      setHrmsEmployeeId,
      projects,
      setProjects,
      addProject,
      editProject,
      deleteProject,
      updateProjectStage,
      addProjectTask,
      updateProjectTask,
      addProjectComment,
      addProjectDocument,
      recordProjectPayment,
      tasks,
      setTasks,
      createTask,
      updateTask,
      deleteTask,
      reminders,
      setReminders,
      createReminder,
      updateReminder,
      deleteReminder,
      roles,
      setRoles,
      fetchRoles,
      createRole,
      updateRole,
      deleteRole,
      duplicateRole,
      auditLogs,
      setAuditLogs,
      fetchAuditLogs,
      quotes,
      setQuotes,
      addQuote,
      invoices,
      setInvoices,
      addInvoice,
      payments,
      setPayments,
      addPayment,
      campaigns,
      setCampaigns,
      addCampaign,
      adminUsers,
      setAdminUsers,
      addAdminUser,
      createProduct,
      updateProduct,
      deleteProductApi,
      fetchProducts,
      expenses,
      setExpenses,
      ledger,
      setLedger,
      gstRecords,
      setGstRecords,
      fetchInvoices,
      createInvoice,
      updateInvoice,
      deleteInvoiceApi,
      fetchQuotes,
      createQuote,
      updateQuote,
      deleteQuote,
      fetchPayments,
      createPayment,
      updatePayment,
      fetchLedger,
      createLedgerEntry,
      fetchExpenses,
      createExpense,
      updateExpense,
      fetchGstRecords,
      createGstRecord,
      updateGstRecord,
      fetchEmployees,
      workspaceSettings,
      refreshWorkspaceSettings,
      setWorkspaceSettings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
