import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, Upload, Palette, Globe, Mail, Shield, Check } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function WhiteLabel() {
  const { addToast } = useApp();
  const [config, setConfig] = useState({
    companyName: 'AIO CRM',
    primaryColor: '#4f46e5',
    accentColor: '#8b5cf6',
    customDomain: 'crm.rapidmodel.ai',
    supportEmail: 'support@rapidmodel.ai',
    smtpServer: 'smtp.mailgun.org',
    smtpPort: '587',
    logoUrl: '',
  });

  const handleSave = () => {
    addToast('White Label settings saved successfully');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="White Label Customization" subtitle="Customize branding & white-label settings" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form Settings */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-card p-5 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Palette size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Custom Identity Branding</h2>
                <p className="text-[10px] text-slate-400">Configure client-facing company names, color schemes, and logo signatures.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Branded Company Name</label>
                  <input 
                    type="text" 
                    value={config.companyName} 
                    onChange={e => setConfig({...config, companyName: e.target.value})} 
                    className="input-field text-xs py-1.5" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Custom Domain Endpoint</label>
                  <input 
                    type="text" 
                    value={config.customDomain} 
                    onChange={e => setConfig({...config, customDomain: e.target.value})} 
                    className="input-field text-xs py-1.5" 
                    placeholder="crm.yourbrand.com" 
                  />
                </div>
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Custom Brand Logo</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-slate-50/30 dark:bg-slate-900/20">
                  <Upload size={20} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Click to upload brand assets</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, SVG format up to 2MB (transparent recommended)</p>
                </div>
              </div>

              {/* Color selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Branded Primary Color</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Branded Accent Color</label>
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

              {/* SMTP configuration */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-violet-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Outbound SMTP Mailer Setup</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">SMTP Server Host</label>
                    <input 
                      type="text" 
                      value={config.smtpServer} 
                      onChange={e => setConfig({...config, smtpServer: e.target.value})} 
                      className="input-field text-xs py-1.5" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">SMTP Port</label>
                    <input 
                      type="text" 
                      value={config.smtpPort} 
                      onChange={e => setConfig({...config, smtpPort: e.target.value})} 
                      className="input-field text-xs py-1.5 text-center" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Support Email Sender Address</label>
                  <input 
                    type="email" 
                    value={config.supportEmail} 
                    onChange={e => setConfig({...config, supportEmail: e.target.value})} 
                    className="input-field text-xs py-1.5" 
                  />
                </div>
              </div>
            </div>

            <button onClick={handleSave} className="btn-primary py-2 px-4 text-xs font-bold">
              Save White Label configuration
            </button>
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Platform Header Preview</h3>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="h-12 flex items-center px-4 justify-between" 
                style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
                    {config.companyName.charAt(0)}
                  </div>
                  <span className="text-white text-xs font-bold">{config.companyName} Workspace</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 leading-relaxed text-center font-medium">
                The visual layout header above illustrates your custom organization settings. When applied, clients will access the dashboard under <span className="font-semibold text-indigo-600 dark:text-indigo-400">{config.customDomain}</span>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
