// src/controllers/productController.js
const { Product, Category } = require('../models');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
  try {
    const { active, type, category_id, search } = req.query;
    const where = { tenant_id: req.tenant.id };
    if (active !== undefined) where.active = active === 'true';
    if (type) where.type = type;
    if (category_id) where.category_id = category_id;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }],
      order: [['name', 'ASC']]
    });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const getById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, tenant_id: req.tenant.id },
      include: [{ model: Category, as: 'category' }]
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, price, stock, stock_min, category_id, type, image_url } = req.body;
    if (!name || !price || !category_id || !type) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Verificar que la categoría pertenece al tenant
    const category = await Category.findOne({ where: { id: category_id, tenant_id: req.tenant.id } });
    if (!category) return res.status(400).json({ error: 'Categoría no válida' });

    const product = await Product.create({
      tenant_id: req.tenant.id, name, description, price,
      stock: stock || 0, stock_min: stock_min || 5,
      category_id, type, image_url, active: true
    });
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

const update = async (req, res) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    await product.update(req.body);
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const remove = async (req, res) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    await product.update({ active: false });
    res.json({ message: 'Producto desactivado' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

module.exports = { getAll, getById, create, update, remove };
