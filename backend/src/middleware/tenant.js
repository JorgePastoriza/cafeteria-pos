// src/middleware/tenant.js
const { Tenant } = require('../models');

/**
 * Resuelve el tenant desde el slug en la URL: /api/:slug/...
 * Adjunta req.tenant para uso en controladores
 */
const resolveTenant = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: 'Slug de comercio requerido' });

    const tenant = await Tenant.findOne({ where: { slug, active: true } });
    if (!tenant) return res.status(404).json({ error: 'Comercio no encontrado' });

    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant resolve error:', error);
    res.status(500).json({ error: 'Error al resolver el comercio' });
  }
};

/**
 * Verifica que el usuario autenticado pertenece al tenant de la URL
 */
const checkTenantAccess = (req, res, next) => {
  if (!req.user || !req.tenant) return res.status(401).json({ error: 'No autorizado' });
  if (req.user.tenant_id !== req.tenant.id) {
    return res.status(403).json({ error: 'Acceso denegado a este comercio' });
  }
  next();
};

module.exports = { resolveTenant, checkTenantAccess };
