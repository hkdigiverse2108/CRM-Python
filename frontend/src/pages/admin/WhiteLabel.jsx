import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, Upload, Palette, Globe, FileText, Check, Shield, Briefcase, Building2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function WhiteLabel() {
  const { token, tenantId, addToast, refreshWorkspaceSettings, tasks, createTask, deleteTask } = useApp();
  const [calDate, setCalDate] = useState(new Date());
  
  const splitTime = (timeStr, defaultVal = '09:00', defaultAmpm = 'AM') => {
    if (!timeStr) return { val: defaultVal, ampm: defaultAmpm };
    const parts = timeStr.trim().split(/\s+/);
    return {
      val: parts[0] || defaultVal,
      ampm: parts[1] || defaultAmpm
    };
  };

  const [config, setConfig] = useState({
    companyName: 'AIO CRM',
    primaryColor: '#4f46e5',
    accentColor: '#8b5cf6',
    customDomain: '',
    logoUrl: '',
    companyAddress: '',
    companyGstin: '',
    companyDocs: '',
    workingDays: 26,
    loginGreeting: 'Enterprise multi-tenant customer relationship hub',
    shiftStartVal: '09:00',
    shiftStartAmpm: 'AM',
    shiftEndVal: '06:00',
    shiftEndAmpm: 'PM',
    companyPan: '',
    breakDuration: 60,
    breakStartVal: '01:00',
    breakStartAmpm: 'PM',
    breakEndVal: '02:00',
    breakEndAmpm: 'PM',
    saturdaysOff: '2,4'
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const resp = await fetch(`${API_BASE}/admin/settings`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || 'rapidmodel_corp',
          }
        });
        if (resp.ok) {
          const res = await resp.json();
          if (res.success && res.data) {
            const startSplit = splitTime(res.data.shift_start, '09:00', 'AM');
            const endSplit = splitTime(res.data.shift_end, '06:00', 'PM');
            const breakStartSplit = splitTime(res.data.break_start, '01:00', 'PM');
            const breakEndSplit = splitTime(res.data.break_end, '02:00', 'PM');

            setConfig({
              companyName: res.data.company_name || '',
              primaryColor: res.data.brand_color || '#4f46e5',
              accentColor: '#8b5cf6',
              customDomain: res.data.custom_domain || '',
              logoUrl: res.data.logo_url || '',
              companyAddress: res.data.company_address || '',
              companyGstin: res.data.company_gstin || '',
              companyDocs: res.data.company_docs || '',
              workingDays: res.data.working_days || 26,
              loginGreeting: res.data.login_greeting || 'Enterprise multi-tenant customer relationship hub',
              shiftStartVal: startSplit.val,
              shiftStartAmpm: startSplit.ampm,
              shiftEndVal: endSplit.val,
              shiftEndAmpm: endSplit.ampm,
              companyPan: res.data.company_pan || '',
              breakDuration: res.data.break_duration !== undefined ? res.data.break_duration : 60,
              breakStartVal: breakStartSplit.val,
              breakStartAmpm: breakStartSplit.ampm,
              breakEndVal: breakEndSplit.val,
              breakEndAmpm: breakEndSplit.ampm,
              saturdaysOff: res.data.saturdays_off || '2,4'
            });
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    if (token) {
      fetchSettings();
    }
  }, [token, tenantId]);

  const getShiftDuration = () => {
    try {
      const parseMins = (val, ampm) => {
        if (!val) return 0;
        const [h, m] = val.split(':').map(Number);
        let hours = h;
        if (ampm === 'PM' && h < 12) hours += 12;
        if (ampm === 'AM' && h === 12) hours = 0;
        return hours * 60 + m;
      };

      const start = parseMins(config.shiftStartVal, config.shiftStartAmpm);
      const end = parseMins(config.shiftEndVal, config.shiftEndAmpm);
      if (start !== undefined && end !== undefined) {
        let diff = end - start;
        if (diff < 0) diff += 24 * 60;
        
        const bStart = parseMins(config.breakStartVal, config.breakStartAmpm);
        const bEnd = parseMins(config.breakEndVal, config.breakEndAmpm);
        let breakMins = 60;
        if (bStart !== undefined && bEnd !== undefined) {
          breakMins = bEnd - bStart;
          if (breakMins < 0) breakMins += 24 * 60;
        }

        const netMins = Math.max(0, diff - breakMins);
        const hrs = Math.floor(netMins / 60);
        const mins = netMins % 60;
        return `${hrs} hrs ${mins} mins (net of ${breakMins} mins break)`;
      }
    } catch (e) {}
    return null;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${API_BASE}/leaves/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || 'rapidmodel_corp',
        },
        body: formData
      });
      const data = await resp.json();
      if (data.success && data.data?.url) {
        setConfig(prev => ({ ...prev, logoUrl: data.data.url }));
        addToast('Logo uploaded successfully', 'success');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Logo upload failed', 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfCalMonth = new Date(calYear, calMonth, 1).getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevCalMonth = (e) => {
    e.preventDefault();
    setCalDate(new Date(calYear, calMonth - 1, 1));
  };
  const nextCalMonth = (e) => {
    e.preventDefault();
    setCalDate(new Date(calYear, calMonth + 1, 1));
  };

  const handleToggleSaturday = async (e, dateStr, existingEvent) => {
    e.preventDefault();
    if (existingEvent) {
      try {
        await deleteTask(existingEvent.id);
        addToast('Saturday Off removed successfully', 'success');
      } catch (err) {
        addToast('Failed to remove Saturday Off', 'error');
      }
    } else {
      try {
        await createTask({
          title: 'Saturday Off',
          type: 'Holiday',
          startDate: dateStr,
          dueDate: dateStr,
          status: 'Done',
          priority: 'Low',
          assignee: 'All Employees',
          project: 'General',
          description: 'Saturday Weekly Off'
        });
        addToast('Saturday Off added successfully', 'success');
      } catch (err) {
        addToast('Failed to add Saturday Off', 'error');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resp = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || 'rapidmodel_corp',
        },
        body: JSON.stringify({
          company_name: config.companyName,
          custom_domain: config.customDomain || null,
          logo_url: config.logoUrl || null,
          brand_color: config.primaryColor || null,
          company_address: config.companyAddress || null,
          company_gstin: config.companyGstin || null,
          company_docs: config.companyDocs || null,
          working_days: parseInt(config.workingDays) || 26,
          login_greeting: config.loginGreeting || 'Enterprise multi-tenant customer relationship hub',
          shift_start: `${config.shiftStartVal} ${config.shiftStartAmpm}`,
          shift_end: `${config.shiftEndVal} ${config.shiftEndAmpm}`,
          company_pan: config.companyPan || null,
          break_duration: parseInt(config.breakDuration) || 60,
          break_start: `${config.breakStartVal} ${config.breakStartAmpm}`,
          break_end: `${config.breakEndVal} ${config.breakEndAmpm}`,
          saturdays_off: config.saturdaysOff || '2,4'
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        addToast('Workspace settings updated successfully!', 'success');
        refreshWorkspaceSettings();
        try {
          const channel = new BroadcastChannel('crm-auth-channel');
          channel.postMessage({ type: 'REFRESH_PROFILE' });
          channel.close();
        } catch (e) {
          console.error(e);
        }
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Workspace Settings & Branding" subtitle="Customize company profile, brand logo, identity assets and payroll parameters" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form Settings */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-card p-5 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Palette size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Brand Identity Setup</h2>
                <p className="text-[10px] text-slate-400">Configure client-facing company names, logo, and brand color palette.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company / Business Name</label>
                  <input 
                    type="text" 
                    value={config.companyName} 
                    onChange={e => setConfig({...config, companyName: e.target.value})} 
                    className="input-field text-xs py-1.5" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Custom Domain Address</label>
                  <input 
                    type="text" 
                    value={config.customDomain} 
                    onChange={e => setConfig({...config, customDomain: e.target.value})} 
                    className="input-field text-xs py-1.5" 
                    placeholder="e.g. crm.yourbrand.com" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Custom Login Greeting / Subtitle</label>
                <input 
                  type="text" 
                  value={config.loginGreeting} 
                  onChange={e => setConfig({...config, loginGreeting: e.target.value})} 
                  className="input-field text-xs py-1.5" 
                  placeholder="e.g. Enterprise multi-tenant customer relationship hub" 
                />
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Custom Brand Logo</label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-slate-50/30 dark:bg-slate-900/20">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <Upload size={20} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isUploadingLogo ? 'Uploading logo...' : 'Click to upload company logo'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, SVG formats up to 2MB (transparent recommended)</p>
                </div>
                {config.logoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Current Logo:</span>
                    <img 
                      src={config.logoUrl.startsWith('/') ? `${API_BASE.replace('/api', '')}${config.logoUrl}` : config.logoUrl} 
                      alt="Current Logo" 
                      className="h-8 max-w-40 object-contain border border-slate-100 rounded p-1 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Color selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Primary Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.primaryColor} 
                      onChange={e => setConfig({...config, primaryColor: e.target.value})} 
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer shrink-0" 
                    />
                    <input 
                      type="text" 
                      value={config.primaryColor} 
                      onChange={e => setConfig({...config, primaryColor: e.target.value})} 
                      className="input-field text-xs py-1.5 font-mono" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Branded Theme Accent</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.accentColor} 
                      onChange={e => setConfig({...config, accentColor: e.target.value})} 
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer shrink-0" 
                    />
                    <input 
                      type="text" 
                      value={config.accentColor} 
                      onChange={e => setConfig({...config, accentColor: e.target.value})} 
                      className="input-field text-xs py-1.5 font-mono" 
                    />
                  </div>
                </div>
              </div>

              {/* Company Legal Information */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Building2 size={15} className="text-violet-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Corporate & Operational Details</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company Tax ID / GSTIN</label>
                    <input 
                      type="text" 
                      value={config.companyGstin} 
                      onChange={e => setConfig({...config, companyGstin: e.target.value})} 
                      className="input-field text-xs py-1.5" 
                      placeholder="e.g. 24AAAAB1111C1Z1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company PAN Number</label>
                    <input 
                      type="text" 
                      value={config.companyPan} 
                      onChange={e => setConfig({...config, companyPan: e.target.value})} 
                      className="input-field text-xs py-1.5" 
                      placeholder="e.g. ABCDE1234F"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Monthly Working Days</label>
                    <input 
                      type="number" 
                      value={config.workingDays} 
                      onChange={e => setConfig({...config, workingDays: parseInt(e.target.value) || ''})} 
                      className="input-field text-xs py-1.5" 
                      placeholder="e.g. 26"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>

                 <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Configure Saturday Offs (Holidays Calendar)</label>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {monthNames[calMonth]} {calYear}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={prevCalMonth} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><ChevronLeft size={16} /></button>
                        <button onClick={nextCalMonth} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><ChevronRight size={16} /></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                      {dayNames.map(d => <div key={d}>{d}</div>)}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfCalMonth }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-8" />
                      ))}
                      {Array.from({ length: daysInCalMonth }, (_, idx) => {
                        const day = idx + 1;
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dateObj = new Date(calYear, calMonth, day);
                        const isSunday = dateObj.getDay() === 0;
                        const isSaturday = dateObj.getDay() === 6;
                        
                        const existingEvent = isSaturday 
                          ? tasks?.find(t => (t.dueDate === dateStr || t.startDate === dateStr) && t.type?.toLowerCase() === 'holiday' && t.title === 'Saturday Off')
                          : null;
                          
                        let cellClass = "h-8 flex items-center justify-center rounded-lg text-xs font-semibold select-none transition-all ";
                        let tooltip = "";
                        let onClickHandler = null;
                        
                        if (isSunday) {
                          cellClass += "bg-red-50 text-red-500 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 cursor-not-allowed";
                          tooltip = "Sunday Off";
                        } else if (isSaturday) {
                          if (existingEvent) {
                            cellClass += "bg-rose-500 text-white shadow-xs cursor-pointer hover:bg-rose-600";
                            tooltip = "Saturday Off (Click to Make Working Day)";
                          } else {
                            cellClass += "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 cursor-pointer hover:bg-rose-100 hover:text-rose-600";
                            tooltip = "Working Saturday (Click to Mark Off)";
                          }
                          onClickHandler = (e) => handleToggleSaturday(e, dateStr, existingEvent);
                        } else {
                          const hasHoliday = tasks?.some(t => (t.dueDate === dateStr || t.startDate === dateStr) && t.type?.toLowerCase() === 'holiday');
                          if (hasHoliday) {
                            cellClass += "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
                            tooltip = "Holiday Event";
                          } else {
                            cellClass += "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400";
                          }
                        }
                        
                        return (
                          <div 
                            key={day} 
                            className={cellClass} 
                            onClick={onClickHandler}
                            title={tooltip}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900" />Weekly Off</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" />Saturday Off</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900" />Working Saturday</span>
                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Office Shift Start Time</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={config.shiftStartVal} 
                        onChange={e => setConfig({...config, shiftStartVal: e.target.value})} 
                        className="input-field text-xs py-1.5 flex-1" 
                        placeholder="09:00" 
                      />
                      <select
                        value={config.shiftStartAmpm}
                        onChange={e => setConfig({...config, shiftStartAmpm: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold shadow-sm cursor-pointer"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Office Shift End Time</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={config.shiftEndVal} 
                        onChange={e => setConfig({...config, shiftEndVal: e.target.value})} 
                        className="input-field text-xs py-1.5 flex-1" 
                        placeholder="06:00" 
                      />
                      <select
                        value={config.shiftEndAmpm}
                        onChange={e => setConfig({...config, shiftEndAmpm: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold shadow-sm cursor-pointer"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Lunch Break Start Time</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={config.breakStartVal} 
                        onChange={e => setConfig({...config, breakStartVal: e.target.value})} 
                        className="input-field text-xs py-1.5 flex-1" 
                        placeholder="01:00" 
                      />
                      <select
                        value={config.breakStartAmpm}
                        onChange={e => setConfig({...config, breakStartAmpm: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold shadow-sm cursor-pointer"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Lunch Break End Time</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={config.breakEndVal} 
                        onChange={e => setConfig({...config, breakEndVal: e.target.value})} 
                        className="input-field text-xs py-1.5 flex-1" 
                        placeholder="02:00" 
                      />
                      <select
                        value={config.breakEndAmpm}
                        onChange={e => setConfig({...config, breakEndAmpm: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold shadow-sm cursor-pointer"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                {getShiftDuration() && (
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    Total Shift Duration: {getShiftDuration()}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Registered Office Address</label>
                  <textarea 
                    value={config.companyAddress} 
                    onChange={e => setConfig({...config, companyAddress: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-20"
                    placeholder="Enter complete company registered address..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company Documents & Verification Registry</label>
                  <textarea 
                    value={config.companyDocs} 
                    onChange={e => setConfig({...config, companyDocs: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-20"
                    placeholder="e.g. COI, PAN Registry, or corporate certificate details..."
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={`btn-primary py-2 px-4 text-xs font-bold ${isSaving ? 'opacity-50' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Platform Preview</h3>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="h-12 flex items-center px-4 justify-between" 
                style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }}
              >
                <div className="flex items-center gap-2.5">
                  {config.logoUrl ? (
                    <img 
                      src={config.logoUrl.startsWith('/') ? `${API_BASE.replace('/api', '')}${config.logoUrl}` : config.logoUrl} 
                      alt="Logo" 
                      className="w-6 h-6 object-contain rounded bg-white/20 p-0.5"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
                      {config.companyName ? config.companyName.charAt(0) : 'A'}
                    </div>
                  )}
                  <span className="text-white text-xs font-bold">{config.companyName || 'AIO CRM'} Workspace</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 leading-relaxed text-center font-medium space-y-2">
                <div>
                  Your users and employees can access this workspace at <span className="font-semibold text-indigo-600 dark:text-indigo-400">{config.customDomain || window.location.host}</span>.
                </div>
                {config.companyGstin && (
                  <div className="text-[10px] text-slate-400 font-bold">
                    GSTIN ID: {config.companyGstin} {config.companyPan && `| PAN: ${config.companyPan}`}
                  </div>
                )}
                {config.shiftStartVal && config.shiftEndVal && (
                  <div className="text-[10px] text-slate-400 font-bold">
                    Shift Timings: {config.shiftStartVal} {config.shiftStartAmpm} - {config.shiftEndVal} {config.shiftEndAmpm} {config.breakStartVal && config.breakEndVal && `(Lunch Break: ${config.breakStartVal} ${config.breakStartAmpm} - ${config.breakEndVal} ${config.breakEndAmpm})`}
                  </div>
                )}
                {config.workingDays && (
                  <div className="text-[10px] text-slate-400 font-bold">
                    Monthly working days for Payroll: {config.workingDays} days
                  </div>
                )}
                {config.saturdaysOff && (
                  <div className="text-[10px] text-slate-400 font-bold">
                    Saturday Offs: {config.saturdaysOff.split(',').map(n => n + (n === '1' ? 'st' : n === '2' ? 'nd' : n === '3' ? 'rd' : 'th')).join(', ') || 'None'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
