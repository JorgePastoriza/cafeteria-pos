// src/pages/Ventas.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const formatPrice = (n) => `$${parseFloat(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
const paymentLabel = { efectivo: '💵 Efectivo', qr: '📱 QR', debito: '💳 Débito' };

export default function Ventas() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [payment, setPayment] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { from, to };
      if (payment) params.payment_method = payment;
      const res = await slugAPI.sales.getAll(params);
      setSales(res.data.sales);
      setTotal(res.data.total);
    } catch { toast.error('Error al cargar ventas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Historial de Ventas</div>
          <div className="page-subtitle">{total} ventas encontradas</div>
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
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="debito">Débito</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={fetch} style={{ alignSelf: 'flex-end' }}>
                🔍 Buscar
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrapper">
              {sales.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No se encontraron ventas</p>
                </div>
              ) : (
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
                        <tr key={sale.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}>
                          <td><strong style={{ fontFamily: 'monospace' }}>{sale.sale_number}</strong></td>
                          <td>{new Date(sale.created_at).toLocaleString('es-AR')}</td>
                          <td>{sale.user?.name}</td>
                          <td><span className="badge badge-info">{paymentLabel[sale.payment_method]}</span></td>
                          <td>{sale.items?.length} ítem(s)</td>
                          <td style={{ textAlign: 'right' }}><strong>{formatPrice(sale.total)}</strong></td>
                          <td>{expanded === sale.id ? '▲' : '▼'}</td>
                        </tr>
                        {expanded === sale.id && (
                          <tr key={`${sale.id}-detail`}>
                            <td colSpan={7} style={{ background: 'var(--foam)', padding: '0 16px 16px' }}>
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
                                  {sale.items?.map(item => (
                                    <tr key={item.id}>
                                      <td>{item.product_name}</td>
                                      <td>{formatPrice(item.product_price)}</td>
                                      <td>× {item.quantity}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(item.subtotal)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
