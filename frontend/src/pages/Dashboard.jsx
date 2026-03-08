// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { makeSlugAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const formatPrice = (n) => `$${parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

const CHART_COLORS = {
  espresso: '#1a0a00',
  accent: '#e8a045',
  latte: '#c4956a',
  success: '#4caf7d',
  info: '#5b9bd5',
  danger: '#e05252'
};

export default function Dashboard() {
  const { slug } = useParams();
  const slugAPI = makeSlugAPI(slug);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes, topRes] = await Promise.all([
        slugAPI.dashboard.getStats(),
        slugAPI.dashboard.getChart({ days }),
        slugAPI.dashboard.getTopProducts()
      ]);
      setStats(statsRes.data);
      setChartData(Array.isArray(chartRes.data) ? chartRes.data : []);
      setTopProducts(Array.isArray(topRes.data) ? topRes.data : []);
    } catch (err) {
      console.error('Dashboard error:', err);
      toast.error('Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [days]);

  // Ventas por día (desde el chart endpoint que devuelve array con date/revenue/count/efectivo/qr/debito)
  const salesByDayChart = chartData.length > 0 ? {
    labels: chartData.map(d => {
      const date = new Date(d.date + 'T00:00:00');
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    }),
    datasets: [{
      label: 'Ventas ($)',
      data: chartData.map(d => parseFloat(d.revenue || 0)),
      backgroundColor: CHART_COLORS.accent + '40',
      borderColor: CHART_COLORS.accent,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: CHART_COLORS.accent,
      pointRadius: 4
    }]
  } : null;

  // Cantidad de ventas por día
  const countByDayChart = chartData.length > 0 ? {
    labels: chartData.map(d => {
      const date = new Date(d.date + 'T00:00:00');
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    }),
    datasets: [{
      label: 'Cantidad de ventas',
      data: chartData.map(d => parseInt(d.count || 0)),
      backgroundColor: CHART_COLORS.espresso,
      borderRadius: 6
    }]
  } : null;

  // Distribución por método de pago (suma del período)
  const paymentTotals = chartData.reduce((acc, d) => {
    acc.efectivo += parseFloat(d.efectivo || 0);
    acc.qr += parseFloat(d.qr || 0);
    acc.debito += parseFloat(d.debito || 0);
    return acc;
  }, { efectivo: 0, qr: 0, debito: 0 });

  const hasPaymentData = paymentTotals.efectivo + paymentTotals.qr + paymentTotals.debito > 0;

  const paymentChart = hasPaymentData ? {
    labels: ['Efectivo', 'QR', 'Débito'],
    datasets: [{
      data: [paymentTotals.efectivo, paymentTotals.qr, paymentTotals.debito],
      backgroundColor: [CHART_COLORS.success, CHART_COLORS.info, CHART_COLORS.latte],
      borderWidth: 0
    }]
  } : null;

  // Totales del período desde chartData
  const periodTotals = chartData.reduce((acc, d) => {
    acc.revenue += parseFloat(d.revenue || 0);
    acc.count += parseInt(d.count || 0);
    return acc;
  }, { revenue: 0, count: 0 });

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">📈 Dashboard de Ventas</div>
          <div className="page-subtitle">Análisis y estadísticas</div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="form-control"
            style={{ width: 160 }}
            value={days}
            onChange={e => setDays(parseInt(e.target.value))}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
          </select>
          <button className="btn btn-primary" onClick={fetchData}>Actualizar</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* KPIs de hoy / mes desde stats */}
            {stats && (
              <div className="stat-grid mb-4">
                <div className="stat-card">
                  <div className="stat-label">Ventas hoy</div>
                  <div className="stat-value">{formatPrice(stats.today?.revenue || 0)}</div>
                  <div className="stat-icon">☀️</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Transacciones hoy</div>
                  <div className="stat-value">{stats.today?.sales || 0}</div>
                  <div className="stat-icon">🧾</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Ventas del mes</div>
                  <div className="stat-value">{formatPrice(stats.month?.revenue || 0)}</div>
                  <div className="stat-icon">📅</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Productos activos</div>
                  <div className="stat-value">{stats.products?.total || 0}</div>
                  <div className="stat-icon">☕</div>
                </div>
                {stats.products?.lowStock > 0 && (
                  <div className="stat-card" style={{ borderColor: 'var(--warning)' }}>
                    <div className="stat-label">Stock bajo</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.products.lowStock}</div>
                    <div className="stat-icon">⚠️</div>
                  </div>
                )}
              </div>
            )}

            {/* KPIs del período seleccionado */}
            <div className="stat-grid mb-4">
              <div className="stat-card">
                <div className="stat-label">Total del período</div>
                <div className="stat-value">{formatPrice(periodTotals.revenue)}</div>
                <div className="stat-icon">💰</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Transacciones</div>
                <div className="stat-value">{periodTotals.count}</div>
                <div className="stat-icon">🧾</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Ticket promedio</div>
                <div className="stat-value">
                  {periodTotals.count > 0
                    ? formatPrice(periodTotals.revenue / periodTotals.count)
                    : '$0'}
                </div>
                <div className="stat-icon">📊</div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid-2 mb-4">
              <div className="card">
                <div className="card-header"><span className="card-title">📅 Ingresos por día</span></div>
                <div className="card-body">
                  {salesByDayChart
                    ? <Line data={salesByDayChart} options={chartOptions} />
                    : <div className="empty-state"><p>Sin datos para el período</p></div>}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">🔢 Cantidad de ventas por día</span></div>
                <div className="card-body">
                  {countByDayChart
                    ? <Bar data={countByDayChart} options={chartOptions} />
                    : <div className="empty-state"><p>Sin datos para el período</p></div>}
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header"><span className="card-title">💳 Distribución por método de pago</span></div>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                  {paymentChart
                    ? <div style={{ maxWidth: 300, width: '100%' }}>
                        <Doughnut data={paymentChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>💵 Efectivo</div>
                            <div style={{ fontWeight: 700 }}>{formatPrice(paymentTotals.efectivo)}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📱 QR</div>
                            <div style={{ fontWeight: 700 }}>{formatPrice(paymentTotals.qr)}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>💳 Débito</div>
                            <div style={{ fontWeight: 700 }}>{formatPrice(paymentTotals.debito)}</div>
                          </div>
                        </div>
                      </div>
                    : <div className="empty-state"><p>Sin datos para el período</p></div>}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">🏆 Top Productos del Mes</span></div>
                <div className="card-body">
                  {topProducts.length > 0 ? (
                    <table>
                      <thead>
                        <tr><th>#</th><th>Producto</th><th>Cant.</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p, i) => (
                          <tr key={i}>
                            <td>
                              <span style={{ fontSize: 16 }}>
                                {['🥇','🥈','🥉'][i] || `${i + 1}`}
                              </span>
                            </td>
                            <td><strong>{p.product_name}</strong></td>
                            <td>{p.total_qty}</td>
                            <td style={{ textAlign: 'right' }}>{formatPrice(p.total_revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state"><p>Sin ventas este mes</p></div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
