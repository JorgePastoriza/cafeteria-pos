// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import POS from './pages/POS';
import Cierre from './pages/Cierre';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Stock from './pages/Stock';
import Ventas from './pages/Ventas';
import Usuarios from './pages/Usuarios';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/pos" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/pos" /> : <Login />} />

      <Route path="/pos" element={
        <ProtectedRoute>
          <CartProvider>
            <Layout><POS /></Layout>
          </CartProvider>
        </ProtectedRoute>
      } />

      <Route path="/cierre" element={
        <ProtectedRoute>
          <Layout><Cierre /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute adminOnly>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/productos" element={
        <ProtectedRoute adminOnly>
          <Layout><Productos /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/stock" element={
        <ProtectedRoute>
          <Layout><Stock /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/ventas" element={
        <ProtectedRoute adminOnly>
          <Layout><Ventas /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/usuarios" element={
        <ProtectedRoute adminOnly>
          <Layout><Usuarios /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={user ? "/pos" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'DM Sans, sans-serif',
              borderRadius: '10px',
              background: '#1a0a00',
              color: '#f5e6d3'
            },
            success: { iconTheme: { primary: '#4caf7d', secondary: '#f5e6d3' } },
            error: { iconTheme: { primary: '#e05252', secondary: '#f5e6d3' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
