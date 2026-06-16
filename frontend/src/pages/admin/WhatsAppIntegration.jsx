import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, RefreshCw, Loader2, ArrowLeft,
  CheckCircle2, XCircle, AlertTriangle, Layers, Unplug, Info
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function WhatsAppIntegration() {
  const { addToast, token, tenantId } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Connection Status
  const [status, setStatus] = useState({ connected: false });

  // Headers helper
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || 'rapidmodel_corp',
  }), [token, tenantId]);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/integrations/whatsapp/status`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStatus(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle Meta Embedded Signup popup
  const handleConnect = () => {
    setConnecting(true);
    
    // Simulate Embedded Signup popup
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '',
      'Meta Embedded Signup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`
    );
    
    if (!popup) {
      addToast('Popup blocker active. Please allow popups to connect WhatsApp.', 'error');
      setConnecting(false);
      return;
    }
    
    // Render simulated Embedded Signup inside the popup
    popup.document.write(`
      <html>
        <head>
          <title>Facebook Login for Business</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-white font-sans flex flex-col justify-between h-screen p-6">
          <div class="space-y-4">
            <div class="flex items-center gap-2 pb-4 border-b border-slate-800">
              <span class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">f</span>
              <h2 class="text-sm font-bold">Facebook Login for Business</h2>
            </div>
            
            <div class="space-y-3 pt-2">
              <h3 class="text-base font-bold">Connect AIO CRM to WhatsApp</h3>
              <p class="text-xs text-slate-400">By continuing, AIO CRM will receive access to your WhatsApp Business accounts and phone numbers.</p>
              
              <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
                <div>
                  <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Select Business Profile</label>
                  <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none">
                    <option>Digiverse Corp (ID: 9812739281)</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Select WhatsApp Account</label>
                  <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none">
                    <option>Digiverse WhatsApp API Account (waba_991823749)</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Select Phone Number</label>
                  <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none">
                    <option>+1 555-019-2834 (phone_number_id_991)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button onclick="window.close()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold">Cancel</button>
            <button onclick="window.opener.postMessage({ type: 'META_SIGNUP_SUCCESS', code: 'mock_auth_code_sandbox' }, '*'); window.close()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20">Finish Setup</button>
          </div>
        </body>
      </html>
    `);
    
    // Listen for callback code from popup
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'META_SIGNUP_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        
        try {
          const resp = await fetch(`${API_BASE}/integrations/whatsapp/connect`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ code: event.data.code })
          });
          
          const result = await resp.json();
          if (resp.ok && result.success) {
            addToast('WhatsApp connected successfully!', 'success');
            fetchStatus();
          } else {
            addToast(result.message || 'Failed to complete connection', 'error');
          }
        } catch {
          addToast('Network error while connecting WhatsApp', 'error');
        } finally {
          setConnecting(false);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your WhatsApp account? This will revoke access.')) {
      return;
    }
    try {
      setDisconnecting(true);
      const res = await fetch(`${API_BASE}/integrations/whatsapp/disconnect`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        addToast('WhatsApp disconnected successfully', 'success');
        setStatus({ connected: false });
      } else {
        addToast('Failed to disconnect WhatsApp', 'error');
      }
    } catch (err) {
      addToast('Error disconnecting WhatsApp', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  // Handle Sync Templates
  const handleSyncTemplates = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`${API_BASE}/integrations/whatsapp/sync-templates`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        addToast('WhatsApp templates synced successfully!', 'success');
      } else {
        addToast('Failed to sync templates', 'error');
      }
    } catch {
      addToast('Error syncing templates', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to Integrations */}
      <button
        onClick={() => navigate('/admin/integrations')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Integrations Hub
      </button>

      {/* Page Header */}
      <PageHeader
        title="WhatsApp API Control Center"
        subtitle="Secure Meta Embedded Signup onboarding for instant multi-tenant WhatsApp Business communications."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-xs text-slate-400 font-medium">Loading WhatsApp credentials and status...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">WhatsApp Business API</h2>
                      <p className="text-xs text-slate-400">Complete multi-tenant embedded signup integration</p>
                    </div>
                  </div>
                  <span className={`badge py-1.5 px-3 rounded-full text-xs font-semibold ${
                    status.connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                  }`}>
                    {status.connected ? '✓ Connected' : 'Not Connected'}
                  </span>
                </div>

                {status.connected ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500">Business Name:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{status.business_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500">WABA ID:</span>
                        <span className="font-bold text-slate-850 dark:text-slate-300 font-mono">{status.waba_id}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500">Phone Number ID:</span>
                        <span className="font-bold text-slate-850 dark:text-slate-300 font-mono">{status.phone_number_id}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500">Display Phone Number:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{status.display_phone_number}</span>
                      </div>
                      {status.created_at && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-500">Connected Since:</span>
                          <span className="text-slate-600 dark:text-slate-350">{new Date(status.created_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={handleSyncTemplates}
                        disabled={syncing}
                        className="btn-outline py-2 px-4 text-xs font-semibold flex items-center gap-2"
                      >
                        {syncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                        Sync Templates
                      </button>
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="btn-outline py-2 px-4 text-xs font-semibold flex items-center gap-2 border-indigo-200 text-indigo-600"
                      >
                        {connecting ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                        Reconnect
                      </button>
                      <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 py-2 px-4 text-xs font-semibold flex items-center gap-2"
                      >
                        <Unplug size={14} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <AlertTriangle className="text-amber-500" size={36} />
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp Not Connected</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Connect your WhatsApp Business profile in a single click using Meta's Embedded Signup login flow.
                      </p>
                    </div>
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/10"
                    >
                      {connecting ? <Loader2 className="animate-spin" size={14} /> : <MessageCircle size={14} />}
                      Connect WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-500" />
                  Embedded Signup Features
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  FastAPI routes automatically receive the temporary authorization code, exchanges it with Meta using system app details, and creates isolation credentials for this tenant.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-[10px] space-y-2 border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-500 block mb-1">Webhook Subscriptions:</span>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>messages</span>
                    <span className="text-emerald-500 font-bold">Subscribed</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>message_status</span>
                    <span className="text-emerald-500 font-bold">Subscribed</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>message_template_status_update</span>
                    <span className="text-emerald-500 font-bold">Subscribed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
