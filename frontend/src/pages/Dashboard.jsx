// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.get({ from, to });
      setData(res.data);
    } catch {
      toast.error('Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const salesByDayChart = data ? {
    labels: data.salesByDay.map(d => new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })),
    datasets: [{
      label: 'Ventas ($)',
      data: data.salesByDay.map(d => parseFloat(d.total)),
      backgroundColor: CHART_COLORS.accent + '80',
      borderColor: CHART_COLORS.accent,
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  } : null;

  const salesByHourChart = data ? {
    labels: data.salesByHour.map(d => `${d.hour}:00`),
    datasets: [{
      label: 'Ventas por hora',
      data: data.salesByHour.map(d => parseInt(d.count)),
      backgroundColor: CHART_COLORS.espresso,
      borderRadius: 6
    }]
  } : null;

  const paymentChart = data ? {
    labels: data.salesByPayment.map(d => ({ efectivo: 'Efectivo', qr: 'QR', debito: 'Débito' }[d.payment_method])),
    datasets: [{
      data: data.salesByPayment.map(d => parseFloat(d.total)),
      backgroundColor: [CHART_COLORS.success, CHART_COLORS.info, CHART_COLORS.latte],
      borderWidth: 0
    }]
  } : null;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">📈 Dashboard de Ventas</div>
          <div className="page-subtitle">Análisis y estadísticas</div>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" className="form-control" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 160 }} />
          <span className="text-muted">→</span>
          <input type="date" className="form-control" value={to} onChange={e => setTo(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-primary" onClick={fetchData}>Aplicar</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="stat-grid mb-4">
              <div className="stat-card">
                <div className="stat-label">Total del período</div>
                <div className="stat-value">{formatPrice(data?.totals?.total)}</div>
                <div className="stat-icon">💰</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Ventas realizadas</div>
                <div className="stat-value">{parseInt(data?.totals?.count || 0)}</div>
                <div className="stat-icon">🧾</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Ticket promedio</div>
                <div className="stat-value">
                  {data?.totals?.count > 0
                    ? formatPrice(parseFloat(data.totals.total) / parseInt(data.totals.count))
                    : '$0'}
                </div>
                <div className="stat-icon">📊</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid-2 mb-4">
              <div className="card">
                <div className="card-header"><span className="card-title">📅 Ventas por día</span></div>
                <div className="card-body">
                  {salesByDayChart && salesByDayChart.labels.length > 0
                    ? <Line data={salesByDayChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    : <div className="empty-state"><p>Sin datos para el período</p></div>}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">🕐 Ventas por franja horaria</span></div>
                <div className="card-body">
                  {salesByHourChart && salesByHourChart.labels.length > 0
                    ? <Bar data={salesByHourChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    : <div className="empty-state"><p>Sin datos para el período</p></div>}
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header"><span className="card-title">💳 Ventas por método de pago</span></div>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                  {paymentChart && paymentChart.labels.length > 0
                    ? <div style={{ maxWidth: 300, width: '100%' }}>
                        <Doughnut data={paymentChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                      </div>
                    : <div className="empty-state"><p>Sin datos para el período</p></div>}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">🏆 Top Productos</span></div>
                <div className="card-body">
                  {data?.topProducts?.length > 0 ? (
                    <table>
                      <thead>
                        <tr><th>Producto</th><th>Cant.</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                      </thead>
                      <tbody>
                        {data.topProducts.map((p, i) => (
                          <tr key={i}>
                            <td><strong>{p.product_name}</strong></td>
                            <td>{p.total_qty}</td>
                            <td style={{ textAlign: 'right' }}>{formatPrice(p.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="empty-state"><p>Sin datos para el período</p></div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
