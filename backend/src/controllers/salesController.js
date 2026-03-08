// src/controllers/salesController.js
const { Sale, SaleItem, Product, User, StockMovement, DailyClosure } = require('../models');
const { Op } = require('sequelize');

// Obtiene la fecha local del servidor en formato YYYY-MM-DD
// Usa el offset de la variable de entorno TZ o calcula desde el servidor
const getLocalDateString = () => {
  const now = new Date();
  // Usar fecha local del servidor (respeta la variable TZ del sistema)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateSaleNumber = (tenantSlug) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${tenantSlug.toUpperCase()}-${year}${month}${day}-${hours}${mins}${secs}`;
};

const create = async (req, res) => {
  const { sequelize } = require('../models');
  const t = await sequelize.transaction();
  try {
    const { items, payment_method } = req.body;
    if (!items?.length) { await t.rollback(); return res.status(400).json({ error: 'El carrito está vacío' }); }
    if (!payment_method) { await t.rollback(); return res.status(400).json({ error: 'Método de pago requerido' }); }

    // Verificar cierre usando fecha LOCAL del servidor
    const today = getLocalDateString();
    const closure = await DailyClosure.findOne({
      where: { tenant_id: req.tenant.id, date: today },
      transaction: t
    });
    if (closure) {
      await t.rollback();
      return res.status(400).json({ error: `La caja ya fue cerrada hoy (${today}). Podés volver a operar mañana.` });
    }

    let total = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id, tenant_id: req.tenant.id, active: true },
        transaction: t, lock: true
      });
      if (!product) { await t.rollback(); return res.status(400).json({ error: `Producto ${item.product_id} no encontrado` }); }
      if (product.stock < item.quantity) { await t.rollback(); return res.status(400).json({ error: `Stock insuficiente para ${product.name}` }); }

      const subtotal = parseFloat(product.price) * item.quantity;
      total += subtotal;
      saleItems.push({ product, quantity: item.quantity, subtotal, price: product.price });
    }

    const sale = await Sale.create({
      tenant_id: req.tenant.id,
      sale_number: generateSaleNumber(req.tenant.slug),
      user_id: req.user.id,
      payment_method, total, status: 'completed'
    }, { transaction: t });

    for (const item of saleItems) {
      await SaleItem.create({
        sale_id: sale.id, product_id: item.product.id,
        product_name: item.product.name, product_price: item.price,
        quantity: item.quantity, subtotal: item.subtotal
      }, { transaction: t });

      const prevStock = item.product.stock;
      await item.product.update({ stock: prevStock - item.quantity }, { transaction: t });

      await StockMovement.create({
        tenant_id: req.tenant.id, product_id: item.product.id,
        type: 'sale', quantity: -item.quantity,
        previous_stock: prevStock, new_stock: prevStock - item.quantity,
        user_id: req.user.id, sale_id: sale.id
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ ...sale.toJSON(), items: saleItems.length });
  } catch (e) {
    await t.rollback();
    console.error('Sale create error:', e);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
};

const getAll = async (req, res) => {
  try {
    // Soporta: date (un día), from+to (rango), o sin fecha (últimos 50)
    const { date, from, to, payment_method, page = 1, limit = 100 } = req.query;
    const where = { tenant_id: req.tenant.id, status: 'completed' };

    if (date) {
      // Filtro por un día específico
      where.created_at = { [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`] };
    } else if (from && to) {
      // Filtro por rango de fechas
      where.created_at = { [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`] };
    } else if (from) {
      // Solo fecha desde
      where.created_at = { [Op.gte]: `${from} 00:00:00` };
    }

    if (payment_method) where.payment_method = payment_method;

    const sales = await Sale.findAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: SaleItem, as: 'items' }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(sales);
  } catch (e) {
    console.error('Sales getAll error:', e);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

const getById = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      where: { id: req.params.id, tenant_id: req.tenant.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: SaleItem, as: 'items' }
      ]
    });
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(sale);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

module.exports = { create, getAll, getById };
