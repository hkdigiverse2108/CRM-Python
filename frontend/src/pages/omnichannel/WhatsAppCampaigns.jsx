import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, RefreshCw, Send, Play, BarChart2, Trash2, Calendar, CheckCircle2, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Campaigns() {
  const { campaigns = [], addCampaign, deleteCampaign, addToast } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const [newCamp, setNewCamp] = useState({
    name: '',
    template: 'hello_world',
    target: 'All Contacts',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Scheduled',
  });

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!newCamp.name) return;
    
    addCampaign({
      id: `camp_${Date.now().toString().slice(-6)}`,
      name: newCamp.name,
      template: newCamp.template,
      target: newCamp.target,
      startDate: newCamp.startDate,
      status: newCamp.status,
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      conversionRate: 0,
      budget: 0,
      channel: 'WhatsApp',
      segment: newCamp.target
    });

    setShowCreate(false);
    setNewCamp({
      name: '',
      template: 'hello_world',
      target: 'All Contacts',
      startDate: new Date().toISOString().split('T')[0],
      status: 'Scheduled',
    });
    addToast('Campaign created successfully!', 'success');
  };

  const handleDeleteCampaign = (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
      addToast('Campaign deleted.', 'info');
    }
  };

  const displayCampaigns = campaigns.length > 0 ? campaigns : [
    { id: '1', name: 'Product Feedback Survey', template: 'feedback_msg', target: 'VIP Customers', startDate: '2026-06-15', status: 'Scheduled', totalSent: 0, delivered: 0 },
    { id: '2', name: 'Abandoned Cart Recovery Blast', template: 'abandoned_cart', target: 'Abandoned Carts', startDate: '2026-06-16', status: 'Scheduled', totalSent: 0, delivered: 0 },
  ];

  const activeRunning = displayCampaigns.filter(c => c.status === 'Active' || c.status === 'Running').length;
  const scheduled = displayCampaigns.filter(c => c.status === 'Scheduled').length;
  const completed = displayCampaigns.filter(c => c.status === 'Completed').length;
  const totalSent = displayCampaigns.reduce((acc, c) => acc + (Number(c.totalSent) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Blast Campaigns</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Launch marketing campaigns and track delivery metrics.
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(true)} 
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-450 uppercase tracking-wider block font-bold">Active Running</span>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{activeRunning}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Play size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-450 uppercase tracking-wider block font-bold">Scheduled</span>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{scheduled}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-450 uppercase tracking-wider block font-bold">Completed</span>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{completed}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-450 uppercase tracking-wider block font-bold">Total Sent</span>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalSent}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BarChart2 size={20} />
          </div>
        </div>
      </div>

      {/* Campaigns Log Table container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-bold text-slate-800 dark:text-white">Campaigns Log</h2>
          <button onClick={() => addToast('Refreshing campaigns log')} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
          <table className="data-table">
            <thead>
              <tr>
                <th>CAMPAIGN NAME</th>
                <th>TEMPLATE</th>
                <th>TARGET</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>DELIVERY</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayCampaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="font-bold text-xs text-slate-800 dark:text-white">{camp.name}</td>
                  <td className="font-mono text-xs text-slate-500">{camp.template || 'hello_world'}</td>
                  <td className="text-xs text-slate-650 dark:text-slate-300">{camp.target || camp.segment || 'All Contacts'}</td>
                  <td className="font-mono text-xs text-slate-500">{camp.startDate}</td>
                  <td>
                    <span className={`badge text-[9px] ${
                      camp.status === 'Active' || camp.status === 'Running' ? 'badge-success' :
                      camp.status === 'Completed' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td>
                    <div className="text-[10px] text-slate-450 font-semibold space-y-0.5">
                      <p>Sent: {camp.totalSent || 0}</p>
                      <p className="text-emerald-600">Delivered: {camp.delivered || 0}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => addToast(`Viewing analytics for ${camp.name}`)} 
                        className="text-xs text-indigo-500 hover:underline font-bold"
                      >
                        Analytics
                      </button>
                      <span className="text-slate-300">|</span>
                      <button 
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="text-xs text-red-500 hover:text-red-650 font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreate(false)} />
          <div className="modal-content w-full max-w-md p-6 bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Create New Blast Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5 block">Campaign Name *</label>
                <input 
                  type="text" 
                  value={newCamp.name} 
                  onChange={e => setNewCamp({...newCamp, name: e.target.value})} 
                  className="input-field text-xs" 
                  placeholder="e.g. Festival Offer Blast" 
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5 block">WhatsApp Template</label>
                <select 
                  value={newCamp.template} 
                  onChange={e => setNewCamp({...newCamp, template: e.target.value})} 
                  className="input-field text-xs"
                >
                  <option value="hello_world">hello_world (Utility)</option>
                  <option value="welcome_user">welcome_user (Marketing)</option>
                  <option value="testing">testing (Marketing)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5 block">Target Segment</label>
                <select 
                  value={newCamp.target} 
                  onChange={e => setNewCamp({...newCamp, target: e.target.value})} 
                  className="input-field text-xs"
                >
                  <option value="All Contacts">All Contacts</option>
                  <option value="VIP Customers">VIP Customers</option>
                  <option value="Leads">Leads Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5 block">Start Date</label>
                <input 
                  type="date" 
                  value={newCamp.startDate} 
                  onChange={e => setNewCamp({...newCamp, startDate: e.target.value})} 
                  className="input-field text-xs" 
                />
              </div>

              <button 
                type="submit"
                className="btn-primary w-full justify-center text-xs py-2.5 font-bold uppercase tracking-wider mt-4"
              >
                Create Campaign
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
