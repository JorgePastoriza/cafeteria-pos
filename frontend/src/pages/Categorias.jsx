// src/pages/Categorias.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const ICONS_CAFE = ['☕', '🍵', '🧋', '🥤', '🍶', '🫖', '🧃', '🍹'];
const ICONS_COMIDA = ['🥐', '🍰', '🧁', '🥪', '🍩', '🥗', '🍞', '🧇'];

const EMPTY_FORM = { name: '', type: 'cafe', icon: '☕' };

function CategoryModal({ category, onClose, onSave, slugAPI }) {
  const [form, setForm] = useState(category ? { name: category.name, type: category.type, icon: category.icon } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const iconOptions = form.type === 'cafe' ? ICONS_CAFE : ICONS_COMIDA;

  // Cuando cambia el tipo, resetear ícono al default
  const handleTypeChange = (type) => {
    set('type', type);
    set('icon', type === 'cafe' ? '☕' : '🥐');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      if (category) {
        await slugAPI.categories.update(category.id, form);
        toast.success('Categoría actualizada');
      } else {
        await slugAPI.categories.create(form);
        toast.success('Categoría creada');
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
          <span className="modal-title">{category ? 'Editar Categoría' : 'Nueva Categoría'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group mb-3">
              <label className="form-label">Nombre *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej: Cafés especiales"
                autoFocus
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Tipo *</label>
              <select className="form-control" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                <option value="cafe">☕ Café / Bebidas</option>
                <option value="comida">🥐 Comida</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ícono</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {iconOptions.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => set('icon', ic)}
                    style={{
                      fontSize: 24,
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: form.icon === ic ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: form.icon === ic ? 'var(--primary-light, #f0f7ff)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
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

export default function Categorias() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | category

  const loadCategories = async () => {
    try {
      const res = await slugAPI.categories.getAll();
      setCategories(res.data);
    } catch {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleDelete = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    try {
      await slugAPI.categories.delete(cat.id);
      toast.success('Categoría eliminada');
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const cafes = categories.filter(c => c.type === 'cafe');
  const comidas = categories.filter(c => c.type === 'comida');

  const renderTable = (list, label) => (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 15 }}>
        {label} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>({list.length})</span>
      </div>
      {list.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay categorías en este grupo todavía
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ícono</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontSize: 24, width: 60 }}>{cat.icon}</td>
                  <td><strong>{cat.name}</strong></td>
                  <td>
                    <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                      {cat.type === 'cafe' ? '☕ Café' : '🥐 Comida'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(cat)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">🏷️ Gestión de Categorías</div>
          <div className="page-subtitle">{categories.length} categorías registradas</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Nueva Categoría</button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {renderTable(cafes, '☕ Cafés y Bebidas')}
            {renderTable(comidas, '🥐 Comidas')}
          </>
        )}
      </div>

      {modal && (
        <CategoryModal
          category={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={loadCategories}
          slugAPI={slugAPI}
        />
      )}
    </>
  );
}
