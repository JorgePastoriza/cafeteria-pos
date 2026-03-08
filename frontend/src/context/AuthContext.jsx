// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, tenantAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [tenant, setTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tenant')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // Aplicar tema del tenant (colores dinámicos)
  const applyTheme = useCallback((t) => {
    if (!t?.primary_color) return;
    const root = document.documentElement;
    const hex = t.primary_color;
    root.style.setProperty('--accent', hex);
    // Generar versión oscura del color
    const darken = (h) => {
      const n = parseInt(h.slice(1), 16);
      const r = Math.max(0, (n >> 16) - 30);
      const g = Math.max(0, ((n >> 8) & 0xff) - 20);
      const b = Math.max(0, (n & 0xff) - 15);
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };
    root.style.setProperty('--accent-dark', darken(hex));
    // Favicon / título
    if (t.name) document.title = `${t.name} | POS`;
  }, []);

  useEffect(() => {
    if (tenant) applyTheme(tenant);
  }, [tenant, applyTheme]);

  const login = async (slug, email, password) => {
    const res = await authAPI.login(slug, { email, password });
    const { token, user: u, tenant: t } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('tenant', JSON.stringify(t));
    localStorage.setItem('slug', slug);
    setUser(u);
    setTenant(t);
    applyTheme(t);
    return { user: u, tenant: t };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    // NO borrar slug para redirigir bien
    setUser(null);
    setTenant(null);
    // Resetear tema
    document.documentElement.style.setProperty('--accent', '#e8a045');
    document.documentElement.style.setProperty('--accent-dark', '#c4872a');
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
