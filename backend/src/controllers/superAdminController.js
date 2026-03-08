// src/controllers/superAdminController.js
const jwt = require('jsonwebtoken');
const { SuperAdmin, Tenant, User, Role, Sale, Product } = require('../models');
const { Op } = require('sequelize');

/** POST /api/superadmin/login */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const sa = await SuperAdmin.findOne({ where: { email, active: true } });
    if (!sa || !(await sa.validatePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: sa.id, email: sa.email, type: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, superAdmin: { id: sa.id, name: sa.name, email: sa.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};

/** GET /api/superadmin/me */
const me = (req, res) => {
  res.json({ id: req.superAdmin.id, name: req.superAdmin.name, email: req.superAdmin.email });
};

/** GET /api/superadmin/tenants */
const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: SuperAdmin, as: 'creator', attributes: ['name'] }]
    });

    // Agregar conteo de usuarios y ventas
    const enriched = await Promise.all(tenants.map(async (t) => {
      const userCount = await User.count({ where: { tenant_id: t.id } });
      const saleCount = await Sale.count({ where: { tenant_id: t.id } });
      return { ...t.toJSON(), userCount, saleCount };
    }));

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener comercios' });
  }
};

/** POST /api/superadmin/tenants - Crear comercio + admin */
const createTenant = async (req, res) => {
  const { sequelize } = require('../models');
  const t = await sequelize.transaction();
  try {
    const { name, slug, logo_url, primary_color, adminName, adminEmail, adminPassword } = req.body;

    if (!name || !slug || !adminName || !adminEmail || !adminPassword) {
      await t.rollback();
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Validar slug (solo letras, números y guiones)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      await t.rollback();
      return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' });
    }

    const existing = await Tenant.findOne({ where: { slug }, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'Ya existe un comercio con ese slug' });
    }

    // Crear tenant
    const tenant = await Tenant.create({
      name, slug, logo_url, primary_color: primary_color || '#e8a045',
      created_by: req.superAdmin.id
    }, { transaction: t });

    // Obtener rol admin
    const adminRole = await Role.findOne({ where: { name: 'admin' } });

    // Crear usuario admin del tenant
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await User.create({
      tenant_id: tenant.id,
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role_id: adminRole.id
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      tenant: tenant.toJSON(),
      adminUser: { id: adminUser.id, name: adminUser.name, email: adminUser.email }
    });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ error: 'Error al crear el comercio' });
  }
};

/** PUT /api/superadmin/tenants/:id */
const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Comercio no encontrado' });

    const { name, logo_url, primary_color, active } = req.body;
    await tenant.update({ name, logo_url, primary_color, active });
    res.json(tenant);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

/** DELETE /api/superadmin/tenants/:id */
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Comercio no encontrado' });
    await tenant.update({ active: false });
    res.json({ message: 'Comercio desactivado' });
  } catch (e) {
    res.status(500).json({ error: 'Error al desactivar' });
  }
};

/** GET /api/superadmin/tenants/:id/users */
const getTenantUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { tenant_id: req.params.id },
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

/** GET /api/superadmin/stats */
const getStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.count({ where: { active: true } });
    const totalUsers = await User.count({ where: { active: true } });
    const totalSales = await Sale.count();
    const tenants = await Tenant.findAll({
      where: { active: true },
      attributes: ['id', 'name', 'slug', 'primary_color', 'logo_url', 'created_at']
    });
    res.json({ totalTenants, totalUsers, totalSales, tenants });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = { login, me, getTenants, createTenant, updateTenant, deleteTenant, getTenantUsers, getStats };
