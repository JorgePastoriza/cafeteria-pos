// src/pages/Cierre.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const formatPrice = (n) => `$${parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

export default function Cierre() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await slugAPI.cierre.getToday();
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
      await slugAPI.cierre.close({});
      toast.success('✅ Día cerrado exitosamente');
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cerrar el día');
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const hasDelivery = summary?.summary?.delivery > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">📊 Cierre Diario</div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
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
            🔒 El día fue cerrado a las {new Date(summary.closure?.closed_at).toLocaleTimeString('es-AR')}.
            No se pueden eliminar ventas.
          </div>
        )}

        {/* ── Stats por método de pago ── */}
        <div className="stat-grid mb-4">
          <div className="stat-card">
            <div className="stat-label">Total del Día</div>
            <div className="stat-value">{formatPrice(summary?.summary?.total)}</div>
            <div className="stat-icon">💰</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ventas Realizadas</div>
            <div className="stat-value">{summary?.summary?.count || 0}</div>
            <div className="stat-icon">🧾</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💵 Efectivo</div>
            <div className="stat-value">{formatPrice(summary?.summary?.efectivo)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📱 QR</div>
            <div className="stat-value">{formatPrice(summary?.summary?.qr)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💳 Débito</div>
            <div className="stat-value">{formatPrice(summary?.summary?.debito)}</div>
          </div>
        </div>

        {/* ── Stats por modalidad de entrega ── */}
        <div className="grid-2 mb-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">📦 Ventas por Modalidad</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--foam)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🏠</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Local</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ventas en mostrador</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                    {formatPrice(summary?.summary?.local)}
                  </div>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  background: hasDelivery ? 'rgba(240,168,48,0.08)' : 'var(--foam)',
                  border: hasDelivery ? '1px solid rgba(240,168,48,0.25)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🛵</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Delivery</div>
                      {hasDelivery && (
                        <div style={{ fontSize: 12, color: 'var(--warning)' }}>
                          Recargos: {formatPrice(summary?.summary?.delivery_surcharge_total)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: hasDelivery ? 'var(--accent-dark)' : 'var(--text-muted)' }}>
                    {formatPrice(summary?.summary?.delivery)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top productos */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏆 Top productos hoy</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {summary?.topProducts?.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}><p>Sin ventas registradas hoy</p></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.topProducts?.map((p, i) => (
                      <tr key={p.id}>
                        <td><span style={{ fontSize: 16 }}>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span></td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
