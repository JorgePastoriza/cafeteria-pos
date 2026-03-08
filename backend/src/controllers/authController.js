// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { User, Role, Tenant } = require('../models');

/** POST /api/:slug/auth/login */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await User.findOne({
      where: { email, active: true, tenant_id: req.tenant.id },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name, tenant_id: req.tenant.id, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
      tenant: {
        id: req.tenant.id, name: req.tenant.name, slug: req.tenant.slug,
        logo_url: req.tenant.logo_url, primary_color: req.tenant.primary_color
      }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Error interno' });
  }
};

/** GET /api/:slug/auth/me */
const me = (req, res) => {
  res.json({
    id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role.name,
    tenant: {
      id: req.tenant.id, name: req.tenant.name, slug: req.tenant.slug,
      logo_url: req.tenant.logo_url, primary_color: req.tenant.primary_color
    }
  });
};

/** GET /api/tenant-info/:slug - Datos públicos para pantalla de login */
const getTenantInfo = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      where: { slug: req.params.slug, active: true },
      attributes: ['id', 'name', 'slug', 'logo_url', 'primary_color']
    });
    if (!tenant) return res.status(404).json({ error: 'Comercio no encontrado' });
    res.json(tenant);
  } catch (e) {
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { login, me, getTenantInfo };
