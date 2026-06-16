import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';

export default function AIAssistantHub() {
  const { addToast, leads = [] } = useApp();
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your AI Assistant. How can I help you analyze your tenant workspace data today?"
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [leadScoringEnabled, setLeadScoringEnabled] = useState(true);
  
  // Modules State
  const [modules, setModules] = useState([
    { id: 'mod-1', name: 'Campaign Generator', icon: 'campaign', desc: 'Automatically draft multi-channel ad copy and visuals based on target ROI.', status: 'Installed', rating: '4.9 (2.1k users)', color: 'border-t-indigo-600' },
    { id: 'mod-2', name: 'Sentiment Analysis', icon: 'mood', desc: 'Real-time tone detection in customer chats to alert supervisors of friction.', status: 'Popular', rating: '4.8 (840 users)', color: 'border-t-violet-600' },
    { id: 'mod-3', name: 'Churn Predictor', icon: 'query_stats', desc: 'Identifies at-risk accounts before they cancel using usage pattern AI.', status: 'Install', rating: '4.7 (1.5k users)', color: 'border-t-teal-555' },
    { id: 'mod-4', name: 'Smart Translator', icon: 'translate', desc: 'Auto-translate incoming messages with 99% accuracy in 45 languages.', status: 'Install', rating: '5.0 (320 users)', color: 'border-t-red-650' }
  ]);

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      setIsTyping(false);
      let replyText = `I have received your query regarding: "${textToSend}". Understood. Generating custom report parameters.`;
      
      if (textToSend.includes('breakdown')) {
        replyText = "Here is the performance breakdown: Sales conversions accounted for 64% of total traffic, with organic search driving the highest customer lifetime value.";
      } else if (textToSend.includes('Google Ads')) {
        replyText = "Google Ads performance: Spent $12,400 with a conversion value of $38,200. ROI stands at 3.08x compared to Meta Ads at 4.2x.";
      } else if (textToSend.includes('LTV')) {
        replyText = "Calculated Average LTV by channel: Referral ($1,420), WhatsApp CRM ($1,150), Google Organic ($980), Meta Paid ($740).";
      }

      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: replyText
      }]);
      addToast('AI Intelligence response received.');
    }, 1200);
  };

  const handleLeadScoringToggle = () => {
    const nextState = !leadScoringEnabled;
    setLeadScoringEnabled(nextState);
    addToast(nextState ? 'AI Lead Scoring Engine Enabled.' : 'AI Lead Scoring Engine Disabled.');
  };

  const handleModuleAction = (id, currentStatus) => {
    if (currentStatus !== 'Install') return;

    // Simulate installation
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, status: 'Installing...' };
      }
      return m;
    }));
    
    addToast('Initiating module installation...');

    setTimeout(() => {
      setModules(prev => prev.map(m => {
        if (m.id === id) {
          return { ...m, status: 'Installed' };
        }
        return m;
      }));
      addToast('Module successfully integrated into AIO CRM!');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="AI Assistant Hub" subtitle="Configure and manage AI-powered assistant features">
        <button 
          onClick={() => addToast('Opening AI execution history...')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-indigo-400 font-semibold hover:bg-slate-800 transition-colors border border-slate-700 text-xs shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          History
        </button>
        <button 
          onClick={() => addToast('Starting new AI task...')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:opacity-90 transition-opacity text-xs"
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          New Task
        </button>
      </PageHeader>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* AI Assistant Chat Pane */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col h-[650px] overflow-hidden">
          
          {/* Pane Header */}
          <div className="p-4 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-650 flex items-center justify-center text-white">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-950 dark:text-white">Enterprise Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">System Active</span>
                </div>
              </div>
            </div>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10 custom-scrollbar">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[12px] font-bold shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300' 
                    : 'bg-gradient-to-br from-indigo-600 to-violet-650'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">{msg.sender === 'user' ? 'person' : 'smart_toy'}</span>
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl shadow-sm border ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 border-indigo-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-850 border-slate-150 dark:border-slate-800/80 text-slate-850 dark:text-slate-205 rounded-tl-none'
                }`}>
                  <p className="text-xs leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  
                  {/* Suggestions (Bot only) */}
                  {msg.suggestions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.suggestions.map((pill, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(pill)}
                          className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-3 py-1.5 rounded-full hover:bg-indigo-100/50 dark:hover:bg-indigo-900/60 transition-colors"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom Data Visualization (Bot only) */}
                  {msg.dataViz && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                      {msg.dataViz.map((item, dIdx) => (
                        <div key={dIdx} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-inner">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{item.name}</p>
                          <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{item.value}</p>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-850 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full" style={{ width: item.pct }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Insight Label (Bot only) */}
                  {msg.insight && (
                    <div className="flex items-center gap-2 text-[10px] text-green-700 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20 w-fit px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-950/40 mt-1">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      <span>{msg.insight}</span>
                    </div>
                  )}

                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-650 shrink-0 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                </div>
                <div className="bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Field */}
          <div className="p-4 border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900/60 shrink-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-600/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 shadow-inner focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                <button 
                  onClick={() => addToast('Upload context file for AI engine')}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendMessage(chatInput);
                  }}
                  placeholder="Ask AI anything about your data..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-2 outline-none dark:text-white"
                />
                <button 
                  onClick={() => handleSendMessage(chatInput)}
                  className="bg-gradient-to-r from-indigo-600 to-violet-650 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 mt-3">
              <button 
                onClick={() => handleSendMessage('Calculate average LTV per channel')}
                className="text-[10px] text-slate-450 dark:text-slate-500 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
              >
                <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                <span>Try "Calculate average LTV per channel"</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* AI Lead Scoring Card */}
          <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm relative overflow-hidden group flex-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-slate-800 dark:text-white pointer-events-none">
              <span className="material-symbols-outlined text-[64px]">score</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600 dark:text-violet-400">verified</span>
              AI Lead Scoring
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-855 dark:text-slate-300">Predictive Priority</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Active scoring on {leads.length} leads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={leadScoringEnabled}
                    onChange={handleLeadScoringToggle}
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5.5 bg-slate-250 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">Score Distribution</p>
                {leads.length > 0 ? (
                  <div className="flex items-end gap-2.5 h-16 pt-2">
                    <div className="bg-indigo-600/20 w-full h-[30%] rounded-t-lg"></div>
                    <div className="bg-indigo-600/40 w-full h-[50%] rounded-t-lg"></div>
                    <div className="bg-indigo-600/60 w-full h-[80%] rounded-t-lg"></div>
                    <div className="bg-gradient-to-t from-indigo-600 to-violet-600 w-full h-full rounded-t-lg"></div>
                    <div className="bg-indigo-600/40 w-full h-[40%] rounded-t-lg"></div>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    No leads to score
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => addToast('Navigating to Lead Scoring rule builder')}
              className="w-full mt-6 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage Scoring Rules
            </button>
          </div>

          {/* Workflow Suggestions */}
          <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workflow Suggestions</h3>
              <span className="bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-violet-200/50 dark:border-violet-900/20">Beta</span>
            </div>
            
            <div className="space-y-4">
              {leads.length > 0 ? (
                <>
                  <div 
                    onClick={() => addToast('Initiating Auto-Followup reactivation chain...')}
                    className="p-3 bg-gradient-to-br from-indigo-50/20 to-violet-50/20 hover:from-indigo-50/50 hover:to-violet-50/50 dark:from-indigo-950/5 dark:to-violet-950/5 dark:hover:from-indigo-950/10 dark:hover:to-violet-950/10 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-850 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <span className="material-symbols-outlined text-[20px]">rebase_edit</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-855 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Auto-Followup Chain</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Detected high-value dormant leads. Enable reactivation?</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => addToast('Launching AI contact deduplication audit...')}
                    className="p-3 bg-gradient-to-br from-indigo-50/20 to-violet-50/20 hover:from-indigo-50/50 hover:to-violet-50/50 dark:from-indigo-950/5 dark:to-violet-950/5 dark:hover:from-indigo-950/10 dark:hover:to-violet-950/10 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-850 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-violet-600 dark:text-violet-400 shrink-0">
                        <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-855 dark:text-slate-200 group-hover:text-violet-650 dark:group-hover:text-violet-400 transition-colors">CRM Data Cleaning</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Identify duplicate contacts. Run AI deduplication merge?</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  <span className="material-symbols-outlined text-3xl text-slate-350 dark:text-slate-700 block mb-2 font-normal">tips_and_updates</span>
                  No workflow suggestions available.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Module Center */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Module Center</h3>
          <button 
            onClick={() => addToast('Opening AI Marketplace modules...')}
            className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
          >
            Browse All Modules
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map(mod => (
            <div 
              key={mod.id}
              onClick={() => handleModuleAction(mod.id, mod.status)}
              className={`bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-250 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border-t-4 ${mod.color}`}
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-650 dark:text-slate-350 border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-[22px]">{mod.icon}</span>
                </div>
                {mod.status === 'Installed' && (
                  <span className="text-[9px] font-bold text-green-700 bg-green-50 dark:bg-green-950/40 dark:text-green-400 px-2 py-0.5 rounded-md border border-green-100 dark:border-green-950/20">Installed</span>
                )}
                {mod.status === 'Popular' && (
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Popular</span>
                )}
                {mod.status === 'Installing...' && (
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-md animate-pulse">Installing...</span>
                )}
                {mod.status === 'Install' && (
                  <button className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 px-2 py-0.5 rounded-md transition-colors border border-indigo-100 dark:border-indigo-900/40">Install</button>
                )}
              </div>
              
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {mod.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {mod.desc}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-550 font-semibold">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span>{mod.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
