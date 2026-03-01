// src/models/Sale.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sale_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  payment_method: { type: DataTypes.ENUM('efectivo', 'qr', 'debito'), allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('completed', 'cancelled'), defaultValue: 'completed' },
  closure_id: { type: DataTypes.INTEGER }
}, { tableName: 'sales' });

module.exports = Sale;
