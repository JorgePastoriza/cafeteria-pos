// src/pages/Productos.jsx
import { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../services/api';
import toast from 'react-hot-toast';

const formatPrice = (n) => `$${parseFloat(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', stock_min: 5, category_id: '', type: 'cafe', image_url: '', active: true };

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product ? { ...product, price: product.price, stock: product.stock, stock_min: product.stock_min } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id) { toast.error('Completá los campos obligatorios'); return; }
    setLoading(true);
    try {
      if (product) {
        await productsAPI.update(product.id, form);
        toast.success('Producto actualizado');
      } else {
        await productsAPI.create(form);
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
            <div className="form-group">
              <label className="form-label">URL de imagen</label>
              <input className="form-control" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." />
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | product

  const fetch = async () => {
    try {
      const [p, c] = await Promise.all([productsAPI.getAll(), categoriesAPI.getAll()]);
      setProducts(p.data);
      setCategories(c.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este producto?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Producto desactivado');
      fetch();
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
                          <img src={p.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=60'} alt={p.name}
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
          onSave={fetch}
        />
      )}
    </>
  );
}
