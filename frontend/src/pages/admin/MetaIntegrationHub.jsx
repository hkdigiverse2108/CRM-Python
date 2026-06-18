import { useState, useEffect, useCallback } from 'react';
import { useApp, getTenantId } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, Megaphone, ShoppingBag, Camera, BarChart3,
  Shield, CheckCircle2, XCircle, ExternalLink, Unplug, RefreshCw,
  Loader2, ChevronRight, Globe, Zap, AlertTriangle, Users,
  FileText, Layers, ArrowLeft, Settings
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Platform configs for the 5 Meta integrations
const META_PLATFORMS = [
  {
    id: 'whatsapp',
    key: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Send and receive automated messages, run support chats, and broadcast notifications.',
    icon: MessageCircle,
    gradient: 'from-emerald-500 to-green-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    assetLabel: 'Business Accounts',
  },
  {
    id: 'facebook_pages',
    key: 'facebook_pages',
    name: 'Facebook Pages',
    description: 'Manage brand pages, capture DMs, monitor comments, and trigger auto-replies.',
    icon: Megaphone,
    gradient: 'from-blue-500 to-blue-700',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    assetLabel: 'Pages',
  },
  {
    id: 'facebook_lead_forms',
    key: 'facebook_lead_forms',
    name: 'Facebook Lead Forms',
    description: 'Instantly sync lead form responses into the CRM pipeline.',
    icon: FileText,
    gradient: 'from-indigo-500 to-blue-600',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    assetLabel: 'Lead Forms',
  },
  {
    id: 'instagram',
    key: 'instagram',
    name: 'Instagram Business',
    description: 'Sync Instagram messages, handle comments, and automate comment-to-lead responses.',
    icon: Camera,
    gradient: 'from-pink-500 to-purple-600',
    bgLight: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200',
    assetLabel: 'Accounts',
  },
  {
    id: 'meta_ads',
    key: 'meta_ads',
    name: 'Meta Ads',
    description: 'Track ad campaigns, sync leads, configure conversion tracking and Meta Pixel.',
    icon: BarChart3,
    gradient: 'from-violet-500 to-purple-700',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    assetLabel: 'Ad Accounts',
  },
];

export default function MetaIntegrationHub() {
  const { addToast, token, tenantId, logout } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState(null);

  // Developer App Config Editing State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [appIdInput, setAppIdInput] = useState('');
  const [appSecretInput, setAppSecretInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Build headers fresh each call to avoid stale token closures
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || getTenantId() || '96722',
  }), [token, tenantId]);

  // Fetch current Meta integration status
  const fetchStatus = useCallback(async () => {
    if (!token) {
      setStatus({ connected: false, platforms: {} });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE}/meta/status`, { headers: getHeaders() });

      if (resp.status === 401) {
        // Token expired — force re-login
        addToast('Session expired. Please log in again.', 'error');
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const data = await resp.json();
      if (data.success) {
        setStatus(data.data);
        if (data.data) {
          setAppIdInput(data.data.meta_app_id || '');
        }
      } else {
        setStatus({ connected: false, platforms: {} });
      }
    } catch (err) {
      console.error('Failed to fetch Meta status:', err);
      setStatus({ connected: false, platforms: {} });
    } finally {
      setLoading(false);
    }
  }, [token, tenantId, getHeaders]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
      addToast('Meta platforms connected successfully!', 'success');
      navigate(window.location.pathname, { replace: true });
    }
  }, [addToast, navigate]);

  // Handle Meta developer app credentials update
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!appIdInput.trim() || !appSecretInput.trim()) {
      addToast('Please fill in both App ID and App Secret.', 'error');
      return;
    }

    try {
      setSavingConfig(true);
      const resp = await fetch(`${API_BASE}/meta/config`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          app_id: appIdInput.trim(),
          app_secret: appSecretInput.trim(),
        }),
      });

      const data = await resp.json();
      if (data.success) {
        addToast('Meta Developer App credentials updated successfully!', 'success');
        setShowConfigModal(false);
        setAppSecretInput('');
        fetchStatus();
      } else {
        addToast(data.message || 'Failed to update Meta credentials.', 'error');
      }
    } catch (err) {
      addToast('Network error while updating credentials.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };


  // Handle "Connect with Facebook" button click
  const handleConnect = async () => {
    try {
      setConnecting(true);
      const resp = await fetch(`${API_BASE}/meta/oauth/url`, { headers: getHeaders() });

      if (resp.status === 401) {
        addToast('Session expired. Please log in again.', 'error');
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const data = await resp.json();

      if (data.success && data.data?.oauth_url) {
        // Store state token for CSRF validation on callback
        sessionStorage.setItem('meta_oauth_state', data.data.state);
        // Redirect to Meta OAuth
        window.location.href = data.data.oauth_url;
      } else {
        addToast('Failed to generate Meta OAuth URL. Check your Meta App configuration.', 'error');
      }
    } catch (err) {
      addToast('Network error. Please check your backend server.', 'error');
    } finally {
      setConnecting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const resp = await fetch(`${API_BASE}/meta/disconnect`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (resp.status === 401) {
        addToast('Session expired. Please log in again.', 'error');
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const data = await resp.json();
      if (data.success) {
        addToast('Meta integration disconnected successfully.', 'success');
        setStatus({ connected: false, platforms: {} });
      } else {
        addToast('Failed to disconnect Meta integration.', 'error');
      }
    } catch (err) {
      addToast('Network error during disconnect.', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const [syncing, setSyncing] = useState(false);

  // Handle manual sync of Meta assets
  const handleSync = async () => {
    try {
      setSyncing(true);
      const resp = await fetch(`${API_BASE}/meta/sync`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (resp.status === 401) {
        addToast('Session expired. Please log in again.', 'error');
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const data = await resp.json();
      if (data.success) {
        addToast('Meta resources synchronized successfully!', 'success');
        fetchStatus();
      } else {
        addToast(data.message || 'Failed to sync Meta resources.', 'error');
      }
    } catch (err) {
      addToast('Network error during resource sync.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSetActiveWhatsApp = async (wabaId, phoneNumberId) => {
    try {
      const resp = await fetch(`${API_BASE}/meta/whatsapp/select`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          waba_id: wabaId,
          phone_number_id: phoneNumberId
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        addToast('WhatsApp active sender account updated!', 'success');
        fetchStatus();
      } else {
        addToast(data.message || 'Failed to update WhatsApp configuration.', 'error');
      }
    } catch {
      addToast('Network error while setting active WhatsApp account.', 'error');
    }
  };

  const isConnected = status?.connected || false;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/integrations')}
          className="btn-ghost p-2 rounded-lg"
          title="Back to Integrations"
        >
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          title="Meta Integration Hub"
          subtitle="Connect all Meta platforms with a single OAuth login"
        />
      </div>

      {/* Hero Connection Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 pointer-events-none" />
        
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Info */}
            <div className="flex items-start gap-4 max-w-2xl">
              {/* Meta Logo */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-1">
                  {isConnected ? 'Meta Platforms Connected' : 'Connect Meta Platforms'}
                </h2>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-3">
                  {isConnected
                    ? `Connected to ${status.business_name || 'your Meta Business account'}. All five platforms are linked via a single OAuth session.`
                    : 'Connect WhatsApp Business, Facebook Pages, Lead Forms, Instagram Business, and Meta Ads — all through a single Facebook login. No manual API keys needed.'
                  }
                </p>

                {isConnected && (
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      OAuth Active
                    </span>
                    {status.business_name && (
                      <span className="text-[var(--color-muted-foreground)]">
                        Business: <strong className="text-[var(--color-foreground)]">{status.business_name}</strong>
                      </span>
                    )}
                    {status.connected_at && (
                      <span className="text-[var(--color-muted-foreground)]">
                        Connected: {new Date(status.connected_at).toLocaleString()}
                      </span>
                    )}
                    {status.updated_at && (
                      <span className="text-[var(--color-muted-foreground)] border-l pl-3 border-[var(--color-border)]">
                        Last Sync: {new Date(status.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Action Button */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!isConnected && (
                <button
                  onClick={() => {
                    setAppIdInput(status?.meta_app_id || '');
                    setShowConfigModal(true);
                  }}
                  className="btn-outline py-2.5 px-4 text-xs gap-2"
                >
                  <Settings size={14} />
                  Configure App ID
                </button>
              )}
              {isConnected ? (
                <>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-outline py-2.5 px-4 text-xs gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                    title="Synchronize Meta resources now"
                  >
                    {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="btn-outline py-2.5 px-4 text-xs gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    title="Reconnect and refresh authorization permissions"
                  >
                    {connecting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Reconnect
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="btn-ghost text-red-600 hover:bg-red-50 py-2.5 px-4 text-xs gap-2 border border-red-200"
                  >
                    {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2.5 px-6 py-3 text-white font-bold rounded-xl text-sm transition-all shadow-lg bg-[#1877F2] hover:bg-[#166FE5] shadow-blue-500/25 disabled:opacity-60"
                  title={!status?.app_id_configured ? 'Connect instantly with Simulated Demo mode' : 'Connect to Meta App'}
                >
                  {connecting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                    </svg>
                  )}
                  {connecting ? 'Redirecting...' : 'Connect with Facebook'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="border-t border-[var(--color-border)] px-6 sm:px-8 py-3 flex items-center gap-2 text-[10px] text-[var(--color-muted-foreground)] bg-slate-50/50">
          <Shield size={12} className="text-emerald-600 shrink-0" />
          <span>
            OAuth 2.0 flow via Meta's official API. Your tokens are securely stored and encrypted. No passwords are shared.
          </span>
        </div>
      </div>

      {/* Setup Credentials Banner */}
      {!isConnected && !status?.app_id_configured && (
        <div className="flex gap-2.5 p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs leading-relaxed animate-fadeIn">
          <Zap size={16} className="text-blue-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <strong>Instant Demo Connection Active:</strong> No developer credentials are set. You can click 
            <strong className="text-blue-950 mx-1">"Connect with Facebook"</strong> 
            above to immediately connect using <strong>Simulated Sandbox mode</strong> for testing. 
            To use a real production app instead, click 
            <button 
              onClick={() => {
                setAppIdInput(status?.meta_app_id || '');
                setShowConfigModal(true);
              }}
              className="mx-1 underline font-bold text-blue-950 hover:text-black"
            >
              Configure App ID
            </button> 
            to enter your Meta Developer credentials.
          </div>
        </div>
      )}

      {/* Permissions Info */}
      {!isConnected && status?.app_id_configured && (
        <div className="flex gap-2.5 p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs leading-relaxed">
          <Zap size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Permissions Requested:</strong> When you click "Connect with Facebook", Meta will ask you to grant permissions for 
            WhatsApp Business Management, Page Messaging, Lead Form Retrieval, Ads Management, and Instagram Messaging.
            You can review and modify permissions in your{' '}
            <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              Meta Business Settings <ExternalLink size={10} className="inline" />
            </a>.
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
          <span className="ml-3 text-sm text-[var(--color-muted-foreground)]">Loading integration status...</span>
        </div>
      )}

      {/* Platform Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {META_PLATFORMS.map((platform) => {
            const platformData = status?.platforms?.[platform.key] || { connected: false, assets: [] };
            const Icon = platform.icon;
            const assetCount = platform.key === 'whatsapp' && (platformData.phone_numbers || []).length > 0
              ? (platformData.phone_numbers || []).length
              : (platformData.assets?.length || 0);
            const platformConnected = platformData.connected && isConnected;

            return (
              <div
                key={platform.id}
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  platformConnected
                    ? `${platform.borderColor} shadow-sm`
                    : 'border-[var(--color-border)] opacity-75'
                } bg-[var(--color-card)]`}
              >
                {/* Card Header with gradient strip */}
                <div className={`h-1 bg-gradient-to-r ${platform.gradient} ${!platformConnected ? 'opacity-30' : ''}`} />
                
                <div className="p-5">
                  {/* Icon + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${platform.bgLight} ${platform.textColor} flex items-center justify-center border ${platform.borderColor}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      platformConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {platformConnected ? (
                        <>
                          <CheckCircle2 size={10} />
                          Connected
                        </>
                      ) : (
                        <>
                          <XCircle size={10} />
                          Not Connected
                        </>
                      )}
                    </span>
                  </div>

                  {/* Name & Description */}
                  <h3 className="font-semibold text-sm text-[var(--color-foreground)] mb-1">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed mb-4">
                    {platform.description}
                  </p>

                  {/* Connected Assets List */}
                  {platformConnected && assetCount > 0 && (
                    <div className="border-t border-[var(--color-border)] pt-3 mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[var(--color-muted-foreground)] tracking-wider flex items-center gap-1">
                          <Layers size={10} />
                          {platform.assetLabel} ({assetCount})
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {platform.key === 'whatsapp' && (platformData.phone_numbers || []).length > 0 ? (
                          (platformData.phone_numbers || []).map((phone, idx) => {
                            const isActive = platformData.active_phone_number_id === phone.id;
                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                                  isActive
                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-900 font-semibold dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-450'
                                    : 'bg-slate-50 border-slate-100 text-[var(--color-foreground)] dark:bg-slate-900/50 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350 dark:bg-slate-700'}`} />
                                  <span className="truncate">
                                    {phone.display_name || phone.phone_number}
                                    <span className="text-[9px] text-slate-400 font-normal ml-1.5">
                                      (WABA: {phone.waba_id})
                                    </span>
                                  </span>
                                </div>
                                {isActive ? (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold dark:bg-emerald-900/50 dark:text-emerald-300">
                                    Active
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetActiveWhatsApp(phone.waba_id, phone.id)}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    Set Active
                                  </button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          platformData.assets.map((asset, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs dark:bg-slate-900/50 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-[var(--color-foreground)] font-medium truncate">
                                  {asset.name || asset.username || asset.id}
                                  {asset.business_id && (
                                    <span className="text-[9px] text-slate-400 font-normal ml-1.5">
                                      (Biz: {asset.business_id})
                                    </span>
                                  )}
                                </span>
                              </div>
                              {asset.followers != null && (
                                <span className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-1 shrink-0 ml-2">
                                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current inline mr-0.5 text-slate-400">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                  </svg>
                                  {Number(asset.followers).toLocaleString()}
                                </span>
                              )}
                              {asset.currency && (
                                <span className="text-[10px] text-[var(--color-muted-foreground)] shrink-0 ml-2">
                                  {asset.currency}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {platformConnected && assetCount === 0 && (
                    <div className="border-t border-[var(--color-border)] pt-3 mt-3">
                      <p className="text-[10px] text-[var(--color-muted-foreground)] italic text-center py-2 flex items-center justify-center gap-1.5">
                        <AlertTriangle size={11} />
                        No {platform.assetLabel.toLowerCase()} discovered. Configure in Meta Business Suite.
                      </p>
                    </div>
                  )}

                  {/* Not Connected Hint */}
                  {!platformConnected && (
                    <div className="border-t border-[var(--color-border)] pt-3 mt-3">
                      <p className="text-[10px] text-[var(--color-muted-foreground)] text-center py-1">
                        {isConnected
                          ? `No ${platform.assetLabel.toLowerCase()} found in your Meta account.`
                          : 'Click "Connect with Facebook" above to enable this platform.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How It Works Section */}
      {!isConnected && !loading && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h3 className="font-bold text-sm text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <Globe size={16} className="text-[var(--color-primary)]" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Click Connect', desc: 'Press "Connect with Facebook" to start the OAuth flow.' },
              { step: '2', title: 'Grant Permissions', desc: 'Approve requested permissions on the Meta OAuth screen.' },
              { step: '3', title: 'Auto-Discovery', desc: 'We automatically discover your Pages, WABA, Ads, & Instagram.' },
              { step: '4', title: 'Ready to Go', desc: 'All five platforms are connected and synced instantly.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-foreground)]">{item.title}</h4>
                  <p className="text-[10px] text-[var(--color-muted-foreground)] leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Meta Developer Credentials Configuration Modal */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div 
            className="modal-content w-full max-w-md p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings size={18} className="text-blue-500" />
                Configure Meta Developer App
              </h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta App ID
                </label>
                <input
                  type="text"
                  required
                  value={appIdInput}
                  onChange={(e) => setAppIdInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. 15928374928374"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta App Secret
                </label>
                <input
                  type="password"
                  required
                  value={appSecretInput}
                  onChange={(e) => setAppSecretInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter your Meta App Secret"
                />
              </div>

              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed space-y-1">
                <p className="font-semibold text-slate-300">How to get credentials:</p>
                <p>1. Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Meta Developer Dashboard</a></p>
                <p>2. Select/Create your App &rarr; Go to App Settings &rarr; Basic</p>
                <p>3. Copy App ID and App Secret into the fields above</p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-xs transition-colors border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg shadow-blue-500/10 disabled:opacity-60"
                >
                  {savingConfig && <Loader2 size={12} className="animate-spin" />}
                  {savingConfig ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
