// src/controllers/dashboardController.js
const { Sale, SaleItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

/** GET /api/dashboard - Datos del dashboard con filtros de fecha */
const getDashboard = async (req, res) => {
  try {
    const { from, to } = req.query;
    const startDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const dateWhere = { created_at: { [Op.between]: [startDate, endDate] }, status: 'completed' };

    // Ventas por día
    const salesByDay = await Sale.findAll({
      where: dateWhere,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Ventas por franja horaria
    const salesByHour = await Sale.findAll({
      where: dateWhere,
      attributes: [
        [sequelize.fn('HOUR', sequelize.col('created_at')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: [sequelize.fn('HOUR', sequelize.col('created_at'))],
      order: [[sequelize.fn('HOUR', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Ventas por método de pago
    const salesByPayment = await Sale.findAll({
      where: dateWhere,
      attributes: [
        'payment_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: ['payment_method'],
      raw: true
    });

    // Top productos
    const topProducts = await SaleItem.findAll({
      include: [{
        model: Sale,
        where: dateWhere,
        attributes: []
      }],
      attributes: [
        'product_name',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_qty'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_amount']
      ],
      group: ['product_name'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Totales generales
    const totals = await Sale.findOne({
      where: dateWhere,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      raw: true
    });

    res.json({ salesByDay, salesByHour, salesByPayment, topProducts, totals });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
};

module.exports = { getDashboard };
