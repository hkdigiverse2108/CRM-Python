import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, RefreshCw, X, Check, AlertTriangle, Eye, Grid, List } from 'lucide-react';

export default function Templates() {
  const { addToast, token, tenantId } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states for template designer
  const [templateMode, setTemplateMode] = useState('Meta Review Mode'); // Meta Review Mode, Local Custom Mode
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Marketing');
  const [headerFormat, setHeaderFormat] = useState('None');
  const [headerText, setHeaderText] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [language, setLanguage] = useState('English (en)');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttonText, setButtonText] = useState('');

  // Loaded templates
  const [templates, setTemplates] = useState([]);

  const fetchTemplates = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/integrations/whatsapp/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722',
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTemplates(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [token, tenantId]);

  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);
    addToast('Syncing templates from Meta Cloud API...', 'info');
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/integrations/whatsapp/sync-templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722',
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTemplates(json.data);
          addToast('Templates synced successfully!', 'success');
        } else {
          addToast(json.message || 'Sync completed.', 'success');
        }
      } else {
        addToast('Sync failed or completed with warning.', 'warning');
      }
    } catch (err) {
      console.error('Failed to sync templates:', err);
      addToast('Sync templates request failed.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!templateName) return;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/integrations/whatsapp/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722',
        },
        body: JSON.stringify({
          name: templateName,
          category: category,
          language: language,
          body_text: bodyText,
          header_format: headerFormat,
          header_text: headerText,
          footer_text: footerText,
          button_text: buttonText
        })
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        setTemplates(prev => [json.data, ...prev]);
        addToast(json.message || 'Template created and submitted to Meta!', 'success');
        setShowAddModal(false);
        // Reset form
        setTemplateName('');
        setBodyText('');
        setHeaderText('');
        setHeaderImageUrl('');
        setHeaderFormat('None');
        setFooterText('');
        setButtonText('');
      } else {
        addToast(json.detail || json.message || 'Failed to submit template.', 'error');
      }
    } catch (err) {
      console.error('Failed to create template:', err);
      addToast('Create template request failed.', 'error');
    }
  };

  // Helper to format body text with variable placeholders for a realistic preview
  const getPreviewBodyText = () => {
    if (!bodyText) return '[Empty Body Text]';
    return bodyText
      .replace(/\{\{1\}\}/g, 'John')
      .replace(/\{\{2\}\}/g, 'AIO Solutions')
      .replace(/\{\{3\}\}/g, 'tomorrow')
      .replace(/\{\{\d\}\}/g, '[Variable]');
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
                  <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block mt-0.5">
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
                  <div className="mb-2 bg-slate-100 dark:bg-slate-850 rounded-lg p-3 text-center border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold text-[10px] flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-base mb-1">image</span>
                    HEADER IMAGE
                  </div>
                )}
                {t.headerText && (
                  <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200/50 pb-1 mb-1.5">{t.headerText}</p>
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
                <button onClick={() => addToast(`Copied ID for ${t.name}`)} className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-bold">Copy ID</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} className="text-xs text-red-500 hover:text-red-650 font-bold">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Designer Modal (Screenshot 4) */}
      {/* Template Designer Modal (Screenshot 4) */}
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div 
            className="modal-content w-full max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl flex flex-col lg:flex-row" 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100
            }}
            onClick={e => e.stopPropagation()}
          >
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
                <div className="flex bg-slate-100 dark:bg-slate-805 p-1 rounded-xl w-max">
                  {['Meta Review Mode', 'Local Custom Mode'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTemplateMode(mode)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        templateMode === mode 
                          ? 'bg-[#00a884] text-white shadow' 
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

                {headerFormat === 'Text' && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-1">Header Text *</label>
                    <input
                      type="text"
                      value={headerText}
                      onChange={e => setHeaderText(e.target.value)}
                      placeholder="e.g. Order Confirmation"
                      className="input-field text-xs"
                      required
                    />
                  </div>
                )}

                {headerFormat === 'Image' && (
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Header Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={headerImageUrl}
                        onChange={e => setHeaderImageUrl(e.target.value)}
                        placeholder="Paste image URL here or use the upload button..."
                        className="input-field text-xs flex-1"
                      />
                      <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0">
                        <Plus size={14} /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            addToast('Uploading template header image...', 'info');
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            try {
                              const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
                              const res = await fetch(`${API_BASE}/integrations/whatsapp/upload`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'X-Tenant-ID': tenantId || '96722',
                                },
                                body: formData
                              });
                              if (res.ok) {
                                const result = await res.json();
                                if (result.success && result.data?.url) {
                                  setHeaderImageUrl(result.data.url);
                                  addToast('Image uploaded successfully!', 'success');
                                } else {
                                  addToast('Upload failed', 'error');
                                }
                              } else {
                                addToast('Failed to upload image', 'error');
                              }
                            } catch (err) {
                              console.error(err);
                              addToast('Network error uploading image', 'error');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

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
                  className="btn-primary bg-[#00a884] hover:bg-[#008f70] text-white w-full justify-center py-2 text-xs font-bold border-none"
                >
                  Submit to Meta
                </button>
              </div>
            </form>

            {/* Right Column: Live Message Preview Mobile Phone */}
            <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[400px] shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 block">Live Message Preview</span>
              
              {/* Phone Mockup Frame */}
              <div className="w-[260px] h-[460px] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
                
                {/* Phone Notch/Header */}
                <div className="h-6 bg-slate-900 flex items-center justify-between px-4 text-white text-[9px] font-semibold shrink-0 relative z-20">
                  <span>9:41</span>
                  <div className="w-16 h-3.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1"></div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-[10px]">wifi</span>
                    <span className="material-symbols-outlined text-[10px]">battery_5_bar</span>
                  </div>
                </div>

                {/* WhatsApp Chat Room Header */}
                <div className="bg-[#005c4b] text-white p-2.5 flex items-center gap-2 shrink-0 z-10">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
                    WA
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[10px] truncate">{templateName || 'my_template_name'}</p>
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
                  <div className="bg-white rounded-lg rounded-tl-none p-2.5 shadow-sm text-[10px] max-w-[90%] relative space-y-1.5 text-slate-800">
                    
                    {headerFormat === 'Image' && (
                      <div className="mb-2 max-w-full rounded overflow-hidden border border-slate-150 shadow-sm bg-slate-100 flex items-center justify-center min-h-[80px]">
                        {headerImageUrl ? (
                          <img className="w-full max-h-[110px] object-cover" src={headerImageUrl} alt="Header Preview" />
                        ) : (
                          <div className="p-3 text-center text-slate-400 font-bold text-[8px] flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-sm mb-0.5">image</span>
                            HEADER IMAGE PREVIEW
                          </div>
                        )}
                      </div>
                    )}

                    {headerFormat === 'Text' && headerText && (
                      <p className="font-extrabold text-[11px] text-slate-900 border-b border-slate-100 pb-1 mb-1">{headerText}</p>
                    )}
                    
                    <p className="whitespace-pre-wrap leading-relaxed pr-6 font-medium">
                      {getPreviewBodyText()}
                    </p>
                    
                    {footerText && (
                      <p className="text-[8px] text-slate-400/90 italic font-medium">{footerText}</p>
                    )}

                    <div className="text-right text-[7px] text-slate-400 select-none">
                      9:41 AM
                    </div>

                    {/* Button action */}
                    {buttonText && (
                      <div className="border-t border-slate-100 pt-1.5 mt-1.5 text-center">
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
