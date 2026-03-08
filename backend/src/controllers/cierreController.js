// src/controllers/cierreController.js
const { Sale, DailyClosure, SaleItem } = require('../models');
const { Op } = require('sequelize');

const getToday = async (req, res) => {
  try {
    const tid = req.tenant.id;
    const today = new Date().toISOString().split('T')[0];

    const closure = await DailyClosure.findOne({ where: { tenant_id: tid, date: today } });

    const sales = await Sale.findAll({
      where: { tenant_id: tid, status: 'completed', created_at: { [Op.between]: [`${today} 00:00:00`, `${today} 23:59:59`] } },
      include: [{ model: SaleItem, as: 'items' }]
    });

    const summary = { efectivo: 0, qr: 0, debito: 0, total: 0, count: sales.length };
    sales.forEach(s => {
      summary[s.payment_method] += parseFloat(s.total);
      summary.total += parseFloat(s.total);
    });

    res.json({ closure, sales, summary, isClosed: !!closure });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener cierre' });
  }
};

const close = async (req, res) => {
  try {
    const tid = req.tenant.id;
    const today = new Date().toISOString().split('T')[0];

    const existing = await DailyClosure.findOne({ where: { tenant_id: tid, date: today } });
    if (existing) return res.status(400).json({ error: 'La caja ya fue cerrada hoy' });

    const sales = await Sale.findAll({
      where: { tenant_id: tid, status: 'completed', created_at: { [Op.between]: [`${today} 00:00:00`, `${today} 23:59:59`] } }
    });

    const totals = { efectivo: 0, qr: 0, debito: 0 };
    let totalAmount = 0;
    sales.forEach(s => { totals[s.payment_method] += parseFloat(s.total); totalAmount += parseFloat(s.total); });

    const closure = await DailyClosure.create({
      tenant_id: tid, date: today, closed_by: req.user.id,
      total_cash: totals.efectivo, total_qr: totals.qr, total_debit: totals.debito,
      total_sales: sales.length, total_amount: totalAmount,
      notes: req.body.notes || ''
    });

    await Sale.update({ closure_id: closure.id }, { where: { tenant_id: tid, created_at: { [Op.between]: [`${today} 00:00:00`, `${today} 23:59:59`] }, status: 'completed' } });

    res.json(closure);
  } catch (e) {
    res.status(500).json({ error: 'Error al cerrar caja' });
  }
};

const getHistory = async (req, res) => {
  try {
    const closures = await DailyClosure.findAll({
      where: { tenant_id: req.tenant.id },
      order: [['date', 'DESC']],
      limit: 30
    });
    res.json(closures);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = { getToday, close, getHistory };
