import { useState, useEffect } from 'react';
import { leads as initialLeads } from '@/data/mockData';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import ButtonGuard from '@/components/ui/ButtonGuard';

import {
  Search, Plus, Filter, X, Phone, MessageCircle, Mail, Building,
  DollarSign, User, Calendar, Tag, ArrowRight, Download, Upload,
  Clock, CheckCircle, MoreHorizontal, Edit, Trash2, Globe
} from 'lucide-react';

export default function Leads() {
  const { 
    addToast, leads: allLeads, setLeads: setAllLeads, convertLeadToClient, 
    updateLead, deleteLead, createLead, token, tenantId,
    fetchLeadFollowups, createLeadFollowup
  } = useApp();
  const [selectedLeadId, setSelectedLeadId] = useState(allLeads[0]?.id || '');
  const selectedLead = allLeads.find(l => l.id === selectedLeadId) || allLeads[0];
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [workspaceLabels, setWorkspaceLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState('All');

  // Follow-up States
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [newFollowupNote, setNewFollowupNote] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [nextFollowupRemarks, setNextFollowupRemarks] = useState('');
  const [followupType, setFollowupType] = useState('Call');

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

  const stages = ['All', 'New Lead', 'Contacted', 'Follow-up', 'Negotiation', 'Hot Lead', 'Proposal Sent', 'Converted'];
  const sources = ['All', 'Website', 'LinkedIn', 'Referral', 'Google Ads', 'WhatsApp', 'Cold Call'];
  const tags = ['All', 'High Value', 'Warm Lead', 'Enterprise', 'Retail'];

  const filtered = allLeads.filter(l => {
    const matchesSearch = (l.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (l.company || '').toLowerCase().includes(search.toLowerCase());
    const matchesStage = selectedStage === 'All' || l.stage === selectedStage;
    const matchesSource = selectedSource === 'All' || l.source === selectedSource;
    
    // Custom tag mock matching
    let matchesTag = true;
    if (selectedTag === 'High Value') matchesTag = l.value >= 500000;
    else if (selectedTag === 'Warm Lead') matchesTag = l.stage === 'Negotiation' || l.stage === 'Qualified';
    else if (selectedTag === 'Enterprise') matchesTag = l.value >= 1000000;
    else if (selectedTag === 'Retail') matchesTag = (l.company || '').toLowerCase().includes('retail') || (l.company || '').toLowerCase().includes('foods');

    const matchesLabel = selectedLabel === 'All' || l.product_interest === selectedLabel;

    return matchesSearch && matchesStage && matchesSource && matchesTag && matchesLabel;
  });

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

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editLeadData.name || !editLeadData.company) {
      addToast('Name and Company Name are required', 'warning');
      return;
    }
    updateLead(editLeadData.id, {
      ...editLeadData,
      value: Number(editLeadData.value) || 0
    });
    setShowEditLead(false);
    setEditLeadData(null);
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
          <button onClick={handleImport} className="btn-outline py-1.5 px-3 text-xs gap-1.5" style={{ color: '#ffffff', borderColor: 'rgba(99,102,241,0.3)' }}>
            <Upload size={13} />
            <span>Import</span>
          </button>
        </ButtonGuard>
        <ButtonGuard module="crm" action="export">
          <button onClick={handleExport} className="btn-outline py-1.5 px-3 text-xs gap-1.5" style={{ color: '#ffffff', borderColor: 'rgba(99,102,241,0.3)' }}>
            <Download size={13} />
            <span>Export</span>
          </button>
        </ButtonGuard>
        <ButtonGuard module="crm" action="create">
          <button onClick={() => setShowAddLead(true)} className="btn-primary py-1.5 px-3.5 text-xs rounded-xl" style={{ color: '#ffffff' }}>
            <Plus size={14} />
            <span>Create Lead</span>
          </button>
        </ButtonGuard>
      </PageHeader>

      {/* 3-Pane Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANE - Filters & Segments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-4 space-y-4">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Deal Stages</h3>
              <div className="space-y-1">
                {stages.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStage(s)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedStage === s 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{s}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
                      {s === 'All' ? allLeads.length : allLeads.filter(l => l.stage === s).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sources</h3>
              <div className="space-y-1">
                {sources.slice(0, 5).map(src => (
                  <button
                    key={src}
                    onClick={() => setSelectedSource(src)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedSource === src 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{src}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Lead Tags</h3>
              <div className="space-y-1">
                {tags.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedTag === t 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Product Interest</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedLabel('All')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedLabel === 'All'
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>All</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
                    {allLeads.length}
                  </span>
                </button>
                {workspaceLabels.map(lbl => (
                  <button
                    key={lbl}
                    onClick={() => setSelectedLabel(lbl)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedLabel === lbl
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="truncate">{lbl}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full shrink-0">
                      {allLeads.filter(l => l.product_interest === lbl).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANE - Lead Table list */}
        <div className="lg:col-span-7 space-y-3">
          <div className="glass-card p-3 flex items-center gap-3">
            <Search size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <input 
              type="text" 
              placeholder="Search leads by name or company..." 
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
                  {filtered.map(lead => (
                    <tr 
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`cursor-pointer ${selectedLeadId === lead.id ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''}`}
                    >
                      <td>
                        <div className="font-semibold text-xs text-slate-800 dark:text-white">{lead.name}</div>
                        <div className="text-[10px] text-slate-400">{lead.email}</div>
                      </td>
                      <td className="text-xs text-slate-600 dark:text-slate-300 font-medium">{lead.company}</td>
                      <td>
                        {lead.product_interest ? (
                          <span className="text-[10px] bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {lead.product_interest}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Unlabeled</span>
                        )}
                      </td>
                      <td className="text-xs font-bold text-slate-800 dark:text-white">{formatCurrency(lead.value)}</td>
                      <td><span className={`badge ${getStatusColor(lead.stage || 'New')}`}>{lead.stage || 'New'}</span></td>
                      <td className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{lead.source || 'Website'}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANE - Detailed Lead Profile Panel */}
        <div className="lg:col-span-3">
          {selectedLead ? (
            <div className="glass-card p-5 space-y-5">
              <div className="flex justify-end gap-1.5 mb-2 -mt-2">
                <ButtonGuard module="crm" action="edit">
                  <button
                    onClick={() => handleStartEdit(selectedLead)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                    title="Edit Lead"
                  >
                    <Edit size={12} /> Edit
                  </button>
                </ButtonGuard>
                <ButtonGuard module="crm" action="delete">
                  <button
                    onClick={() => handleDeleteClick(selectedLead.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                    title="Delete Lead"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </ButtonGuard>
              </div>

              <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center mx-auto shadow-md">
                  {selectedLead.name.split(' ').map(n => n.charAt(0)).join('')}
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mt-3">{selectedLead.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium">{selectedLead.company}</p>
                {selectedLead.industry && <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 inline-block">{selectedLead.industry}</span>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Deal Value</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(selectedLead.value)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Stage</span>
                  <div><span className={`badge ${getStatusColor(selectedLead.stage || 'New')} mt-0.5`}>{selectedLead.stage || 'New'}</span></div>
                </div>
              </div>

              {/* Lead Details */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-655 dark:text-slate-300 truncate" title="Email">{selectedLead.email || 'No Email'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-655 dark:text-slate-300" title="Phone">{selectedLead.phone || 'No Phone'}</span>
                </div>
                {selectedLead.altPhone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-655 dark:text-slate-300" title="Alternate Phone">{selectedLead.altPhone} (Alt)</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Building size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-655 dark:text-slate-300" title="Company">{selectedLead.company}</span>
                </div>
                {selectedLead.website && (
                  <div className="flex items-center gap-2.5">
                    <Globe size={13} className="text-slate-400 shrink-0" />
                    <a href={`https://${selectedLead.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate">{selectedLead.website}</a>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-655 dark:text-slate-300">Rep: {selectedLead.assignedTo || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Tag size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-655 dark:text-slate-300">
                    Interest: <span className="font-bold text-violet-600 dark:text-violet-400">{selectedLead.product_interest || 'Unlabeled'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-655 dark:text-slate-300">Created: {formatDate(selectedLead.createdAt)}</span>
                </div>
                {selectedLead.priority && (
                  <div className="flex items-center gap-2.5">
                    <Tag size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-655 dark:text-slate-300">Priority: <span className="font-bold">{selectedLead.priority}</span></span>
                  </div>
                )}
                {selectedLead.nextFollowUpDate && (
                  <div className="flex items-center gap-2.5 border-t border-dashed border-slate-100 dark:border-slate-800/80 pt-2 mt-2">
                    <Clock size={13} className="text-amber-500 shrink-0" />
                    <span className="text-slate-655 dark:text-slate-300">Next Follow-Up: <span className="font-bold text-amber-600 dark:text-amber-400">{selectedLead.nextFollowUpDate}</span> ({selectedLead.followUpStatus || 'Scheduled'})</span>
                  </div>
                )}
                {selectedLead.requirement && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Requirements</span>
                    <span className="text-slate-655 dark:text-slate-305 text-[11px] leading-relaxed mt-0.5 block">{selectedLead.requirement}</span>
                  </div>
                )}
                {selectedLead.description && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Description</span>
                    <span className="text-slate-655 dark:text-slate-305 text-[11px] leading-relaxed mt-0.5 block">{selectedLead.description}</span>
                  </div>
                )}
                {selectedLead.notes && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Notes</span>
                    <span className="text-slate-655 dark:text-slate-305 text-[11px] leading-relaxed mt-0.5 block italic">"{selectedLead.notes}"</span>
                  </div>
                )}
                {(selectedLead.city || selectedLead.state || selectedLead.pincode) && (
                  <div className="text-[10px] text-slate-400 mt-2 font-semibold">
                    📍 {selectedLead.city}, {selectedLead.state}, {selectedLead.country} {selectedLead.pincode ? `- ${selectedLead.pincode}` : ''}
                  </div>
                )}
              </div>

              {selectedLead.stage !== 'Won' && (
                <button
                  onClick={() => convertLeadToClient(selectedLead.id)}
                  className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <ArrowRight size={13} />
                  <span>Convert to Client</span>
                </button>
              )}

              {/* Trigger Actions */}
              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button 
                  onClick={() => addToast(`Opening WhatsApp chat with ${selectedLead.name}`)}
                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </button>
                <button 
                  onClick={() => addToast(`Calling ${selectedLead.name}...`)}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone size={13} />
                  <span>Call Dialer</span>
                </button>
              </div>

              {/* Follow-Up Logs & Scheduling Section */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                  <span>Follow-Up Logs & Reminders</span>
                  {followups.length > 0 && (
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                      {followups.length} Taken
                    </span>
                  )}
                </h4>

                {/* Schedule Next / Log Current Form */}
                <form onSubmit={handleLogFollowup} className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex gap-2">
                    <select 
                      value={followupType} 
                      onChange={e => setFollowupType(e.target.value)} 
                      className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1"
                    >
                      <option value="Call">📞 Call</option>
                      <option value="WhatsApp">💬 WhatsApp</option>
                      <option value="Email">✉️ Email</option>
                      <option value="F2F Meeting">🤝 F2F Meeting</option>
                    </select>
                    <span className="text-[9px] text-slate-400 font-semibold self-center">
                      First Taken: {followups.length > 0 ? followups[0].followup_date : 'None yet'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">Follow-Up Note / Remarks *</label>
                    <textarea 
                      value={newFollowupNote}
                      onChange={e => setNewFollowupNote(e.target.value)}
                      placeholder="What was discussed?" 
                      className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                      rows="2"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Next Follow-Up Date</label>
                      <input 
                        type="date" 
                        value={nextFollowupDate}
                        onChange={e => setNextFollowupDate(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Next Remarks / Task</label>
                      <input 
                        type="text" 
                        value={nextFollowupRemarks}
                        onChange={e => setNextFollowupRemarks(e.target.value)}
                        placeholder="e.g. Call to close" 
                        className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Log Follow-Up & Schedule
                  </button>
                </form>

                {/* Follow-up Logs History list */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {loadingFollowups ? (
                    <p className="text-[10px] text-slate-400 italic">Loading logs...</p>
                  ) : followups.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No follow-up history logged yet.</p>
                  ) : (
                    followups.slice().reverse().map((item, index) => {
                      const logNum = followups.length - index;
                      const isFirst = logNum === 1;
                      return (
                        <div key={item.id || index} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-xl relative shadow-xs">
                          <span className="absolute top-2 right-2 text-[8px] bg-slate-105 dark:bg-slate-900 text-slate-500 px-1 rounded uppercase font-bold">
                            {item.followup_type}
                          </span>
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                            {isFirst ? 'First Follow-Up' : `${logNum}th Follow-Up`}
                          </p>
                          <p className="text-[9px] text-slate-400">{item.followup_date} • {item.created_by || 'Agent'}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic bg-slate-50 dark:bg-slate-900/30 p-1.5 rounded">
                            "{item.remarks}"
                          </p>
                          {item.next_followup_date && (
                            <div className="mt-2 text-[9px] text-amber-600 dark:text-amber-400 font-semibold border-t border-dashed border-slate-100 dark:border-slate-800 pt-1.5">
                              📅 Next: {item.next_followup_date} {item.next_followup_remarks && `(${item.next_followup_remarks})`}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-slate-400">
              Select a lead from the workspace list to view their detailed timeline profile.
            </div>
          )}
        </div>
      </div>

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
