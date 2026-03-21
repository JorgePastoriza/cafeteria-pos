// src/models/Tenant.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  logo_url: { type: DataTypes.STRING(500) },
  primary_color: { type: DataTypes.STRING(7), defaultValue: '#e8a045' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER },
  // ── DELIVERY ──
  delivery_surcharge: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Porcentaje de recargo para delivery (ej: 10 = 10%)'
  }
}, { tableName: 'tenants' });

module.exports = Tenant;
