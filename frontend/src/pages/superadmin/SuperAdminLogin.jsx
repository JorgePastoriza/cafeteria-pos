// src/pages/superadmin/SuperAdminLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import toast from 'react-hot-toast';

export default function SuperAdminLogin() {
  const { login, superAdmin } = useSuperAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (superAdmin) navigate('/superadmin/dashboard', { replace: true });
  }, [superAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenido al panel maestro');
      navigate('/superadmin/dashboard');
    } catch {
      toast.error('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0500 0%, #1a0a00 50%, #2d1200 100%)',
      padding: 20, fontFamily: 'var(--font-body)'
    }}>
      {/* Fondo decorativo */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${200 + i * 80}px`, height: `${200 + i * 80}px`,
            borderRadius: '50%',
            border: '1px solid rgba(232,160,69,0.06)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(232,160,69,0.2)',
        borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(232,160,69,0.3)'
          }}>☕</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--accent-light)',
            letterSpacing: '-0.5px', marginBottom: 6
          }}>CaféPOS</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Panel de Administración Maestro
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="user@mail.com" autoFocus
              style={{
                padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(232,160,69,0.2)',
                background: 'rgba(255,255,255,0.05)', color: 'white',
                fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none', width: '100%'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(232,160,69,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(232,160,69,0.2)'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(232,160,69,0.2)',
                background: 'rgba(255,255,255,0.05)', color: 'white',
                fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none', width: '100%'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(232,160,69,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(232,160,69,0.2)'}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 8, padding: '14px 24px', borderRadius: 12,
              background: loading ? 'rgba(232,160,69,0.4)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: 'var(--espresso)', border: 'none', fontSize: 15, fontWeight: 700,
              fontFamily: 'var(--font-body)', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s'
            }}
          >
            {loading ? <><span className="spinner" style={{ borderTopColor: 'var(--espresso)' }} /> Ingresando...</> : '🔐 Ingresar al Panel Maestro'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Acceso restringido — Solo administradores del sistema
        </div>
      </div>
    </div>
  );
}
