// src/pages/superadmin/SuperAdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

// ── Utilidades ──
const slugify = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ColorPicker = ({ value, onChange }) => {
  const presets = ['#e8a045', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#1a0a00', '#374151'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {presets.map(c => (
          <button key={c} onClick={() => onChange(c)} style={{
            width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
            outline: value === c ? `3px solid ${c}` : '3px solid transparent',
            outlineOffset: 2, transition: 'outline 0.15s'
          }} title={c} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 32, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{value}</span>
      </div>
    </div>
  );
};

// ── Modal Crear Comercio ──
function CreateTenantModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', slug: '', logo_url: '', primary_color: '#e8a045',
    adminName: '', adminEmail: '', adminPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleNameChange = (v) => {
    set('name', v);
    if (!slugManual) set('slug', slugify(v));
  };

  const handleSubmit = async () => {
    const { name, slug, adminName, adminEmail, adminPassword } = form;
    if (!name || !slug || !adminName || !adminEmail || !adminPassword) {
      toast.error('Completá todos los campos obligatorios'); return;
    }
    if (adminPassword.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      const res = await superAdminAPI.createTenant(form);
      toast.success(`✅ Comercio "${form.name}" creado correctamente`);
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear el comercio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">🏪 Nuevo Comercio</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Info del comercio */}
          <div style={{ padding: '14px 16px', background: 'var(--foam)', borderRadius: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>
              Datos del Comercio
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Nombre del local *</label>
                <input className="form-control" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Ej: Café del Centro" />
              </div>
              <div className="form-group">
                <label className="form-label">Slug (URL) *</label>
                <input className="form-control" value={form.slug}
                  onChange={e => { setSlugManual(true); set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
                  placeholder="cafe-del-centro" style={{ fontFamily: 'monospace' }} />
                {form.slug && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    URL: <strong>{FRONTEND_URL}/{form.slug}</strong>
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">URL del Logo</label>
                <input className="form-control" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Color del tema</label>
                <ColorPicker value={form.primary_color} onChange={v => set('primary_color', v)} />
              </div>
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div style={{
              padding: 14, borderRadius: 10, border: '1px solid var(--border)',
              background: 'white', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: form.primary_color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22
              }}>
                {form.logo_url ? <img src={form.logo_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} /> : '☕'}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--espresso)' }}>{form.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{FRONTEND_URL}/{form.slug || '...'}</div>
              </div>
              <div style={{
                marginLeft: 'auto', padding: '4px 12px', borderRadius: 20,
                background: form.primary_color, color: 'white', fontSize: 12, fontWeight: 600
              }}>Vista previa</div>
            </div>
          )}

          {/* Admin del comercio */}
          <div style={{ padding: '14px 16px', background: 'var(--foam)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>
              Usuario Administrador del Comercio
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-control" value={form.adminName} onChange={e => set('adminName', e.target.value)} placeholder="Ej: Juan García" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} placeholder="admin@local.com" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Contraseña *</label>
                <input className="form-control" type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} placeholder="Mín. 6 caracteres" />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Creando...</> : '✓ Crear Comercio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Editar Comercio ──
function EditTenantModal({ tenant, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: tenant.name, logo_url: tenant.logo_url || '', primary_color: tenant.primary_color || '#e8a045'
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.updateTenant(tenant.id, form);
      toast.success('Comercio actualizado');
      onUpdated(res.data);
      onClose();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">✏️ Editar Comercio</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">URL del Logo</label>
            <input className="form-control" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">Color del tema</label>
            <ColorPicker value={form.primary_color} onChange={v => set('primary_color', v)} />
          </div>
          {form.logo_url && (
            <div style={{ textAlign: 'center' }}>
              <img src={form.logo_url} alt="logo preview" style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain', borderRadius: 8 }} onError={e => { e.target.style.display='none'; }} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Guardando...</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de Tenant ──
function TenantCard({ tenant, onEdit, onDeactivate }) {
  const url = `${FRONTEND_URL}/${tenant.slug}`;

  return (
    <div className="card" style={{ overflow: 'hidden', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(26,10,0,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      {/* Barra de color */}
      <div style={{ height: 6, background: tenant.primary_color || 'var(--accent)' }} />
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          {/* Avatar / logo */}
          <div style={{
            width: 52, height: 52, borderRadius: 12, flexShrink: 0,
            background: `${tenant.primary_color}22` || 'var(--cream)',
            border: `2px solid ${tenant.primary_color}44` || 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, overflow: 'hidden'
          }}>
            {tenant.logo_url
              ? <img src={tenant.logo_url} alt={tenant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              : '☕'
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--espresso)', marginBottom: 2 }}>{tenant.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{tenant.slug}</div>
          </div>
          <div style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: tenant.active ? 'rgba(76,175,125,0.12)' : 'rgba(224,82,82,0.12)',
            color: tenant.active ? 'var(--success)' : 'var(--danger)'
          }}>
            {tenant.active ? '● Activo' : '● Inactivo'}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Usuarios', value: tenant.userCount || 0, icon: '👥' },
            { label: 'Ventas', value: tenant.saleCount || 0, icon: '🧾' }
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 12px', background: 'var(--foam)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--espresso)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* URL del comercio */}
        <div style={{
          padding: '8px 12px', background: 'var(--foam)', borderRadius: 8,
          marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url}/login
          </span>
          <button
            onClick={() => { navigator.clipboard.writeText(`${url}/login`); toast.success('URL copiada'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, flexShrink: 0, color: 'var(--text-muted)' }}
            title="Copiar URL"
          >📋</button>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`${url}/login`} target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost btn-sm" style={{ flex: 1, textDecoration: 'none' }}>
            🔗 Abrir
          </a>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(tenant)} style={{ flex: 1 }}>
            ✏️ Editar
          </button>
          {tenant.active && (
            <button className="btn btn-sm" style={{ background: 'rgba(224,82,82,0.1)', color: 'var(--danger)', border: 'none' }}
              onClick={() => onDeactivate(tenant)}>
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Principal ──
export default function SuperAdminDashboard() {
  const { superAdmin, logout } = useSuperAdmin();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, statsRes] = await Promise.all([
        superAdminAPI.getTenants(),
        superAdminAPI.getStats()
      ]);
      setTenants(tenantsRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (tenant) => {
    if (!window.confirm(`¿Desactivar el comercio "${tenant.name}"? Los usuarios no podrán acceder.`)) return;
    try {
      await superAdminAPI.deleteTenant(tenant.id);
      toast.success(`Comercio "${tenant.name}" desactivado`);
      fetchData();
    } catch {
      toast.error('Error al desactivar');
    }
  };

  const handleLogout = () => { logout(); navigate('/superadmin/login'); };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0500', fontFamily: 'var(--font-body)' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(232,160,69,0.15)',
        padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>☕</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-light)', fontSize: 18, letterSpacing: '-0.3px' }}>
              CaféPOS
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Panel Maestro</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {superAdmin?.name}
          </span>
          <button onClick={handleLogout} style={{
            background: 'rgba(224,82,82,0.15)', border: '1px solid rgba(224,82,82,0.3)',
            color: '#ef8080', borderRadius: 8, padding: '7px 14px', fontSize: 13,
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600
          }}>
            Salir
          </button>
        </div>
      </header>

      <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Comercios activos', value: stats?.totalTenants ?? '—', icon: '🏪', color: '#e8a045' },
            { label: 'Usuarios totales', value: stats?.totalUsers ?? '—', icon: '👥', color: '#3b82f6' },
            { label: 'Ventas registradas', value: stats?.totalSales ?? '—', icon: '🧾', color: '#10b981' }
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '22px 24px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color }} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'white', fontWeight: 700 }}>{s.value}</div>
              <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 32, opacity: 0.15 }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: 22, marginBottom: 2 }}>
              Comercios
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {filteredTenants.length} {filteredTenants.length === 1 ? 'comercio' : 'comercios'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar comercio..."
              style={{
                padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14,
                fontFamily: 'var(--font-body)', outline: 'none', width: 220
              }}
            />
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: 'var(--espresso)', fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              + Nuevo Comercio
            </button>
          </div>
        </div>

        {/* ── Grid de Tenants ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.4)' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent)', margin: '0 auto 16px', width: 32, height: 32, borderWidth: 3 }} />
            <p>Cargando comercios...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏪</div>
            <h3 style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              {search ? 'No se encontraron resultados' : 'Sin comercios aún'}
            </h3>
            {!search && (
              <button onClick={() => setShowCreate(true)} style={{
                marginTop: 16, padding: '12px 24px', borderRadius: 10, border: 'none',
                background: 'var(--accent)', color: 'var(--espresso)', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>
                Crear el primer comercio
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filteredTenants.map(tenant => (
              <TenantCard
                key={tenant.id} tenant={tenant}
                onEdit={setEditTenant}
                onDeactivate={handleDeactivate}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={() => fetchData()}
        />
      )}
      {editTenant && (
        <EditTenantModal
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onUpdated={() => { fetchData(); setEditTenant(null); }}
        />
      )}
    </div>
  );
}
