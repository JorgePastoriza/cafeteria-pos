// src/controllers/tenantController.js
const { Tenant } = require('../models');

/**
 * GET /api/:slug/tenant/settings
 * Retorna configuración pública+privada del tenant (solo admin)
 */
const getSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.tenant.id, {
      attributes: ['id', 'name', 'slug', 'logo_url', 'primary_color', 'delivery_surcharge']
    });
    if (!tenant) return res.status(404).json({ error: 'Comercio no encontrado' });
    res.json(tenant);
  } catch (e) {
    console.error('getSettings error:', e);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

/**
 * PUT /api/:slug/tenant/settings
 * Actualiza configuración del tenant (solo admin)
 * Acepta: name, logo_url, primary_color, delivery_surcharge
 */
const updateSettings = async (req, res) => {
  try {
    const { name, logo_url, primary_color, delivery_surcharge } = req.body;

    // Validar recargo
    if (delivery_surcharge !== undefined) {
      const pct = parseFloat(delivery_surcharge);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ error: 'El recargo debe ser un número entre 0 y 100' });
      }
    }

    const tenant = await Tenant.findByPk(req.tenant.id);
    if (!tenant) return res.status(404).json({ error: 'Comercio no encontrado' });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (primary_color !== undefined) updates.primary_color = primary_color;
    if (delivery_surcharge !== undefined) updates.delivery_surcharge = parseFloat(delivery_surcharge);

    await tenant.update(updates);

    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color,
      delivery_surcharge: parseFloat(tenant.delivery_surcharge)
    });
  } catch (e) {
    console.error('updateSettings error:', e);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

module.exports = { getSettings, updateSettings };
