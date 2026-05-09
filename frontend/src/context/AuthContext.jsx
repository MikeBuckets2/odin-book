import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('orbit_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('orbit_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) localStorage.setItem('orbit_token', token);
    else localStorage.removeItem('orbit_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('orbit_user', JSON.stringify(user));
    else localStorage.removeItem('orbit_user');
  }, [user]);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.data.user);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, []);

  const saveAuth = (data) => {
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    saveAuth(res.data);
    return res.data;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    saveAuth(res.data);
    return res.data;
  };

  const guestLogin = async () => {
    const res = await authApi.guest();
    saveAuth(res.data);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated, login, register, guestLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};