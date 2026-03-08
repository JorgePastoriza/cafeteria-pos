// src/controllers/usersController.js
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { tenant_id: req.tenant.id },
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password || !role_id) return res.status(400).json({ error: 'Faltan campos' });

    const existing = await User.findOne({ where: { email, tenant_id: req.tenant.id } });
    if (existing) return res.status(400).json({ error: 'Ya existe un usuario con ese email en este comercio' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      tenant_id: req.tenant.id, name, email, password: hashedPassword, role_id, active: true
    });
    const full = await User.findByPk(user.id, { include: [{ model: Role, as: 'role' }], attributes: { exclude: ['password'] } });
    res.status(201).json(full);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const update = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { name, email, password, role_id, active } = req.body;
    const updates = { name, email, role_id, active };
    if (password) updates.password = await bcrypt.hash(password, 10);

    await user.update(updates);
    const full = await User.findByPk(user.id, { include: [{ model: Role, as: 'role' }], attributes: { exclude: ['password'] } });
    res.json(full);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

const remove = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'No podés eliminarte a vos mismo' });
    await user.update({ active: false });
    res.json({ message: 'Usuario desactivado' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    res.json(roles);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

module.exports = { getAll, create, update, remove, getRoles };
