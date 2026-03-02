// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Completá todos los campos'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`¡Bienvenido, ${user.name}!`);
      navigate('/pos');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="coffee-icon">☕</div>
          <h1>CaféPOS</h1>
          <p>Sistema de Punto de Venta</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@cafeteria.com"
              autoFocus
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Ingresando...</> : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px', background: 'var(--foam)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)' }}>

        </div>
      </div>
    </div>
  );
}
