// src/controllers/categoriesController.js
const { Category } = require('../models');

const getAll = async (req, res) => {
  try {
    const { type } = req.query;
    const where = { tenant_id: req.tenant.id, active: true };
    if (type) where.type = type;
    const categories = await Category.findAll({ where, order: [['name', 'ASC']] });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const create = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo requeridos' });
    const category = await Category.create({ tenant_id: req.tenant.id, name, type, icon: icon || '☕' });
    res.status(201).json(category);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const update = async (req, res) => {
  try {
    const cat = await Category.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    await cat.update(req.body);
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

const remove = async (req, res) => {
  try {
    const cat = await Category.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    await cat.update({ active: false });
    res.json({ message: 'Categoría desactivada' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

module.exports = { getAll, create, update, remove };
