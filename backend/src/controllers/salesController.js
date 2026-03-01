// src/controllers/salesController.js
const { Sale, SaleItem, Product, StockMovement, User, DailyClosure, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Genera número de venta único: VTA-YYYYMMDD-NNNN
 */
const generateSaleNumber = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Sale.count({
    where: { created_at: { [Op.gte]: new Date().setHours(0, 0, 0, 0) } }
  });
  return `VTA-${today}-${String(count + 1).padStart(4, '0')}`;
};

/** POST /api/sales - Crear venta */
const createSale = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, payment_method } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El carrito está vacío' });
    }
    if (!payment_method) {
      await t.rollback();
      return res.status(400).json({ error: 'Seleccione un método de pago' });
    }

    // Verificar stock y calcular total
    let total = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: true });
      if (!product || !product.active) {
        await t.rollback();
        return res.status(400).json({ error: `Producto no disponible: ${item.product_id}` });
      }
      if (product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente para "${product.name}". Stock disponible: ${product.stock}`
        });
      }
      const subtotal = parseFloat(product.price) * item.quantity;
      total += subtotal;
      enrichedItems.push({ product, quantity: item.quantity, subtotal });
    }

    const sale_number = await generateSaleNumber();

    // Crear venta
    const sale = await Sale.create({
      sale_number,
      user_id: req.user.id,
      payment_method,
      total
    }, { transaction: t });

    // Crear ítems y descontar stock
    for (const { product, quantity, subtotal } of enrichedItems) {
      await SaleItem.create({
        sale_id: sale.id,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity,
        subtotal
      }, { transaction: t });

      const newStock = product.stock - quantity;
      await product.update({ stock: newStock }, { transaction: t });

      await StockMovement.create({
        product_id: product.id,
        type: 'sale',
        quantity: -quantity,
        previous_stock: product.stock,
        new_stock: newStock,
        reason: `Venta ${sale_number}`,
        user_id: req.user.id,
        sale_id: sale.id
      }, { transaction: t });
    }

    await t.commit();

    const fullSale = await Sale.findByPk(sale.id, {
      include: [
        { model: SaleItem, as: 'items' },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(fullSale);
  } catch (error) {
    await t.rollback();
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
};

/** GET /api/sales - Listar ventas */
const getSales = async (req, res) => {
  try {
    const { from, to, payment_method, page = 1, limit = 50 } = req.query;
    const where = {};

    if (from || to) {
      where.created_at = {};
      if (from) where.created_at[Op.gte] = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = toDate;
      }
    }
    if (payment_method) where.payment_method = payment_method;

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: SaleItem, as: 'items' },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({ total: count, page: parseInt(page), sales: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

/** GET /api/sales/today - Resumen del día */
const getTodaySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await Sale.findAll({
      where: {
        created_at: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: 'completed'
      },
      include: [{ model: SaleItem, as: 'items' }]
    });

    const totals = { efectivo: 0, qr: 0, debito: 0, total: 0, count: sales.length };
    const productSales = {};

    for (const sale of sales) {
      totals[sale.payment_method] += parseFloat(sale.total);
      totals.total += parseFloat(sale.total);

      for (const item of sale.items) {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: item.product_name, quantity: 0, total: 0 };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].total += parseFloat(item.subtotal);
      }
    }

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const closure = await DailyClosure.findOne({
      where: { date: today.toISOString().slice(0, 10) }
    });

    res.json({ ...totals, topProducts, isClosed: !!closure, closure });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen del día' });
  }
};

/** POST /api/sales/close-day - Cierre diario */
const closeDay = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await DailyClosure.findOne({ where: { date: today } });
    if (existing) return res.status(400).json({ error: 'El día ya fue cerrado' });

    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.findAll({
      where: { created_at: { [Op.gte]: startOfDay, [Op.lte]: endOfDay }, status: 'completed' }
    });

    const totals = { efectivo: 0, qr: 0, debito: 0, total: 0 };
    for (const sale of sales) {
      totals[sale.payment_method] += parseFloat(sale.total);
      totals.total += parseFloat(sale.total);
    }

    const closure = await DailyClosure.create({
      date: today,
      closed_by: req.user.id,
      total_cash: totals.efectivo,
      total_qr: totals.qr,
      total_debit: totals.debito,
      total_sales: sales.length,
      total_amount: totals.total,
      notes: req.body.notes
    });

    await Sale.update({ closure_id: closure.id }, {
      where: { created_at: { [Op.gte]: startOfDay, [Op.lte]: endOfDay }, status: 'completed' }
    });

    res.status(201).json(closure);
  } catch (error) {
    console.error('Close day error:', error);
    res.status(500).json({ error: 'Error al cerrar el día' });
  }
};

module.exports = { createSale, getSales, getTodaySummary, closeDay };
