import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import { X } from 'lucide-react';

export default function Pipeline() {
  const { 
    addToast, leads = [], setLeads, 
    fetchLeadFollowups, fetchLeadAuditLogs, createLeadFollowup, updateLead 
  } = useApp();
  
  const [search, setSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newDeal, setNewDeal] = useState({
    name: '', // Deal Name
    company: '', // Company Name
    value: '', // Deal Value
    currency: 'INR',
    pipeline: 'Sales',
    stage: 'New',
    probability: '50',
    expectedClosingDate: '',
    assignedTo: 'Arjun Mehta', // Assigned User
    source: 'Website', // Deal Source
    description: '',
    products: '',
    quantity: '1',
    discount: '0',
    tax: '18',
    notes: ''
  });

  // Follow-up & Detail Drawer States
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [newFollowupNote, setNewFollowupNote] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [nextFollowupRemarks, setNextFollowupRemarks] = useState('');
  const [followupType, setFollowupType] = useState('Call');
  const [isEditing, setIsEditing] = useState(false);
  
  // State for edit form inputs
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    value: '',
    stage: '',
    source: '',
    assignedTo: ''
  });

  const stages = [
    { id: 'New', name: 'New Lead', color: 'bg-blue-500' },
    { id: 'Contacted', name: 'Contacted', color: 'bg-indigo-500' },
    { id: 'Follow-up', name: 'Follow-up', color: 'bg-cyan-500' },
    { id: 'Negotiation', name: 'Negotiation', color: 'bg-purple-500' },
    { id: 'Hot Lead', name: 'Hot Lead', color: 'bg-orange-500' },
    { id: 'Proposal', name: 'Proposal Sent', color: 'bg-pink-500' },
    { id: 'Won', name: 'Won', color: 'bg-emerald-500' },
    { id: 'Lost', name: 'Lost', color: 'bg-red-500' }
  ];

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleOpenDetails = async (id) => {
    setSelectedLeadId(id);
    setIsEditing(false);
    
    setLoadingFollowups(true);
    const data = await fetchLeadFollowups(id);
    setFollowups(data || []);
    setLoadingFollowups(false);

    setLoadingAuditLogs(true);
    const aData = await fetchLeadAuditLogs(id);
    setAuditLogs(aData || []);
    setLoadingAuditLogs(false);
    
    const lead = leads.find(l => l.id === id);
    if (lead) {
      setEditForm({
        name: lead.name || '',
        company: lead.company || '',
        value: lead.value || '',
        stage: lead.stage || 'New',
        source: lead.source || 'Website',
        assignedTo: lead.assignedTo || ''
      });
    }
  };

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
    const created = await createLeadFollowup(selectedLeadId, payload);
    if (created) {
      setFollowups(prev => [...prev, created]);
      setNewFollowupNote('');
      setNextFollowupDate('');
      setNextFollowupRemarks('');
      addToast('Follow-up logged successfully', 'success');
    }
  };

  const handleSaveEditLead = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.company) {
      addToast('Name and Company are required', 'warning');
      return;
    }
    await updateLead(selectedLeadId, {
      name: editForm.name,
      company: editForm.company,
      value: Number(editForm.value) || 0.0,
      stage: editForm.stage,
      source: editForm.source,
      assigned_to: editForm.assignedTo
    });
    setIsEditing(false);
    addToast('Lead details updated successfully', 'success');

    // Refresh audit logs
    setLoadingAuditLogs(true);
    const aData = await fetchLeadAuditLogs(selectedLeadId);
    setAuditLogs(aData || []);
    setLoadingAuditLogs(false);
  };

  const deals = leads.map(l => ({
    id: l.id,
    stage: l.stage || 'New',
    name: l.name || `Deal - ${l.company}`,
    company: l.company || l.name,
    phone: l.phone || '',
    value: Number(l.value) || 0,
    source: l.source || 'Website',
    score: l.score || 50,
    rep: l.assignedTo || l.assigned_to || 'Unassigned',
    createdBy: l.created_by || 'Admin',
    remarks: l.notes || '',
    nextFollowupDate: l.next_followup_date || '',
    probability: l.stage === 'Won' ? 100 : l.stage === 'Lost' ? 0 : 70,
  }));

  const filteredDeals = deals.filter(d => {
    const matchesSearch = (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (d.company || '').toLowerCase().includes(search.toLowerCase());
    const matchesStage = selectedStageFilter === 'All' || d.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const handleCreateDealSubmit = (e) => {
    e.preventDefault();
    if (!newDeal.name || !newDeal.company) {
      addToast('Deal Name and Company Name are required', 'warning');
      return;
    }

    const createdDeal = {
      id: `DL-${String(leads.length + 1).padStart(3, '0')}`,
      ...newDeal,
      value: Number(newDeal.value) || 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setLeads(prev => [createdDeal, ...prev]);
    setShowCreateModal(false);
    setNewDeal({
      name: '',
      company: '',
      value: '',
      currency: 'INR',
      pipeline: 'Sales',
      stage: 'New',
      probability: '50',
      expectedClosingDate: '',
      assignedTo: 'Arjun Mehta',
      source: 'Website',
      description: '',
      products: '',
      quantity: '1',
      discount: '0',
      tax: '18',
      notes: ''
    });
    addToast(`Deal "${createdDeal.name}" created successfully`);
  };

  return (
    <div className="text-on-background min-h-screen space-y-5">
      <PageHeader title="Sales Pipeline" subtitle={`${stages.length} Deal Stages • Filter and manage deals directly`}>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#818cf8', fontSize: '18px' }}>search</span>
          <input 
            type="text" 
            placeholder="Search deals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary w-48"
            style={{ background: 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)', color: '#ffffff' }}
          />
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          style={{ color: '#ffffff' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Create Deal
        </button>
      </PageHeader>

      {/* Stages Filter Row */}
      <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/60 dark:bg-slate-950/20 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 backdrop-blur-xs">
        <button
          onClick={() => setSelectedStageFilter('All')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
            selectedStageFilter === 'All'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]'
              : 'bg-white hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80'
          }`}
        >
          All Stages ({deals.length})
        </button>
        {stages.map(st => {
          const count = deals.filter(d => d.stage === st.id).length;
          const isActive = selectedStageFilter === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setSelectedStageFilter(st.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]'
                  : 'bg-white hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${st.color} shadow-xs`}></span>
              <span>{st.name} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Deals Table View */}
      <div className="glass-card rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                <th className="py-4 px-4 text-center">Hot</th>
                <th className="py-4 px-4">Created By</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Source</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Assigned To</th>
                <th className="py-4 px-4">Expected Income</th>
                <th className="py-4 px-4">Remarks</th>
                <th className="py-4 px-4">Follow-ups</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredDeals.length > 0 ? (
                filteredDeals.map(deal => (
                  <tr 
                    key={deal.id} 
                    onClick={() => handleOpenDetails(deal.id)}
                    className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all duration-150 cursor-pointer border-l-2 border-transparent hover:border-indigo-500"
                  >
                    <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={deal.stage === 'Hot Lead'}
                        onChange={async (e) => {
                          const isChecked = e.target.checked;
                          const newStage = isChecked ? 'Hot Lead' : 'New';
                          await updateLead(deal.id, { stage: newStage });
                          setLeads(prev => prev.map(l => l.id === deal.id ? { ...l, stage: newStage, status: newStage } : l));
                          addToast(`Lead marked as ${newStage}`, 'success');
                        }}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        title={deal.stage === 'Hot Lead' ? "Hot Lead" : "Mark as Hot Lead"}
                      />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-655 dark:text-slate-300 font-medium">
                      {deal.createdBy}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-xs text-slate-800 dark:text-white">{deal.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{deal.phone || deal.company}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-semibold uppercase">{deal.source}</td>
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <select 
                        value={deal.stage} 
                        onChange={async (e) => {
                          const newStage = e.target.value;
                          await updateLead(deal.id, { stage: newStage });
                          setLeads(prev => prev.map(l => l.id === deal.id ? { ...l, stage: newStage, status: newStage } : l));
                          addToast(`"${deal.name}" stage updated to ${newStage}`, 'success');
                        }}
                        className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {stages.map(st => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-655 dark:text-slate-300">
                      {deal.rep}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{deal.value.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={deal.remarks}>
                      {deal.remarks || 'No remarks'}
                    </td>
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      {deal.nextFollowupDate ? (
                        <button 
                          onClick={() => handleOpenDetails(deal.id)}
                          className="text-[10px] bg-amber-55/60 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded font-bold border border-amber-200/50 hover:bg-amber-100 transition-colors"
                          title={`Next follow-up: ${deal.nextFollowupDate}`}
                        >
                          📅 {deal.nextFollowupDate}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenDetails(deal.id)}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded font-bold hover:bg-slate-200 transition-colors"
                        >
                          + Log/Schedule
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          setLeads(prev => prev.filter(l => l.id !== deal.id));
                          addToast(`Deal "${deal.name}" deleted`, 'info');
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Deal"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-xs text-slate-400 italic">
                    No deals or leads found in this pipeline stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail & Followups Drawer */}
      {selectedLeadId && selectedLead && (
        <>
          <div className="sheet-overlay animate-fade-in" onClick={() => setSelectedLeadId(null)} />
          <div className="sheet-content w-full max-w-lg p-6 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                {isEditing ? 'Edit Lead Details' : 'Lead Profile & Timeline'}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                >
                  {isEditing ? 'View Profile' : 'Edit Info'}
                </button>
                <button onClick={() => setSelectedLeadId(null)} className="btn-ghost p-1"><X size={18} /></button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEditLead} className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Lead / Contact Name *</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Company Name *</label>
                  <input type="text" value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Expected Value (₹)</label>
                  <input type="number" value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Stage</label>
                  <select value={editForm.stage} onChange={e => setEditForm({...editForm, stage: e.target.value})} className="input-field">
                    {stages.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Source</label>
                  <select value={editForm.source} onChange={e => setEditForm({...editForm, source: e.target.value})} className="input-field">
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Cold Call">Cold Call</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Assigned Agent</label>
                  <input type="text" value={editForm.assignedTo} onChange={e => setEditForm({...editForm, assignedTo: e.target.value})} className="input-field" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-outline w-full justify-center py-2 text-xs">Cancel</button>
                  <button type="submit" className="btn-primary w-full justify-center py-2 text-xs" style={{ color: '#ffffff' }}>Save Changes</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {selectedLead.name ? selectedLead.name.split(' ').map(n => n.charAt(0)).join('') : 'LD'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800 dark:text-white">{selectedLead.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{selectedLead.company}</p>
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 inline-block">
                      {selectedLead.source}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Deal Value</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">₹{(Number(selectedLead.value) || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Current Stage</span>
                    <p className="text-xs font-bold mt-0.5 text-indigo-600 dark:text-indigo-400">{selectedLead.stage}</p>
                  </div>
                </div>
                {/* Followup logs & scheduling (Only visible if lead stage is 'Follow-up') */}
                {selectedLead.stage === 'Follow-up' ? (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                      <span>Follow-Up Logs & Reminders</span>
                      <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                        {followups.length} logs
                      </span>
                    </h4>

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
                          First: {followups.length > 0 ? followups[0].followup_date : 'None yet'}
                        </span>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1">Follow-Up Remarks *</label>
                        <textarea 
                          value={newFollowupNote}
                          onChange={e => setNewFollowupNote(e.target.value)}
                          placeholder="What was discussed?" 
                          className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                          rows="2"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-1">Next Date</label>
                          <input type="date" value={nextFollowupDate} onChange={e => setNextFollowupDate(e.target.value)} className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block mb-1">Next Remarks</label>
                          <input type="text" value={nextFollowupRemarks} onChange={e => setNextFollowupRemarks(e.target.value)} placeholder="e.g. Call back" className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded" />
                        </div>
                      </div>

                      <button type="submit" className="btn-primary w-full justify-center py-2 text-xs font-bold cursor-pointer">
                        Log Follow-Up & Schedule
                      </button>
                    </form>

                    {/* List of followups */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {loadingFollowups ? (
                        <p className="text-[10px] text-slate-400 italic">Loading...</p>
                      ) : followups.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No follow-ups logged yet.</p>
                      ) : (
                        followups.slice().reverse().map((item, index) => {
                          const logNum = followups.length - index;
                          return (
                            <div key={item.id || index} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-xl relative shadow-xs">
                              <span className="absolute top-2 right-2 text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-1 rounded uppercase font-bold">
                                {item.followup_type}
                              </span>
                              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                {logNum === 1 ? 'First Follow-Up' : `${logNum}th Follow-Up`}
                              </p>
                              <p className="text-[9px] text-slate-400">{item.followup_date} • {item.created_by || 'Agent'}</p>
                              <p className="text-xs text-slate-655 dark:text-slate-305 mt-1 italic">"{item.remarks}"</p>
                              {item.next_followup_date && (
                                <div className="mt-2 text-[9px] text-amber-600 dark:text-amber-400 font-semibold border-t border-dashed dark:border-slate-800 pt-1">
                                  📅 Next: {item.next_followup_date} {item.next_followup_remarks && `(${item.next_followup_remarks})`}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400 italic">
                    Follow-up forms are only active when the lead stage is set to "Follow-up".
                  </div>
                )}

                {/* Activity & Audit Logs */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850/80">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>Activity History & Audit Logs</span>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                      {auditLogs.length} changes
                    </span>
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {loadingAuditLogs ? (
                      <p className="text-[10px] text-slate-400 italic">Loading activity history...</p>
                    ) : auditLogs.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No activity recorded yet.</p>
                    ) : (
                      auditLogs.map((log) => {
                        // Convert UTC time to Indian Standard Time (IST)
                        // Indian timezone offset is UTC+5:30
                        const utcDate = new Date(log.changed_at);
                        const istOptions = {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        };
                        const istTimeString = utcDate.toLocaleString('en-IN', istOptions);

                        // Format column name to friendly text
                        const fieldNameMap = {
                          full_name: 'Name',
                          email: 'Email',
                          phone_primary: 'Phone',
                          company_name: 'Company',
                          lead_source: 'Source',
                          lead_status: 'Status/Stage',
                          lead_score: 'Score',
                          assigned_agent_id: 'Assigned Agent',
                          deal_value_expected: 'Expected Income'
                        };
                        const friendlyField = fieldNameMap[log.field_name] || log.field_name;

                        return (
                          <div key={log.id} className="p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-xl relative text-[11px]">
                            <p className="font-semibold text-slate-705 dark:text-slate-200">
                              Updated <span className="text-indigo-600 dark:text-indigo-400 font-bold">{friendlyField}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              From: <span className="italic">"{log.old_value || 'None'}"</span> → To: <span className="font-semibold">"{log.new_value || 'None'}"</span>
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                              <span>By: {log.changed_by || 'System/Admin'}</span>
                              <span className="text-amber-600 dark:text-amber-500 font-bold">🇮🇳 {istTimeString}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Deal Modal */}
      {showCreateModal && (
        <>
          <div className="sheet-overlay" onClick={() => setShowCreateModal(false)} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Create New Sales Deal</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateDealSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold mb-1 block">Deal Name *</label><input type="text" value={newDeal.name} onChange={e => setNewDeal({...newDeal, name: e.target.value})} className="input-field" placeholder="e.g. Acme Enterprise Deal" required /></div>
              <div><label className="text-xs font-semibold mb-1 block">Company Name *</label><input type="text" value={newDeal.company} onChange={e => setNewDeal({...newDeal, company: e.target.value})} className="input-field" placeholder="e.g. Acme Corp" required /></div>
              <div><label className="text-xs font-semibold mb-1 block">Deal Value (₹) *</label><input type="number" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: e.target.value})} className="input-field" placeholder="Deal Amount" required /></div>
              
              <div><label className="text-xs font-semibold mb-1 block">Currency</label>
                <select value={newDeal.currency} onChange={e => setNewDeal({...newDeal, currency: e.target.value})} className="input-field">
                  <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Pipeline</label>
                <select value={newDeal.pipeline} onChange={e => setNewDeal({...newDeal, pipeline: e.target.value})} className="input-field">
                  <option value="Sales">Sales Pipeline</option><option value="Partner">Partner Pipeline</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Stage</label>
                <select value={newDeal.stage} onChange={e => setNewDeal({...newDeal, stage: e.target.value})} className="input-field">
                  <option value="New">New Lead</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Hot Lead">Hot Lead</option>
                  <option value="Proposal">Proposal Sent</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Probability (%)</label><input type="number" value={newDeal.probability} onChange={e => setNewDeal({...newDeal, probability: e.target.value})} className="input-field" placeholder="50" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Expected Closing Date</label><input type="date" value={newDeal.expectedClosingDate} onChange={e => setNewDeal({...newDeal, expectedClosingDate: e.target.value})} className="input-field" /></div>

              <div><label className="text-xs font-semibold mb-1 block">Assigned User</label><input type="text" value={newDeal.assignedTo} onChange={e => setNewDeal({...newDeal, assignedTo: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Deal Source</label>
                <select value={newDeal.source} onChange={e => setNewDeal({...newDeal, source: e.target.value})} className="input-field">
                  <option>Website</option><option>LinkedIn</option><option>Referral</option><option>Google Ads</option><option>WhatsApp</option><option>Cold Call</option>
                </select>
              </div>

              <div><label className="text-xs font-semibold mb-1 block">Product Name</label><input type="text" value={newDeal.products} onChange={e => setNewDeal({...newDeal, products: e.target.value})} className="input-field" placeholder="e.g. CRM Software Licences" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Quantity</label><input type="number" value={newDeal.quantity} onChange={e => setNewDeal({...newDeal, quantity: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Discount (₹)</label><input type="number" value={newDeal.discount} onChange={e => setNewDeal({...newDeal, discount: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Tax (%)</label><input type="number" value={newDeal.tax} onChange={e => setNewDeal({...newDeal, tax: e.target.value})} className="input-field" /></div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Description</label>
                <textarea rows="2" value={newDeal.description} onChange={e => setNewDeal({...newDeal, description: e.target.value})} className="input-field" placeholder="Describe deal details..."></textarea>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Notes</label>
                <textarea rows="2" value={newDeal.notes} onChange={e => setNewDeal({...newDeal, notes: e.target.value})} className="input-field" placeholder="Internal remarks..."></textarea>
              </div>

              <div className="col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline w-full justify-center py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary w-full justify-center py-2 text-xs" style={{ color: '#ffffff' }}>Create Deal</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
