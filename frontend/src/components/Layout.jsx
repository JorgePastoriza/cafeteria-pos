// src/components/Layout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS_ADMIN = [
  { path: '/pos', icon: '🛒', label: 'Punto de Venta' },
  { path: '/cierre', icon: '📊', label: 'Cierre Diario' },
  { path: '/dashboard', icon: '📈', label: 'Dashboard' },
  { path: '/productos', icon: '☕', label: 'Productos' },
  { path: '/stock', icon: '📦', label: 'Stock' },
  { path: '/ventas', icon: '📋', label: 'Historial Ventas' },
  { path: '/usuarios', icon: '👥', label: 'Usuarios' },
];

const NAV_ITEMS_CAJERO = [
  { path: '/pos', icon: '🛒', label: 'Punto de Venta' },
  { path: '/cierre', icon: '📊', label: 'Cierre Diario' },
  { path: '/stock', icon: '📦', label: 'Stock' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = isAdmin() ? NAV_ITEMS_ADMIN : NAV_ITEMS_CAJERO;

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Cerrar sidebar con Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Bloquear scroll del body cuando el sidebar está abierto en mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  // Obtener título de la página actual
  const currentPage = [...NAV_ITEMS_ADMIN, ...NAV_ITEMS_CAJERO]
    .find(item => location.pathname === item.path);

  return (
    <div className="layout">

      {/* ── TOPBAR (solo mobile) ── */}
      <header className="topbar">
        <button
          className="topbar-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <span className="topbar-title">
          {currentPage ? `${currentPage.icon} ${currentPage.label}` : '☕ CaféPOS'}
        </span>
        <div className="topbar-user" title={user?.name}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </header>

      {/* ── OVERLAY ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-text">
            <h1>☕ CaféPOS</h1>
            <p>Sistema de ventas</p>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm w-full" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
