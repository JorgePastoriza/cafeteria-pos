// src/controllers/stockController.js
const { Product, StockMovement, User } = require('../models');

const adjustStock = async (req, res) => {
  try {
    const { product_id, quantity, reason, type = 'adjustment' } = req.body;
    if (!product_id || quantity === undefined) return res.status(400).json({ error: 'Faltan campos' });

    const product = await Product.findOne({ where: { id: product_id, tenant_id: req.tenant.id } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const newStock = product.stock + parseInt(quantity);
    if (newStock < 0) return res.status(400).json({ error: 'Stock no puede ser negativo' });

    await StockMovement.create({
      tenant_id: req.tenant.id, product_id, type,
      quantity: parseInt(quantity), previous_stock: product.stock, new_stock: newStock,
      reason, user_id: req.user.id
    });

    await product.update({ stock: newStock });
    res.json({ product: { id: product.id, name: product.name, stock: newStock } });
  } catch (e) {
    res.status(500).json({ error: 'Error al ajustar stock' });
  }
};

const getMovements = async (req, res) => {
  try {
    const movements = await StockMovement.findAll({
      where: { tenant_id: req.tenant.id },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(movements);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
};

module.exports = { adjustStock, getMovements };
