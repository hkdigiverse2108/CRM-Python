import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function MetaOAuthCallback() {
  const { addToast, token, tenantId } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [phase, setPhase] = useState('exchanging'); // 'exchanging' | 'success' | 'error'
  const [message, setMessage] = useState('Exchanging authorization code...');
  const [details, setDetails] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React strict mode
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle Meta OAuth error (user denied permissions, etc.)
    if (error) {
      setPhase('error');
      setMessage(errorDescription || 'Authorization was denied or an error occurred.');
      return;
    }

    if (!code) {
      setPhase('error');
      setMessage('No authorization code received from Meta. Please try again.');
      return;
    }

    // Validate CSRF state token
    const storedState = sessionStorage.getItem('meta_oauth_state');
    if (storedState && state && !state.startsWith(storedState.split(':')[0])) {
      setPhase('error');
      setMessage('State mismatch. Possible CSRF attack detected. Please try reconnecting.');
      return;
    }

    // Exchange the code for an access token
    exchangeCode(code, state);
  }, []);

  const exchangeCode = async (code, state) => {
    try {
      setPhase('exchanging');
      setMessage('Exchanging authorization code with Meta...');

      const resp = await fetch(`${API_BASE}/meta/oauth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || 'rapidmodel_corp',
        },
        body: JSON.stringify({ code, state: state || '' }),
      });

      const data = await resp.json();

      if (data.success) {
        setPhase('success');
        setMessage('Meta platforms connected successfully!');
        setDetails(data.data);
        addToast('Meta integration connected! All platforms are now linked.', 'success');

        // Clean up state token
        sessionStorage.removeItem('meta_oauth_state');

        // Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate('/admin/integrations/meta', { replace: true });
        }, 3000);
      } else {
        setPhase('error');
        setMessage(data.message || 'Failed to connect Meta integration.');
      }
    } catch (err) {
      setPhase('error');
      setMessage('Network error during token exchange. Please check your backend server.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-purple-500/10 to-blue-500/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {phase === 'exchanging' && (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
          )}
          {phase === 'success' && (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <CheckCircle2 size={28} className="text-white" />
            </div>
          )}
          {phase === 'error' && (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <XCircle size={28} className="text-white" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-extrabold text-white text-center mb-2">
          {phase === 'exchanging' && 'Connecting Meta Platforms...'}
          {phase === 'success' && 'Connection Successful!'}
          {phase === 'error' && 'Connection Failed'}
        </h1>

        {/* Message */}
        <p className="text-sm text-slate-400 text-center mb-6">{message}</p>

        {/* Success Details */}
        {phase === 'success' && details?.platforms_discovered && (
          <div className="space-y-2 mb-6">
            {Object.entries(details.platforms_discovered).map(([key, count]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs"
              >
                <span className="text-slate-300 font-medium capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className={`font-bold ${count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {count} discovered
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Loading bar animation */}
        {phase === 'exchanging' && (
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[loading_2s_ease-in-out_infinite]"
              style={{ width: '60%', animation: 'loading 2s ease-in-out infinite' }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          {phase === 'success' && (
            <button
              onClick={() => navigate('/admin/integrations/meta', { replace: true })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/15"
            >
              View Integration Hub
              <ArrowRight size={14} />
            </button>
          )}
          {phase === 'error' && (
            <>
              <button
                onClick={() => navigate('/admin/integrations/meta', { replace: true })}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all border border-slate-700"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setPhase('exchanging');
                  setMessage('Retrying...');
                  window.location.href = '/admin/integrations/meta';
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/15"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        {/* Auto-redirect notice */}
        {phase === 'success' && (
          <p className="text-[10px] text-slate-600 text-center mt-4">
            Redirecting to Integration Hub in 3 seconds...
          </p>
        )}
      </div>

      {/* Loading animation keyframes */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(60%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
