// src/pages/Cierre.jsx
import { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';

const formatPrice = (n) => `$${parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

export default function Cierre() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await salesAPI.today();
      setSummary(res.data);
    } catch {
      toast.error('Error al cargar resumen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleCloseDay = async () => {
    if (!window.confirm('¿Estás seguro de cerrar el día? Esta acción no se puede revertir.')) return;
    setClosing(true);
    try {
      await salesAPI.closeDay({});
      toast.success('✅ Día cerrado exitosamente');
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cerrar el día');
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">📊 Cierre Diario</div>
          <div className="page-subtitle">{new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        {!summary?.isClosed && (
          <button className="btn btn-danger" onClick={handleCloseDay} disabled={closing}>
            {closing ? <><span className="spinner" /> Cerrando...</> : '🔒 Cerrar Día'}
          </button>
        )}
      </div>

      <div className="page-body">
        {summary?.isClosed && (
          <div className="alert alert-warning mb-4">
            🔒 El día fue cerrado a las {new Date(summary.closure?.closed_at).toLocaleTimeString('es-AR')}. No se pueden eliminar ventas.
          </div>
        )}

        {/* Stats */}
        <div className="stat-grid mb-4">
          <div className="stat-card">
            <div className="stat-label">Total del Día</div>
            <div className="stat-value">{formatPrice(summary?.total)}</div>
            <div className="stat-icon">💰</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ventas Realizadas</div>
            <div className="stat-value">{summary?.count || 0}</div>
            <div className="stat-icon">🧾</div>
          </div>
          <div className="stat-card" style={{ '--before-color': 'var(--success)' }}>
            <div className="stat-label">💵 Efectivo</div>
            <div className="stat-value">{formatPrice(summary?.efectivo)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📱 QR</div>
            <div className="stat-value">{formatPrice(summary?.qr)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💳 Débito</div>
            <div className="stat-value">{formatPrice(summary?.debito)}</div>
          </div>
        </div>

        {/* Top productos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏆 Productos más vendidos hoy</span>
          </div>
          <div className="card-body">
            {summary?.topProducts?.length === 0 ? (
              <div className="empty-state"><p>Sin ventas registradas hoy</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>Cantidad vendida</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.topProducts?.map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontSize: 18 }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i] || i + 1}</span>
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.quantity} unidades</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
