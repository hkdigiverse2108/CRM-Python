import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function AutomationCenter() {
  const { addToast } = useApp();
  const [zoom, setZoom] = useState(100);
  const [searchLibrary, setSearchLibrary] = useState('');

  const handleZoomIn = () => {
    if (zoom < 150) {
      setZoom(prev => prev + 10);
      addToast('Zoomed In');
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50) {
      setZoom(prev => prev - 10);
      addToast('Zoomed Out');
    }
  };

  const handleResetZoom = () => {
    setZoom(100);
    addToast('Zoom Reset');
  };

  const handlePublish = () => {
    addToast('Workflow published successfully!');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] border border-outline-variant rounded-xl overflow-hidden bg-white dark:bg-slate-900 relative">
      
      {/* Canvas Toolbar (Top-Left overlay) */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-xl border border-outline-variant flex gap-1">
          <button onClick={handleZoomIn} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Zoom In">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button onClick={handleZoomOut} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Zoom Out">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <div className="w-[1px] bg-outline-variant mx-1"></div>
          <button onClick={handleResetZoom} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Center View">
            <span className="material-symbols-outlined">filter_center_focus</span>
          </button>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-xl border border-outline-variant flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-on-surface">Live: Pricing Inbound Bot ({zoom}%)</span>
        </div>
      </div>

      {/* Automation Controls (Top-Right overlay) */}
      <div className="absolute top-6 right-[340px] z-30 flex items-center gap-3">
        <button onClick={() => addToast('Viewing execution logs...')} className="bg-white dark:bg-slate-800 border border-outline-variant text-on-surface-variant px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-md">
          <span className="material-symbols-outlined text-[18px]">history</span>
          History
        </button>
        <button onClick={() => addToast('Initiating mock workflow test...')} className="bg-white dark:bg-slate-800 border border-outline-variant text-on-surface-variant px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-md">
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          Test Workflow
        </button>
        <button onClick={handlePublish} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          Publish
        </button>
      </div>

      {/* Dotted Grid Canvas Area */}
      <div className="flex-1 overflow-auto relative dotted-grid bg-[#f8f9ff] dark:bg-[#0b121f] h-full" style={{ backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
        <div className="min-w-[1000px] min-h-[800px] relative transition-transform duration-200" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* SVG Connections with animation */}
            <path className="connector-line glow-active" d="M 400 150 L 400 250" fill="none" stroke="#0052cc" strokeWidth="2.5" strokeDasharray="6"></path>
            <path className="connector-line opacity-50" d="M 400 350 L 400 450" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="6"></path>
            <path className="connector-line opacity-50" d="M 400 550 L 250 650" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="6"></path>
            <path className="connector-line opacity-50" d="M 400 550 L 550 650" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="6"></path>
          </svg>

          {/* Nodes Container */}
          <div className="absolute inset-0 p-12 z-10">
            {/* Trigger Node */}
            <div className="absolute left-[300px] top-[50px] w-[200px]">
              <div className="workflow-node bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl p-4 shadow-xl ring-4 ring-primary/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Trigger</span>
                </div>
                <h3 className="font-bold text-on-surface text-xs">New WhatsApp Message</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">Triggers when any user sends a message.</p>
              </div>
            </div>

            {/* Condition Node */}
            <div className="absolute left-[300px] top-[250px] w-[200px]">
              <div className="workflow-node bg-white dark:bg-slate-800 border border-outline-variant rounded-2xl p-4 shadow-lg glow-active">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">account_tree</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Condition</span>
                </div>
                <h3 className="font-bold text-on-surface text-xs">Keyword: "Pricing"</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">If message body contains 'pricing' or 'cost'.</p>
              </div>
            </div>

            {/* Action Node 1 */}
            <div className="absolute left-[300px] top-[450px] w-[200px]">
              <div className="workflow-node bg-white dark:bg-slate-800 border border-outline-variant rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center text-[#805ad5]">
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#805ad5]">Action</span>
                </div>
                <h3 className="font-bold text-on-surface text-xs">Send WhatsApp Template</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">Template: 'Price List'</p>
              </div>
            </div>

            {/* Split Action Node 2 */}
            <div className="absolute left-[150px] top-[650px] w-[200px]">
              <div className="workflow-node bg-white dark:bg-slate-800 border border-outline-variant rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950/20 rounded-lg flex items-center justify-center text-orange-600">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">Internal</span>
                </div>
                <h3 className="font-bold text-on-surface text-xs">Assign to Sales Team</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">Round-robin assignment.</p>
              </div>
            </div>

            {/* Split Action Node 3 (Add Step) */}
            <div className="absolute left-[450px] top-[650px] w-[200px]">
              <div className="workflow-node bg-white dark:bg-slate-800 border border-outline-variant border-dashed rounded-2xl p-4 shadow-lg opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center rounded-xl p-4 h-full">
                  <button onClick={() => addToast('Node addition drawer opened')} className="flex flex-col items-center gap-1.5 group">
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">add_circle</span>
                    <span className="text-[10px] font-bold text-outline-variant uppercase group-hover:text-primary">Add Step</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nodes Library Sidebar (Right) */}
      <aside className="w-80 bg-slate-50 dark:bg-slate-900 border-l border-outline-variant flex flex-col shrink-0">
        <div className="p-6 border-b border-outline-variant bg-white dark:bg-slate-900">
          <h2 className="text-headline-sm font-bold text-on-surface">Nodes Library</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Drag and drop nodes to the canvas.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* CRM Triggers */}
          <div>
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase mb-3 opacity-60 tracking-wider">CRM Triggers</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-grab shadow-sm group">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">person_pin</span>
                <span className="text-xs font-bold text-on-surface">New Lead Added</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-grab shadow-sm group">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">payments</span>
                <span className="text-xs font-bold text-on-surface">Deal Closed</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Actions */}
          <div>
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase mb-3 opacity-60 tracking-wider">WhatsApp Actions</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-grab shadow-sm group">
                <span className="material-symbols-outlined text-tertiary group-hover:scale-110 transition-transform">send</span>
                <span className="text-xs font-bold text-on-surface">Send Message</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-grab shadow-sm group">
                <span className="material-symbols-outlined text-tertiary group-hover:scale-110 transition-transform">attach_file</span>
                <span className="text-xs font-bold text-on-surface">Send Media</span>
              </div>
            </div>
          </div>

          {/* Logic & Utilities */}
          <div>
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase mb-3 opacity-60 tracking-wider">Logic & Utilities</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-grab shadow-sm group">
                <span className="material-symbols-outlined text-[#805ad5] group-hover:scale-110 transition-transform">alt_route</span>
                <span className="text-xs font-bold text-on-surface">Filter / Condition</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-grab shadow-sm group">
                <span className="material-symbols-outlined text-[#805ad5] group-hover:scale-110 transition-transform">schedule</span>
                <span className="text-xs font-bold text-on-surface">Time Delay</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-grab shadow-sm group">
                <span className="material-symbols-outlined text-[#805ad5] group-hover:scale-110 transition-transform">code</span>
                <span className="text-xs font-bold text-on-surface">Custom Webhook</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-outline-variant">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase text-primary tracking-wider">Storage Used</span>
              <span className="text-[10px] font-bold text-primary">82%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="w-[82%] h-full bg-primary rounded-full"></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 leading-normal">
              Using 41/50 active automations in your Professional plan.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
