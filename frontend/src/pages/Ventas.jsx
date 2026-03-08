// src/pages/Ventas.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const formatPrice = (n) => `$${parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
const paymentLabel = { efectivo: '💵 Efectivo', qr: '📱 QR', debito: '💳 Débito' };

export default function Ventas() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  // Por defecto: últimos 7 días
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [payment, setPayment] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    setSales([]);
    try {
      // Mandamos from+to para rango de fechas
      const params = { from, to };
      if (payment) params.payment_method = payment;

      const res = await slugAPI.sales.getAll(params);
      const data = res.data;

      // El backend devuelve array directo
      const salesArray = Array.isArray(data) ? data : [];
      setSales(salesArray);
    } catch (err) {
      console.error('Ventas error:', err?.response?.data || err.message);
      toast.error(err?.response?.data?.error || 'Error al cargar ventas');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => { fetchSales(); }, []);

  // Totales calculados en frontend
  const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
  const totalByPayment = sales.reduce((acc, s) => {
    acc[s.payment_method] = (acc[s.payment_method] || 0) + parseFloat(s.total || 0);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Historial de Ventas</div>
          <div className="page-subtitle">
            {loading ? 'Cargando...' : `${sales.length} ventas encontradas`}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Filtros */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label className="form-label">Desde</label>
                <input
                  type="date"
                  className="form-control"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label className="form-label">Hasta</label>
                <input
                  type="date"
                  className="form-control"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label className="form-label">Método de pago</label>
                <select className="form-control" value={payment} onChange={e => setPayment(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="qr">📱 QR</option>
                  <option value="debito">💳 Débito</option>
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={fetchSales}
                style={{ alignSelf: 'flex-end' }}
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Buscando...</> : '🔍 Buscar'}
              </button>
            </div>
          </div>
        </div>

        {/* Resumen del período — solo cuando hay datos */}
        {!loading && sales.length > 0 && (
          <div className="stat-grid mb-4">
            <div className="stat-card">
              <div className="stat-label">Total del período</div>
              <div className="stat-value">{formatPrice(totalAmount)}</div>
              <div className="stat-icon">💰</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">💵 Efectivo</div>
              <div className="stat-value">{formatPrice(totalByPayment.efectivo || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">📱 QR</div>
              <div className="stat-value">{formatPrice(totalByPayment.qr || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">💳 Débito</div>
              <div className="stat-value">{formatPrice(totalByPayment.debito || 0)}</div>
            </div>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : sales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No se encontraron ventas para el período seleccionado</p>
              <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                {from} → {to}
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>N° Venta</th>
                    <th>Fecha y Hora</th>
                    <th>Cajero</th>
                    <th>Pago</th>
                    <th>Ítems</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <>
                      <tr
                        key={sale.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                      >
                        <td>
                          <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
                            {sale.sale_number}
                          </strong>
                        </td>
                        <td>
                          {new Date(sale.created_at).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td>{sale.user?.name || '—'}</td>
                        <td>
                          <span className="badge badge-info">
                            {paymentLabel[sale.payment_method] || sale.payment_method}
                          </span>
                        </td>
                        <td>{sale.items?.length ?? 0} ítem(s)</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{formatPrice(sale.total)}</strong>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {expanded === sale.id ? '▲' : '▼'}
                        </td>
                      </tr>

                      {expanded === sale.id && (
                        <tr key={`${sale.id}-detail`}>
                          <td
                            colSpan={7}
                            style={{ background: 'var(--foam)', padding: '0 16px 16px' }}
                          >
                            {sale.items && sale.items.length > 0 ? (
                              <table style={{ marginTop: 8 }}>
                                <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th>Precio Unit.</th>
                                    <th>Cantidad</th>
                                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.items.map(item => (
                                    <tr key={item.id}>
                                      <td>{item.product_name}</td>
                                      <td>{formatPrice(item.product_price)}</td>
                                      <td>× {item.quantity}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                        {formatPrice(item.subtotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                Sin detalle disponible
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
