// src/components/Layout.jsx
import { NavLink, useNavigate } from 'react-router-dom';
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

  const navItems = isAdmin() ? NAV_ITEMS_ADMIN : NAV_ITEMS_CAJERO;

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>☕ CaféPOS</h1>
          <p>Sistema de ventas</p>
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

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
