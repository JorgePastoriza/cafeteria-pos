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

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [payment, setPayment] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState(''); // '' | 'local' | 'delivery'

  const fetchSales = async () => {
    setLoading(true);
    setSales([]);
    try {
      const params = { from, to };
      if (payment) params.payment_method = payment;
      if (deliveryFilter) params.delivery_type = deliveryFilter;
      const res = await slugAPI.sales.getAll(params);
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al cargar ventas');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
  const totalSurcharge = sales.reduce((sum, s) => sum + parseFloat(s.delivery_surcharge_amount || 0), 0);
  const totalByPayment = sales.reduce((acc, s) => {
    acc[s.payment_method] = (acc[s.payment_method] || 0) + parseFloat(s.total || 0);
    return acc;
  }, {});
  const deliveryCount = sales.filter(s => s.delivery_type === 'delivery').length;

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
                <input type="date" className="form-control" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label className="form-label">Hasta</label>
                <input type="date" className="form-control" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label className="form-label">Pago</label>
                <select className="form-control" value={payment} onChange={e => setPayment(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="qr">📱 QR</option>
                  <option value="debito">💳 Débito</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: '0 0 auto' }}>
                <label className="form-label">Modalidad</label>
                <select className="form-control" value={deliveryFilter} onChange={e => setDeliveryFilter(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="local">🏠 Local</option>
                  <option value="delivery">🛵 Delivery</option>
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

        {/* Resumen */}
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
            {deliveryCount > 0 && (
              <div className="stat-card" style={{ borderColor: 'var(--warning)' }}>
                <div className="stat-label">🛵 Recargos delivery</div>
                <div className="stat-value" style={{ color: 'var(--accent-dark)' }}>{formatPrice(totalSurcharge)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{deliveryCount} ventas delivery</div>
              </div>
            )}
          </div>
        )}

        {/* Tabla */}
        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : sales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No se encontraron ventas para el período seleccionado</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>N° Venta</th>
                    <th>Fecha y Hora</th>
                    <th>Cajero</th>
                    <th>Modalidad</th>
                    <th>Pago</th>
                    <th>Ítems</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => {
                    const isDelivery = sale.delivery_type === 'delivery';
                    const surcharge = parseFloat(sale.delivery_surcharge_amount || 0);
                    return (
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
                            <span className={`badge ${isDelivery ? 'badge-warning' : 'badge-success'}`}>
                              {isDelivery ? '🛵 Delivery' : '🏠 Local'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-info">
                              {paymentLabel[sale.payment_method] || sale.payment_method}
                            </span>
                          </td>
                          <td>{sale.items?.length ?? 0} ítem(s)</td>
                          <td style={{ textAlign: 'right' }}>
                            <strong>{formatPrice(sale.total)}</strong>
                            {isDelivery && surcharge > 0 && (
                              <div style={{ fontSize: 11, color: 'var(--warning)' }}>
                                +{formatPrice(surcharge)} delivery
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {expanded === sale.id ? '▲' : '▼'}
                          </td>
                        </tr>

                        {expanded === sale.id && (
                          <tr key={`${sale.id}-detail`}>
                            <td colSpan={8} style={{ background: 'var(--foam)', padding: '0 16px 16px' }}>
                              {/* Detalle de ítems */}
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

                                    {/* Fila de recargo delivery */}
                                    {isDelivery && surcharge > 0 && (
                                      <>
                                        <tr>
                                          <td colSpan={3} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            Subtotal productos
                                          </td>
                                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                            {formatPrice(sale.subtotal_before_surcharge)}
                                          </td>
                                        </tr>
                                        <tr style={{ background: 'rgba(240,168,48,0.06)' }}>
                                          <td colSpan={3} style={{ color: 'var(--warning)', fontWeight: 600 }}>
                                            🛵 Recargo delivery ({parseFloat(sale.delivery_surcharge_pct)}%)
                                          </td>
                                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--warning)' }}>
                                            + {formatPrice(surcharge)}
                                          </td>
                                        </tr>
                                      </>
                                    )}

                                    {/* Total final */}
                                    <tr style={{ background: 'var(--cream)' }}>
                                      <td colSpan={3} style={{ fontWeight: 700 }}>Total</td>
                                      <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'var(--font-display)', fontSize: 15 }}>
                                        {formatPrice(sale.total)}
                                      </td>
                                    </tr>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
