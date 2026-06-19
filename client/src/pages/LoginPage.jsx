import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
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
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminName',  res.data.admin.name);
      localStorage.setItem('adminRole',  res.data.admin.role);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"/>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"/>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-500/20 rounded-full -translate-x-1/2 -translate-y-1/2"/>

        <div className="relative z-10 text-center">
          <div className="w-28 h-28 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl">
            <span className="text-6xl">🏥</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight mb-3">
            Marwari Hospital
          </h1>
          <p className="text-blue-200 text-lg font-medium mb-8">
            Internal Review System
          </p>
          <div className="space-y-3">
            {[
              { icon: '⭐', text: 'Capture patient feedback instantly' },
              { icon: '📊', text: 'Track complaints & resolutions' },
              { icon: '💬', text: 'Auto WhatsApp review requests' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-blue-100 text-sm">
                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ─────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">

          {/* Mobile header (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🏥</span>
            </div>
            <h1 className="text-2xl font-black text-gray-800">Marwari Hospital</h1>
            <p className="text-gray-500 text-sm mt-1">Internal Review System</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-800">Welcome back</h2>
              <p className="text-gray-400 text-sm mt-1">Sign in to your admin account</p>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <span className="text-red-500 text-lg flex-shrink-0">⚠</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} autocomplete="off" className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Password — NO default value, show/hide toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-12 py-3.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Signing in...
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-300 mt-6">
              Marwari Hospital · Internal Use Only
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}