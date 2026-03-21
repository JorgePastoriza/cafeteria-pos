// src/components/Layout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user, tenant, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NAV_ITEMS_ADMIN = [
    { path: `/${slug}/pos`, icon: '🛒', label: 'Punto de Venta' },
    { path: `/${slug}/cierre`, icon: '📊', label: 'Cierre Diario' },
    { path: `/${slug}/dashboard`, icon: '📈', label: 'Dashboard' },
    { path: `/${slug}/productos`, icon: '☕', label: 'Productos' },
    { path: `/${slug}/categorias`, icon: '🏷️', label: 'Categorías' },
    { path: `/${slug}/stock`, icon: '📦', label: 'Stock' },
    { path: `/${slug}/ventas`, icon: '📋', label: 'Historial Ventas' },
    { path: `/${slug}/usuarios`, icon: '👥', label: 'Usuarios' },
    { path: `/${slug}/configuracion`, icon: '⚙️', label: 'Configuración' },  // ← NUEVO
  ];

  const NAV_ITEMS_CAJERO = [
    { path: `/${slug}/pos`, icon: '🛒', label: 'Punto de Venta' },
    { path: `/${slug}/cierre`, icon: '📊', label: 'Cierre Diario' },
    { path: `/${slug}/stock`, icon: '📦', label: 'Stock' },
  ];

  const navItems = isAdmin() ? NAV_ITEMS_ADMIN : NAV_ITEMS_CAJERO;

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate(`/${slug}/login`);
  };

  const accentColor = tenant?.primary_color || 'var(--accent)';

  return (
    <div className="layout">
      {/* ── TOPBAR mobile ── */}
      <header className="topbar">
        <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">☰</button>
        <span className="topbar-title">
          {tenant?.logo_url
            ? <img src={tenant.logo_url} alt={tenant.name} style={{ height: 28, maxWidth: 120, objectFit: 'contain', verticalAlign: 'middle' }} onError={e => { e.target.style.display = 'none'; }} />
            : (tenant?.name || '☕ CaféPOS')}
        </span>
        <div className="topbar-user" style={{ background: accentColor }} title={user?.name}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </header>

      {/* ── OVERLAY ── */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-text">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name}
                style={{ height: 32, maxWidth: 140, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <>
                <h1 style={{ color: accentColor }}>{tenant?.name || '☕ CaféPOS'}</h1>
                <p>Sistema de ventas</p>
              </>
            )}
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Cerrar">✕</button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => isActive ? { background: accentColor, color: '#1a0a00' } : {}}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" style={{ background: accentColor }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm w-full" onClick={handleLogout}>🚪 Cerrar Sesión</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">{children}</main>
    </div>
  );
}
