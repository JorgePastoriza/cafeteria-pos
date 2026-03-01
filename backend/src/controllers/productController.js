// src/controllers/productController.js
const { Product, Category, StockMovement } = require('../models');
const { Op } = require('sequelize');

/** GET /api/products - Listar productos */
const getProducts = async (req, res) => {
  try {
    const { type, category_id, active, search } = req.query;
    const where = {};

    if (type) where.type = type;
    if (category_id) where.category_id = category_id;
    if (active !== undefined) where.active = active === 'true';
    if (search) where.name = { [Op.like]: `%${search}%` };

    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['name', 'ASC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

/** GET /api/products/:id */
const getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }]
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

/** POST /api/products - Crear producto (admin) */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, stock_min, category_id, type, image_url, active } = req.body;

    if (!name || !price || !category_id || !type) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const product = await Product.create({
      name, description, price, stock: stock || 0,
      stock_min: stock_min || 5, category_id, type, image_url, active
    });

    if (stock > 0) {
      await StockMovement.create({
        product_id: product.id,
        type: 'adjustment',
        quantity: stock,
        previous_stock: 0,
        new_stock: stock,
        reason: 'Stock inicial',
        user_id: req.user.id
      });
    }

    const created = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category' }]
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

/** PUT /api/products/:id - Actualizar producto (admin) */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await product.update(req.body);
    const updated = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category' }]
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

/** DELETE /api/products/:id - Eliminar producto (admin) */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    await product.update({ active: false });
    res.json({ message: 'Producto desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

/** POST /api/products/:id/stock - Ajuste manual de stock (admin) */
const adjustStock = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const previousStock = product.stock;
    const newStock = previousStock + parseInt(quantity);

    if (newStock < 0) {
      return res.status(400).json({ error: 'El stock no puede quedar negativo' });
    }

    await product.update({ stock: newStock });
    await StockMovement.create({
      product_id: product.id,
      type: 'adjustment',
      quantity: parseInt(quantity),
      previous_stock: previousStock,
      new_stock: newStock,
      reason: reason || 'Ajuste manual',
      user_id: req.user.id
    });

    res.json({ ...product.toJSON(), stock: newStock });
  } catch (error) {
    res.status(500).json({ error: 'Error al ajustar stock' });
  }
};

/** GET /api/products/:id/movements - Historial de movimientos */
const getStockMovements = async (req, res) => {
  try {
    const movements = await StockMovement.findAll({
      where: { product_id: req.params.id },
      include: [{ model: require('../models').User, as: 'user', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock, getStockMovements };
