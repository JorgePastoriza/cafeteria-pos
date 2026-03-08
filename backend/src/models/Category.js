// src/models/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('cafe', 'comida'), allowNull: false },
  icon: { type: DataTypes.STRING(10), defaultValue: '☕' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'categories',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'name']
    }
  ]
});

module.exports = Category;
