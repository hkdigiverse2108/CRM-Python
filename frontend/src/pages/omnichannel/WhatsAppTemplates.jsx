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
          header_image_url: headerImageUrl,
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





  const handleDelete = async (templateName, templateId) => {
    if (!window.confirm(`Are you sure you want to delete the template "${templateName}"?`)) return;
    
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/integrations/whatsapp/templates/${templateName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722',
        }
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId && t.name !== templateName));
        addToast(json.message || 'Template deleted successfully.', 'success');
      } else {
        addToast(json.detail || json.message || 'Failed to delete template.', 'error');
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
      addToast('Delete template request failed.', 'error');
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
                <button onClick={() => handleDelete(t.name, t.id)} className="text-xs text-red-500 hover:text-red-650 font-bold">Delete</button>
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
                    {headerImageUrl ? (
                      <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={headerImageUrl} alt="Header" className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">Image Uploaded Successfully</p>
                            <a href={headerImageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 hover:underline truncate block">View Full Image</a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHeaderImageUrl('')}
                          className="btn-ghost text-red-500 hover:text-red-750 p-1.5 rounded-full shrink-0"
                          title="Remove Image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 dark:border-slate-800 dark:hover:border-emerald-500/55 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 group text-center">
                        <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors">cloud_upload</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Click to upload image from PC</span>
                        <span className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, JPEG</span>
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
                    )}
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
            <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[400px] shrink-0 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 block">Live Message Preview</span>
                            {/* Modern iPhone Mockup Frame */}
              <div className="w-[270px] h-[480px] bg-slate-950 rounded-[44px] p-1.5 shadow-2xl border-[6px] border-slate-900 relative flex flex-col overflow-hidden ring-1 ring-slate-900/10">
                
                {/* Dynamic Island */}
                <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[72px] h-4 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-full absolute right-2.5"></div>
                </div>

                {/* Inner Curved Screen Container */}
                <div className="flex-1 flex flex-col relative overflow-hidden rounded-[36px] bg-[#efeae2]">
                  {/* iPhone iOS Status Bar (matching WhatsApp Green background color) */}
                  <div className="h-8 bg-[#005c4b] flex items-end justify-between px-6 pb-1 text-white/90 text-[8.5px] font-bold shrink-0 relative z-25">
                    <span className="select-none leading-none mb-0.5">9:41</span>
                    <div className="flex items-center gap-1.5 mb-0.5 select-none text-white/90">
                      {/* Signal */}
                      <svg className="w-3 h-1.5 shrink-0" viewBox="0 0 12 7" fill="currentColor">
                        <rect x="0" y="5" width="1.5" height="2" rx="0.3" />
                        <rect x="2.5" y="3.5" width="1.5" height="3.5" rx="0.3" />
                        <rect x="5" y="2" width="1.5" height="5" rx="0.3" />
                        <rect x="7.5" y="0.5" width="1.5" height="6.5" rx="0.3" />
                      </svg>
                      {/* WiFi */}
                      <svg className="w-3 h-2 shrink-0" viewBox="0 0 12 9" fill="currentColor">
                        <path d="M6 8a0.8 0 100-1.6 0.8 0 000 1.6zm2.8-2.8a4 4 0 00-5.6 0l0.5 0.5a3.2 3.2 0 014.6 0l0.5-0.5zm1-1a5.6 5.6 0 00-7.6 0l0.5 0.5a4.8 4.8 0 016.6 0l0.5-0.5z" />
                      </svg>
                      {/* Battery */}
                      <svg className="w-4 h-2 shrink-0" viewBox="0 0 16 8" fill="currentColor">
                        <rect x="0" y="0.5" width="13" height="7" rx="1.8" fill="none" stroke="currentColor" strokeWidth="0.8" />
                        <rect x="1.2" y="1.7" width="8.5" height="4.6" rx="0.8" />
                        <path d="M14 2.5v3c0.3 0 0.5-0.2 0.5-0.5v-2c0-0.3-0.2-0.5-0.5-0.5z" />
                      </svg>
                    </div>
                  </div>

                  {/* WhatsApp Chat Room Header (iOS Style) */}
                  <div className="bg-[#005c4b] text-white pt-1.5 pb-2.5 px-4 flex items-center gap-2 shrink-0 z-10">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-[8px] shrink-0">
                      WA
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[9px] truncate leading-tight">{templateName || 'my_template_name'}</p>
                      <span className="text-[7.5px] text-white/80 block font-semibold leading-none mt-0.5">Template Preview</span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Room Body (Sand Background) */}
                  <div 
                    className="flex-1 p-3 pb-6 flex flex-col justify-start relative overflow-y-auto"
                    style={{
                      backgroundColor: '#efeae2',
                      backgroundImage: 'radial-gradient(#dfdcd6 0.8px, transparent 0.8px)',
                      backgroundSize: '10px 10px'
                    }}
                  >
                    {/* Message Bubble Card */}
                    <div className="bg-white rounded-lg rounded-tl-none p-3.5 shadow-sm text-[13px] max-w-[90%] relative space-y-1.5 text-slate-800 font-sans">
                      
                      {headerFormat === 'Image' && (
                        <div className="mb-2 max-w-full rounded overflow-hidden border border-slate-150 shadow-sm bg-slate-100 flex items-center justify-center min-h-[90px]">
                          {headerImageUrl ? (
                            <img className="w-full max-h-[120px] object-cover" src={headerImageUrl} alt="Header Preview" />
                          ) : (
                            <div className="p-3 text-center text-slate-400 font-bold text-[9px] flex flex-col items-center justify-center">
                              <span className="material-symbols-outlined text-sm mb-0.5">image</span>
                              HEADER IMAGE PREVIEW
                            </div>
                          )}
                        </div>
                      )}

                      {headerFormat === 'Text' && headerText && (
                        <p className="font-extrabold text-[13.5px] text-slate-900 border-b border-slate-100 pb-1 mb-1 font-sans">{headerText}</p>
                      )}
                      
                      <p className="whitespace-pre-wrap leading-relaxed pr-6 font-normal text-[12.5px] text-slate-800 font-sans">
                        {getPreviewBodyText()}
                      </p>
                      
                      {footerText && (
                        <p className="text-[10px] text-slate-400/90 italic font-normal font-sans">{footerText}</p>
                      )}

                      <div className="text-right text-[8.5px] text-slate-400 select-none font-sans">
                        9:41 AM
                      </div>

                      {/* Button action */}
                      {buttonText && (
                        <div className="border-t border-slate-100 pt-1.5 mt-1.5 text-center">
                          <button type="button" className="text-emerald-600 text-[11px] font-bold flex items-center justify-center gap-1 w-full hover:bg-slate-50 py-1 rounded">
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                            {buttonText}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* iPhone Home Indicator Bar */}
                  <div className="absolute bottom-1 left-0 right-0 h-4 flex items-center justify-center z-30 pointer-events-none">
                    <div className="w-20 h-1 bg-black/20 rounded-full"></div>
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
