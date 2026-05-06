import { createContext, useContext, useState, useEffect } from 'react';
import { loginAgent, loginCustomer, getMe } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On mount: restore session
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (stored && storedUser) {
        setToken(stored);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (email, password, role) => {
    const fn = role === 'CUSTOMER' ? loginCustomer : loginAgent;
    const { data } = await fn({ email, password });
    const { token: t, user: u } = data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
