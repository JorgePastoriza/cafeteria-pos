// src/controllers/categoriesController.js
const { Category } = require('../models');

const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const categories = await Category.findAll({ where, order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    const category = await Category.create({ name, type, icon });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

module.exports = { getCategories, createCategory };
