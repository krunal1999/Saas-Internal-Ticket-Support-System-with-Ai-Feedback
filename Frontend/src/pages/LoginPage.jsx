import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

const DEMO_AGENTS = [
  { label: 'Admin', email: 'admin@support.com', password: 'password123' },
  { label: 'Agent Priya', email: 'priya@support.com', password: 'password123' },
];
const DEMO_CUSTOMERS = [
  { label: 'Amit Verma', email: 'amit@acmecorp.com', password: 'password123' },
  { label: 'Sneha Patil', email: 'sneha@techstart.io', password: 'password123' },
];

export default function LoginPage() {
  const [tab, setTab]       = useState('AGENT');   // 'AGENT' | 'CUSTOMER'
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();

  const fillDemo = (d) => { setEmail(d.email); setPassword(d.password); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password, tab);
      navigate(user.role === 'CUSTOMER' ? '/customer' : '/agent');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoCreds = tab === 'AGENT' ? DEMO_AGENTS : DEMO_CUSTOMERS;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 bg-mesh p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-4">
            <span className="text-white font-black text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Code<span className="gradient-text">N</span>Coffe
          </h1>
          <p className="text-slate-500 text-sm mt-1">Support Ticket System</p>
        </div>

        {/* Card */}
        <div className="glass p-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-7">
            {['AGENT', 'CUSTOMER'].map((t) => (
              <button
                key={t}
                id={`tab-${t.toLowerCase()}`}
                onClick={() => { setTab(t); setError(''); setEmail(''); setPassword(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'AGENT' ? '🛡️ Agent Login' : '👤 Customer Login'}
              </button>
            ))}
          </div>

          {/* Demo quick-fill */}
          <div className="mb-5">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Quick fill demo account</p>
            <div className="flex flex-wrap gap-2">
              {demoCreds.map((d) => (
                <button
                  key={d.email}
                  id={`demo-${d.label.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => fillDemo(d)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 transition-all"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <input
                id="email-input"
                type="email"
                className="input"
                placeholder={tab === 'AGENT' ? 'admin@support.com' : 'customer@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                id="password-input"
                type="password"
                className="input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn-primary w-full py-3 text-base mt-2"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Signing in...' : `Sign in as ${tab === 'AGENT' ? 'Agent' : 'Customer'}`}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          All demo passwords: <span className="text-slate-400 font-mono">password123</span>
        </p>
      </div>
    </div>
  );
}
