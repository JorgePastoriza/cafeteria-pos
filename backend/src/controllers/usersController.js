// src/controllers/usersController.js
const { User, Role } = require('../models');

/** GET /api/users */
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

/** POST /api/users */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'El email ya está registrado' });

    const user = await User.create({ name, email, password, role_id });
    const created = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

/** PUT /api/users/:id */
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { name, email, role_id, active, password } = req.body;
    const updateData = { name, email, role_id, active };
    if (password) updateData.password = password;

    await user.update(updateData);
    const updated = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

/** DELETE /api/users/:id */
const deleteUser = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    await user.update({ active: false });
    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

/** GET /api/roles */
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, getRoles };
