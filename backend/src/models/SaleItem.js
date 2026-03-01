// src/models/SaleItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleItem = sequelize.define('SaleItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sale_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  product_name: { type: DataTypes.STRING(150), allowNull: false },
  product_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'sale_items', updatedAt: false });

module.exports = SaleItem;
