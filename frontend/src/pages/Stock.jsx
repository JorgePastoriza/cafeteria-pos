// src/pages/Stock.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

function AdjustModal({ product, onClose, onSave, slugAPI }) {
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qty || qty === '0') { toast.error('Ingresá una cantidad'); return; }
    setLoading(true);
    try {
      await slugAPI.stock.adjust({ product_id: product.id, quantity: parseInt(qty), reason });
      toast.success('Stock ajustado correctamente');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al ajustar stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Ajustar Stock</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="alert alert-warning mb-3">
              <strong>{product.name}</strong><br />
              Stock actual: <strong>{product.stock}</strong> unidades
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Cantidad (+ para agregar, - para reducir)</label>
              <input
                type="number"
                className="form-control"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="Ej: +10 o -5"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <input
                className="form-control"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Motivo del ajuste..."
              />
            </div>
            {qty && (
              <div className="alert alert-success mt-3">
                Nuevo stock: <strong>{product.stock + parseInt(qty || 0)}</strong> unidades
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Ajustando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Stock() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(null);
  const [filter, setFilter] = useState('all'); // all | low | out

  const fetch = async () => {
    try {
      const res = await slugAPI.products.getAll({ active: true });
      setProducts(res.data);
    } catch { toast.error('Error al cargar stock'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = products.filter(p => {
    if (filter === 'low') return p.stock > 0 && p.stock <= p.stock_min;
    if (filter === 'out') return p.stock === 0;
    return true;
  });

  const lowCount = products.filter(p => p.stock > 0 && p.stock <= p.stock_min).length;
  const outCount = products.filter(p => p.stock === 0).length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">📦 Control de Stock</div>
          <div className="page-subtitle">{outCount > 0 ? `⚠️ ${outCount} productos sin stock` : `${lowCount} productos con stock bajo`}</div>
        </div>
      </div>

      <div className="page-body">
        {(lowCount > 0 || outCount > 0) && (
          <div className="alert alert-warning mb-4">
            ⚠️ Hay <strong>{outCount} productos sin stock</strong> y <strong>{lowCount} con stock bajo</strong>. Revisá el inventario.
          </div>
        )}

        <div className="filters-bar mb-4">
          {[
            { key: 'all', label: `Todos (${products.length})` },
            { key: 'low', label: `⚡ Stock Bajo (${lowCount})` },
            { key: 'out', label: `🚫 Sin Stock (${outCount})` }
          ].map(f => (
            <button key={f.key} className={`filter-chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Stock actual</th>
                    <th>Stock mínimo</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const isOut = p.stock === 0;
                    const isLow = !isOut && p.stock <= p.stock_min;
                    const pct = Math.min((p.stock / Math.max(p.stock_min * 3, 1)) * 100, 100);

                    return (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category?.name}</div>
                        </td>
                        <td>{p.type === 'cafe' ? '☕ Café' : '🥐 Comida'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 700, fontSize: 18 }}>{p.stock}</span>
                            <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                width: `${pct}%`, height: '100%',
                                background: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)',
                                borderRadius: 3
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.stock_min}</td>
                        <td>
                          <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                            {isOut ? '🚫 Sin stock' : isLow ? '⚡ Bajo' : '✅ OK'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setAdjusting(p)}>
                            📝 Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {adjusting && <AdjustModal product={adjusting} onClose={() => setAdjusting(null)} onSave={fetch} slugAPI={slugAPI} />}
    </>
  );
}
