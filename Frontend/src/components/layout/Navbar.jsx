import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const roleColor = user?.role === 'CUSTOMER'
    ? 'from-purple-500 to-pink-500'
    : 'from-brand-500 to-cyan-500';

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-surface-900/80 backdrop-blur-lg flex items-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-auto">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="font-bold text-slate-100 tracking-tight">
          CodeNCoffe <span className="gradient-text">Support</span>
        </span>
      </div>

      {/* Right */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-200">{user.name}</span>
            <span className="text-xs text-slate-500">{user.role}</span>
          </div>
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
            {initials}
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="btn-ghost text-slate-500 hover:text-red-400 px-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
