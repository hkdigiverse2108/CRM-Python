import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { leads as initialLeads } from '@/data/mockData';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import ButtonGuard from '@/components/ui/ButtonGuard';
import { formatAssignedAgent } from './Pipeline';

// Import newly created enhanced CRM UI components
import FilterBar from '@/components/crm/FilterBar';
import SavedViewsToggle from '@/components/crm/SavedViewsToggle';
import LeadDetailDrawer from '@/components/crm/LeadDetailDrawer';

import {
  Search, Plus, Filter, X, Phone, MessageCircle, Mail, Building,
  DollarSign, User, Calendar, Tag, ArrowRight, Download, Upload,
  Clock, CheckCircle, MoreHorizontal, Edit, Trash2, Globe
} from 'lucide-react';

export default function Leads() {
  const { 
    addToast, leads: allLeads, setLeads: setAllLeads, convertLeadToClient, 
    updateLead, deleteLead, createLead, token, tenantId,
    fetchLeadFollowups, createLeadFollowup, fetchLeadAuditLogs, createReminder
  } = useApp();
  const navigate = useNavigate();
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const selectedLead = allLeads.find(l => l.id === selectedLeadId);
  
  // Combined Filter State for Saved Views Toggle compatibility
  const [filters, setFilters] = useState({
    stage: 'All',
    source: 'All',
    tag: 'All',
    label: 'All',
    search: ''
  });
  
  const [workspaceLabels, setWorkspaceLabels] = useState([]);
  
  // Pagination State: initial visible count of leads to optimize DOM loading
  const [visibleCount, setVisibleCount] = useState(15);

  // Follow-up States
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [newFollowupNote, setNewFollowupNote] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [nextFollowupRemarks, setNextFollowupRemarks] = useState('');
  const [followupType, setFollowupType] = useState('Call');

  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  useEffect(() => {
    if (!selectedLead?.id) return;
    const loadFollowups = async () => {
      setLoadingFollowups(true);
      const data = await fetchLeadFollowups(selectedLead.id);
      setFollowups(data || []);
      setLoadingFollowups(false);
    };
    loadFollowups();
  }, [selectedLeadId, selectedLead?.id, fetchLeadFollowups]);

  useEffect(() => {
    if (!selectedLead?.id) return;
    const loadAuditLogs = async () => {
      setLoadingAuditLogs(true);
      const data = await fetchLeadAuditLogs(selectedLead.id);
      setAuditLogs(data || []);
      setLoadingAuditLogs(false);
    };
    loadAuditLogs();
  }, [selectedLeadId, selectedLead?.id, fetchLeadAuditLogs]);

  const handleLogFollowup = async (e) => {
    e.preventDefault();
    if (!newFollowupNote.trim()) {
      addToast('Remarks note is required', 'warning');
      return;
    }
    const payload = {
      followup_date: new Date().toISOString().split('T')[0],
      followup_type: followupType,
      remarks: newFollowupNote,
      next_followup_date: nextFollowupDate || null,
      next_followup_remarks: nextFollowupRemarks || null,
    };
    const created = await createLeadFollowup(selectedLead.id, payload);
    if (created) {
      setFollowups(prev => [...prev, created]);
      setNewFollowupNote('');
      setNextFollowupDate('');
      setNextFollowupRemarks('');
      addToast('Follow-up history updated', 'success');
    }
  };

  useEffect(() => {
    const fetchLabels = async () => {
      if (!token) return;
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_BASE}/integrations/whatsapp/labels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '96722',
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setWorkspaceLabels(json.data.map(l => l.name));
          }
        }
      } catch (err) {
        console.error('Failed to fetch lead labels:', err);
      }
    };
    fetchLabels();
  }, [token, tenantId]);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showEditLead, setShowEditLead] = useState(false);
  const [editLeadData, setEditLeadData] = useState(null);
  const [newLead, setNewLead] = useState({
    name: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    altPhone: '',
    email: '',
    website: '',
    industry: '',
    source: 'Website',
    status: 'New Lead',
    stage: 'New Lead',
    priority: 'Medium',
    tags: '',
    requirement: '',
    description: '',
    notes: '',
    assignedTo: 'Arjun Mehta',
    createdBy: 'CRM Admin',
    nextFollowUpDate: '',
    followUpStatus: 'Scheduled',
    value: '',
    probability: '',
    customerType: 'Individual',
    preferredChannel: 'Email',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
  });

  const stages = useMemo(() => ['All', 'New Lead', 'Contacted', 'Follow-up', 'Negotiation', 'Hot Lead', 'Proposal Sent', 'Converted'], []);
  const sources = useMemo(() => ['All', 'Website', 'LinkedIn', 'Referral', 'Google Ads', 'WhatsApp', 'Cold Call'], []);
  const tags = useMemo(() => ['All', 'High Value', 'Warm Lead', 'Enterprise', 'Retail'], []);

  const filtered = useMemo(() => {
    return allLeads.filter(l => {
      const searchLower = (filters.search || '').toLowerCase();
      const matchesSearch = (l.name || '').toLowerCase().includes(searchLower) || 
                            (l.company || '').toLowerCase().includes(searchLower);
      const matchesStage = filters.stage === 'All' || l.stage === filters.stage;
      const matchesSource = filters.source === 'All' || l.source === filters.source;
      
      let matchesTag = true;
      if (filters.tag === 'High Value') matchesTag = l.value >= 500000;
      else if (filters.tag === 'Warm Lead') matchesTag = l.stage === 'Negotiation' || l.stage === 'Qualified';
      else if (filters.tag === 'Enterprise') matchesTag = l.value >= 1000000;
      else if (filters.tag === 'Retail') matchesTag = (l.company || '').toLowerCase().includes('retail') || (l.company || '').toLowerCase().includes('foods');

      const matchesLabel = filters.label === 'All' || l.product_interest === filters.label;

      return matchesSearch && matchesStage && matchesSource && matchesTag && matchesLabel;
    });
  }, [allLeads, filters]);

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.company) {
      addToast('Name and Company Name are required', 'warning');
      return;
    }
    
    if (createLead) {
      const created = await createLead(newLead);
      if (created) {
        setSelectedLeadId(created.id);
        setShowAddLead(false);
        setNewLead({
          name: '',
          firstName: '',
          lastName: '',
          company: '',
          phone: '',
          altPhone: '',
          email: '',
          website: '',
          industry: '',
          source: 'Website',
          status: 'New Lead',
          stage: 'New Lead',
          priority: 'Medium',
          tags: '',
          requirement: '',
          description: '',
          notes: '',
          assignedTo: 'Arjun Mehta',
          createdBy: 'CRM Admin',
          nextFollowUpDate: '',
          followUpStatus: 'Scheduled',
          value: '',
          probability: '',
          customerType: 'Individual',
          preferredChannel: 'Email',
          city: '',
          state: '',
          country: 'India',
          pincode: ''
        });
      }
    } else {
      const lead = {
        id: `LD-${String(allLeads.length + 1).padStart(3, '0')}`,
        ...newLead,
        status: 'New Lead',
        stage: 'New Lead',
        value: Number(newLead.value) || 0,
        createdAt: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString().split('T')[0],
      };
      setAllLeads(prev => [lead, ...prev]);
      setSelectedLeadId(lead.id);
      setShowAddLead(false);
      setNewLead({
        name: '',
        firstName: '',
        lastName: '',
        company: '',
        phone: '',
        altPhone: '',
        email: '',
        website: '',
        industry: '',
        source: 'Website',
        status: 'New Lead',
        stage: 'New Lead',
        priority: 'Medium',
        tags: '',
        requirement: '',
        description: '',
        notes: '',
        assignedTo: 'Arjun Mehta',
        createdBy: 'CRM Admin',
        nextFollowUpDate: '',
        followUpStatus: 'Scheduled',
        value: '',
        probability: '',
        customerType: 'Individual',
        preferredChannel: 'Email',
        city: '',
        state: '',
        country: 'India',
        pincode: ''
      });
      addToast(`Lead "${lead.name}" created successfully`);
    }
  };

  const handleStartEdit = (lead) => {
    setEditLeadData(lead);
    setShowEditLead(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editLeadData.name || !editLeadData.company) {
      addToast('Name and Company Name are required', 'warning');
      return;
    }
    await updateLead(editLeadData.id, {
      ...editLeadData,
      value: Number(editLeadData.value) || 0
    });
    setShowEditLead(false);
    const oldId = editLeadData.id;
    setEditLeadData(null);
    
    if (selectedLeadId === oldId) {
      setLoadingAuditLogs(true);
      const data = await fetchLeadAuditLogs(oldId);
      setAuditLogs(data || []);
      setLoadingAuditLogs(false);
    }
  };

  const handleDeleteClick = (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteLead(leadId);
      if (selectedLeadId === leadId) {
        const remaining = allLeads.filter(l => l.id !== leadId);
        setSelectedLeadId(remaining[0]?.id || '');
      }
    }
  };

  const handleImport = () => {
    addToast('Imported 12 leads from CSV successfully');
  };

  const handleExport = () => {
    addToast('CSV export downloaded successfully');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Lead Workspace" subtitle={`${filtered.length} Leads matching filters`}>
        <ButtonGuard module="crm" action="import">
          <button onClick={handleImport} className="btn-outline py-1.5 px-3 text-xs gap-1.5 border border-indigo-200 dark:border-indigo-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Upload size={13} />
            <span>Import</span>
          </button>
        </ButtonGuard>
        <ButtonGuard module="crm" action="export">
          <button onClick={handleExport} className="btn-outline py-1.5 px-3 text-xs gap-1.5 border border-indigo-200 dark:border-indigo-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={13} />
            <span>Export</span>
          </button>
        </ButtonGuard>
        <ButtonGuard module="crm" action="create">
          <button onClick={() => setShowAddLead(true)} className="btn-primary py-1.5 px-3.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer">
            <Plus size={14} />
            <span>Create Lead</span>
          </button>
        </ButtonGuard>
      </PageHeader>

      {/* Saved Views Configurator Switchboard */}
      <SavedViewsToggle 
        currentFilters={filters}
        onLoadView={(savedFilters) => setFilters(savedFilters)}
        onAddToast={addToast}
      />

      {/* Premium Glass-Card styled Filter Bar */}
      <FilterBar 
        stages={stages}
        sources={sources}
        tags={tags}
        workspaceLabels={workspaceLabels}
        filters={filters}
        onChangeFilter={(key, value) => {
          setFilters(prev => ({ ...prev, [key]: value }));
          setVisibleCount(15); // Reset pagination offset
        }}
        onClearFilters={() => {
          setFilters({
            stage: 'All',
            source: 'All',
            tag: 'All',
            label: 'All',
            search: ''
          });
          setVisibleCount(15);
        }}
      />

      {/* Main Table Layout */}
      <div className="space-y-4">
        <div className="glass-card p-3.5 flex items-center gap-3 bg-white/70 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <Search size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Search leads by name or company..." 
            value={filters.search} 
            onChange={e => {
              setFilters(prev => ({ ...prev, search: e.target.value }));
              setVisibleCount(15);
            }} 
            className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 font-semibold" 
          />
        </div>

        <div className="glass-card overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white/80 dark:bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Label</th>
                  <th>Value</th>
                  <th>Stage</th>
                  <th>Source</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.slice(0, visibleCount).map(lead => (
                    <tr 
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`cursor-pointer border-l-2 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all duration-150 ${
                        selectedLeadId === lead.id 
                          ? 'bg-indigo-55/60 dark:bg-indigo-950/20 border-indigo-500 font-medium' 
                          : 'border-transparent hover:border-indigo-400'
                      }`}
                    >
                      <td>
                        <div className="font-semibold text-xs text-slate-800 dark:text-white">{lead.name}</div>
                        <div className="text-[10px] text-slate-400">{lead.email}</div>
                      </td>
                      <td className="text-xs text-slate-600 dark:text-slate-300 font-medium">{lead.company}</td>
                      <td>
                        {lead.product_interest ? (
                          <span className="text-[10px] bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                            {lead.product_interest}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Unlabeled</span>
                        )}
                      </td>
                      <td className="text-xs font-bold text-slate-800 dark:text-white">{formatCurrency(lead.value)}</td>
                      <td><span className={`badge ${getStatusColor(lead.stage || lead.status || 'New Lead')} whitespace-nowrap`}>{lead.stage || lead.status || 'New Lead'}</span></td>
                      <td className="text-xs text-slate-405 dark:text-slate-500 font-semibold">{lead.source || 'Website'}</td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <ButtonGuard module="crm" action="edit">
                            <button
                              onClick={() => handleStartEdit(lead)}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                              title="Edit Lead"
                            >
                              <Edit size={13} />
                            </button>
                          </ButtonGuard>
                          <ButtonGuard module="crm" action="delete">
                            <button
                              onClick={() => handleDeleteClick(lead.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 size={13} />
                            </button>
                          </ButtonGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-xs text-slate-400 italic">No leads found matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load More Pagination Button for performance optimization */}
        {filtered.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount(prev => prev + 15)}
              className="px-5 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-150/40 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-sm active:scale-95"
            >
              Load More Leads
            </button>
          </div>
        )}
      </div>

      {/* Right side slide-out drawer containing full lead detail dashboard */}
      {selectedLeadId && selectedLead && (
        <>
          <div className="sheet-overlay animate-fade-in" onClick={() => setSelectedLeadId(null)} />
          <LeadDetailDrawer 
            lead={selectedLead}
            onClose={() => setSelectedLeadId(null)}
            onStartEdit={handleStartEdit}
            addToast={addToast}
            fetchLeadFollowups={fetchLeadFollowups}
            createLeadFollowup={createLeadFollowup}
            fetchLeadAuditLogs={fetchLeadAuditLogs}
            createReminder={createReminder}
            formatAssignedAgent={formatAssignedAgent}
          />
        </>
      )}

      {/* Add Lead Slide-out Sheet */}
      {showAddLead && (
        <>
          <div className="sheet-overlay" onClick={() => setShowAddLead(false)} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Add New CRM Lead</h2>
              <button onClick={() => setShowAddLead(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold mb-1 block">Lead Name *</label><input type="text" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="input-field" placeholder="Full Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Company Name *</label><input type="text" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} className="input-field" placeholder="Company Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">First Name</label><input type="text" value={newLead.firstName} onChange={e => setNewLead({...newLead, firstName: e.target.value})} className="input-field" placeholder="First Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Last Name</label><input type="text" value={newLead.lastName} onChange={e => setNewLead({...newLead, lastName: e.target.value})} className="input-field" placeholder="Last Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Mobile Number</label><input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="input-field" placeholder="Mobile Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Alternate Number</label><input type="text" value={newLead.altPhone} onChange={e => setNewLead({...newLead, altPhone: e.target.value})} className="input-field" placeholder="Alt Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Email Address</label><input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="input-field" placeholder="Email Address" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Website</label><input type="text" value={newLead.website} onChange={e => setNewLead({...newLead, website: e.target.value})} className="input-field" placeholder="e.g. google.com" /></div>
              
              <div><label className="text-xs font-semibold mb-1 block">Industry</label><input type="text" value={newLead.industry} onChange={e => setNewLead({...newLead, industry: e.target.value})} className="input-field" placeholder="e.g. IT Services, Healthcare" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Lead Source</label>
                <select value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} className="input-field">
                  <option>Website</option><option>LinkedIn</option><option>Referral</option><option>Google Ads</option><option>WhatsApp</option><option>Cold Call</option>
                </select>
              </div>
              
              <div><label className="text-xs font-semibold mb-1 block">Lead Status</label>
                <select value={newLead.status} onChange={e => setNewLead({...newLead, status: e.target.value})} className="input-field">
                  <option value="New Lead">New Lead</option><option value="Contacted">Contacted</option><option value="Follow-up">Follow-up</option><option value="Negotiation">Negotiation</option><option value="Hot Lead">Hot Lead</option><option value="Proposal Sent">Proposal Sent</option><option value="Converted">Converted</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Lead Stage</label>
                <select value={newLead.stage} onChange={e => setNewLead({...newLead, stage: e.target.value})} className="input-field">
                  <option value="New Lead">New Lead</option><option value="Contacted">Contacted</option><option value="Follow-up">Follow-up</option><option value="Negotiation">Negotiation</option><option value="Hot Lead">Hot Lead</option><option value="Proposal Sent">Proposal Sent</option><option value="Converted">Converted</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Priority</label>
                <select value={newLead.priority} onChange={e => setNewLead({...newLead, priority: e.target.value})} className="input-field">
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Tags (comma-separated)</label><input type="text" value={newLead.tags} onChange={e => setNewLead({...newLead, tags: e.target.value})} className="input-field" placeholder="High Value, Retail" /></div>

              <div><label className="text-xs font-semibold mb-1 block">Expected Value (₹)</label><input type="number" value={newLead.value} onChange={e => setNewLead({...newLead, value: e.target.value})} className="input-field" placeholder="Expected Deal Value" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Probability %</label><input type="number" value={newLead.probability} onChange={e => setNewLead({...newLead, probability: e.target.value})} className="input-field" placeholder="Probability of closing" /></div>

              <div><label className="text-xs font-semibold mb-1 block">Customer Type</label>
                <select value={newLead.customerType} onChange={e => setNewLead({...newLead, customerType: e.target.value})} className="input-field">
                  <option value="Individual">Individual</option><option value="Corporate">Corporate</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Preferred Communication Channel</label>
                <select value={newLead.preferredChannel} onChange={e => setNewLead({...newLead, preferredChannel: e.target.value})} className="input-field">
                  <option value="Email">Email</option><option value="WhatsApp">WhatsApp</option><option value="Phone Call">Phone Call</option><option value="SMS">SMS</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Next Follow-Up Date</label><input type="date" value={newLead.nextFollowUpDate} onChange={e => setNewLead({...newLead, nextFollowUpDate: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Follow-Up Status</label>
                <select value={newLead.followUpStatus} onChange={e => setNewLead({...newLead, followUpStatus: e.target.value})} className="input-field">
                  <option value="Scheduled">Scheduled</option><option value="Contacted">Contacted</option><option value="Postponed">Postponed</option><option value="No Show">No Show</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Assigned To</label><input type="text" value={newLead.assignedTo} onChange={e => setNewLead({...newLead, assignedTo: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Created By</label><input type="text" value={newLead.createdBy} onChange={e => setNewLead({...newLead, createdBy: e.target.value})} className="input-field" /></div>

              <div><label className="text-xs font-semibold mb-1 block">City</label><input type="text" value={newLead.city} onChange={e => setNewLead({...newLead, city: e.target.value})} className="input-field" placeholder="City" /></div>
              <div><label className="text-xs font-semibold mb-1 block">State</label><input type="text" value={newLead.state} onChange={e => setNewLead({...newLead, state: e.target.value})} className="input-field" placeholder="State" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Country</label><input type="text" value={newLead.country} onChange={e => setNewLead({...newLead, country: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Pincode</label><input type="text" value={newLead.pincode} onChange={e => setNewLead({...newLead, pincode: e.target.value})} className="input-field" placeholder="Pincode" /></div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Requirement</label>
                <textarea rows="2" value={newLead.requirement} onChange={e => setNewLead({...newLead, requirement: e.target.value})} className="input-field" placeholder="Specify customer requirements..."></textarea>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Description</label>
                <textarea rows="2" value={newLead.description} onChange={e => setNewLead({...newLead, description: e.target.value})} className="input-field" placeholder="Lead description..."></textarea>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Notes</label>
                <textarea rows="2" value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} className="input-field" placeholder="Internal notes..."></textarea>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowAddLead(false)} className="btn-outline w-full justify-center py-2 text-xs">Cancel</button>
              <button onClick={handleAddLead} className="btn-primary w-full justify-center py-2 text-xs" style={{ color: '#ffffff' }}>Create Lead</button>
            </div>
          </div>
        </>
      )}

      {/* Edit Lead Modal */}
      {showEditLead && editLeadData && (
        <>
          <div className="sheet-overlay" onClick={() => { setShowEditLead(false); setEditLeadData(null); }} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-808 dark:text-white uppercase tracking-wider">Edit Lead Details</h2>
              <button onClick={() => { setShowEditLead(false); setEditLeadData(null); }} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div><label className="text-xs font-semibold mb-1 block">Lead Name *</label><input type="text" required value={editLeadData.name} onChange={e => setEditLeadData({...editLeadData, name: e.target.value})} className="input-field" placeholder="Full Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Company Name *</label><input type="text" required value={editLeadData.company} onChange={e => setEditLeadData({...editLeadData, company: e.target.value})} className="input-field" placeholder="Company Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">First Name</label><input type="text" value={editLeadData.firstName || ''} onChange={e => setEditLeadData({...editLeadData, firstName: e.target.value})} className="input-field" placeholder="First Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Last Name</label><input type="text" value={editLeadData.lastName || ''} onChange={e => setEditLeadData({...editLeadData, lastName: e.target.value})} className="input-field" placeholder="Last Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Mobile Number</label><input type="text" value={editLeadData.phone || ''} onChange={e => setEditLeadData({...editLeadData, phone: e.target.value})} className="input-field" placeholder="Mobile Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Alternate Number</label><input type="text" value={editLeadData.altPhone || ''} onChange={e => setEditLeadData({...editLeadData, altPhone: e.target.value})} className="input-field" placeholder="Alt Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Email Address</label><input type="email" value={editLeadData.email || ''} onChange={e => setEditLeadData({...editLeadData, email: e.target.value})} className="input-field" placeholder="Email Address" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Website</label><input type="text" value={editLeadData.website || ''} onChange={e => setEditLeadData({...editLeadData, website: e.target.value})} className="input-field" placeholder="e.g. google.com" /></div>
              
              <div><label className="text-xs font-semibold mb-1 block">Industry</label><input type="text" value={editLeadData.industry || ''} onChange={e => setEditLeadData({...editLeadData, industry: e.target.value})} className="input-field" placeholder="e.g. IT Services, Healthcare" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Lead Source</label>
                <select value={editLeadData.source || 'Website'} onChange={e => setEditLeadData({...editLeadData, source: e.target.value})} className="input-field">
                  <option>Website</option><option>LinkedIn</option><option>Referral</option><option>Google Ads</option><option>WhatsApp</option><option>Cold Call</option>
                </select>
              </div>
              
              <div><label className="text-xs font-semibold mb-1 block">Lead Status</label>
                <select value={editLeadData.status || 'New Lead'} onChange={e => setEditLeadData({...editLeadData, status: e.target.value})} className="input-field">
                  <option value="New Lead">New Lead</option><option value="Contacted">Contacted</option><option value="Follow-up">Follow-up</option><option value="Negotiation">Negotiation</option><option value="Hot Lead">Hot Lead</option><option value="Proposal Sent">Proposal Sent</option><option value="Converted">Converted</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Lead Stage</label>
                <select value={editLeadData.stage || 'New Lead'} onChange={e => setEditLeadData({...editLeadData, stage: e.target.value})} className="input-field">
                  <option value="New Lead">New Lead</option><option value="Contacted">Contacted</option><option value="Follow-up">Follow-up</option><option value="Negotiation">Negotiation</option><option value="Hot Lead">Hot Lead</option><option value="Proposal Sent">Proposal Sent</option><option value="Converted">Converted</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Priority</label>
                <select value={editLeadData.priority || 'Medium'} onChange={e => setEditLeadData({...editLeadData, priority: e.target.value})} className="input-field">
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Tags (comma-separated)</label><input type="text" value={editLeadData.tags || ''} onChange={e => setEditLeadData({...editLeadData, tags: e.target.value})} className="input-field" placeholder="High Value, Retail" /></div>

              <div><label className="text-xs font-semibold mb-1 block">Expected Value (₹)</label><input type="number" value={editLeadData.value || ''} onChange={e => setEditLeadData({...editLeadData, value: e.target.value})} className="input-field" placeholder="Expected Deal Value" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Probability %</label><input type="number" value={editLeadData.probability || ''} onChange={e => setEditLeadData({...editLeadData, probability: e.target.value})} className="input-field" placeholder="Probability of closing" /></div>

              <div><label className="text-xs font-semibold mb-1 block">Customer Type</label>
                <select value={editLeadData.customerType || 'Individual'} onChange={e => setEditLeadData({...editLeadData, customerType: e.target.value})} className="input-field">
                  <option value="Individual">Individual</option><option value="Corporate">Corporate</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold mb-1 block">Preferred Communication Channel</label>
                <select value={editLeadData.preferredChannel || 'Email'} onChange={e => setEditLeadData({...editLeadData, preferredChannel: e.target.value})} className="input-field">
                  <option value="Email">Email</option><option value="WhatsApp">WhatsApp</option><option value="Phone Call">Phone Call</option><option value="SMS">SMS</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Next Follow-Up Date</label><input type="date" value={editLeadData.nextFollowUpDate || ''} onChange={e => setEditLeadData({...editLeadData, nextFollowUpDate: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Follow-Up Status</label>
                <select value={editLeadData.followUpStatus || 'Scheduled'} onChange={e => setEditLeadData({...editLeadData, followUpStatus: e.target.value})} className="input-field">
                  <option value="Scheduled">Scheduled</option><option value="Contacted">Contacted</option><option value="Postponed">Postponed</option><option value="No Show">No Show</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Assigned To</label><input type="text" value={editLeadData.assignedTo || ''} onChange={e => setEditLeadData({...editLeadData, assignedTo: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Created By</label><input type="text" value={editLeadData.createdBy || ''} onChange={e => setEditLeadData({...editLeadData, createdBy: e.target.value})} className="input-field" /></div>

              <div><label className="text-xs font-semibold mb-1 block">City</label><input type="text" value={editLeadData.city || ''} onChange={e => setEditLeadData({...editLeadData, city: e.target.value})} className="input-field" placeholder="City" /></div>
              <div><label className="text-xs font-semibold mb-1 block">State</label><input type="text" value={editLeadData.state || ''} onChange={e => setEditLeadData({...editLeadData, state: e.target.value})} className="input-field" placeholder="State" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Country</label><input type="text" value={editLeadData.country || ''} onChange={e => setEditLeadData({...editLeadData, country: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Pincode</label><input type="text" value={editLeadData.pincode || ''} onChange={e => setEditLeadData({...editLeadData, pincode: e.target.value})} className="input-field" placeholder="Pincode" /></div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Requirement</label>
                <textarea rows="2" value={editLeadData.requirement || ''} onChange={e => setEditLeadData({...editLeadData, requirement: e.target.value})} className="input-field" placeholder="Specify customer requirements..."></textarea>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Description</label>
                <textarea rows="2" value={editLeadData.description || ''} onChange={e => setEditLeadData({...editLeadData, description: e.target.value})} className="input-field" placeholder="Lead description..."></textarea>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Notes</label>
                <textarea rows="2" value={editLeadData.notes || ''} onChange={e => setEditLeadData({...editLeadData, notes: e.target.value})} className="input-field" placeholder="Internal notes..."></textarea>
              </div>
            </form>

            <div className="flex gap-4 mt-6">
              <button type="button" onClick={() => { setShowEditLead(false); setEditLeadData(null); }} className="btn-outline w-full justify-center py-2 text-xs">Cancel</button>
              <button type="button" onClick={handleSaveEdit} className="btn-primary w-full justify-center py-2 text-xs" style={{ color: '#ffffff' }}>Save Changes</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
