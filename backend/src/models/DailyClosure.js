// src/models/DailyClosure.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyClosure = sequelize.define('DailyClosure', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
  closed_by: { type: DataTypes.INTEGER, allowNull: false },
  closed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  total_cash: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_qr: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_debit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_sales: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'daily_closures', updatedAt: false, createdAt: false });

module.exports = DailyClosure;
