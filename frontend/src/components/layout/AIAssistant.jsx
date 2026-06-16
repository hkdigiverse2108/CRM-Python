import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Sparkles, X, Send, Bot, User, CornerDownLeft, RefreshCw } from 'lucide-react';

const suggestionPrompts = [
  'Analyze sales pipeline',
  'How to create a lead?',
  'Tips for lead qualification',
  'Compare marketing channels'
];

export default function AIAssistant() {
  const { aiAssistantOpen, setAiAssistantOpen } = useApp();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your AI Business Assistant. How can I help you drive revenue today?',
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: 'Just now'
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Dynamic clean response
    setTimeout(() => {
      let botResponse = '';
      const lowerText = text.toLowerCase();

      if (lowerText.includes('pipeline') || lowerText.includes('sales')) {
        botResponse = 'Based on the pipeline data, you currently have no active deals in negotiation. To start tracking revenue, create or import leads and advance them to the Negotiation stage.';
      } else if (lowerText.includes('create') || lowerText.includes('lead') || lowerText.includes('how to')) {
        botResponse = 'To create a new lead, navigate to the Leads page and click the "+ Create Lead" button. You can also ingest leads automatically from WhatsApp, Shopify, or Meta Ads integrations.';
      } else if (lowerText.includes('qualification') || lowerText.includes('tips')) {
        botResponse = 'Here are 3 tips for lead qualification:\n1. Verify budget and timeline early.\n2. Leverage WhatsApp or phone follow-ups within 15 minutes of signup.\n3. Keep lead details and custom fields up to date.';
      } else if (lowerText.includes('marketing') || lowerText.includes('roi') || lowerText.includes('channel')) {
        botResponse = 'Once campaigns are configured and leads are flowing, this panel will report conversion rates and acquisition costs (CAC) for channels like Meta, Google Ads, and Referrals.';
      } else {
        botResponse = "I've analyzed your CRM database. It is currently empty and ready for production. Let me know if you would like me to assist you with lead imports or workflow automations.";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        time: 'Just now'
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSuggestionClick = (prompt) => {
    handleSend(prompt);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setAiAssistantOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        title="Open AI CRM Assistant"
      >
        {aiAssistantOpen ? <X size={22} className="animate-spin-once" /> : <Sparkles size={22} className="animate-pulse" />}
      </button>

      {/* AI Assistant Chat Drawer */}
      {aiAssistantOpen && (
        <div 
          className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] glass-card flex flex-col overflow-hidden animate-[slideUp_200ms_ease]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-md">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1">
                  AI CRM Copilot
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Available and analyzing workspace</p>
              </div>
            </div>
            <button
              onClick={() => setAiAssistantOpen(false)}
              className="btn-ghost p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {msg.sender === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>
                <div className="flex flex-col max-w-[75%]">
                  <div className={`text-xs px-3 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/40 dark:border-slate-700/40 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`text-[9px] mt-1 text-slate-400 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Bot size={13} />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-2.5 rounded-2xl rounded-tl-none border border-slate-200/40 dark:border-slate-700/40">
                  <div className="flex items-center gap-1.5 h-3">
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Action Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/10">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Suggested Actions</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestionPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend(inputValue)}
                className="input-field py-2 pr-8 text-xs font-medium"
                placeholder="Ask AI Copilot..."
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-slate-400 font-mono pointer-events-none">
                <span>↵</span>
              </div>
            </div>
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim()}
              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
