import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldAlert, ClipboardCheck, MessageSquareText } from 'lucide-react';
import API from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { username, password });
      const { role, permissions = [] } = res.data.admin;
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminName',  res.data.admin.name);
      localStorage.setItem('adminRole',  role);
      localStorage.setItem('adminPermissions', JSON.stringify(permissions));

      // Land on the first section this account actually has access to
      const canSeeDashboard = role === 'superadmin' || permissions.includes('dashboard');
      navigate(canSeeDashboard ? '/admin' : permissions.includes('complaints') ? '/admin/complaints' : '/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ── Left panel — branding ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center p-12">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 bg-white">
            <img src="/logo-mh.jpg" alt="Marwari Hospital" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-semibold text-white leading-tight mb-1">
            Marwari Hospital
          </h1>
          <p className="text-slate-400 text-sm font-medium mb-10 tracking-wide uppercase">
            Internal Review System
          </p>
          <div className="space-y-4 text-left">
            {[
              { Icon: ClipboardCheck,      text: 'Capture patient feedback instantly' },
              { Icon: ShieldAlert,         text: 'Track complaints and resolutions' },
              { Icon: MessageSquareText,   text: 'Automated WhatsApp review requests' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ─────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile header (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4">
              <img src="/logo-mh.jpg" alt="Marwari Hospital" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Marwari Hospital</h1>
            <p className="text-slate-500 text-sm mt-0.5">Internal Review System</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
              <p className="text-slate-500 text-sm mt-1">Use your assigned username and password</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Marwari Hospital · Internal Use Only
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
