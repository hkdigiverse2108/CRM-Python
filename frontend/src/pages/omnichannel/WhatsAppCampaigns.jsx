import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, RefreshCw, Send, Play, BarChart2, Trash2, Calendar, CheckCircle2, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Campaigns() {
  const { campaigns = [], addCampaign, deleteCampaign, addToast } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // all, tags

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
      target: targetAudience === 'all' ? 'All Contacts' : 'Filter by Tags',
      startDate: newCamp.startDate,
      status: newCamp.status,
      totalSent: 9, // dummy count matching the screenshot
      delivered: 0,
      opened: 0,
      clicked: 0,
      conversionRate: 0,
      budget: 0,
      channel: 'WhatsApp',
      segment: targetAudience === 'all' ? 'All Contacts' : 'Filter by Tags'
    });

    setShowCreate(false);
    setNewCamp({
      name: '',
      template: 'hello_world',
      target: 'All Contacts',
      startDate: new Date().toISOString().split('T')[0],
      status: 'Scheduled',
    });
    setTargetAudience('all');
    addToast('Campaign created successfully!', 'success');
  };

  const handleDeleteCampaign = (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
      addToast('Campaign deleted.', 'info');
    }
  };

  const displayCampaigns = campaigns.length > 0 ? campaigns : [
    { id: '1', name: 'cvbnm', template: 'werty', target: 'All Contacts', startDate: '18 Jun 2026, 03:11 PM', status: 'Completed', totalSent: 9, delivered: 0 },
    { id: '2', name: 'Festival Offer Blast', template: 'hello_world', target: 'All Contacts', startDate: '20 Jun 2026, 10:00 AM', status: 'Scheduled', totalSent: 0, delivered: 0 }
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
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
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
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-605 dark:text-emerald-400 flex items-center justify-center">
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
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#00a884]/10 text-[#00a884] flex items-center justify-center">
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
          <table className="data-table text-xs font-medium">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40">
                <th className="p-3 text-left font-bold text-slate-500">CAMPAIGN NAME</th>
                <th className="p-3 text-left font-bold text-slate-500">TEMPLATE</th>
                <th className="p-3 text-left font-bold text-slate-500">TARGET</th>
                <th className="p-3 text-left font-bold text-slate-500">DATE</th>
                <th className="p-3 text-left font-bold text-slate-500">STATUS</th>
                <th className="p-3 text-left font-bold text-slate-500">DELIVERY</th>
                <th className="p-3 text-right font-bold text-slate-500">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayCampaigns.map((camp) => (
                <tr key={camp.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-3 font-bold text-slate-800 dark:text-white">{camp.name}</td>
                  <td className="p-3 font-mono text-slate-500">{camp.template || 'hello_world'}</td>
                  <td className="p-3 text-slate-650 dark:text-slate-350">{camp.target || 'All Contacts'}</td>
                  <td className="p-3 font-mono text-slate-500">{camp.startDate}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      camp.status === 'Active' || camp.status === 'Running' || camp.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' 
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-[10px] text-slate-450 font-semibold space-y-0.5">
                      <p className="text-slate-700 dark:text-slate-300">0% <span className="text-slate-400 font-medium ml-3">0 read</span></p>
                      <p className="text-slate-400 font-normal">{camp.totalSent} sent · 0 delivered · 0 failed</p>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => addToast(`Viewing analytics for ${camp.name}`)} 
                        className="text-xs text-emerald-600 hover:text-emerald-750 hover:underline font-bold"
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

      {/* Create Campaign Modal (Matching Screenshot 2) */}
      {showCreate && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreate(false)} />
          <div className="modal-content w-full max-w-lg p-6 bg-white dark:bg-slate-900 rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">Create WhatsApp Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="space-y-5 text-xs font-semibold text-slate-700 dark:text-slate-350">
              
              {/* 1. BASIC DETAILS */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Basic Details</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Campaign Name *</label>
                  <input 
                    type="text" 
                    value={newCamp.name} 
                    onChange={e => setNewCamp({...newCamp, name: e.target.value})} 
                    className="input-field text-xs rounded-xl" 
                    placeholder="e.g. Black Friday Special Blast" 
                    required
                  />
                </div>
              </div>

              {/* 2. TARGET AUDIENCE */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Target Audience</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option 1: All Active Contacts */}
                  <div 
                    onClick={() => setTargetAudience('all')}
                    className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-3 ${
                      targetAudience === 'all'
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="targetAudience" 
                      checked={targetAudience === 'all'} 
                      onChange={() => setTargetAudience('all')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-white">All Active Contacts</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                        Send to all opted-in subscribers in the database
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Filter by Tags */}
                  <div 
                    onClick={() => setTargetAudience('tags')}
                    className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-3 ${
                      targetAudience === 'tags'
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="targetAudience" 
                      checked={targetAudience === 'tags'} 
                      onChange={() => setTargetAudience('tags')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-white">Filter by Tags</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                        Target contacts matching specific tags
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TEMPLATE SELECTION */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Template Selection</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Choose WhatsApp Template *</label>
                  <select 
                    value={newCamp.template} 
                    onChange={e => setNewCamp({...newCamp, template: e.target.value})} 
                    className="input-field text-xs rounded-xl"
                  >
                    <option value="hello_world">hello_world (Utility)</option>
                    <option value="werty">werty (Marketing)</option>
                    <option value="welcome_user">welcome_user (Marketing)</option>
                    <option value="testing">testing (Marketing)</option>
                  </select>
                </div>
              </div>

              {/* 4. SEND TIMING */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. Send Timing</h4>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 dark:text-slate-350">
                  <input 
                    type="checkbox"
                    checked={newCamp.status === 'Scheduled'}
                    onChange={(e) => setNewCamp({...newCamp, status: e.target.checked ? 'Scheduled' : 'Active'})}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Schedule for later</span>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-outline w-full justify-center py-2.5 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-[#00a884] hover:bg-[#008f70] text-white w-full justify-center py-2.5 text-xs font-bold rounded-xl border-none"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

