import { useState, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  Briefcase, BarChart3, CheckCircle2, Clock, AlertTriangle, CalendarDays,
  TrendingUp, DollarSign, Plus, Search, Filter, X, ChevronDown, ChevronRight,
  FileText, MessageSquare, Upload, Download, Edit3, Trash2, Eye, Users,
  ArrowRight, Star, Activity, Target, Layers, GanttChart, ListChecks,
  CircleDollarSign, PieChart, Send, Calendar, MapPin, Tag, User, GripVertical
} from 'lucide-react';

const PIPELINE_STAGES = [
  'New Project', 'Discussion', 'Planning', 'Design', 'Development',
  'Testing', 'Client Review', 'Revision', 'Deployment', 'Completed', 'On Hold', 'Cancelled'
];

const STAGE_COLORS = {
  'New Project': '#3b82f6', 'Discussion': '#06b6d4', 'Planning': '#6366f1',
  'Design': '#8b5cf6', 'Development': '#f59e0b', 'Testing': '#f97316',
  'Client Review': '#ec4899', 'Revision': '#f43f5e', 'Deployment': '#14b8a6',
  'Completed': '#10b981', 'On Hold': '#94a3b8', 'Cancelled': '#ef4444'
};

const STAGE_BG = {
  'New Project': 'bg-blue-500', 'Discussion': 'bg-cyan-500', 'Planning': 'bg-indigo-500',
  'Design': 'bg-violet-500', 'Development': 'bg-amber-500', 'Testing': 'bg-orange-500',
  'Client Review': 'bg-pink-500', 'Revision': 'bg-rose-500', 'Deployment': 'bg-teal-500',
  'Completed': 'bg-emerald-500', 'On Hold': 'bg-slate-400', 'Cancelled': 'bg-red-500'
};

const PRIORITY_STYLES = {
  'Critical': 'bg-red-500/15 text-red-600 border-red-500/20',
  'High': 'bg-orange-500/15 text-orange-600 border-orange-500/20',
  'Medium': 'bg-blue-500/15 text-blue-600 border-blue-500/20',
  'Low': 'bg-slate-400/15 text-slate-500 border-slate-400/20'
};

const getProjectProgress = (p) => {
  if (!p) return 0;
  if (p.status === 'Completed' || p.stage === 'Completed') return 100;
  if (p.status === 'Cancelled' || p.stage === 'Cancelled') return 0;
  
  const stageWeights = {
    'New Project': 10,
    'Discussion': 20,
    'Planning': 35,
    'Design': 50,
    'Development': 65,
    'Testing': 80,
    'Client Review': 85,
    'Revision': 90,
    'Deployment': 95,
    'On Hold': 30
  };
  
  return stageWeights[p.stage] || 0;
};

const TASK_STATUSES = ['Pending', 'In Progress', 'Under Review', 'Completed', 'Blocked'];

const TASK_STATUS_STYLES = {
  'Pending': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'In Progress': 'bg-blue-500/15 text-blue-600',
  'Under Review': 'bg-amber-500/15 text-amber-600',
  'Completed': 'bg-emerald-500/15 text-emerald-600',
  'Blocked': 'bg-red-500/15 text-red-600'
};

const TASK_STATUS_COLORS = {
  'Pending': '#94a3b8', 'In Progress': '#3b82f6', 'Under Review': '#f59e0b',
  'Completed': '#10b981', 'Blocked': '#ef4444'
};

export default function ProjectsDashboard() {
  const {
    projects, clients, employees, addProject, editProject, deleteProject,
    updateProjectStage, addProjectTask, updateProjectTask,
    addProjectComment, addProjectDocument, recordProjectPayment, addToast
  } = useApp();

  const { tab } = useParams();
  const activeTab = tab || 'dashboard';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState(null);

  // Task board project filter
  const [taskBoardProjectId, setTaskBoardProjectId] = useState('all');

  // Drag & Drop state
  const [dragData, setDragData] = useState(null);
  const [dropTargetStage, setDropTargetStage] = useState(null);
  const [dropTargetStatus, setDropTargetStatus] = useState(null);

  // Forms
  const [newProject, setNewProject] = useState({
    name: '', description: '', clientId: '', clientName: '', category: 'Web Development',
    type: 'Client Project', priority: 'Medium', startDate: '', endDate: '',
    estimatedCompletion: '', budget: '', projectValue: '', department: 'Engineering',
    assignedManager: '', assignedTeam: [], status: 'Active', stage: 'New Project',
    tags: '', notes: '', createdBy: 'CRM Admin'
  });
  const [newTask, setNewTask] = useState({
    name: '', description: '', assignedTo: '', priority: 'Medium', startDate: '', dueDate: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [commentText, setCommentText] = useState('');
  const [docForm, setDocForm] = useState({ name: '', type: 'Requirements', size: '' });

  // Selected project
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'All' || p.status === filterStatus;
      const matchPriority = filterPriority === 'All' || p.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [projects, searchQuery, filterStatus, filterPriority]);

  // Dashboard Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = projects.length;
    const active = projects.filter(p => p.status === 'Active').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const pending = projects.filter(p => p.stage === 'New Project' || p.stage === 'Discussion').length;
    const overdue = projects.filter(p => p.status === 'Active' && p.endDate < todayStr).length;
    const startingToday = projects.filter(p => p.startDate === todayStr).length;
    const endingSoon = projects.filter(p => {
      if (p.status !== 'Active') return false;
      const endDate = new Date(p.endDate);
      const diff = (endDate - new Date()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    const totalValue = projects.reduce((s, p) => s + (p.projectValue || 0), 0);
    const totalReceived = projects.reduce((s, p) => s + (p.financials?.received || 0), 0);
    const totalPending = totalValue - totalReceived;
    const totalExpenses = projects.reduce((s, p) => s + (p.financials?.expenses || 0), 0);
    const totalProfit = totalReceived - totalExpenses;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const allTasks = projects.flatMap(p => p.tasks || []);
    const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
    const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    return {
      total, active, completed, pending, overdue, startingToday, endingSoon,
      totalValue, totalReceived, totalPending, totalExpenses, totalProfit,
      completionRate, taskCompletionRate, totalTasks: allTasks.length, completedTasks
    };
  }, [projects]);

  // Category distribution
  const categoryDist = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [projects]);

  // ====== DRAG & DROP — Pipeline ======
  const handlePipelineDragStart = useCallback((e, projectId) => {
    setDragData({ type: 'project', projectId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
    e.currentTarget.style.opacity = '0.5';
  }, []);

  const handlePipelineDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
    setDragData(null);
    setDropTargetStage(null);
  }, []);

  const handlePipelineDragOver = useCallback((e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetStage(stage);
  }, []);

  const handlePipelineDragLeave = useCallback(() => {
    setDropTargetStage(null);
  }, []);

  const handlePipelineDrop = useCallback((e, stage) => {
    e.preventDefault();
    setDropTargetStage(null);
    if (dragData?.type === 'project') {
      updateProjectStage(dragData.projectId, stage);
    }
    setDragData(null);
  }, [dragData, updateProjectStage]);

  // ====== DRAG & DROP — Task Board ======
  const handleTaskDragStart = useCallback((e, projectId, taskId) => {
    setDragData({ type: 'task', projectId, taskId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${projectId}|${taskId}`);
    e.currentTarget.style.opacity = '0.5';
  }, []);

  const handleTaskDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
    setDragData(null);
    setDropTargetStatus(null);
  }, []);

  const handleTaskDragOver = useCallback((e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetStatus(status);
  }, []);

  const handleTaskDragLeave = useCallback(() => {
    setDropTargetStatus(null);
  }, []);

  const handleTaskDrop = useCallback((e, status) => {
    e.preventDefault();
    setDropTargetStatus(null);
    if (dragData?.type === 'task') {
      const newProgress = status === 'Completed' ? 100 : status === 'Pending' ? 0 : undefined;
      const update = newProgress !== undefined ? { status, progress: newProgress } : { status };
      updateProjectTask(dragData.projectId, dragData.taskId, update);
    }
    setDragData(null);
  }, [dragData, updateProjectTask]);

  const handleStartEdit = (project, e) => {
    if (e) e.stopPropagation();
    setEditProjectData({
      ...project,
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : project.tags || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editProjectData.name) return;
    const clientMatch = clients.find(c => c.id === editProjectData.clientId);
    editProject(editProjectData.id, {
      ...editProjectData,
      clientName: clientMatch?.name || editProjectData.clientName || 'Internal',
      budget: Number(editProjectData.budget) || 0,
      projectValue: Number(editProjectData.projectValue) || 0,
      tags: typeof editProjectData.tags === 'string' ? editProjectData.tags.split(',').map(t => t.trim()) : editProjectData.tags
    });
    setShowEditModal(false);
    setEditProjectData(null);
  };

  const handleDeleteProject = (projectId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
      if (selectedProjectId === projectId) {
        setShowDetailDrawer(false);
        setSelectedProjectId(null);
      }
    }
  };

  // Handlers
  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProject.name) return;
    const clientMatch = clients.find(c => c.id === newProject.clientId);
    addProject({
      ...newProject,
      clientName: clientMatch?.name || newProject.clientName || 'Internal',
      budget: Number(newProject.budget) || 0,
      projectValue: Number(newProject.projectValue) || 0,
      assignedTeam: newProject.assignedTeam.length ? newProject.assignedTeam : [],
      tags: newProject.tags ? newProject.tags.split(',').map(t => t.trim()) : []
    });
    setNewProject({
      name: '', description: '', clientId: '', clientName: '', category: 'Web Development',
      type: 'Client Project', priority: 'Medium', startDate: '', endDate: '',
      estimatedCompletion: '', budget: '', projectValue: '', department: 'Engineering',
      assignedManager: '', assignedTeam: [], status: 'Active', stage: 'New Project',
      tags: '', notes: '', createdBy: 'CRM Admin'
    });
    setShowCreateModal(false);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.name || !selectedProjectId) return;
    addProjectTask(selectedProjectId, newTask);
    setNewTask({ name: '', description: '', assignedTo: '', priority: 'Medium', startDate: '', dueDate: '' });
    setShowAddTaskModal(false);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentAmount || !selectedProjectId) return;
    recordProjectPayment(selectedProjectId, Number(paymentAmount));
    setPaymentAmount('');
    setShowPaymentModal(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedProjectId) return;
    addProjectComment(selectedProjectId, { user: 'CRM Admin', text: commentText.trim() });
    setCommentText('');
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!docForm.name || !selectedProjectId) return;
    addProjectDocument(selectedProjectId, { ...docForm, uploadedBy: 'CRM Admin' });
    setDocForm({ name: '', type: 'Requirements', size: '' });
  };

  const openDetail = (projectId) => {
    setSelectedProjectId(projectId);
    setDetailTab('overview');
    setShowDetailDrawer(true);
  };

  const fmtCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  // CSV export
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    data.forEach(row => {
      csvRows.push(headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    addToast('CSV exported successfully.', 'success');
  };

  // ============= TAB DEFINITIONS =============
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'pipeline', label: 'Pipeline Board', icon: Layers },
    { id: 'gantt', label: 'Gantt Chart', icon: GanttChart },
    { id: 'reports', label: 'Reports', icon: PieChart },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-border/20 shadow-xl" style={{ background: 'linear-gradient(to right, #0f172a, #1e1b4b, #0f172a)' }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ background: 'linear-gradient(to right, #ffffff, #c7d2fe, #e0e7ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Projects Command Center
          </h1>
          <p className="text-xs mt-1" style={{ color: '#a5b4fc' }}>Enterprise Project Lifecycle Management &amp; Analytics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#818cf8' }} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)', color: '#ffffff' }}
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none" style={{ background: 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)', color: '#ffffff' }}>
            <option value="All" style={{ color: '#0f172a' }}>All Status</option>
            <option value="Active" style={{ color: '#0f172a' }}>Active</option>
            <option value="Completed" style={{ color: '#0f172a' }}>Completed</option>
            <option value="On Hold" style={{ color: '#0f172a' }}>On Hold</option>
            <option value="Cancelled" style={{ color: '#0f172a' }}>Cancelled</option>
          </select>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md" style={{ color: '#ffffff' }}>
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>



      {/* =================== DASHBOARD TAB =================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Metrics — Spacious clean cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Projects', value: stats.total, icon: Briefcase, color: 'text-primary', iconBg: 'bg-primary/10' },
              { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-blue-500', iconBg: 'bg-blue-500/10' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
              { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-500', iconBg: 'bg-red-500/10' },
              { label: 'Ending Soon', value: stats.endingSoon, icon: Clock, color: 'text-amber-500', iconBg: 'bg-amber-500/10' },
              { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: Target, color: 'text-indigo-500', iconBg: 'bg-indigo-500/10' }
            ].map(kpi => {
              const KpiIcon = kpi.icon;
              return (
                <div key={kpi.label} className="bg-card border border-border/60 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-[0.12em]">{kpi.label}</p>
                    <p className={`text-2xl font-extrabold mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <KpiIcon size={20} className={kpi.color} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue Cards — First card gradient, rest white with colored accents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)' }}>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <p className="text-[10px] uppercase font-bold tracking-[0.15em]" style={{ color: '#c7d2fe' }}>Total Project Value</p>
              <p className="text-3xl font-extrabold mt-3 tracking-tight" style={{ color: '#ffffff' }}>{fmtCurrency(stats.totalValue)}</p>
              <p className="text-xs mt-2" style={{ color: 'rgba(199,210,254,0.8)' }}>{projects.filter(p => p.type === 'Client Project').length} client projects</p>
            </div>
            <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-emerald-500">Amount Received</p>
              <p className="text-3xl font-extrabold mt-3 text-foreground tracking-tight">{fmtCurrency(stats.totalReceived)}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-3">
                <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.totalValue > 0 ? Math.min(100, (stats.totalReceived / stats.totalValue) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-2xl" />
              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-amber-500">Pending Payments</p>
              <p className="text-3xl font-extrabold mt-3 text-foreground tracking-tight">{fmtCurrency(stats.totalPending)}</p>
              <p className="text-[10px] text-muted-foreground mt-2">awaiting collection</p>
            </div>
            <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-violet-500 rounded-l-2xl" />
              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-violet-500">Net Profit</p>
              <p className="text-3xl font-extrabold mt-3 text-foreground tracking-tight">{fmtCurrency(stats.totalProfit)}</p>
              <p className="text-[10px] text-muted-foreground mt-2">Expenses: {fmtCurrency(stats.totalExpenses)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Category Distribution */}
            <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><PieChart size={16} className="text-primary" /> Category Distribution</h3>
              <div className="space-y-3">
                {categoryDist.map(([cat, count]) => {
                  const pct = Math.round((count / (projects.length || 1)) * 100);
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{cat}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Completion */}
            <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><ListChecks size={16} className="text-emerald-500" /> Team Productivity</h3>
              <div className="flex items-center justify-center py-4">
                <svg viewBox="0 0 120 120" className="w-36 h-36">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - stats.taskCompletionRate / 100)}`}
                    transform="rotate(-90 60 60)"
                    className="transition-all duration-700"
                  />
                  <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--foreground)">{stats.taskCompletionRate}%</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">Tasks Done</text>
                </svg>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                {stats.completedTasks} of {stats.totalTasks} tasks completed across all projects
              </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Activity size={16} className="text-amber-500" /> Recent Projects</h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                 {projects.slice(0, 6).map(p => (
                  <div key={p.id} onClick={() => openDetail(p.id)} className="w-full text-left p-3.5 bg-muted/30 border border-border/30 rounded-xl hover:bg-muted/60 hover:border-primary/20 transition-all space-y-1.5 group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{p.name}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${PRIORITY_STYLES[p.priority]}`}>{p.priority}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{p.clientName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.status === 'Active' ? 'bg-blue-500/15 text-blue-600' : p.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-400/15 text-slate-500'}`}>
                        {p.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================== PIPELINE TAB — Drag & Drop =================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Project Pipeline — Kanban Board</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">🎯 Drag & drop projects between stages to update their progress</p>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">{filteredProjects.length} projects</p>
          </div>
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-3" style={{ minWidth: `${PIPELINE_STAGES.length * 230}px` }}>
              {PIPELINE_STAGES.map(stage => {
                const stageProjects = filteredProjects.filter(p => p.stage === stage);
                const isDropTarget = dropTargetStage === stage && dragData?.type === 'project';
                return (
                  <div
                    key={stage}
                    className={`flex-shrink-0 w-56 rounded-xl p-3 flex flex-col transition-all duration-200 ${
                      isDropTarget
                        ? 'bg-primary/10 border-2 border-dashed border-primary shadow-lg scale-[1.01]'
                        : 'bg-muted/30 border border-border/40'
                    }`}
                    onDragOver={e => handlePipelineDragOver(e, stage)}
                    onDragLeave={handlePipelineDragLeave}
                    onDrop={e => handlePipelineDrop(e, stage)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                        <h4 className="text-[10px] font-bold uppercase tracking-wider truncate">{stage}</h4>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-card border border-border/40 rounded-md font-bold text-muted-foreground">{stageProjects.length}</span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
                      {stageProjects.map(p => {
                        const progress = getProjectProgress(p);
                        return (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={e => handlePipelineDragStart(e, p.id)}
                            onDragEnd={handlePipelineDragEnd}
                            className="bg-card border border-border p-3 rounded-xl shadow-xs space-y-2 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                            onClick={() => openDetail(p.id)}
                          >
                            <div className="flex items-start gap-1.5">
                              <GripVertical size={12} className="text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-muted-foreground transition-colors" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold leading-snug truncate">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">{p.clientName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border ${PRIORITY_STYLES[p.priority]}`}>{p.priority}</span>
                                {p.assignedManager && <span className="text-[9px] text-muted-foreground">👤 {p.assignedManager.split(' ')[0]}</span>}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <p className="text-[9px] text-muted-foreground">
                                Progress • {progress}%
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-border/30 text-[9px] text-muted-foreground">
                              <span>📅 {p.endDate}</span>
                              {(p.assignedTeam || []).length > 0 && (
                                <div className="flex -space-x-1.5">
                                  {p.assignedTeam.slice(0, 3).map((m, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/70 to-indigo-600/70 border border-card flex items-center justify-center text-[7px] text-white font-bold">{m[0]}</div>
                                  ))}
                                  {p.assignedTeam.length > 3 && <div className="w-5 h-5 rounded-full bg-muted border border-card flex items-center justify-center text-[7px] font-bold">+{p.assignedTeam.length - 3}</div>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {stageProjects.length === 0 && (
                        <div className={`text-center py-8 text-[10px] italic rounded-lg border border-dashed transition-all ${
                          isDropTarget ? 'border-primary text-primary bg-primary/5' : 'border-border/40 text-muted-foreground'
                        }`}>
                          {isDropTarget ? '⬇ Drop here' : 'No projects'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================== TASK BOARD TAB — Drag & Drop =================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Task Management Board</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">🎯 Drag & drop tasks between status columns</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={taskBoardProjectId} onChange={e => setTaskBoardProjectId(e.target.value)} className="bg-card border border-border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
              <button
                onClick={() => {
                  if (taskBoardProjectId === 'all') {
                    addToast('Select a specific project to add tasks.', 'warning');
                    return;
                  }
                  setSelectedProjectId(taskBoardProjectId);
                  setShowAddTaskModal(true);
                }}
                className="flex items-center gap-1 btn-primary text-xs px-3 py-1.5"
              >
                <Plus size={13} /> Add Task
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {TASK_STATUSES.map(status => {
              const allTasks = taskBoardProjectId === 'all'
                ? projects.flatMap(p => (p.tasks || []).map(t => ({ ...t, projectId: p.id, projectName: p.name })))
                : (projects.find(p => p.id === taskBoardProjectId)?.tasks || []).map(t => ({ ...t, projectId: taskBoardProjectId, projectName: projects.find(p => p.id === taskBoardProjectId)?.name }));
              const statusTasks = allTasks.filter(t => t.status === status);
              const isDropTarget = dropTargetStatus === status && dragData?.type === 'task';
              return (
                <div
                  key={status}
                  className={`rounded-xl p-3 flex flex-col min-h-64 transition-all duration-200 ${
                    isDropTarget
                      ? 'bg-primary/10 border-2 border-dashed border-primary shadow-lg'
                      : 'bg-muted/30 border border-border/40'
                  }`}
                  onDragOver={e => handleTaskDragOver(e, status)}
                  onDragLeave={handleTaskDragLeave}
                  onDrop={e => handleTaskDrop(e, status)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TASK_STATUS_COLORS[status] }} />
                      <h4 className="text-[10px] font-bold uppercase tracking-wider">{status}</h4>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-card border border-border/40 rounded-md font-bold text-muted-foreground">{statusTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    {statusTasks.map(task => (
                      <div
                        key={`${task.projectId}-${task.id}`}
                        draggable
                        onDragStart={e => handleTaskDragStart(e, task.projectId, task.id)}
                        onDragEnd={handleTaskDragEnd}
                        className="bg-card border border-border p-3 rounded-xl shadow-xs space-y-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={11} className="text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-muted-foreground transition-colors" />
                          <p className="text-xs font-bold flex-1 min-w-0 truncate">{task.name}</p>
                        </div>
                        {taskBoardProjectId === 'all' && <p className="text-[9px] text-primary font-semibold pl-4">{task.projectName}</p>}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pl-4">
                          <span>👤 {task.assignedTo || 'Unassigned'}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                        </div>
                        {task.progress > 0 && task.progress < 100 && (
                          <div className="w-full bg-muted rounded-full h-1.5 ml-4" style={{ width: 'calc(100% - 1rem)' }}>
                            <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${task.progress}%` }} />
                          </div>
                        )}
                        <div className="flex items-center justify-between pl-4 text-[9px] text-muted-foreground">
                          <span>Due: {task.dueDate || '-'}</span>
                        </div>
                      </div>
                    ))}
                    {statusTasks.length === 0 && (
                      <div className={`text-center py-8 text-[10px] italic rounded-lg border border-dashed transition-all ${
                        isDropTarget ? 'border-primary text-primary bg-primary/5' : 'border-border/40 text-muted-foreground'
                      }`}>
                        {isDropTarget ? '⬇ Drop here' : 'No tasks'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================== GANTT CHART TAB =================== */}
      {activeTab === 'gantt' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold">Project Gantt Chart</h2>
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-5 overflow-x-auto">
            {(() => {
              const activeProjects = filteredProjects.filter(p => p.startDate && p.endDate);
              if (!activeProjects.length) return <p className="text-sm text-muted-foreground text-center py-10">No projects with dates to display.</p>;

              const parseLocalDate = (dateStr) => {
                if (!dateStr) return new Date();
                const parts = dateStr.split('-');
                if (parts.length < 3) return new Date(dateStr);
                return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              };

              // Calculate min and max dates
              const allDates = activeProjects.flatMap(p => [parseLocalDate(p.startDate), parseLocalDate(p.endDate)]);
              let minDate = new Date();
              let maxDate = new Date();
              if (allDates.length > 0) {
                minDate = new Date(Math.min(...allDates));
                maxDate = new Date(Math.max(...allDates));
              }

              // Pad by 7 days start and 14 days end to make it spacious and not touch the edge
              const startTimeline = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() - 7);
              const endTimeline = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 14);

              const totalDays = Math.max(30, Math.ceil((endTimeline - startTimeline) / (1000 * 60 * 60 * 24)));
              
              // Constants for Gantt Grid
              const dayWidth = 40; // width of each day column
              const rowHeight = 56; // height of each project row
              const headerHeight = 60; // timeline header height
              const barHeight = 28; // actual height of the Gantt bar
              
              const svgWidth = totalDays * dayWidth;
              const svgHeight = headerHeight + activeProjects.length * rowHeight;
              
              const today = new Date();
              const todayX = Math.round(((today - startTimeline) / (1000 * 60 * 60 * 24)) * dayWidth);

              // Generate days and month bands
              const days = [];
              const months = [];
              let currentMonth = null;
              let currentMonthStart = 0;

              for (let i = 0; i < totalDays; i++) {
                const d = new Date(startTimeline.getTime() + i * (1000 * 60 * 60 * 24));
                days.push({
                  date: d,
                  x: i * dayWidth,
                  label: d.getDate(),
                  isWeekend: d.getDay() === 0 || d.getDay() === 6
                });

                const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                if (monthLabel !== currentMonth) {
                  if (currentMonth !== null) {
                    months.push({
                      label: currentMonth,
                      startX: currentMonthStart,
                      width: (i * dayWidth) - currentMonthStart
                    });
                  }
                  currentMonth = monthLabel;
                  currentMonthStart = i * dayWidth;
                }
                if (i === totalDays - 1) {
                  months.push({
                    label: currentMonth,
                    startX: currentMonthStart,
                    width: ((i + 1) * dayWidth) - currentMonthStart
                  });
                }
              }

              return (
                <div className="flex border border-border/60 rounded-2xl overflow-hidden bg-card">
                  {/* Left Column: Projects Sticky List */}
                  <div className="w-56 shrink-0 border-r border-border/60 bg-muted/10">
                    <div className="flex items-center px-4 font-bold text-xs text-muted-foreground border-b border-border/60" style={{ height: `${headerHeight}px` }}>
                      Projects
                    </div>
                    <div className="divide-y divide-border/40">
                      {activeProjects.map((p, i) => (
                        <div 
                          key={p.id} 
                          onClick={() => openDetail(p.id)} 
                          className="px-4 flex flex-col justify-center hover:bg-muted/30 cursor-pointer transition-colors group"
                          style={{ height: `${rowHeight}px` }}
                        >
                          <span className="text-xs font-bold truncate group-hover:text-primary transition-colors">{p.name}</span>
                          <span className="text-[9px] text-muted-foreground truncate">{p.clientName || 'Internal'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Horizontal Scrollable Timeline Grid */}
                  <div className="flex-1 overflow-x-auto custom-scrollbar relative">
                    <svg width={svgWidth} height={svgHeight} className="bg-card/50">
                      {/* Grid Columns for Days */}
                      {days.map((d, i) => (
                        <g key={i}>
                          <rect x={d.x} y={headerHeight} width={dayWidth} height={svgHeight - headerHeight} fill="var(--muted)" className="opacity-5" />
                          <line x1={d.x} y1={headerHeight - 20} x2={d.x} y2={svgHeight} stroke="var(--border)" strokeWidth="0.5" strokeDasharray={d.isWeekend ? 'none' : '2 2'} />
                          <text x={d.x + dayWidth / 2} y={headerHeight - 6} textAnchor="middle" fontSize="9" fontWeight={d.isWeekend ? 'bold' : 'normal'} fill={d.isWeekend ? 'var(--muted-foreground)' : 'var(--foreground)'} className="opacity-80">
                            {d.label}
                          </text>
                        </g>
                      ))}

                      {/* Month Headers */}
                      {months.map((m, i) => (
                        <g key={i}>
                          <rect x={m.startX} y={0} width={m.width} height={headerHeight - 24} fill="var(--muted)" className="opacity-10" />
                          <line x1={m.startX} y1={0} x2={m.startX} y2={headerHeight - 24} stroke="var(--border)" strokeWidth="1" />
                          <text x={m.startX + m.width / 2} y={22} textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--foreground)">
                            {m.label}
                          </text>
                        </g>
                      ))}
                      
                      <line x1={0} y1={headerHeight - 24} x2={svgWidth} y2={headerHeight - 24} stroke="var(--border)" strokeWidth="1" />
                      <line x1={0} y1={headerHeight} x2={svgWidth} y2={headerHeight} stroke="var(--border)" strokeWidth="1" />

                      {/* Vertical line for Today */}
                      {todayX >= 0 && todayX <= svgWidth && (
                        <g className="z-10">
                          <line x1={todayX} y1={headerHeight - 24} x2={todayX} y2={svgHeight} stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 3" />
                          <rect x={todayX - 20} y={4} width={40} height={14} rx={4} fill="var(--primary)" />
                          <text x={todayX} y={14} textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--primary-foreground)">Today</text>
                        </g>
                      )}

                      {/* Project Bars */}
                      {activeProjects.map((p, i) => {
                        const startX = ((parseLocalDate(p.startDate) - startTimeline) / (1000 * 60 * 60 * 24)) * dayWidth;
                        const endX = ((parseLocalDate(p.endDate) - startTimeline) / (1000 * 60 * 60 * 24) + 1) * dayWidth; // +1 to cover the end date fully
                        const barW = Math.max(24, endX - startX);
                        const y = headerHeight + i * rowHeight + (rowHeight - barHeight) / 2;

                        const progress = getProjectProgress(p) / 100;
                        const barColor = p.status === 'Completed' ? '#10b981' : p.priority === 'Critical' ? '#ef4444' : p.priority === 'High' ? '#f59e0b' : '#6366f1';

                        return (
                          <g key={p.id} className="cursor-pointer group/bar" onClick={() => openDetail(p.id)}>
                            {/* Bar outline */}
                            <rect x={startX} y={y} width={barW} height={barHeight} rx={6} fill={`${barColor}15`} stroke={barColor} strokeWidth="1.5" className="group-hover/bar:stroke-2 transition-all" />
                            {/* Progress bar inside */}
                            <rect x={startX} y={y} width={barW * progress} height={barHeight} rx={6} fill={`${barColor}35`} />
                            {/* Text labels outside/inside the bar */}
                            <text x={startX + 8} y={y + barHeight / 2 + 4} fontSize="10" fontWeight="bold" fill="var(--foreground)">
                              {Math.round(progress * 100)}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =================== TIMELINE TAB =================== */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold">Activity Timeline</h2>
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-6">
            <div className="space-y-0 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {(() => {
                const allEvents = projects.flatMap(p =>
                  (p.timeline || []).map(t => ({ ...t, projectId: p.id, projectName: p.name }))
                ).sort((a, b) => new Date(b.date) - new Date(a.date));

                if (!allEvents.length) return <p className="text-sm text-muted-foreground text-center py-10">No activity recorded yet.</p>;

                const typeIcons = { creation: '🚀', stage: '📋', task: '✅', payment: '💰', team: '👥', document: '📄', comment: '💬' };

                return allEvents.slice(0, 50).map((evt, i) => (
                  <div key={`${evt.projectId}-${i}`} className="flex gap-4 pb-4 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-sm shrink-0">
                        {typeIcons[evt.type] || '📌'}
                      </div>
                      {i < allEvents.slice(0, 50).length - 1 && <div className="w-0.5 flex-1 bg-border/60 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4 border-b border-border/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold">{evt.event}</p>
                          <p className="text-[10px] text-primary font-semibold mt-0.5">{evt.projectName}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-3">{evt.date}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">By: {evt.user}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =================== FINANCIALS TAB =================== */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Project Financial Management</h2>
            <button
              onClick={() => exportCSV(
                projects.filter(p => p.type === 'Client Project').map(p => ({
                  ID: p.id, Name: p.name, Client: p.clientName, Value: p.projectValue,
                  Received: p.financials?.received || 0, Pending: (p.projectValue || 0) - (p.financials?.received || 0),
                  Expenses: p.financials?.expenses || 0, Profit: (p.financials?.received || 0) - (p.financials?.expenses || 0)
                })),
                'Project_Financials.csv'
              )}
              className="flex items-center gap-1 btn-outline text-xs px-3 py-1.5"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Value', value: fmtCurrency(stats.totalValue), color: 'text-indigo-500' },
              { label: 'Received', value: fmtCurrency(stats.totalReceived), color: 'text-emerald-500' },
              { label: 'Pending', value: fmtCurrency(stats.totalPending), color: 'text-amber-500' },
              { label: 'Expenses', value: fmtCurrency(stats.totalExpenses), color: 'text-rose-500' },
              { label: 'Net Profit', value: fmtCurrency(stats.totalProfit), color: 'text-green-600' },
              { label: 'Margin', value: `${stats.totalReceived > 0 ? Math.round(((stats.totalReceived - stats.totalExpenses) / stats.totalReceived) * 100) : 0}%`, color: 'text-primary' }
            ].map(item => (
              <div key={item.label} className="bg-card border border-border/60 p-4 rounded-xl text-center">
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">{item.label}</p>
                <p className={`text-lg font-extrabold mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted text-muted-foreground font-bold">
                    <th className="p-3">Project</th>
                    <th className="p-3">Client</th>
                    <th className="p-3 text-right">Value</th>
                    <th className="p-3 text-right">Received</th>
                    <th className="p-3 text-right">Pending</th>
                    <th className="p-3 text-right">Expenses</th>
                    <th className="p-3 text-right">Profit</th>
                    <th className="p-3 text-right">Margin</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.filter(p => p.projectValue > 0 || (p.financials?.received || 0) > 0).map(p => {
                    const value = p.projectValue || 0;
                    const received = p.financials?.received || 0;
                    const pending = value - received;
                    const expenses = p.financials?.expenses || 0;
                    const profit = received - expenses;
                    const margin = received > 0 ? Math.round((profit / received) * 100) : 0;
                    return (
                      <tr key={p.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                        <td className="p-3 font-semibold">{p.name}</td>
                        <td className="p-3 text-muted-foreground">{p.clientName}</td>
                        <td className="p-3 text-right font-mono">{fmtCurrency(value)}</td>
                        <td className="p-3 text-right font-mono text-emerald-600">{fmtCurrency(received)}</td>
                        <td className="p-3 text-right font-mono text-amber-600">{fmtCurrency(pending)}</td>
                        <td className="p-3 text-right font-mono text-rose-500">{fmtCurrency(expenses)}</td>
                        <td className="p-3 text-right font-mono font-bold text-green-600">{fmtCurrency(profit)}</td>
                        <td className="p-3 text-right font-bold">{margin}%</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => { setSelectedProjectId(p.id); setShowPaymentModal(true); }}
                            className="text-[10px] text-primary font-bold hover:underline"
                          >
                            + Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================== REPORTS TAB =================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-base font-bold">Project Reports & Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Project Performance Summary</h3>
                <button
                  onClick={() => exportCSV(
                    projects.map(p => ({ ID: p.id, Name: p.name, Client: p.clientName, Status: p.status, Stage: p.stage, Priority: p.priority, Start: p.startDate, End: p.endDate, Value: p.projectValue || 0 })),
                    'Project_Performance.csv'
                  )}
                  className="flex items-center gap-1 btn-outline text-[10px] px-2 py-1"
                >
                  <Download size={11} /> CSV
                </button>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground font-bold">
                      <th className="p-2 text-left">Project</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Stage</th>
                      <th className="p-2">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id} className="border-b border-border/30 hover:bg-muted/40">
                        <td className="p-2 font-semibold">{p.name}</td>
                        <td className="p-2 text-center"><span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${p.status === 'Active' ? 'bg-blue-500/15 text-blue-600' : p.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-400/15 text-slate-500'}`}>{p.status}</span></td>
                        <td className="p-2 text-center text-muted-foreground">{p.stage}</td>
                        <td className="p-2 text-center"><span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${PRIORITY_STYLES[p.priority]}`}>{p.priority}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Team Workload Distribution</h3>
                <button
                  onClick={() => {
                    const teamData = {};
                    projects.forEach(p => (p.assignedTeam || []).forEach(m => {
                      if (!teamData[m]) teamData[m] = { member: m, projects: 0, tasks: 0, completed: 0 };
                      teamData[m].projects++;
                      (p.tasks || []).forEach(t => { if (t.assignedTo === m) { teamData[m].tasks++; if (t.status === 'Completed') teamData[m].completed++; } });
                    }));
                    exportCSV(Object.values(teamData), 'Team_Workload.csv');
                  }}
                  className="flex items-center gap-1 btn-outline text-[10px] px-2 py-1"
                >
                  <Download size={11} /> CSV
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(() => {
                  const teamMap = {};
                  projects.forEach(p => (p.assignedTeam || []).forEach(m => {
                    if (!teamMap[m]) teamMap[m] = { projects: 0, tasks: 0, completed: 0 };
                    teamMap[m].projects++;
                    (p.tasks || []).forEach(t => { if (t.assignedTo === m) { teamMap[m].tasks++; if (t.status === 'Completed') teamMap[m].completed++; } });
                  }));
                  return Object.entries(teamMap).sort((a, b) => b[1].projects - a[1].projects).map(([name, data]) => (
                    <div key={name} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">{name[0]}</div>
                        <div>
                          <p className="text-xs font-semibold">{name}</p>
                          <p className="text-[10px] text-muted-foreground">{data.projects} projects • {data.tasks} tasks</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-500">{data.completed} done</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><AlertTriangle size={14} className="text-red-500" /> Overdue Projects</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projects.filter(p => p.status === 'Active' && p.endDate < new Date().toISOString().split('T')[0]).map(p => (
                  <div key={p.id} className="p-3 bg-red-500/5 border border-red-500/15 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">Due: {p.endDate} • {p.clientName}</p>
                    </div>
                    <button onClick={() => openDetail(p.id)} className="text-[10px] text-primary font-bold hover:underline">View</button>
                  </div>
                ))}
                {projects.filter(p => p.status === 'Active' && p.endDate < new Date().toISOString().split('T')[0]).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">🎉 No overdue projects!</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Client Revenue Breakdown</h3>
                <button
                  onClick={() => {
                    const clientRevenue = {};
                    projects.filter(p => p.type === 'Client Project').forEach(p => {
                      if (!clientRevenue[p.clientName]) clientRevenue[p.clientName] = { client: p.clientName, projects: 0, revenue: 0, received: 0 };
                      clientRevenue[p.clientName].projects++;
                      clientRevenue[p.clientName].revenue += p.projectValue || 0;
                      clientRevenue[p.clientName].received += p.financials?.received || 0;
                    });
                    exportCSV(Object.values(clientRevenue), 'Client_Revenue.csv');
                  }}
                  className="flex items-center gap-1 btn-outline text-[10px] px-2 py-1"
                >
                  <Download size={11} /> CSV
                </button>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {(() => {
                  const map = {};
                  projects.filter(p => p.type === 'Client Project').forEach(p => {
                    if (!map[p.clientName]) map[p.clientName] = { projects: 0, value: 0, received: 0 };
                    map[p.clientName].projects++;
                    map[p.clientName].value += p.projectValue || 0;
                    map[p.clientName].received += p.financials?.received || 0;
                  });
                  return Object.entries(map).sort((a, b) => b[1].value - a[1].value).map(([client, data]) => (
                    <div key={client} className="p-2.5 bg-muted/40 rounded-lg border border-border/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">{client}</p>
                        <p className="text-[10px] text-muted-foreground">{data.projects} projects</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">{fmtCurrency(data.value)}</p>
                        <p className="text-[10px] text-emerald-500 font-semibold">Received: {fmtCurrency(data.received)}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================== CREATE PROJECT MODAL =================== */}
      {showCreateModal && (
        <>
          <div className="sheet-overlay" onClick={() => setShowCreateModal(false)} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Create New Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Project Name *</label><input type="text" required value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Enter project name" /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Description</label><textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} className="input-field min-h-16" placeholder="Project description" /></div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Client</label>
                <select value={newProject.clientId} onChange={e => { const cl = clients.find(c => c.id === e.target.value); setNewProject(p => ({ ...p, clientId: e.target.value, clientName: cl?.name || 'Internal' })); }} className="input-field">
                  <option value="">Internal Project</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Category</label>
                <select value={newProject.category} onChange={e => setNewProject(p => ({ ...p, category: e.target.value }))} className="input-field">
                  {['Web Development', 'Mobile Development', 'Software Development', 'Design', 'Marketing', 'Data Analytics', 'DevOps', 'Consulting', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Priority</label>
                <select value={newProject.priority} onChange={e => setNewProject(p => ({ ...p, priority: e.target.value }))} className="input-field">
                  {['Critical', 'High', 'Medium', 'Low'].map(pr => <option key={pr} value={pr}>{pr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Department</label>
                <select value={newProject.department} onChange={e => setNewProject(p => ({ ...p, department: e.target.value }))} className="input-field">
                  {['Engineering', 'Marketing', 'Sales', 'HR', 'Customer Support', 'Finance'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Start Date</label><input type="date" value={newProject.startDate} onChange={e => setNewProject(p => ({ ...p, startDate: e.target.value }))} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">End Date</label><input type="date" value={newProject.endDate} onChange={e => setNewProject(p => ({ ...p, endDate: e.target.value }))} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Budget (₹)</label><input type="number" value={newProject.budget} onChange={e => setNewProject(p => ({ ...p, budget: e.target.value }))} className="input-field" placeholder="0" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Project Value (₹)</label><input type="number" value={newProject.projectValue} onChange={e => setNewProject(p => ({ ...p, projectValue: e.target.value }))} className="input-field" placeholder="0" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Assigned Manager</label><input type="text" value={newProject.assignedManager} onChange={e => setNewProject(p => ({ ...p, assignedManager: e.target.value }))} className="input-field" placeholder="Manager name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Created By</label><input type="text" value={newProject.createdBy} onChange={e => setNewProject(p => ({ ...p, createdBy: e.target.value }))} className="input-field" placeholder="Your name" /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Tags (comma separated)</label><input type="text" value={newProject.tags} onChange={e => setNewProject(p => ({ ...p, tags: e.target.value }))} className="input-field" placeholder="web, design, priority" /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Notes</label><textarea value={newProject.notes} onChange={e => setNewProject(p => ({ ...p, notes: e.target.value }))} className="input-field min-h-16" placeholder="Additional notes" /></div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-border mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-6 py-2 font-bold">Create Project</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* =================== EDIT PROJECT MODAL =================== */}
      {/* =================== EDIT PROJECT MODAL =================== */}
      {showEditModal && editProjectData && (
        <>
          <div className="sheet-overlay" onClick={() => setShowEditModal(false)} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-808 dark:text-white uppercase tracking-wider">Edit Project Details - {editProjectData.id}</h2>
              <button onClick={() => setShowEditModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Project Name *</label><input type="text" required value={editProjectData.name} onChange={e => setEditProjectData(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Enter project name" /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Description</label><textarea value={editProjectData.description || ''} onChange={e => setEditProjectData(p => ({ ...p, description: e.target.value }))} className="input-field min-h-16" placeholder="Project description" /></div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Client</label>
                <select value={editProjectData.clientId || ''} onChange={e => { const cl = clients.find(c => c.id === e.target.value); setEditProjectData(p => ({ ...p, clientId: e.target.value, clientName: cl?.name || 'Internal' })); }} className="input-field">
                  <option value="">Internal Project</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Category</label>
                <select value={editProjectData.category} onChange={e => setEditProjectData(p => ({ ...p, category: e.target.value }))} className="input-field">
                  {['Web Development', 'Mobile Development', 'Software Development', 'Design', 'Marketing', 'Data Analytics', 'DevOps', 'Consulting', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Priority</label>
                <select value={editProjectData.priority} onChange={e => setEditProjectData(p => ({ ...p, priority: e.target.value }))} className="input-field">
                  {['Critical', 'High', 'Medium', 'Low'].map(pr => <option key={pr} value={pr}>{pr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Department</label>
                <select value={editProjectData.department} onChange={e => setEditProjectData(p => ({ ...p, department: e.target.value }))} className="input-field">
                  {['Engineering', 'Marketing', 'Sales', 'HR', 'Customer Support', 'Finance'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Start Date</label><input type="date" value={editProjectData.startDate || ''} onChange={e => setEditProjectData(p => ({ ...p, startDate: e.target.value }))} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">End Date</label><input type="date" value={editProjectData.endDate || ''} onChange={e => setEditProjectData(p => ({ ...p, endDate: e.target.value }))} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Budget (₹)</label><input type="number" value={editProjectData.budget || 0} onChange={e => setEditProjectData(p => ({ ...p, budget: e.target.value }))} className="input-field" placeholder="0" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Project Value (₹)</label><input type="number" value={editProjectData.projectValue || 0} onChange={e => setEditProjectData(p => ({ ...p, projectValue: e.target.value }))} className="input-field" placeholder="0" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Assigned Manager</label><input type="text" value={editProjectData.assignedManager || ''} onChange={e => setEditProjectData(p => ({ ...p, assignedManager: e.target.value }))} className="input-field" placeholder="Manager name" /></div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Status</label>
                <select value={editProjectData.status} onChange={e => setEditProjectData(p => ({ ...p, status: e.target.value }))} className="input-field">
                  {['Active', 'Completed', 'On Hold', 'Cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Tags (comma separated)</label><input type="text" value={editProjectData.tags || ''} onChange={e => setEditProjectData(p => ({ ...p, tags: e.target.value }))} className="input-field" placeholder="web, design, priority" /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Notes</label><textarea value={editProjectData.notes || ''} onChange={e => setEditProjectData(p => ({ ...p, notes: e.target.value }))} className="input-field min-h-16" placeholder="Additional notes" /></div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-border mt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-6 py-2 font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* =================== ADD TASK MODAL =================== */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddTaskModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold">Add Task to {projects.find(p => p.id === selectedProjectId)?.name}</h2>
              <button onClick={() => setShowAddTaskModal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddTask} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Task Name *</label>
                <input type="text" required value={newTask.name} onChange={e => setNewTask(t => ({ ...t, name: e.target.value }))} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Description</label>
                <textarea value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))} className="input-field min-h-16" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Assigned To</label>
                  <input type="text" value={newTask.assignedTo} onChange={e => setNewTask(t => ({ ...t, assignedTo: e.target.value }))} className="input-field" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))} className="input-field">
                    {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Start Date</label>
                  <input type="date" value={newTask.startDate} onChange={e => setNewTask(t => ({ ...t, startDate: e.target.value }))} className="input-field" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))} className="input-field" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full text-xs py-2 font-bold">Add Task</button>
            </form>
          </div>
        </div>
      )}

      {/* =================== PAYMENT MODAL =================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">Project: <strong>{projects.find(p => p.id === selectedProjectId)?.name}</strong></p>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Payment Amount (₹)</label>
                <input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="input-field" placeholder="Enter amount" />
              </div>
              <button type="submit" className="btn-primary w-full text-xs py-2 font-bold">Record Payment</button>
            </form>
          </div>
        </div>
      )}

      {/* =================== PROJECT DETAIL DRAWER =================== */}
      {showDetailDrawer && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end" onClick={() => setShowDetailDrawer(false)}>
          <div className="bg-card border-l border-border w-full max-w-2xl h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-5 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold">{selectedProject.id}</p>
                  <h2 className="text-base font-bold mt-0.5">{selectedProject.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowDetailDrawer(false)} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Client', value: selectedProject.clientName },
                  { label: 'Category', value: selectedProject.category },
                  { label: 'Priority', value: selectedProject.priority },
                  { label: 'Stage', value: selectedProject.stage },
                  { label: 'Start Date', value: selectedProject.startDate },
                  { label: 'End Date', value: selectedProject.endDate },
                  { label: 'Department', value: selectedProject.department },
                  { label: 'Manager', value: selectedProject.assignedManager },
                  { label: 'Budget', value: fmtCurrency(selectedProject.budget) },
                  { label: 'Project Value', value: fmtCurrency(selectedProject.projectValue) },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-muted/40 rounded-lg border border-border/30">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">{item.label}</p>
                    <p className="text-xs font-semibold mt-0.5">{item.value || '-'}</p>
                  </div>
                ))}
              </div>

              {selectedProject.description && (
                <div className="p-3 bg-muted/40 rounded-lg border border-border/30">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Description</p>
                  <p className="text-xs text-foreground leading-relaxed">{selectedProject.description}</p>
                </div>
              )}

              <div className="p-3 bg-muted/40 rounded-lg border border-border/30">
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Update Stage</p>
                <select
                  value={selectedProject.stage}
                  onChange={e => updateProjectStage(selectedProject.id, e.target.value)}
                  className="input-field text-xs"
                >
                  {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-2">
                <h4 className="text-xs font-bold flex items-center gap-1.5"><User size={13} className="text-primary" /> Project Ownership</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Created By:</span> <strong>{selectedProject.createdBy}</strong></div>
                  <div><span className="text-muted-foreground">Created On:</span> <strong>{selectedProject.createdAt}</strong></div>
                  <div><span className="text-muted-foreground">Last Modified:</span> <strong>{selectedProject.lastModifiedBy}</strong></div>
                  <div><span className="text-muted-foreground">Modified At:</span> <strong>{selectedProject.lastModifiedAt}</strong></div>
                </div>
                {(selectedProject.assignedTeam || []).length > 0 && (
                  <div className="pt-2 border-t border-indigo-500/10">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Team Members:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProject.assignedTeam.map(m => (
                        <span key={m} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(selectedProject.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-muted border border-border/40 text-[10px] font-semibold rounded-full text-muted-foreground">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
