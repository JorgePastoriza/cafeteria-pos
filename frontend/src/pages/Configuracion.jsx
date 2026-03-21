// src/pages/Configuracion.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { makeSlugAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const formatPrice = (n) =>
  `$${parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

export default function Configuracion() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const { tenant, updateTenant } = useAuth();

  const [form, setForm] = useState({
    delivery_surcharge: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ejemplo visual
  const examplePrice = 1000;
  const previewSurcharge = parseFloat(form.delivery_surcharge) || 0;
  const previewTotal = examplePrice * (1 + previewSurcharge / 100);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await slugAPI.tenantSettings.get();
        setForm({
          delivery_surcharge: parseFloat(res.data.delivery_surcharge || 0).toString()
        });
      } catch {
        toast.error('Error al cargar configuración');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const pct = parseFloat(form.delivery_surcharge);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('El recargo debe ser un número entre 0 y 100');
      return;
    }
    setSaving(true);
    try {
      const res = await slugAPI.tenantSettings.update({
        delivery_surcharge: pct
      });
      // Actualizar el contexto global para que el POS lo tome inmediatamente
      updateTenant({ delivery_surcharge: pct });
      toast.success('✅ Configuración guardada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Configuración del Comercio</div>
          <div className="page-subtitle">Ajustes de modalidades de entrega y recargos</div>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div style={{ maxWidth: 600 }}>

            {/* ── Tarjeta: Delivery ── */}
            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">🛵 Modalidad Delivery</span>
              </div>
              <form onSubmit={handleSave}>
                <div className="card-body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                    Cuando el cajero seleccione <strong>Delivery</strong> al confirmar una venta,
                    se aplicará automáticamente un recargo porcentual sobre el subtotal de los productos.
                  </p>

                  <div className="form-group mb-4">
                    <label className="form-label">Recargo por delivery (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="number"
                        className="form-control"
                        value={form.delivery_surcharge}
                        onChange={e => setForm(f => ({ ...f, delivery_surcharge: e.target.value }))}
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="Ej: 10"
                        style={{ maxWidth: 160, fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                      />
                      <span style={{ fontSize: 22, color: 'var(--text-muted)' }}>%</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                      Ingresá 0 para no aplicar recargo. Podés usar decimales (ej: 7.5).
                    </p>
                  </div>

                  {/* Vista previa */}
                  <div style={{
                    background: 'var(--foam)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 20
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 14 }}>
                      Vista previa — Ejemplo con producto de $1.000
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Subtotal productos</span>
                        <span style={{ fontWeight: 600 }}>{formatPrice(examplePrice)}</span>
                      </div>

                      {previewSurcharge > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Recargo delivery ({previewSurcharge}%)
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--warning)' }}>
                            + {formatPrice(examplePrice * previewSurcharge / 100)}
                          </span>
                        </div>
                      )}

                      <div style={{ height: 1, background: 'var(--border)' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          Total al cliente {previewSurcharge > 0 ? '(delivery)' : '(local)'}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 22,
                          fontWeight: 900,
                          color: previewSurcharge > 0 ? 'var(--accent-dark)' : 'var(--espresso)'
                        }}>
                          {formatPrice(previewTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ejemplos rápidos */}
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Porcentajes comunes:</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[0, 5, 8, 10, 15, 20].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, delivery_surcharge: pct.toString() }))}
                          className={`filter-chip ${parseFloat(form.delivery_surcharge) === pct ? 'active' : ''}`}
                          style={{ fontSize: 13 }}
                        >
                          {pct === 0 ? 'Sin recargo' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner" /> Guardando...</> : '💾 Guardar configuración'}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Info ── */}
            <div className="alert alert-warning">
              <span style={{ fontSize: 20 }}>ℹ️</span>
              <div>
                <strong>¿Cómo funciona?</strong><br />
                Al momento de confirmar una venta en el POS, el cajero puede elegir entre
                <strong> Local</strong> (sin recargo) o <strong>Delivery</strong> (con el recargo configurado aquí).
                El recargo se calcula sobre el subtotal y se almacena como <em>snapshot</em>,
                por lo que cambios futuros en el porcentaje no afectan ventas ya registradas.
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
