import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Lock, Mail, Building, ChevronDown, Check, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const savedUser = JSON.parse(localStorage.getItem('auth-user') || '{}');
      if (savedUser.role === 'super_admin') {
        navigate('/admin/super-admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const userInfo = await login(email, password);
      if (userInfo.role === 'super_admin') {
        navigate('/admin/super-admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden select-none font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-fuchsia-500/10 to-indigo-500/20 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        
        {/* Header/Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 animate-[pulse_2s_infinite]">
            <span className="text-white text-lg font-black tracking-tighter">A</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AIO CRM Platform</h1>
          <p className="text-slate-400 text-xs mt-2 font-medium">Enterprise multi-tenant customer relationship hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-650 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-650 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-95 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 outline-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Info Footnote */}
        <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-800/60 pt-4">
          <p>Super Admin: <code className="text-slate-400">superadmin@rapidmodel.ai</code></p>
          <p className="mt-1">Workspace Admin: <code className="text-slate-400">hk@gmail.com</code> (workspace <code className="text-slate-400">71110</code>)</p>
        </div>

      </div>
    </div>
  );
}
