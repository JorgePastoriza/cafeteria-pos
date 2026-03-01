// src/models/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  type: { type: DataTypes.ENUM('cafe', 'comida'), allowNull: false },
  icon: { type: DataTypes.STRING(10), defaultValue: '☕' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'categories' });

module.exports = Category;
