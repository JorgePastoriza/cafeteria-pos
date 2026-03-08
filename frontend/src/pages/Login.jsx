// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const { slug } = useParams();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState(false);

  // Redirigir si ya está logueado
  useEffect(() => {
    if (user) navigate(`/${slug}/pos`, { replace: true });
  }, [user, slug, navigate]);

  // Cargar info del tenant
  useEffect(() => {
    if (!slug) return;
    setTenantLoading(true);
    tenantAPI.getInfo(slug)
      .then(res => {
        setTenantInfo(res.data);
        // Aplicar color del tenant en la página de login
        if (res.data.primary_color) {
          document.documentElement.style.setProperty('--accent', res.data.primary_color);
        }
        if (res.data.name) document.title = `${res.data.name} | Login`;
      })
      .catch(() => setTenantError(true))
      .finally(() => setTenantLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Completá todos los campos'); return; }
    setLoading(true);
    try {
      const { user: u } = await login(slug, email, password);
      toast.success(`¡Bienvenido, ${u.name}!`);
      navigate(`/${slug}/pos`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="login-page">
        <div style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          <div className="spinner" style={{ borderTopColor: 'var(--accent)', margin: '0 auto 12px' }} />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--espresso)', marginBottom: 8 }}>
            Comercio no encontrado
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            El comercio <strong>"{slug}"</strong> no existe o no está activo.
          </p>
        </div>
      </div>
    );
  }

  const accentColor = tenantInfo?.primary_color || 'var(--accent)';

  return (
    <div className="login-page" style={{ background: 'var(--espresso)' }}>
      {/* Decoración de fondo */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
        top: -100, right: -100
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
        bottom: -50, left: -50
      }} />

      <div className="login-card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="login-logo">
          {tenantInfo?.logo_url ? (
            <img
              src={tenantInfo.logo_url}
              alt={tenantInfo.name}
              style={{ height: 72, maxWidth: 200, objectFit: 'contain', marginBottom: 8 }}
            />
          ) : (
            <div className="coffee-icon">☕</div>
          )}
          <h1 style={{ color: 'var(--espresso)', fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 8 }}>
            {tenantInfo?.name || 'CaféPOS'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Sistema de Punto de Venta
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email" className="form-control"
              placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              autoFocus autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password" className="form-control"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 8, background: accentColor }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Ingresando...</> : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Powered by <strong>CaféPOS</strong>
        </div>
      </div>
    </div>
  );
}
