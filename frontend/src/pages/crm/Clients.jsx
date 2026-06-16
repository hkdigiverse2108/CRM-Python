import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import { 
  Building2, User, Phone, Mail, Globe, MapPin, ShieldAlert,
  Search, Plus, Filter, ArrowLeft, TrendingUp, DollarSign, 
  Briefcase, Activity, Calendar, FileText, CheckCircle2, 
  Clock, AlertCircle, PlusCircle, Trash2, ArrowUpRight, Upload, 
  Sparkles, FileUp, CreditCard, ChevronRight, CheckCircle, X, Edit
} from 'lucide-react';


export default function Clients() {
  const { 
    clients, 
    addClient, 
    updateClient,
    deleteClient,
    addClientProject, 
    updateClientProjectStatus, 
    addClientTask, 
    uploadClientFile, 
    recordClientPayment,
    addToast
  } = useApp();

  // Selection state (null = list view, active clientId = dashboard view)
  const [selectedClientId, setSelectedClientId] = useState(null);

  // List Workspace Search & Filter States
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name, revenue, projects, lastActivity
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Client Form state
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [editClientData, setEditClientData] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    industry: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    website: '',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    annualRevenue: '',
    employeesCount: '',
    companySize: '1-10',
    ownerName: '',
    accountManager: '',
    notes: '',
    businessName: '',
    contactPerson: ''
  });

  // Client Dashboard modals
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);

  // Modal Inputs
  const [projectForm, setProjectForm] = useState({ name: '', service: 'Website Development', amount: '' });
  const [taskForm, setTaskForm] = useState({ title: '', assignee: 'Alex R.' });
  const [paymentForm, setPaymentForm] = useState({ projectId: '', amount: '' });
  const [fileForm, setFileForm] = useState({ name: '', size: '1.2 MB' });

  // Get active client object
  const activeClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Compute calculated clients list with dynamic financial values
  const clientsWithStats = useMemo(() => {
    return clients.map(client => {
      const projects = client.projects || [];
      const totalRevenue = projects.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const amountReceived = projects.reduce((sum, p) => sum + (Number(p.received) || 0), 0);
      const pendingAmount = totalRevenue - amountReceived;
      const completedCount = projects.filter(p => p.status === 'Completed').length;
      const activeCount = projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
      
      const lastAct = client.activities?.[0]?.date?.split(' ')[0] || '2026-06-01';

      return {
        ...client,
        totalRevenue,
        pendingAmount,
        completedCount,
        activeCount,
        totalProjects: projects.length,
        lastActivityDate: lastAct
      };
    });
  }, [clients]);

  // Dynamic lists for filters
  const industries = useMemo(() => {
    const list = new Set(clients.map(c => c.industry).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [clients]);

  // Filter & Sort clients list
  const filteredClients = useMemo(() => {
    return clientsWithStats
      .filter(c => {
        const matchesSearch = 
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.businessName.toLowerCase().includes(search.toLowerCase()) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(search.toLowerCase()));
        
        const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

        return matchesSearch && matchesIndustry && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'projects') return b.totalProjects - a.totalProjects;
        if (sortBy === 'lastActivity') return b.lastActivityDate.localeCompare(a.lastActivityDate);
        return 0;
      });
  }, [clientsWithStats, search, industryFilter, statusFilter, sortBy]);

  // Pagination bounds
  const paginatedClients = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Global Workspace Stats
  const globalStats = useMemo(() => {
    const totalClientsCount = clientsWithStats.length;
    const activeClientsCount = clientsWithStats.filter(c => c.status === 'Active').length;
    
    // Top paying client
    const sortedByRevenue = [...clientsWithStats].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const topPaying = sortedByRevenue[0]?.name || 'N/A';
    const topPayingRev = sortedByRevenue[0]?.totalRevenue || 0;

    // Total Pending across all clients
    const totalPendingPayments = clientsWithStats.reduce((sum, c) => sum + c.pendingAmount, 0);
    const totalRevenueGenerated = clientsWithStats.reduce((sum, c) => sum + c.totalRevenue, 0);

    return {
      totalClientsCount,
      activeClientsCount,
      topPaying,
      topPayingRev,
      totalPendingPayments,
      totalRevenueGenerated
    };
  }, [clientsWithStats]);

  // Dashboard calculations for active client
  const activeClientStats = useMemo(() => {
    if (!activeClient) return null;
    const projects = activeClient.projects || [];
    const totalProjectValue = projects.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const amountReceived = projects.reduce((sum, p) => sum + (Number(p.received) || 0), 0);
    const pendingAmount = totalProjectValue - amountReceived;
    const completedCount = projects.filter(p => p.status === 'Completed').length;
    const activeCount = projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;

    // Service Breakdown counts
    const services = {};
    projects.forEach(p => {
      services[p.service] = (services[p.service] || 0) + (Number(p.amount) || 0);
    });

    return {
      totalProjectValue,
      amountReceived,
      pendingAmount,
      totalProjects: projects.length,
      completedCount,
      activeCount,
      services
    };
  }, [activeClient]);

  // Add Client Handler
  const handleAddClient = (e) => {
    e.preventDefault();
    addClient({
      ...newClient,
      businessName: newClient.name,
      contactPerson: newClient.ownerName || newClient.name
    });
    setShowAddDrawer(false);
    setNewClient({
      name: '',
      industry: '',
      businessType: '',
      gstNumber: '',
      panNumber: '',
      website: '',
      email: '',
      phone: '',
      altPhone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      annualRevenue: '',
      employeesCount: '',
      companySize: '1-10',
      ownerName: '',
      accountManager: '',
      notes: '',
      businessName: '',
      contactPerson: ''
    });
  };

  const handleStartEdit = (client, e) => {
    if (e) e.stopPropagation();
    setEditClientData({ ...client });
    setShowEditClient(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editClientData.name) {
      addToast('Client Name is required', 'warning');
      return;
    }
    updateClient(editClientData.id, {
      ...editClientData,
      businessName: editClientData.name,
      contactPerson: editClientData.ownerName || editClientData.name
    });
    setShowEditClient(false);
    setEditClientData(null);
  };

  const handleDeleteClick = (clientId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteClient(clientId);
      if (selectedClientId === clientId) {
        setSelectedClientId(null);
      }
    }
  };

  // Add Project Handler
  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.amount) {
      addToast('Please enter project name and budget.', 'error');
      return;
    }
    addClientProject(selectedClientId, {
      name: projectForm.name,
      service: projectForm.service,
      amount: Number(projectForm.amount) || 0
    });
    setShowAddProject(false);
    setProjectForm({ name: '', service: 'Website Development', amount: '' });
  };

  // Add Task Handler
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskForm.title) {
      addToast('Please enter task description.', 'error');
      return;
    }
    addClientTask(selectedClientId, {
      title: taskForm.title,
      assignee: taskForm.assignee
    });
    setShowAddTask(false);
    setTaskForm({ title: '', assignee: 'Alex R.' });
  };

  // Add Payment Record Handler
  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentForm.projectId || !paymentForm.amount) {
      addToast('Please select project and enter payment amount.', 'error');
      return;
    }
    recordClientPayment(selectedClientId, paymentForm.projectId, Number(paymentForm.amount));
    setShowAddPayment(false);
    setPaymentForm({ projectId: '', amount: '' });
  };

  // Add File Handler
  const handleUploadFile = (e) => {
    e.preventDefault();
    if (!fileForm.name) return;
    uploadClientFile(selectedClientId, {
      name: fileForm.name,
      size: fileForm.size
    });
    setShowAddFile(false);
    setFileForm({ name: '', size: '1.2 MB' });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* 1. VIEW CONTROLLER: LIST VIEW */}
      {!selectedClientId ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header */}
          <PageHeader title="Client Workspace" subtitle="Manage business accounts, client project scopes, files, and billing records.">
            <button 
              onClick={() => setShowAddDrawer(true)}
              className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              style={{ color: '#ffffff' }}
            >
              <Plus size={15} />
              <span>Add New Client</span>
            </button>
          </PageHeader>

          {/* Stats KPI Ribbon Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Clients</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{globalStats.totalClientsCount}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Contracts</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{globalStats.activeClientsCount}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1 col-span-2 lg:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Top Account</span>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">{globalStats.topPaying}</p>
              <span className="text-[10px] text-slate-400 block font-semibold">Value: {formatCurrency(globalStats.topPayingRev)}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pending Outstandings</span>
              <p className="text-sm font-black text-rose-500">{formatCurrency(globalStats.totalPendingPayments)}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Pipeline Value</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">{formatCurrency(globalStats.totalRevenueGenerated)}</p>
            </div>

          </div>

          {/* List Search, Filtering, sorting */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by client, business name, or contact person..."
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none"
              />
            </div>

            {/* Filter selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-450 font-bold">
                <Filter size={13} /> Filters:
              </div>

              {/* Industry Filter */}
              <select
                value={industryFilter}
                onChange={e => { setIndustryFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="All">All Industries</option>
                {industries.filter(ind => ind !== 'All').map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="name">Sort by Name</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="projects">Sort by Projects Count</option>
                <option value="lastActivity">Sort by Activity</option>
              </select>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client Name & Business</th>
                    <th>Contact Person</th>
                    <th>Industry</th>
                    <th className="text-right">Projects</th>
                    <th className="text-right">Total Revenue</th>
                    <th className="text-right text-rose-500">Pending Amount</th>
                    <th>Last Activity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.length > 0 ? (
                    paginatedClients.map(client => (
                      <tr 
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            {client.name === 'HK Digiverse LLP' && <Sparkles size={12} className="text-amber-500 shrink-0" />}
                            {client.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">{client.businessName}</div>
                        </td>
                        <td>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-350">{client.contactPerson || 'N/A'}</div>
                          <div className="text-[9px] text-slate-400 font-medium">{client.email}</div>
                        </td>
                        <td>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500 uppercase tracking-wider">
                            {client.industry || 'General'}
                          </span>
                        </td>
                        <td className="text-right text-xs font-extrabold text-slate-900 dark:text-white">
                          <div className="flex justify-end gap-1.5 text-[10px]">
                            <span className="text-emerald-500 font-black">{client.completedCount} ✔</span>
                            <span className="text-indigo-505 font-bold">{client.activeCount} ⚙</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">Total: {client.totalProjects}</div>
                        </td>
                        <td className="text-right text-xs font-black text-slate-900 dark:text-white">
                          {formatCurrency(client.totalRevenue)}
                        </td>
                        <td className="text-right text-xs font-black text-rose-500">
                          {client.pendingAmount > 0 ? formatCurrency(client.pendingAmount) : 'Nil'}
                        </td>
                        <td className="text-xs text-slate-450 font-bold">
                          {client.activities?.[0] ? client.activities[0].text : 'No activity logged'}
                          <div className="text-[9px] text-slate-400 mt-0.5">{client.lastActivityDate}</div>
                        </td>
                        <td>
                          <span className={`badge ${client.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                            {client.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={(e) => {
                                setSelectedClientId(client.id);
                              }}
                              className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline flex items-center gap-0.5"
                            >
                              <span>Dashboard</span>
                              <ChevronRight size={12} />
                            </button>
                            <button
                              onClick={(e) => handleStartEdit(client, e)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Client"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(client.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete Client"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center p-10 text-slate-400 font-semibold">
                        No clients found matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Showing Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        
        // 2. VIEW CONTROLLER: CLIENT DASHBOARD DETAIL
        <div className="space-y-6 animate-fade-in">
          
          {/* Dashboard Header toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <button 
                onClick={() => setSelectedClientId(null)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title="Back to Clients Workspace"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{activeClient.name}</h2>
                  <span className={`badge ${activeClient.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{activeClient.status}</span>
                  <button onClick={(e) => handleStartEdit(activeClient, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Edit Client"><Edit size={14} /></button>
                  <button onClick={(e) => handleDeleteClick(activeClient.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Delete Client"><Trash2 size={14} /></button>
                </div>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Client Dashboard — Financial Summary, Projects Tracker, and Tally Activity Log.</p>
              </div>
            </div>

            {/* Quick dashboard actions */}
            <div className="flex flex-wrap gap-2.5">
              <button 
                onClick={() => setShowAddProject(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50/50 hover:bg-indigo-55 bg-white border border-slate-200 dark:bg-slate-850 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                <PlusCircle size={14} /> Add Project
              </button>
              <button 
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <Briefcase size={14} /> Assign Task
              </button>
              <button 
                onClick={() => setShowAddPayment(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <CreditCard size={14} /> Record Payment
              </button>
            </div>
          </div>

          {/* Client Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Info & Service Breakdown (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Card Info */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold flex items-center justify-center shadow-md">
                    {activeClient.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Client Info</h3>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeClient.businessName}</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs font-bold">
                  
                  <div className="flex items-start gap-2.5">
                    <User size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Contact Person</span>
                      <span className="text-slate-700 dark:text-slate-350">{activeClient.contactPerson || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Mobile Number</span>
                      <span className="text-slate-700 dark:text-slate-350">{activeClient.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                      <span className="text-slate-700 dark:text-slate-350">{activeClient.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Globe size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Website</span>
                      <a href={`https://${activeClient.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {activeClient.website || 'N/A'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Address Location</span>
                      <span className="text-slate-700 dark:text-slate-350 leading-relaxed block">
                        {activeClient.address}, {activeClient.city}, {activeClient.state}, {activeClient.country}
                      </span>
                    </div>
                  </div>

                  {activeClient.gstNumber && (
                    <div className="flex items-start gap-2.5">
                      <FileText size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">GST Identification Number</span>
                        <span className="text-slate-800 dark:text-slate-100 font-mono">{activeClient.gstNumber}</span>
                      </div>
                    </div>
                  )}

                  {activeClient.notes && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Administrative Notes</span>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                        "{activeClient.notes}"
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Service/Revenue breakdown metrics */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Service Revenue Breakdown</h3>
                
                <div className="space-y-3">
                  {Object.keys(activeClientStats.services).length > 0 ? (
                    Object.entries(activeClientStats.services).map(([service, amount]) => {
                      const percentage = activeClientStats.totalProjectValue > 0
                        ? Math.round((amount / activeClientStats.totalProjectValue) * 100)
                        : 0;

                      return (
                        <div key={service} className="space-y-1.5 text-xs font-bold">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-655 dark:text-slate-300">{service}</span>
                            <span className="text-slate-900 dark:text-white">{formatCurrency(amount)} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No active service revenue recorded yet.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Financial Summaries & Tabs Workspace (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                
                <div className="bg-gradient-to-br from-indigo-50/60 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-100/50 dark:border-indigo-950/50 p-4.5 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Project Value</span>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(activeClientStats.totalProjectValue)}</p>
                  <span className="text-[9px] text-slate-450 block font-semibold">{activeClientStats.totalProjects} contracts generated</span>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-100/50 dark:border-emerald-950/50 p-4.5 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Amount Received</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(activeClientStats.amountReceived)}</p>
                  <span className="text-[9px] text-emerald-600/80 block font-semibold">Cleared payments in Tally</span>
                </div>

                <div className="bg-gradient-to-br from-rose-50/60 to-rose-100/30 dark:from-rose-950/20 dark:to-rose-900/10 border border-rose-100/50 dark:border-rose-950/50 p-4.5 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pending Balance</span>
                  <p className="text-lg font-black text-rose-500">{formatCurrency(activeClientStats.pendingAmount)}</p>
                  <span className="text-[9px] text-rose-500/85 block font-semibold">{activeClientStats.activeCount} active, {activeClientStats.completedCount} completed</span>
                </div>

              </div>

              {/* Sub-tabs system: 1. Projects, 2. Tasks, 3. Files, 4. Payments, 5. Timeline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                
                {/* Tabs Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/10 p-4 flex flex-wrap gap-2.5">
                  <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider flex items-center gap-1.5 mr-auto">
                    <Activity size={14} className="text-indigo-500" /> Work orders & scope management
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* PROJECT SECTION */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase size={14} className="text-slate-500" /> Projects & Work History
                      </h4>
                      <button 
                        onClick={() => setShowAddProject(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle size={13} /> Add New Project
                      </button>
                    </div>

                    <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <table className="min-w-full text-xs font-bold text-slate-655 text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-950/20 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                          <tr>
                            <th className="p-3">Project Title</th>
                            <th className="p-3">Service Category</th>
                            <th className="p-3 text-right">Budget</th>
                            <th className="p-3 text-right">Paid</th>
                            <th className="p-3 text-right text-rose-500">Unpaid</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {activeClient.projects && activeClient.projects.length > 0 ? (
                            activeClient.projects.map((proj) => {
                              const unpaid = (Number(proj.amount) || 0) - (Number(proj.received) || 0);
                              return (
                                <tr key={proj.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/20">
                                  <td className="p-3 font-extrabold text-slate-900 dark:text-white">{proj.name}</td>
                                  <td className="p-3">{proj.service}</td>
                                  <td className="p-3 text-right text-slate-900 dark:text-white">{formatCurrency(proj.amount)}</td>
                                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(proj.received)}</td>
                                  <td className="p-3 text-right text-rose-500">{unpaid > 0 ? formatCurrency(unpaid) : 'Nil'}</td>
                                  <td className="p-3">
                                    <select
                                      value={proj.status}
                                      onChange={(e) => updateClientProjectStatus(activeClient.id, proj.id, e.target.value)}
                                      className="bg-slate-100 dark:bg-slate-800 border-0 text-[10px] font-black rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                                    >
                                      <option value="Completed">Completed</option>
                                      <option value="Active">Active</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="On Hold">On Hold</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center p-6 text-slate-400 italic">No project history recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TASKS & ASSIGNMENTS */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-slate-500" /> Task Management
                      </h4>
                      <button 
                        onClick={() => setShowAddTask(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle size={13} /> Assign Task
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {activeClient.tasks && activeClient.tasks.length > 0 ? (
                        activeClient.tasks.map((task) => (
                          <div key={task.id} className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs font-bold">
                            <div>
                              <p className="text-slate-850 dark:text-slate-100">{task.title}</p>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Assignee: {task.assignee}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0 ${
                              task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-indigo-50 text-indigo-705 dark:bg-indigo-950/20 dark:text-indigo-400'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold italic col-span-2 text-center py-2">No active tasks assigned.</p>
                      )}
                    </div>
                  </div>

                  {/* FILES & DOCUMENTATION */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-500" /> Files & Agreements
                      </h4>
                      <button 
                        onClick={() => setShowAddFile(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={13} /> Upload File
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activeClient.files && activeClient.files.length > 0 ? (
                        activeClient.files.map((file, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850/40 border border-slate-150/40 dark:border-slate-800/60 rounded-xl flex items-center gap-2.5 text-xs font-bold">
                            <FileText className="text-indigo-500 shrink-0" size={16} />
                            <div className="min-w-0">
                              <p className="text-slate-800 dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
                              <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{file.size} • {file.date}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold italic col-span-3 text-center py-2">No documents uploaded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* CLIENT TIMELINE */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} className="text-slate-500" /> Client Activity Timeline
                    </h4>

                    <div className="pl-3.5 space-y-4 relative before:absolute before:left-[4px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
                      {activeClient.activities && activeClient.activities.length > 0 ? (
                        activeClient.activities.map((act, idx) => (
                          <div key={idx} className="relative pl-6">
                            <div className={`absolute left-[-4.5px] top-1.5 w-[9px] h-[9px] rounded-full border border-white dark:border-slate-900 ${
                              act.type.includes('payment') ? 'bg-emerald-500' : act.type.includes('project') ? 'bg-indigo-500' : 'bg-slate-400'
                            }`}></div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-205">
                              {act.text}
                              <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{act.date}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-450 font-semibold italic py-1">No activities logged yet.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 3. MODALS & DRAWERS FOR ACTIONS */}

      {showAddDrawer && (
        <>
          <div className="sheet-overlay" onClick={() => setShowAddDrawer(false)} />
          <div className="sheet-content w-full max-w-2xl p-6 space-y-5 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Manual Company/Client Entry</h3>
              <button 
                onClick={() => setShowAddDrawer(false)}
                className="text-slate-450 hover:text-slate-650 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="e.g. HK Digiverse LLP"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Industry</label>
                  <input
                    type="text"
                    value={newClient.industry}
                    onChange={e => setNewClient({ ...newClient, industry: e.target.value })}
                    placeholder="e.g. Digital Agency"
                    className="input-field"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Business Type</label>
                  <select
                    value={newClient.businessType}
                    onChange={e => setNewClient({ ...newClient, businessType: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Type</option>
                    <option value="LLP">LLP</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">GST Number</label>
                  <input
                    type="text"
                    value={newClient.gstNumber}
                    onChange={e => setNewClient({ ...newClient, gstNumber: e.target.value })}
                    placeholder="GST Identification Number"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">PAN Number</label>
                  <input
                    type="text"
                    value={newClient.panNumber}
                    onChange={e => setNewClient({ ...newClient, panNumber: e.target.value })}
                    placeholder="PAN Card Number"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Website URL</label>
                  <input
                    type="text"
                    value={newClient.website}
                    onChange={e => setNewClient({ ...newClient, website: e.target.value })}
                    placeholder="hkdigiverse.com"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="contact@hkdigiverse.com"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="Main Contact Number"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Alternate Number</label>
                  <input
                    type="tel"
                    value={newClient.altPhone}
                    onChange={e => setNewClient({ ...newClient, altPhone: e.target.value })}
                    placeholder="Alternate Phone"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Owner Name</label>
                  <input
                    type="text"
                    value={newClient.ownerName}
                    onChange={e => setNewClient({ ...newClient, ownerName: e.target.value })}
                    placeholder="Founder / Owner Name"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Account Manager</label>
                  <input
                    type="text"
                    value={newClient.accountManager}
                    onChange={e => setNewClient({ ...newClient, accountManager: e.target.value })}
                    placeholder="Assigned Account Manager"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Annual Revenue (₹)</label>
                  <input
                    type="number"
                    value={newClient.annualRevenue}
                    onChange={e => setNewClient({ ...newClient, annualRevenue: e.target.value })}
                    placeholder="Annual Turnover"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Number of Employees</label>
                  <input
                    type="number"
                    value={newClient.employeesCount}
                    onChange={e => setNewClient({ ...newClient, employeesCount: e.target.value })}
                    placeholder="Total Employees"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Company Size</label>
                  <select
                    value={newClient.companySize}
                    onChange={e => setNewClient({ ...newClient, companySize: e.target.value })}
                    className="input-field"
                  >
                    <option value="1-10">Micro (1-10 employees)</option>
                    <option value="11-50">Small (11-50 employees)</option>
                    <option value="51-200">Medium (51-200 employees)</option>
                    <option value="201-500">Large (201-500 employees)</option>
                    <option value="500+">Enterprise (500+ employees)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    value={newClient.city}
                    onChange={e => setNewClient({ ...newClient, city: e.target.value })}
                    placeholder="Surat"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">State</label>
                  <input
                    type="text"
                    value={newClient.state}
                    onChange={e => setNewClient({ ...newClient, state: e.target.value })}
                    placeholder="Gujarat"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Country</label>
                  <input
                    type="text"
                    value={newClient.country}
                    onChange={e => setNewClient({ ...newClient, country: e.target.value })}
                    placeholder="India"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Postal Code</label>
                  <input
                    type="text"
                    value={newClient.postalCode}
                    onChange={e => setNewClient({ ...newClient, postalCode: e.target.value })}
                    placeholder="Pincode / Zipcode"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Address Details</label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Street details..."
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Administrative Notes</label>
                <textarea
                  value={newClient.notes}
                  onChange={e => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Describe projects, terms, etc."
                  rows="3"
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDrawer(false)}
                  className="flex-1 border border-slate-205 dark:border-slate-800 rounded-xl py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 hover:opacity-90 cursor-pointer"
                  style={{ color: '#ffffff' }}
                >
                  Create Client Profile
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* B. ADD PROJECT MODAL */}
      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <form 
            onSubmit={handleCreateProject} 
            className="modal-content w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Add New Project / service</h3>
            
            <div className="space-y-3.5 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g. Website Development"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">Service Category</label>
                <select
                  value={projectForm.service}
                  onChange={e => setProjectForm({ ...projectForm, service: e.target.value })}
                  className="input-field"
                >
                  <option value="Website Development">Website Development</option>
                  <option value="CRM Development">CRM Development</option>
                  <option value="Automation Services">Automation Services</option>
                  <option value="Support & Maintenance">Support & Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">Project Value (₹) *</label>
                <input
                  type="number"
                  required
                  value={projectForm.amount}
                  onChange={e => setProjectForm({ ...projectForm, amount: e.target.value })}
                  placeholder="15000"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="flex-1 border border-slate-205 dark:border-slate-800 rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Add Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* C. ASSIGN TASK MODAL */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <form 
            onSubmit={handleCreateTask} 
            className="modal-content w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Assign Task</h3>
            
            <div className="space-y-3.5 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">Task Description *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Setup payment gateway integration"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">Assignee Rep</label>
                <select
                  value={taskForm.assignee}
                  onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}
                  className="input-field"
                >
                  <option value="Alex R.">Alex R. (Technical)</option>
                  <option value="Sarah K.">Sarah K. (Support)</option>
                  <option value="Sneha R.">Sneha R. (Account Manager)</option>
                  <option value="Arjun M.">Arjun M. (Operations)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="flex-1 border border-slate-205 dark:border-slate-800 rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Assign Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* D. RECORD PAYMENT MODAL */}
      {showAddPayment && (
        <div className="modal-overlay" onClick={() => setShowAddPayment(false)}>
          <form 
            onSubmit={handleRecordPayment} 
            className="modal-content w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Record Invoice Payment</h3>
            
            <div className="space-y-3.5 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">Select Project *</label>
                <select
                  required
                  value={paymentForm.projectId}
                  onChange={e => setPaymentForm({ ...paymentForm, projectId: e.target.value })}
                  className="input-field text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Active Project --</option>
                  {activeClient.projects && activeClient.projects.map(p => {
                    const unpaid = p.amount - p.received;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Pending: {formatCurrency(unpaid)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">Payment Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="5000"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPayment(false)}
                className="flex-1 border border-slate-205 dark:border-slate-800 rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* E. UPLOAD FILE MODAL */}
      {showAddFile && (
        <div className="modal-overlay" onClick={() => setShowAddFile(false)}>
          <form 
            onSubmit={handleUploadFile} 
            className="modal-content w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Upload Service Agreement / Invoice</h3>
            
            <div className="space-y-3.5 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">File Name *</label>
                <input
                  type="text"
                  required
                  value={fileForm.name}
                  onChange={e => setFileForm({ ...fileForm, name: e.target.value })}
                  placeholder="e.g. project_proposal_v2.pdf"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block uppercase">File Size Description</label>
                <input
                  type="text"
                  value={fileForm.size}
                  onChange={e => setFileForm({ ...fileForm, size: e.target.value })}
                  placeholder="1.2 MB"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddFile(false)}
                className="flex-1 border border-slate-205 dark:border-slate-800 rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-xs font-bold cursor-pointer"
              >
                Upload Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClient && editClientData && (
        <>
          <div className="sheet-overlay" onClick={() => { setShowEditClient(false); setEditClientData(null); }} />
          <div className="sheet-content w-full max-w-2xl p-6 space-y-5 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Edit Client Profile</h3>
              <button 
                onClick={() => { setShowEditClient(false); setEditClientData(null); }}
                className="text-slate-450 hover:text-slate-650 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editClientData.name}
                    onChange={e => setEditClientData({ ...editClientData, name: e.target.value })}
                    placeholder="e.g. HK Digiverse LLP"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Industry</label>
                  <input
                    type="text"
                    value={editClientData.industry || ''}
                    onChange={e => setEditClientData({ ...editClientData, industry: e.target.value })}
                    placeholder="e.g. Digital Agency"
                    className="input-field"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Business Type</label>
                  <select
                    value={editClientData.businessType || ''}
                    onChange={e => setEditClientData({ ...editClientData, businessType: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Type</option>
                    <option value="LLP">LLP</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">GST Number</label>
                  <input
                    type="text"
                    value={editClientData.gstNumber || ''}
                    onChange={e => setEditClientData({ ...editClientData, gstNumber: e.target.value })}
                    placeholder="GST Identification Number"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">PAN Number</label>
                  <input
                    type="text"
                    value={editClientData.panNumber || ''}
                    onChange={e => setEditClientData({ ...editClientData, panNumber: e.target.value })}
                    placeholder="PAN Card Number"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Website URL</label>
                  <input
                    type="text"
                    value={editClientData.website || ''}
                    onChange={e => setEditClientData({ ...editClientData, website: e.target.value })}
                    placeholder="hkdigiverse.com"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={editClientData.email || ''}
                    onChange={e => setEditClientData({ ...editClientData, email: e.target.value })}
                    placeholder="contact@hkdigiverse.com"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="tel"
                    value={editClientData.phone || ''}
                    onChange={e => setEditClientData({ ...editClientData, phone: e.target.value })}
                    placeholder="Main Contact Number"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Alternate Number</label>
                  <input
                    type="tel"
                    value={editClientData.altPhone || ''}
                    onChange={e => setEditClientData({ ...editClientData, altPhone: e.target.value })}
                    placeholder="Alternate Phone"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Owner Name</label>
                  <input
                    type="text"
                    value={editClientData.ownerName || ''}
                    onChange={e => setEditClientData({ ...editClientData, ownerName: e.target.value })}
                    placeholder="Founder / Owner Name"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Account Manager</label>
                  <input
                    type="text"
                    value={editClientData.accountManager || ''}
                    onChange={e => setEditClientData({ ...editClientData, accountManager: e.target.value })}
                    placeholder="Assigned Account Manager"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Annual Revenue (₹)</label>
                  <input
                    type="number"
                    value={editClientData.annualRevenue || ''}
                    onChange={e => setEditClientData({ ...editClientData, annualRevenue: e.target.value })}
                    placeholder="Annual Turnover"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Number of Employees</label>
                  <input
                    type="number"
                    value={editClientData.employeesCount || ''}
                    onChange={e => setEditClientData({ ...editClientData, employeesCount: e.target.value })}
                    placeholder="Total Employees"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Company Size</label>
                  <select
                    value={editClientData.companySize || '1-10'}
                    onChange={e => setEditClientData({ ...editClientData, companySize: e.target.value })}
                    className="input-field"
                  >
                    <option value="1-10">Micro (1-10 employees)</option>
                    <option value="11-50">Small (11-50 employees)</option>
                    <option value="51-200">Medium (51-200 employees)</option>
                    <option value="201-500">Large (201-500 employees)</option>
                    <option value="500+">Enterprise (500+ employees)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Client Status</label>
                  <select
                    value={editClientData.status || 'Active'}
                    onChange={e => setEditClientData({ ...editClientData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    value={editClientData.city || ''}
                    onChange={e => setEditClientData({ ...editClientData, city: e.target.value })}
                    placeholder="Surat"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">State</label>
                  <input
                    type="text"
                    value={editClientData.state || ''}
                    onChange={e => setEditClientData({ ...editClientData, state: e.target.value })}
                    placeholder="Gujarat"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Country</label>
                  <input
                    type="text"
                    value={editClientData.country || ''}
                    onChange={e => setEditClientData({ ...editClientData, country: e.target.value })}
                    placeholder="India"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Postal Code</label>
                  <input
                    type="text"
                    value={editClientData.postalCode || ''}
                    onChange={e => setEditClientData({ ...editClientData, postalCode: e.target.value })}
                    placeholder="Pincode / Zipcode"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Address Details</label>
                <input
                  type="text"
                  value={editClientData.address || ''}
                  onChange={e => setEditClientData({ ...editClientData, address: e.target.value })}
                  placeholder="Street details..."
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Administrative Notes</label>
                <textarea
                  value={editClientData.notes || ''}
                  onChange={e => setEditClientData({ ...editClientData, notes: e.target.value })}
                  placeholder="Describe projects, terms, etc."
                  rows="3"
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditClient(false); setEditClientData(null); }}
                  className="flex-1 border border-slate-205 dark:border-slate-800 rounded-xl py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 hover:opacity-90 cursor-pointer"
                  style={{ color: '#ffffff' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
