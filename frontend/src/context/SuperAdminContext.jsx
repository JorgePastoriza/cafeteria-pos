// src/context/SuperAdminContext.jsx
import { createContext, useContext, useState } from 'react';
import { superAdminAPI } from '../services/api';

const SuperAdminContext = createContext(null);

export function SuperAdminProvider({ children }) {
  const [superAdmin, setSuperAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('superAdmin')); } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await superAdminAPI.login({ email, password });
    const { token, superAdmin: sa } = res.data;
    localStorage.setItem('saToken', token);
    localStorage.setItem('superAdmin', JSON.stringify(sa));
    // Usar el mismo interceptor de axios pero con clave diferente
    // Guardamos en 'token' temporalmente para el interceptor
    localStorage.setItem('token', token);
    setSuperAdmin(sa);
    return sa;
  };

  const logout = () => {
    localStorage.removeItem('saToken');
    localStorage.removeItem('superAdmin');
    localStorage.removeItem('token');
    setSuperAdmin(null);
  };

  return (
    <SuperAdminContext.Provider value={{ superAdmin, login, logout }}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export const useSuperAdmin = () => useContext(SuperAdminContext);
