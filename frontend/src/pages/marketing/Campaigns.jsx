import { useState, useEffect, useCallback } from 'react';
import { useApp, getTenantId } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import { Loader2, RefreshCw } from 'lucide-react';

export default function Campaigns() {
  const { campaigns, setCampaigns, addCampaign, addToast, token, tenantId } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreate, setShowCreate] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const [metaAdAccounts, setMetaAdAccounts] = useState([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState('');
  const [adInsights, setAdInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const fetchAdAccounts = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingAccounts(true);
      const resp = await fetch(`${API_BASE}/meta/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId() || '96722',
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.data?.platforms?.meta_ads?.assets) {
          const accounts = data.data.platforms.meta_ads.assets;
          setMetaAdAccounts(accounts);
          if (accounts.length > 0) {
            setSelectedAdAccount(accounts[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching ad accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, [token, tenantId]);

  const fetchInsights = useCallback(async (accountId) => {
    if (!accountId || !token) return;
    try {
      setLoadingInsights(true);
      const resp = await fetch(`${API_BASE}/meta/ads/insights?ad_account_id=${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || getTenantId() || '96722',
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setAdInsights(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching ad insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    if (activeTab === 'meta-ads') {
      fetchAdAccounts();
    }
  }, [activeTab, fetchAdAccounts]);

  useEffect(() => {
    if (selectedAdAccount) {
      fetchInsights(selectedAdAccount);
    }
  }, [selectedAdAccount, fetchInsights]);

  const [newCamp, setNewCamp] = useState({
    id: '',
    name: '',
    channel: 'WhatsApp',
    segment: 'All Leads',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'Scheduled',
    totalSent: '',
    delivered: '',
    opened: '',
    clicked: '',
    conversionRate: ''
  });

  const handleCreateCampaign = () => {
    if (!newCamp.name) return;
    const cmp = {
      name: newCamp.name,
      channel: newCamp.channel,
      segment: newCamp.segment,
      budget: Number(newCamp.budget) || 0,
      startDate: newCamp.startDate || new Date().toISOString().split('T')[0],
      endDate: newCamp.endDate || '',
      status: newCamp.status || 'Scheduled',
      totalSent: Number(newCamp.totalSent) || 0,
      delivered: Number(newCamp.delivered) || 0,
      opened: Number(newCamp.opened) || 0,
      clicked: Number(newCamp.clicked) || 0,
      conversionRate: Number(newCamp.conversionRate) || 0
    };

    if (newCamp.id) {
      cmp.id = newCamp.id;
    }

    addCampaign(cmp);
    setShowCreate(false);
    setNewCamp({
      id: '',
      name: '',
      channel: 'WhatsApp',
      segment: 'All Leads',
      budget: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'Scheduled',
      totalSent: '',
      delivered: '',
      opened: '',
      clicked: '',
      conversionRate: ''
    });
  };

  const handleLaunch = (id, name) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'Active', totalSent: 5000, clicked: 800, conversionRate: 3 } : c));
    addToast(`Campaign "${name}" launched successfully!`);
  };

  return (
    <div className="text-on-surface">
      {/* Campaign header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-3 mb-6">
        <PageHeader title="Campaign Center" subtitle="Create and manage marketing campaigns across channels" />
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            <button onClick={() => { setActiveTab('dashboard'); }} className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary font-bold' : 'text-slate-500'}`}>Dashboard</button>
            <button onClick={() => { setActiveTab('segments'); }} className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === 'segments' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary font-bold' : 'text-slate-500'}`}>Audience Segments</button>
            <button onClick={() => { setActiveTab('meta-ads'); }} className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === 'meta-ads' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary font-bold' : 'text-slate-500'}`}>Meta Ads Manager</button>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary py-1.5 px-3.5 text-xs rounded-xl flex items-center gap-1.5 shadow hover:opacity-90">
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-label-sm font-bold">+0%</span>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Budget Allocated</p>
              <p className="text-lg font-bold text-on-surface">₹{campaigns.reduce((acc, c) => acc + c.budget, 0).toLocaleString()}</p>
            </div>

            <div className="glass-card p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-secondary/10 p-3 rounded-lg flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-label-sm font-bold">+0%</span>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Campaign Reach</p>
              <p className="text-lg font-bold text-on-surface">{campaigns.reduce((acc, c) => acc + (Number(c.totalSent) || Number(c.reach) || 0), 0).toLocaleString()}</p>
            </div>

            <div className="glass-card p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-tertiary-container/15 p-3 rounded-lg flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">mouse</span>
                </div>
                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-label-sm font-bold">+0%</span>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Avg Click Rate</p>
              <p className="text-lg font-bold text-on-surface">
                {campaigns.length > 0
                  ? (campaigns.reduce((acc, c) => {
                      const sent = Number(c.totalSent) || Number(c.reach) || 0;
                      const clicks = Number(c.clicked) || Number(c.clicks) || 0;
                      return acc + (sent ? (clicks / sent) * 100 : 0);
                    }, 0) / campaigns.length).toFixed(1)
                  : '0.0'}%
              </p>
            </div>

            <div className="glass-card p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-label-sm font-bold">+0%</span>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Avg Conversion Rate</p>
              <p className="text-lg font-bold text-on-surface">
                {campaigns.length > 0
                  ? (campaigns.reduce((acc, c) => acc + (Number(c.conversionRate) || 0), 0) / campaigns.length).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden rounded-xl border border-outline-variant">
            <div className="px-6 py-4 border-b border-outline-variant bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-headline-sm font-bold text-on-surface">Active Campaigns</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-semibold text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/20 border-b border-outline-variant/60">
                  <tr>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Campaign Detail</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Channel</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Audience Segment</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Performance Stats</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Cost Budget</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Status</th>
                    <th className="px-6 py-3 text-label-md text-on-surface-variant font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {campaigns.map((camp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-body-sm text-on-surface">{camp.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {camp.id} • Start: {camp.startDate || 'Immediate'} • End: {camp.endDate || 'Ongoing'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-xs">
                          <span className="material-symbols-outlined text-primary text-base">
                            {camp.channel === 'WhatsApp' ? 'chat_bubble' : camp.channel === 'Email' ? 'mail' : 'sms'}
                          </span>
                          <span className="font-bold">{camp.channel}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface">{camp.segment}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[10px] font-bold text-on-surface-variant">
                          <div className="flex gap-2">
                            <span>Sent: {(camp.totalSent || camp.reach || 0).toLocaleString()}</span>
                            <span>Delivered: {(camp.delivered || 0).toLocaleString()}</span>
                            <span>Opened: {(camp.opened || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <span>Clicked: {(camp.clicked || camp.clicks || 0).toLocaleString()}</span>
                            <span>Conv. Rate: {camp.conversionRate || 0}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface">₹{camp.budget.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold ${
                          camp.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                          camp.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {camp.status === 'Scheduled' ? (
                          <button 
                            onClick={() => handleLaunch(camp.id, camp.name)}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">send</span>
                            Launch Now
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Launched</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { name: 'High-Value Enterprise Customers', criteria: 'Deal Value >= ₹10L', count: 0, users: [] },
            { name: 'Retail Lead Segment', criteria: 'Company contains "Retail"', count: 0, users: [] },
            { name: 'Cold Re-engagement list', criteria: 'Stage is Contacted, Last activity > 15 days', count: 0, users: [] }
          ].map((seg, idx) => (
            <div key={idx} className="glass-card p-6 rounded-xl flex flex-col justify-between gap-4">
              <div>
                <span className="text-[9px] font-bold text-[#805ad5] uppercase tracking-wider">Segment {idx + 1}</span>
                <h3 className="font-bold text-xs text-on-surface mt-1">{seg.name}</h3>
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-outline-variant/30 rounded-xl text-[11px] text-on-surface-variant font-medium">
                  <span className="font-bold text-on-surface">Criteria:</span> {seg.criteria}
                </div>
                <div className="mt-4 space-y-1 text-xs">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sample Targets</p>
                  <p className="font-bold text-on-surface">{seg.users.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 text-[11px]">
                <span className="font-bold text-on-surface-variant">{seg.count} Active Contacts</span>
                <button 
                  onClick={() => addToast(`Broadcasting campaign to ${seg.name}`)}
                  className="text-primary font-bold hover:underline"
                >
                  Launch Broadcast
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'meta-ads' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Ad Account:</label>
              {loadingAccounts ? (
                <Loader2 className="animate-spin text-primary" size={16} />
              ) : (
                <select
                  value={selectedAdAccount}
                  onChange={(e) => setSelectedAdAccount(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                >
                  {metaAdAccounts.length === 0 ? (
                    <option value="">No Ad Accounts Connected</option>
                  ) : (
                    metaAdAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.id})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <button
              onClick={() => {
                if (selectedAdAccount) fetchInsights(selectedAdAccount);
              }}
              disabled={loadingInsights}
              className="btn-outline py-1.5 px-3 text-xs rounded-xl flex items-center gap-1.5"
            >
              {loadingInsights ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
              Refresh Insights
            </button>
          </div>

          {loadingInsights ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-xs text-slate-400 font-medium">Fetching campaign insights from Meta Graph API...</p>
            </div>
          ) : adInsights.length === 0 ? (
            <div className="glass-card p-10 text-center text-xs text-slate-400 font-semibold rounded-xl border border-slate-200 dark:border-slate-800">
              No active campaigns or insights found in the last 30 days for this account.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aggregated stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-5 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Spend</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    ₹{adInsights.reduce((sum, item) => sum + parseFloat(item.spend || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
                <div className="glass-card p-5 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Impressions</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {adInsights.reduce((sum, item) => sum + parseInt(item.impressions || 0, 10), 0).toLocaleString()}
                  </p>
                </div>
                <div className="glass-card p-5 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Average CTR</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {(adInsights.reduce((sum, item) => sum + parseFloat(item.ctr || 0), 0) / adInsights.length * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="glass-card p-5 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Average CPC</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    ₹{(adInsights.reduce((sum, item) => sum + parseFloat(item.cpc || 0), 0) / adInsights.length).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Table of campaigns */}
              <div className="glass-card overflow-hidden rounded-xl border border-outline-variant">
                <div className="px-6 py-4 border-b border-outline-variant bg-slate-50/50 dark:bg-slate-800/40">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Facebook Campaign Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-semibold text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/20 border-b border-outline-variant/60">
                      <tr>
                        <th className="px-6 py-3 text-slate-500 font-bold">Campaign Detail</th>
                        <th className="px-6 py-3 text-slate-500 font-bold">Impressions</th>
                        <th className="px-6 py-3 text-slate-500 font-bold">Clicks</th>
                        <th className="px-6 py-3 text-slate-500 font-bold">CTR</th>
                        <th className="px-6 py-3 text-slate-500 font-bold">CPC</th>
                        <th className="px-6 py-3 text-slate-500 font-bold">Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {adInsights.map((camp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-white">{camp.campaign_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{camp.campaign_id}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            {parseInt(camp.impressions || 0, 10).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            {parseInt(camp.clicks || 0, 10).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            {(parseFloat(camp.ctr || 0) * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            ₹{parseFloat(camp.cpc || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                            ₹{parseFloat(camp.spend || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Create Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-1"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Campaign Name *</label>
                  <input 
                    type="text" 
                    value={newCamp.name} 
                    onChange={e => setNewCamp({...newCamp, name: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="e.g. Q2 Product Update Blast" 
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Campaign ID</label>
                  <input 
                    type="text" 
                    value={newCamp.id} 
                    onChange={e => setNewCamp({...newCamp, id: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="Auto-generated" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Channel / Type</label>
                  <select 
                    value={newCamp.channel} 
                    onChange={e => setNewCamp({...newCamp, channel: e.target.value})} 
                    className="input-field text-xs"
                  >
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>SMS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Target Segment</label>
                  <select 
                    value={newCamp.segment} 
                    onChange={e => setNewCamp({...newCamp, segment: e.target.value})} 
                    className="input-field text-xs"
                  >
                    <option>All Leads</option>
                    <option>High-Value Enterprise Customers</option>
                    <option>Retail Lead Segment</option>
                    <option>Cold Re-engagement list</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Cost Budget (₹)</label>
                  <input 
                    type="number" 
                    value={newCamp.budget} 
                    onChange={e => setNewCamp({...newCamp, budget: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="Budget allocation" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Start Date</label>
                  <input 
                    type="date" 
                    value={newCamp.startDate} 
                    onChange={e => setNewCamp({...newCamp, startDate: e.target.value})} 
                    className="input-field text-xs" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">End Date</label>
                  <input 
                    type="date" 
                    value={newCamp.endDate} 
                    onChange={e => setNewCamp({...newCamp, endDate: e.target.value})} 
                    className="input-field text-xs" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Status</label>
                  <select 
                    value={newCamp.status} 
                    onChange={e => setNewCamp({...newCamp, status: e.target.value})} 
                    className="input-field text-xs"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Total Sent</label>
                  <input 
                    type="number" 
                    value={newCamp.totalSent} 
                    onChange={e => setNewCamp({...newCamp, totalSent: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Delivered</label>
                  <input 
                    type="number" 
                    value={newCamp.delivered} 
                    onChange={e => setNewCamp({...newCamp, delivered: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Opened</label>
                  <input 
                    type="number" 
                    value={newCamp.opened} 
                    onChange={e => setNewCamp({...newCamp, opened: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Clicked</label>
                  <input 
                    type="number" 
                    value={newCamp.clicked} 
                    onChange={e => setNewCamp({...newCamp, clicked: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Conversion Rate %</label>
                  <input 
                    type="number" 
                    value={newCamp.conversionRate} 
                    onChange={e => setNewCamp({...newCamp, conversionRate: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="0.0%" 
                  />
                </div>
              </div>
              <button 
                onClick={handleCreateCampaign}
                className="btn-primary w-full justify-center text-xs py-2.5 font-bold uppercase tracking-wider mt-4"
              >
                Create & Save Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
