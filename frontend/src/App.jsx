// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SuperAdminProvider, useSuperAdmin } from './context/SuperAdminContext';

// Pages Tenant
import Login from './pages/Login';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Stock from './pages/Stock';
import Ventas from './pages/Ventas';
import Usuarios from './pages/Usuarios';
import Cierre from './pages/Cierre';
import Layout from './components/Layout';

// Pages Super Admin
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

// ── Guards ──
function TenantProtectedRoute({ adminOnly = false }) {
  const { user } = useAuth();
  const { slug } = useParams();
  if (!user) return <Navigate to={`/${slug}/login`} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to={`/${slug}/pos`} replace />;
  return <Outlet />;
}

function SuperAdminProtectedRoute() {
  const { superAdmin } = useSuperAdmin();
  if (!superAdmin) return <Navigate to="/superadmin/login" replace />;
  return <Outlet />;
}

// ── Tenant layout wrapper ──
function TenantLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SuperAdminProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <Routes>
              {/* Raíz → redirigir */}
              <Route path="/" element={<Navigate to="/superadmin/login" replace />} />

              {/* ── SUPER ADMIN ── */}
              <Route path="/superadmin/login" element={<SuperAdminLogin />} />
              <Route element={<SuperAdminProtectedRoute />}>
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
              </Route>

              {/* ── TENANT: Login (sin auth) ── */}
              <Route path="/:slug/login" element={<Login />} />

              {/* ── TENANT: Rutas protegidas ── */}
              <Route element={<TenantProtectedRoute />}>
                <Route element={<TenantLayout />}>
                  <Route path="/:slug/pos" element={<POS />} />
                  <Route path="/:slug/cierre" element={<Cierre />} />
                  <Route element={<TenantProtectedRoute adminOnly />}>
                    <Route path="/:slug/dashboard" element={<Dashboard />} />
                    <Route path="/:slug/productos" element={<Productos />} />
                    <Route path="/:slug/categorias" element={<Categorias />} />
                    <Route path="/:slug/ventas" element={<Ventas />} />
                    <Route path="/:slug/usuarios" element={<Usuarios />} />
                  </Route>
                  {/* Stock: todos */}
                  <Route path="/:slug/stock" element={<Stock />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </SuperAdminProvider>
    </BrowserRouter>
  );
}
