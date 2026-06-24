import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import { X } from 'lucide-react';

export default function Pipeline() {
  const { addToast, leads = [], setLeads } = useApp();
  const [search, setSearch] = useState('');
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

  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (stageId) => {
    if (!draggedId) return;
    setLeads(prev => prev.map(l => l.id === draggedId ? { ...l, stage: stageId } : l));
    const targetLead = leads.find(l => l.id === draggedId);
    const dealName = targetLead?.company || targetLead?.name || 'Lead';
    addToast(`"${dealName}" moved to ${stageId}`);
    setDraggedId(null);
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

  const filteredDeals = deals.filter(d => 
    (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.company || '').toLowerCase().includes(search.toLowerCase())
  );

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
      <PageHeader title="Sales Pipeline" subtitle={`${stages.length} Deal Stages • Drag & drop to manage deals`}>
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

      {/* Kanban Scroll Area */}
      <div className="overflow-x-auto pb-6 custom-scrollbar">
        <div className="flex gap-6 h-full items-start">
          {stages.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div 
                key={stage.id} 
                className="flex flex-col gap-4 min-w-[320px] max-w-[320px] shrink-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></div>
                    <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">{stage.name}</h3>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-on-surface-variant">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-label-sm font-bold text-on-surface-variant">₹{totalValue.toLocaleString('en-IN')}</span>
                </div>

                {/* Cards Container */}
                <div className="space-y-4 min-h-[500px] bg-slate-50/50 dark:bg-slate-900/10 p-2 rounded-2xl border border-dashed border-outline-variant/30">
                  {stageDeals.length > 0 ? (
                    stageDeals.map(deal => (
                      <div 
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                        className={`glass-card p-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group ${
                          deal.hot ? 'border-2 border-secondary/30 ring-2 ring-secondary/10 bg-gradient-to-br from-white to-purple-500/5 dark:from-slate-900 dark:to-purple-950/5' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          {deal.stage === 'Won' ? (
                            <span className="bg-emerald-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">WON</span>
                          ) : deal.stage === 'Lost' ? (
                            <span className="bg-red-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">LOST</span>
                          ) : deal.hot ? (
                            <span className="bg-secondary text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">HIGH VALUE</span>
                          ) : (
                            <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                              Score: {deal.score}
                            </span>
                          )}
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded">
                            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                          </button>
                        </div>
                        <h4 className="text-body-sm font-bold text-on-surface mb-1">{deal.name}</h4>
                        <p className="text-[12px] text-on-surface-variant mb-4">{deal.company}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                          <div className="flex items-center gap-2">
                            <img 
                              alt="Rep Avatar" 
                              className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" 
                              src={deal.avatar}
                            />
                            <span className="text-[10px] font-bold text-on-surface-variant">{deal.rep}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-label-md font-bold text-primary">₹{deal.value.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-on-surface-variant">{deal.days} day in stage</p>
                          </div>
                        </div>

                        {(deal.stage !== 'Won' && deal.stage !== 'Lost') && (
                          <div className="mt-3">
                            <div className="bg-slate-100 dark:bg-slate-800 h-1.5 w-full rounded-full overflow-hidden">
                              <div className="bg-[#805ad5] h-full w-[85%] rounded-full shadow-sm" style={{ width: `${deal.probability}%` }}></div>
                            </div>
                            <p className="text-[10px] text-secondary font-bold mt-1 text-right">{deal.probability}% probability</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[10px] text-on-surface-variant py-10 border border-dashed border-outline-variant/50 rounded-xl">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
