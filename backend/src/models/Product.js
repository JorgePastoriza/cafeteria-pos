// src/models/Product.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  stock_min: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('cafe', 'comida'), allowNull: false },
  image_url: { type: DataTypes.STRING(500) },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'products' });

module.exports = Product;
