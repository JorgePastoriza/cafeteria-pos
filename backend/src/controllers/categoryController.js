// src/controllers/categoryController.js
const { Category, Product } = require('../models');

const getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { tenant_id: req.tenant.id },
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const create = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });

    const exists = await Category.findOne({ where: { tenant_id: req.tenant.id, name } });
    if (exists) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });

    const category = await Category.create({
      tenant_id: req.tenant.id,
      name,
      type,
      icon: icon || (type === 'cafe' ? '☕' : '🥐'),
      active: true
    });
    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const update = async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    const { name, icon, type } = req.body;

    // Si cambia el nombre, verificar que no exista otro igual
    if (name && name !== category.name) {
      const exists = await Category.findOne({ where: { tenant_id: req.tenant.id, name } });
      if (exists) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    await category.update({ name, icon, type });
    res.json(category);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

const remove = async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    // Verificar si tiene productos activos asociados
    const productCount = await Product.count({ where: { category_id: category.id, active: true } });
    if (productCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: tiene ${productCount} producto${productCount > 1 ? 's' : ''} activo${productCount > 1 ? 's' : ''} asociado${productCount > 1 ? 's' : ''}`
      });
    }

    await category.destroy();
    res.json({ message: 'Categoría eliminada' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

module.exports = { getAll, create, update, remove };
