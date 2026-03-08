// src/controllers/dashboardController.js
const { Sale, SaleItem, Product, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const getStats = async (req, res) => {
  try {
    const tid = req.tenant.id;
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

    const [todaySales, monthSales, totalProducts, lowStock] = await Promise.all([
      Sale.findAll({ where: { tenant_id: tid, status: 'completed', created_at: { [Op.between]: [`${today} 00:00:00`, `${today} 23:59:59`] } } }),
      Sale.findAll({ where: { tenant_id: tid, status: 'completed', created_at: { [Op.gte]: monthStart } } }),
      Product.count({ where: { tenant_id: tid, active: true } }),
      Product.count({ where: { tenant_id: tid, active: true, stock: { [Op.lte]: literal('stock_min') } } })
    ]);

    const todayRevenue = todaySales.reduce((s, v) => s + parseFloat(v.total), 0);
    const monthRevenue = monthSales.reduce((s, v) => s + parseFloat(v.total), 0);

    res.json({
      today: { sales: todaySales.length, revenue: todayRevenue },
      month: { sales: monthSales.length, revenue: monthRevenue },
      products: { total: totalProducts, lowStock }
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

const getSalesChart = async (req, res) => {
  try {
    const tid = req.tenant.id;
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days + 1); startDate.setHours(0,0,0,0);

    const sales = await Sale.findAll({
      where: { tenant_id: tid, status: 'completed', created_at: { [Op.gte]: startDate } },
      attributes: ['created_at', 'total', 'payment_method']
    });

    const byDay = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      byDay[key] = { date: key, revenue: 0, count: 0, efectivo: 0, qr: 0, debito: 0 };
    }

    sales.forEach(s => {
      const key = new Date(s.created_at).toISOString().split('T')[0];
      if (byDay[key]) {
        byDay[key].revenue += parseFloat(s.total);
        byDay[key].count += 1;
        byDay[key][s.payment_method] += parseFloat(s.total);
      }
    });

    res.json(Object.values(byDay));
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener gráfico' });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const tid = req.tenant.id;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

    const items = await SaleItem.findAll({
      include: [{
        model: Sale, as: undefined,
        where: { tenant_id: tid, status: 'completed', created_at: { [Op.gte]: monthStart } },
        attributes: []
      }],
      attributes: ['product_name', [fn('SUM', col('quantity')), 'total_qty'], [fn('SUM', col('subtotal')), 'total_revenue']],
      group: ['product_name'],
      order: [[literal('total_qty'), 'DESC']],
      limit: 8
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener top productos' });
  }
};

module.exports = { getStats, getSalesChart, getTopProducts };
