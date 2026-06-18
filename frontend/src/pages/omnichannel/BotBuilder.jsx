import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Play, Sparkles, BookOpen, Plus, Undo, Redo, Save, CornerRightDown, HelpCircle, X, ChevronRight } from 'lucide-react';

export default function BotBuilder() {
  const { addToast } = useApp();
  const [selectedFlow, setSelectedFlow] = useState('Chab Chabba Chab Water Park • [ACTIVE]');
  const [triggerType, setTriggerType] = useState('Keywords Match');
  const [keywords, setKeywords] = useState('hello, hi, hey, start, menu, water, park');
  const [status, setStatus] = useState(true);

  // Pre-configured nodes to display in the visual flow canvas simulator
  const [nodes, setNodes] = useState([
    { id: '1', type: 'trigger', title: 'KEYWORDS MATCH', details: 'hello, hi, hey, start, menu', x: 50, y: 50 },
    { id: '2', type: 'message', title: 'SEND MESSAGE', details: 'Welcome to Chab Chabba Chab Water Park! Please select an option from the menu.', x: 300, y: 50 },
    { id: '3', type: 'question', title: 'ASK QUESTION', details: 'Option Selection (Buttons Menu)', x: 550, y: 50 },
    { id: '4', type: 'condition', title: 'CONDITION', details: 'Check option clicked', x: 800, y: 120 },
    { id: '5', type: 'ai', title: 'AI AGENT', details: 'Run GPT agent for park details', x: 1050, y: 40 },
    { id: '6', type: 'handoff', title: 'HUMAN HANDOFF', details: 'Transfer to support team', x: 1050, y: 220 },
  ]);

  const addNode = (type) => {
    const titles = {
      message: 'SEND MESSAGE',
      question: 'ASK QUESTION',
      condition: 'CONDITION',
      ai: 'AI AGENT',
      delay: 'WAIT DELAY',
      handoff: 'HUMAN HANDOFF'
    };

    const details = {
      message: 'New outgoing text message content...',
      question: 'Ask a question and store user response...',
      condition: 'Configure logic branch conditions...',
      ai: 'Prompt guidelines for AI engine response...',
      delay: 'Set wait delay duration...',
      handoff: 'Transfer discussion context to agent queue...'
    };

    const newNode = {
      id: String(nodes.length + 1),
      type,
      title: titles[type] || 'NEW BLOCK',
      details: details[type] || '',
      x: 300 + Math.random() * 200,
      y: 100 + Math.random() * 150
    };

    setNodes([...nodes, newNode]);
    addToast(`Added ${newNode.title} block to visual canvas`, 'success');
  };

  const getNodeColor = (type) => {
    switch (type) {
      case 'trigger': return 'border-l-4 border-l-orange-500 bg-orange-50/50 text-orange-800 dark:bg-orange-950/20 dark:text-orange-450';
      case 'message': return 'border-l-4 border-l-emerald-600 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450';
      case 'question': return 'border-l-4 border-l-sky-500 bg-sky-50/50 text-sky-800 dark:bg-sky-950/20 dark:text-sky-450';
      case 'condition': return 'border-l-4 border-l-amber-500 bg-amber-50/50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-450';
      case 'ai': return 'border-l-4 border-l-indigo-600 bg-indigo-50/50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-450';
      case 'handoff': return 'border-l-4 border-l-red-500 bg-red-50/50 text-red-800 dark:bg-red-950/20 dark:text-red-450';
      default: return 'border-l-4 border-l-slate-400 bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Bot Flow Builder</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Design multi step auto-response workflows, conversational Q&A forms, and trigger AI prompts visually.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => addToast('Starting flow simulation...')} className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 dark:border-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm">
            <Play size={14} /> Simulate Flow
          </button>
          <button onClick={() => addToast('Opening pre-built workflow templates library')} className="flex items-center gap-1.5 px-3.5 py-2 border border-orange-200 dark:border-orange-900/40 rounded-lg font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 bg-white dark:bg-slate-900 transition-all">
            <BookOpen size={14} /> Workflow Library
          </button>
          <button onClick={() => addToast('Creating new empty chatbot flow')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-sm">
            <Plus size={14} /> Create New Flow
          </button>
        </div>
      </div>

      {/* Active Flow details bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">smart_toy</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Flow Builder</span>
            <select 
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value)}
              className="bg-transparent border-none p-0 font-bold text-sm text-slate-800 dark:text-white focus:ring-0 focus:outline-none"
            >
              <option>Chab Chabba Chab Water Park • [ACTIVE]</option>
              <option>Ecommerce Recovery Flow</option>
              <option>Default Offline Responder</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Flow Name:</span>
            <span className="text-slate-850 dark:text-slate-200">Chab Chabba Chab Water Park</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Status:</span>
            <button 
              onClick={() => { setStatus(!status); addToast(`Flow status set to: ${!status ? 'Inactive' : 'Active'}`); }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] ${status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {status ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>
          <button 
            onClick={() => setNodes([])}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
            title="Delete Flow"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>

      {/* Main Builder grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left pane: Trigger config & Flow blocks tool shelf */}
        <div className="space-y-6">
          
          {/* Trigger settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Trigger Config</h3>
            
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Trigger Type</label>
                <select 
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="input-field text-xs font-bold"
                >
                  <option>Keywords Match</option>
                  <option>Webhook Event</option>
                  <option>New Customer Added</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Keywords List</label>
                <textarea 
                  rows="3"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="input-field text-xs font-mono"
                  placeholder="e.g. hello, hi, help"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Comma-separated keywords.</span>
              </div>
            </div>
          </div>

          {/* Node palette menu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Flow Blocks</h3>
            <div className="grid grid-cols-1 gap-2 text-xs font-bold">
              <button 
                type="button" 
                onClick={() => addNode('message')}
                className="w-full flex items-center justify-between border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 p-3 rounded-xl hover:bg-emerald-50/10 dark:hover:bg-slate-800 transition-all group text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Send Message
                </span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-emerald-600">add</span>
              </button>

              <button 
                type="button" 
                onClick={() => addNode('question')}
                className="w-full flex items-center justify-between border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 p-3 rounded-xl hover:bg-sky-50/10 dark:hover:bg-slate-800 transition-all group text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  Ask Question
                </span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-sky-600">add</span>
              </button>

              <button 
                type="button" 
                onClick={() => addNode('condition')}
                className="w-full flex items-center justify-between border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 p-3 rounded-xl hover:bg-amber-50/10 dark:hover:bg-slate-800 transition-all group text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Condition
                </span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-amber-600">add</span>
              </button>

              <button 
                type="button" 
                onClick={() => addNode('ai')}
                className="w-full flex items-center justify-between border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 p-3 rounded-xl hover:bg-indigo-50/10 dark:hover:bg-slate-800 transition-all group text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  AI Agent
                </span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-indigo-600">add</span>
              </button>

              <button 
                type="button" 
                onClick={() => addNode('delay')}
                className="w-full flex items-center justify-between border border-slate-200 dark:border-slate-800 hover:border-slate-400/50 p-3 rounded-xl hover:bg-slate-50/10 dark:hover:bg-slate-800 transition-all group text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Wait Delay
                </span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-slate-600">add</span>
              </button>

              <button 
                type="button" 
                onClick={() => addNode('handoff')}
                className="w-full flex items-center justify-between border border-slate-200 dark:border-slate-800 hover:border-red-500/50 p-3 rounded-xl hover:bg-red-50/10 dark:hover:bg-slate-800 transition-all group text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Human Handoff
                </span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-red-650">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right pane: Visual Flow Canvas workspace */}
        <div className="lg:col-span-3 flex flex-col bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl relative min-h-[500px]">
          
          {/* Visual Grid canvas grid wallpaper */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'radial-gradient(#dfdcd6 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.4
            }}
          />

          {/* Node Cards rendering */}
          <div className="flex-1 p-6 relative overflow-auto z-10 space-y-6">
            <div className="flex flex-wrap gap-6 items-start">
              {nodes.map(node => (
                <div 
                  key={node.id}
                  className={`w-[220px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-4 space-y-3 ${getNodeColor(node.type)}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wide">{node.title}</span>
                    <button 
                      onClick={() => setNodes(nodes.filter(x => x.id !== node.id))}
                      className="text-slate-400 hover:text-slate-650 dark:hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 min-h-[40px] leading-relaxed">
                    {node.details}
                  </p>
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                    <span>ID: {node.id}</span>
                    <span className="text-indigo-500 font-bold hover:underline cursor-pointer">Configure</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom left actions */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <button onClick={() => addToast('Undo last operation')} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-slate-650 hover:text-slate-850 dark:text-slate-350 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
              <Undo size={14} />
            </button>
            <button onClick={() => addToast('Redo operation')} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-slate-650 hover:text-slate-850 dark:text-slate-350 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
              <Redo size={14} />
            </button>
            <button onClick={() => addToast('Bot Flow Builder saved successfully!', 'success')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
              <Save size={14} /> Save Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
