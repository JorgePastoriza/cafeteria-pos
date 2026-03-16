// src/pages/Productos.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const formatPrice = (n) => `$${parseFloat(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', stock_min: 5, category_id: '', type: 'cafe', image_url: '', active: true };

const LOCAL_IMAGES = [
  { label: 'Café',      src: '/images/cafe.jpg' },
  { label: 'Gaseosa',   src: '/images/gaseosa.jpg' },
  { label: 'Cubanito',  src: '/images/cubanito.jpg' },
  { label: 'Medialuna', src: '/images/medialuna.jpg' },
  { label: 'Varios',    src: '/images/varios.jpg' },
];

function ProductModal({ product, categories, onClose, onSave, slugAPI }) {
  const [form, setForm] = useState(product ? { ...product, price: product.price, stock: product.stock, stock_min: product.stock_min } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id) { toast.error('Completá los campos obligatorios'); return; }
    setLoading(true);
    try {
      if (product) {
        await slugAPI.products.update(product.id, form);
        toast.success('Producto actualizado');
      } else {
        await slugAPI.products.create(form);
        toast.success('Producto creado');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{product ? 'Editar Producto' : 'Nuevo Producto'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2 mb-3">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Precio *</label>
                <input type="number" className="form-control" value={form.price} onChange={e => set('price', e.target.value)} min="0" />
              </div>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Descripción</label>
              <input className="form-control" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid-2 mb-3">
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="cafe">☕ Café</option>
                  <option value="comida">🥐 Comida</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select className="form-control" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {categories.filter(c => c.type === form.type).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid-3 mb-3">
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input type="number" className="form-control" value={form.stock} onChange={e => set('stock', e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock mínimo</label>
                <input type="number" className="form-control" value={form.stock_min} onChange={e => set('stock_min', e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-control" value={form.active} onChange={e => set('active', e.target.value === 'true')}>
                  <option value="true">✅ Activo</option>
                  <option value="false">❌ Inactivo</option>
                </select>
              </div>
            </div>

            {/* ── Selector de imagen ── */}
            <div className="form-group">
              <label className="form-label">Imagen</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '8px 0' }}>
                {LOCAL_IMAGES.map(img => {
                  const selected = form.image_url === img.src;
                  return (
                    <div
                      key={img.src}
                      onClick={() => set('image_url', img.src)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 8,
                        border: selected ? '2px solid var(--primary)' : '2px solid var(--border)',
                        overflow: 'hidden',
                        textAlign: 'center',
                        width: 72,
                        flexShrink: 0,
                        background: selected ? 'var(--primary-light, #e8f4ff)' : 'transparent',
                        transition: 'all 0.15s',
                        boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none'
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.label}
                        style={{ width: 72, height: 56, objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.style.background = '#eee'; e.target.style.display = 'block'; e.target.alt = '?'; }}
                      />
                      <div style={{ fontSize: 11, padding: '3px 0', color: selected ? 'var(--primary)' : 'var(--text-muted)', fontWeight: selected ? 600 : 400 }}>
                        {img.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <input
                className="form-control"
                value={form.image_url}
                onChange={e => set('image_url', e.target.value)}
                placeholder="O pegá una URL externa..."
                style={{ marginTop: 6 }}
              />
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Productos() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | product

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([slugAPI.products.getAll(), slugAPI.categories.getAll()]);
      setProducts(p.data);
      setCategories(c.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este producto?')) return;
    try {
      await slugAPI.products.delete(id);
      toast.success('Producto desactivado');
      fetchData();
    } catch { toast.error('Error al desactivar'); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">☕ Gestión de Productos</div>
          <div className="page-subtitle">{products.length} productos registrados</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Nuevo Producto</button>
      </div>

      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const isLow = p.stock <= p.stock_min;
                    return (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image_url || '/images/varios.jpg'} alt={p.name}
                            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }}
                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=60'; }}
                          />
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                          {p.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.description.slice(0, 50)}</div>}
                        </td>
                        <td><span style={{ textTransform: 'capitalize' }}>{p.type === 'cafe' ? '☕' : '🥐'} {p.type}</span></td>
                        <td>{p.category?.name}</td>
                        <td><strong>{formatPrice(p.price)}</strong></td>
                        <td>
                          <span className={`badge ${p.stock === 0 ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                            {p.stock === 0 ? '⚠ Sin stock' : isLow ? `⚡ ${p.stock}` : p.stock}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${p.active ? 'badge-success' : 'badge-danger'}`}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(p)}>✏️ Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑</button>
                          </div>
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

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={fetchData}
          slugAPI={slugAPI}
        />
      )}
    </>
  );
}
