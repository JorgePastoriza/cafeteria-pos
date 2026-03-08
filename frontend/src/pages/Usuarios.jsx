// src/pages/Usuarios.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', password: '', role_id: '' };

function UserModal({ user, roles, onClose, onSave, slugAPI }) {
  const [form, setForm] = useState(user
    ? { name: user.name, email: user.email, password: '', role_id: user.role_id || user.role?.id || '' }
    : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user && (!form.name || !form.email || !form.password || !form.role_id)) {
      toast.error('Completá todos los campos'); return;
    }
    setLoading(true);
    try {
      const data = { ...form };
      if (user && !form.password) delete data.password;
      if (user) await slugAPI.users.update(user.id, data);
      else await slugAPI.users.create(data);
      toast.success(user ? 'Usuario actualizado' : 'Usuario creado');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group mb-3">
              <label className="form-label">Nombre completo</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">{user ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
              <input type="password" className="form-control" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Rol</label>
              <select className="form-control" value={form.role_id} onChange={e => set('role_id', e.target.value)} required>
                <option value="">Seleccionar...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
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

export default function Usuarios() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const { user: me } = useAuth();

  const fetch = async () => {
    try {
      const [u, r] = await Promise.all([slugAPI.users.getAll(), slugAPI.roles.getAll()]);
      setUsers(u.data);
      setRoles(r.data);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este usuario?')) return;
    try {
      await slugAPI.users.delete(id);
      toast.success('Usuario desactivado');
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">👥 Gestión de Usuarios</div>
          <div className="page-subtitle">{users.length} usuarios registrados</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Nuevo Usuario</button>
      </div>

      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{u.name[0]}</div>
                          <strong>{u.name}</strong>
                          {u.id === me?.id && <span className="badge badge-info">Tú</span>}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role?.name === 'admin' ? 'badge-warning' : 'badge-info'}`}>{u.role?.name}</span></td>
                      <td><span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>✏️ Editar</button>
                          {u.id !== me?.id && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && <UserModal user={modal === 'new' ? null : modal} roles={roles} onClose={() => setModal(null)} onSave={fetch} slugAPI={slugAPI} />}
    </>
  );
}
