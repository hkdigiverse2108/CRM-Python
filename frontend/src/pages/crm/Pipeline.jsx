import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import { X } from 'lucide-react';

export default function Pipeline() {
  const { 
    addToast, leads = [], setLeads, 
    fetchLeadFollowups, createLeadFollowup, updateLead 
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
  };

  const deals = leads.map(l => ({
    id: l.id,
    stage: l.stage || 'New',
    name: l.name || `Deal - ${l.company}`,
    company: l.company || l.name,
    value: Number(l.value) || 0,
    source: l.source || 'Website',
    score: l.score || 50,
    rep: l.assignedTo || 'Rep',
    days: 1,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEtKQPcmT818U7NmXsWLGpg--sLLoaJj2Yaz93EJ82OVS_5FOwnn0zFQ02baKg2BhT7ej6Cowz8PIcDuuuBv7C3lA0ik_xqtGYHPGn_q1bmwZw2DIXcO4V5MIfimYx1BySVkSIPuZk5AO29v6pEJuoFAjn5t2h1yZ8uDCibDtiILbrdPu98-piyswq_emYdnWrOsHsx5Ue5KO0layy4JM14MpLatfVgmZmRzj_78-7u_JBXoqwGQvpA__RhwocMYEQv58UVsHiZ6w',
    probability: l.stage === 'Won' ? 100 : l.stage === 'Lost' ? 0 : 70,
    hot: l.value >= 500000
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
      <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar shrink-0 bg-white/50 dark:bg-slate-900/10 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850/80">
        <button
          onClick={() => setSelectedStageFilter('All')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedStageFilter === 'All'
              ? 'bg-indigo-650 text-white shadow-md'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-705'
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-650 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-705'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
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
                <th className="py-4 px-5">Deal & Company</th>
                <th className="py-4 px-5">Stage</th>
                <th className="py-4 px-5">Value (₹)</th>
                <th className="py-4 px-5">Assigned Agent</th>
                <th className="py-4 px-5">Source</th>
                <th className="py-4 px-5">Score / Prob.</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredDeals.length > 0 ? (
                filteredDeals.map(deal => (
                  <tr 
                    key={deal.id} 
                    onClick={() => handleOpenDetails(deal.id)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-5">
                      <div className="font-bold text-xs text-slate-800 dark:text-white">{deal.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{deal.company}</div>
                    </td>
                    <td className="py-4 px-5" onClick={e => e.stopPropagation()}>
                      <select 
                        value={deal.stage} 
                        onChange={(e) => {
                          setLeads(prev => prev.map(l => l.id === deal.id ? { ...l, stage: e.target.value } : l));
                          addToast(`"${deal.name}" stage updated to ${e.target.value}`, 'success');
                        }}
                        className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {stages.map(st => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{deal.value.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <img alt="Rep" className="w-5 h-5 rounded-full" src={deal.avatar} />
                        <span className="text-xs text-slate-655 dark:text-slate-300">{deal.rep}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-[11px] text-slate-500 font-semibold uppercase">{deal.source}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">
                          Score: {deal.score}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {deal.probability}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
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
                  <td colSpan="7" className="py-10 text-center text-xs text-slate-400 italic">
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
                    <p className="text-xs font-bold mt-0.5 text-indigo-650 dark:text-indigo-400">{selectedLead.stage}</p>
                  </div>
                </div>

                {/* Followup logs & scheduling */}
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

                    <button type="submit" className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer">
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
