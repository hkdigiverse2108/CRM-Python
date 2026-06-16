import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Code, Globe, Shield, RefreshCw, Key, Check, Copy,
  Info, Activity, Send, Database, HelpCircle
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function IntegrationCenter() {
  const { addToast } = useApp();
  const [apiKey, setApiKey] = useState('aio_live_723bd89f02c4b8192a83e01c9');
  const [webhookUrl, setWebhookUrl] = useState('https://api.aiocrm.in/v1/webhooks/shopify');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleGenerateKey = () => {
    const newKey = 'aio_live_' + Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 10);
    setApiKey(newKey);
    addToast('New Live API Key generated successfully');
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    addToast('Copied to clipboard');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Website Integration Center" subtitle="Embed widgets & tracking codes on your website" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: API Key & Webhook endpoints */}
        <div className="lg:col-span-8 space-y-5">
          {/* API Key management */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Key size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">REST API Authorization</h2>
                <p className="text-[10px] text-slate-400">Authenticate API requests from your custom applications.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="input-field text-xs font-mono py-2 bg-slate-50/50 dark:bg-slate-900/50"
                />
                <button
                  onClick={() => handleCopy(apiKey, 'key')}
                  className="btn-outline py-2 px-3 text-xs flex items-center gap-1.5"
                >
                  {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleGenerateKey}
                  className="btn-outline py-2 px-3 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Keep this token secure. Do not expose it in public client-side scripts.</p>
            </div>
          </div>

          {/* Webhook integration */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Globe size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Webhook Endpoint Configuration</h2>
                <p className="text-[10px] text-slate-400">Receive real-time lead and ecommerce events directly in AIO CRM.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payload URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    className="input-field text-xs font-mono py-2"
                  />
                  <button
                    onClick={() => handleCopy(webhookUrl, 'url')}
                    className="btn-outline py-2 px-3 text-xs flex items-center gap-1.5"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Triggers Events</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['lead.created', 'order.paid', 'cart.abandoned', 'chat.message'].map(ev => (
                    <label key={ev} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-lg cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Webhook logs */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Integration Logs</h2>
            <div className="space-y-2.5">
              {[
                { event: 'order.paid', status: 'Success (200)', time: '2 min ago', size: '1.2 KB' },
                { event: 'lead.created', status: 'Success (200)', time: '15 min ago', size: '0.8 KB' },
                { event: 'cart.abandoned', status: 'Failed (500)', time: '1 hr ago', size: '1.5 KB' }
              ].map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{log.event}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{log.time} • Size: {log.size}</p>
                  </div>
                  <span className={`badge ${log.status.includes('Success') ? 'badge-success' : 'badge-danger'}`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tracking Script */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Code size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Tracking script</h2>
                <p className="text-[10px] text-slate-400">Embed script in website `&lt;head&gt;` header.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] space-y-2 overflow-x-auto">
              <span className="text-slate-400">// AIO Tracking SDK</span>
              <p className="text-emerald-400">{`<!-- Add this tag -->`}</p>
              <p>{`<script src="https://cdn.aiocrm.in/sdk.js"></script>`}</p>
              <p>{`<script>`}</p>
              <p className="pl-3">{`AIO.init("${apiKey.slice(0, 12)}...");`}</p>
              <p className="pl-3">{`AIO.trackPageview();`}</p>
              <p>{`</script>`}</p>
            </div>

            <button 
              onClick={() => handleCopy(`<script src="https://cdn.aiocrm.in/sdk.js"></script>`, 'script')}
              className="w-full btn-outline py-2 text-xs font-bold justify-center"
            >
              Copy Tracker Code
            </button>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Sync Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Shopify Store:</span>
                <span className="badge badge-success">Synced</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">WooCommerce:</span>
                <span className="badge badge-neutral">Not Configured</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Meta leads:</span>
                <span className="badge badge-success">Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
