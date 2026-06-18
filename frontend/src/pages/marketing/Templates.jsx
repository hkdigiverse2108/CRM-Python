import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, RefreshCw, X, Check, AlertTriangle, Eye, Grid, List } from 'lucide-react';

export default function Templates() {
  const { addToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form states for template designer
  const [templateMode, setTemplateMode] = useState('Meta Review Mode'); // Meta Review Mode, Local Custom Mode
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Marketing');
  const [headerFormat, setHeaderFormat] = useState('None');
  const [language, setLanguage] = useState('English (en)');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttonText, setButtonText] = useState('');

  // Sample templates as shown in screenshot 3
  const [templates, setTemplates] = useState([
    { id: '1', name: 'hello_world', category: 'UTILITY', language: 'EN_US', status: 'Approved', body: 'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.\nWhatsApp Business Platform sample message', vars: 0 },
    { id: '2', name: 'werty', category: 'MARKETING', language: 'EN', status: 'Approved', body: 'cvbn\nfghj', vars: 0, hasHeaderImage: true },
    { id: '3', name: 'vbnm', category: 'MARKETING', language: 'EN', status: 'Pending', body: 'vbnm\nvbnm\nvbn', vars: 0 },
    { id: '4', name: 'welcome_user', category: 'MARKETING', language: 'EN', status: 'Approved', body: 'Hi {{1}}, thank you for joining! We are excited to help you automate your business.', vars: 1 },
    { id: '5', name: 'testing', category: 'MARKETING', language: 'EN', status: 'Approved', body: 'This is a test notification template for API verification.', vars: 0 },
  ]);

  const handleSync = () => {
    setSyncing(true);
    addToast('Syncing templates from Meta Cloud API...', 'info');
    setTimeout(() => {
      setSyncing(false);
      addToast('Templates synced successfully!', 'success');
    }, 1200);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!templateName) return;

    const newT = {
      id: String(templates.length + 1),
      name: templateName.toLowerCase().replace(/\s+/g, '_'),
      category: category.toUpperCase(),
      language: 'EN',
      status: 'Approved',
      body: bodyText || '[Empty Body Text]',
      vars: (bodyText.match(/\{\{\d\}\}/g) || []).length
    };

    setTemplates([newT, ...templates]);
    setShowAddModal(false);
    // Reset form
    setTemplateName('');
    setBodyText('');
    setFooterText('');
    setButtonText('');
    addToast('Template created and submitted to Meta!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">WhatsApp Templates</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Design Meta templates, sync structures, build carousels, or create local custom templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> Sync Meta
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Template
          </button>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">{t.name}</h3>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mt-0.5">
                    {t.category} · {t.language}
                  </span>
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  t.status === 'Approved' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' 
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${t.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {t.status}
                </span>
              </div>

              {/* Template Body Frame Preview */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-medium text-slate-650 dark:text-slate-350 min-h-[90px] flex flex-col justify-between shadow-inner">
                {t.hasHeaderImage && (
                  <div className="mb-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold text-[10px] flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-base mb-1">image</span>
                    HEADER IMAGE
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{t.body}</p>
                <div className="text-[9px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5 mt-2 flex items-center justify-between">
                  <span>WhatsApp Business Platform sample message</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/50 mt-4 text-[10px] text-slate-450 font-bold uppercase">
              <span>{t.vars} variables</span>
              <div className="flex items-center gap-2">
                <button onClick={() => addToast(`Previewing ${t.name}`)} className="text-xs text-indigo-500 hover:underline font-bold">Copy ID</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} className="text-xs text-red-500 hover:text-red-600 font-bold">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Designer Modal (Screenshot 4) */}
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal-content w-full max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl flex flex-col lg:flex-row" onClick={e => e.stopPropagation()}>
            
            {/* Left Column: Form Settings */}
            <form onSubmit={handleCreate} className="flex-1 p-6 space-y-4 border-r border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600">edit_note</span>
                  Create Template Designer
                </h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost p-1"><X size={18} /></button>
              </div>

              {/* Template Mode Tabs */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Template Mode:</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max">
                  {['Meta Review Mode', 'Local Custom Mode'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTemplateMode(mode)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        templateMode === mode 
                          ? 'bg-emerald-600 text-white shadow' 
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="e.g. order_alert"
                    className="input-field text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option>Marketing</option>
                    <option>Utility</option>
                    <option>Authentication</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Header Format</label>
                  <select
                    value={headerFormat}
                    onChange={e => setHeaderFormat(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option>None</option>
                    <option>Text</option>
                    <option>Image</option>
                    <option>Document</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Language</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option>English (en)</option>
                    <option>Gujarati (gu)</option>
                    <option>Hindi (hi)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Body Message Content *</label>
                  <textarea
                    rows="4"
                    value={bodyText}
                    onChange={e => setBodyText(e.target.value)}
                    placeholder="e.g. Hello {{1}}, your booking for {{2}} is confirmed!"
                    className="input-field text-xs font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Use {"{{1}}"}, {"{{2}}"} for message variables.</p>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Footer Text (Optional)</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={e => setFooterText(e.target.value)}
                    placeholder="e.g. Reply STOP to opt out"
                    className="input-field text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Quick Reply Button Text (Optional)</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="e.g. Talk to Agent"
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline w-full justify-center py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white w-full justify-center py-2 text-xs font-bold"
                >
                  Submit to Meta
                </button>
              </div>
            </form>

            {/* Right Column: Live Message Preview Mobile Phone */}
            <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[400px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 block">Live Message Preview</span>
              
              {/* Phone Mockup Frame */}
              <div className="w-[260px] h-[460px] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-850 relative flex flex-col overflow-hidden">
                
                {/* Phone Notch/Header */}
                <div className="h-6 bg-slate-955 flex items-center justify-between px-4 text-white text-[9px] font-semibold shrink-0">
                  <span>9:41</span>
                  <div className="w-16 h-3.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5"></div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-[10px]">wifi</span>
                    <span className="material-symbols-outlined text-[10px]">battery_5_bar</span>
                  </div>
                </div>

                {/* WhatsApp Chat Room Header */}
                <div className="bg-[#005c4b] text-white p-2.5 flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-slate-200/20 flex items-center justify-center font-bold text-[10px]">
                    WA
                  </div>
                  <div>
                    <p className="font-bold text-[10px] truncate max-w-[120px]">{templateName || 'my_template_name'}</p>
                    <span className="text-[8px] text-white/80 block">Template Preview</span>
                  </div>
                </div>

                {/* WhatsApp Chat Room Body (Sand Background) */}
                <div 
                  className="flex-1 p-3 flex flex-col justify-start relative overflow-y-auto"
                  style={{
                    backgroundColor: '#efeae2',
                    backgroundImage: 'radial-gradient(#dfdcd6 0.8px, transparent 0.8px)',
                    backgroundSize: '10px 10px'
                  }}
                >
                  {/* Message Bubble Card */}
                  <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm text-[10px] max-w-[90%] relative space-y-1 text-slate-800">
                    
                    {headerFormat === 'Image' && (
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold text-[8px] flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-sm mb-0.5">image</span>
                        HEADER IMAGE
                      </div>
                    )}
                    
                    <p className="whitespace-pre-wrap leading-relaxed pr-6 font-medium">
                      {bodyText || '[Empty Body Text]'}
                    </p>
                    
                    {footerText && (
                      <p className="text-[8px] text-slate-400">{footerText}</p>
                    )}

                    <div className="text-right text-[7px] text-slate-400">
                      9:41 AM
                    </div>

                    {/* Button action */}
                    {buttonText && (
                      <div className="border-t border-slate-100 pt-1.5 mt-1 text-center">
                        <button type="button" className="text-emerald-600 text-[8px] font-bold flex items-center justify-center gap-1 w-full hover:bg-slate-50 py-1 rounded">
                          <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                          {buttonText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
