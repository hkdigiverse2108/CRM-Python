import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import {
  Search, Plus, Filter, X, Briefcase, Calendar, DollarSign, Tag,
  Users, Trash2, Edit3, CheckCircle, Clock, AlertTriangle, Play, HelpCircle
} from 'lucide-react';

export default function AllProjects() {
  const {
    projects,
    clients,
    employees,
    addProject,
    editProject,
    deleteProject,
    addToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState(null);

  // Forms
  const [newProject, setNewProject] = useState({
    name: '', description: '', clientId: '', clientName: '', category: 'Web Development',
    type: 'Client Project', priority: 'Medium', startDate: '', endDate: '',
    estimatedCompletion: '', budget: '', projectValue: '', department: 'Engineering',
    assignedManager: '', assignedTeam: [], status: 'Active', stage: 'New Project',
    tags: '', notes: '', createdBy: 'CRM Admin'
  });

  const statuses = ['All', 'Active', 'Completed', 'On Hold', 'Cancelled'];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const categories = ['All', 'Web Development', 'Mobile App', 'Consulting', 'Design', 'Marketing'];

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
                            (p.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
                            (p.id || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      const matchesPriority = selectedPriority === 'All' || p.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [projects, search, selectedStatus, selectedPriority, selectedCategory]);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProject.name) {
      addToast('Project Name is required', 'warning');
      return;
    }
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
    if (!editProjectData.name) {
      addToast('Project Name is required', 'warning');
      return;
    }
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
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'bg-blue-500/15 text-blue-600 border-blue-500/20';
      case 'Completed': return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20';
      case 'On Hold': return 'bg-slate-400/15 text-slate-500 border-slate-400/20';
      case 'Cancelled': return 'bg-red-500/15 text-red-600 border-red-500/20';
      default: return 'bg-slate-400/15 text-slate-500 border-slate-400/20';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/15 text-red-600 border-red-500/20';
      case 'High': return 'bg-orange-500/15 text-orange-600 border-orange-500/20';
      case 'Medium': return 'bg-blue-500/15 text-blue-600 border-blue-500/20';
      case 'Low': return 'bg-slate-400/15 text-slate-500 border-slate-400/20';
      default: return 'bg-slate-400/15 text-slate-500 border-slate-400/20';
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="All Projects" subtitle={`${filtered.length} Projects matching filters`}>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary py-1.5 px-3.5 text-xs rounded-xl" style={{ color: '#ffffff' }}>
          <Plus size={14} />
          <span>Create Project</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANE - Filters & Segments */}
        <div className="lg:col-span-3 xl:col-span-2 space-y-4">
          <div className="glass-card p-4 space-y-4">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Project Status</h3>
              <div className="space-y-1">
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedStatus === s 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{s}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
                      {s === 'All' ? projects.length : projects.filter(p => p.status === s).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Priority</h3>
              <div className="space-y-1">
                {priorities.map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPriority(p)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedPriority === p 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{p}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
                      {p === 'All' ? projects.length : projects.filter(proj => proj.priority === p).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Category</h3>
              <div className="space-y-1">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedCategory === c 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{c}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
                      {c === 'All' ? projects.length : projects.filter(proj => proj.category === c).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN PANE - Table & Search */}
        <div className="lg:col-span-9 xl:col-span-10 space-y-3">
          <div className="glass-card p-3 flex items-center gap-3">
            <Search size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <input 
              type="text" 
              placeholder="Search projects by ID, name or client..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400" 
            />
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project ID / Name</th>
                    <th>Client</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Dates</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(project => (
                    <tr key={project.id} className="hover:bg-indigo-50/10 transition-colors">
                      <td>
                        <div className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-xs">{project.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{project.id} • {project.department}</div>
                      </td>
                      <td className="text-xs text-slate-600 dark:text-slate-300 font-medium">{project.clientName || 'Internal'}</td>
                      <td className="text-xs text-slate-500 dark:text-slate-400">{project.category}</td>
                      <td>
                        <span className={`badge border ${getPriorityBadgeClass(project.priority)}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td className="text-xs font-bold text-slate-800 dark:text-white">{formatCurrency(project.projectValue)}</td>
                      <td>
                        <span className={`badge border ${getStatusBadgeClass(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="text-[10px] text-slate-400 whitespace-nowrap">
                        <div>Start: {project.startDate || '-'}</div>
                        <div>End: {project.endDate || '-'}</div>
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={(e) => handleStartEdit(project, e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-xs text-slate-400 italic">No projects found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =================== CREATE PROJECT MODAL (CENTERED) =================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold">Create New Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold mb-1 block">Project Name *</label>
                <input type="text" required value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="E.g., Web Redesign" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold mb-1 block">Description</label>
                <textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} className="input-field min-h-16" placeholder="Describe the project scope" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Client</label>
                <select value={newProject.clientId} onChange={e => setNewProject(p => ({ ...p, clientId: e.target.value }))} className="input-field">
                  <option value="">Internal Project / No Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Category</label>
                <select value={newProject.category} onChange={e => setNewProject(p => ({ ...p, category: e.target.value }))} className="input-field">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Priority</label>
                <select value={newProject.priority} onChange={e => setNewProject(p => ({ ...p, priority: e.target.value }))} className="input-field">
                  {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Department</label>
                <select value={newProject.department} onChange={e => setNewProject(p => ({ ...p, department: e.target.value }))} className="input-field">
                  {['Engineering', 'Marketing', 'Sales', 'HR', 'Customer Support', 'Finance'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Start Date</label>
                <input type="date" value={newProject.startDate} onChange={e => setNewProject(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">End Date</label>
                <input type="date" value={newProject.endDate} onChange={e => setNewProject(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Budget (₹)</label>
                <input type="number" value={newProject.budget} onChange={e => setNewProject(p => ({ ...p, budget: e.target.value }))} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Project Value (₹)</label>
                <input type="number" value={newProject.projectValue} onChange={e => setNewProject(p => ({ ...p, projectValue: e.target.value }))} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Assigned Manager</label>
                <input type="text" value={newProject.assignedManager} onChange={e => setNewProject(p => ({ ...p, assignedManager: e.target.value }))} className="input-field" placeholder="Manager name" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Status</label>
                <select value={newProject.status} onChange={e => setNewProject(p => ({ ...p, status: e.target.value }))} className="input-field">
                  {['Active', 'Completed', 'On Hold', 'Cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold mb-1 block">Tags (comma separated)</label>
                <input type="text" value={newProject.tags} onChange={e => setNewProject(p => ({ ...p, tags: e.target.value }))} className="input-field" placeholder="web, design, priority" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-border mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-6 py-2 font-bold">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== EDIT PROJECT MODAL (CENTERED) =================== */}
      {showEditModal && editProjectData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowEditModal(false); setEditProjectData(null); }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold">Edit Project: {editProjectData.id}</h2>
              <button onClick={() => { setShowEditModal(false); setEditProjectData(null); }} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold mb-1 block">Project Name *</label>
                <input type="text" required value={editProjectData.name || ''} onChange={e => setEditProjectData(p => ({ ...p, name: e.target.value }))} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold mb-1 block">Description</label>
                <textarea value={editProjectData.description || ''} onChange={e => setEditProjectData(p => ({ ...p, description: e.target.value }))} className="input-field min-h-16" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Client</label>
                <select value={editProjectData.clientId || ''} onChange={e => setEditProjectData(p => ({ ...p, clientId: e.target.value }))} className="input-field">
                  <option value="">Internal Project / No Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Category</label>
                <select value={editProjectData.category || ''} onChange={e => setEditProjectData(p => ({ ...p, category: e.target.value }))} className="input-field">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Priority</label>
                <select value={editProjectData.priority || ''} onChange={e => setEditProjectData(p => ({ ...p, priority: e.target.value }))} className="input-field">
                  {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Department</label>
                <select value={editProjectData.department || ''} onChange={e => setEditProjectData(p => ({ ...p, department: e.target.value }))} className="input-field">
                  {['Engineering', 'Marketing', 'Sales', 'HR', 'Customer Support', 'Finance'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Start Date</label>
                <input type="date" value={editProjectData.startDate || ''} onChange={e => setEditProjectData(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">End Date</label>
                <input type="date" value={editProjectData.endDate || ''} onChange={e => setEditProjectData(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Budget (₹)</label>
                <input type="number" value={editProjectData.budget || 0} onChange={e => setEditProjectData(p => ({ ...p, budget: e.target.value }))} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Project Value (₹)</label>
                <input type="number" value={editProjectData.projectValue || 0} onChange={e => setEditProjectData(p => ({ ...p, projectValue: e.target.value }))} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Assigned Manager</label>
                <input type="text" value={editProjectData.assignedManager || ''} onChange={e => setEditProjectData(p => ({ ...p, assignedManager: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Status</label>
                <select value={editProjectData.status || ''} onChange={e => setEditProjectData(p => ({ ...p, status: e.target.value }))} className="input-field">
                  {['Active', 'Completed', 'On Hold', 'Cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold mb-1 block">Tags (comma separated)</label>
                <input type="text" value={editProjectData.tags || ''} onChange={e => setEditProjectData(p => ({ ...p, tags: e.target.value }))} className="input-field" placeholder="web, design, priority" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-border mt-2">
                <button type="button" onClick={() => { setShowEditModal(false); setEditProjectData(null); }} className="btn-outline text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-6 py-2 font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
