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
  created_by: { type: DataTypes.INTEGER }
}, { tableName: 'tenants' });

module.exports = Tenant;
