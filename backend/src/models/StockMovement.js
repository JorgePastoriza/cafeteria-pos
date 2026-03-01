// src/models/StockMovement.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('sale', 'adjustment', 'return'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, comment: 'Negativo = salida, Positivo = entrada' },
  previous_stock: { type: DataTypes.INTEGER, allowNull: false },
  new_stock: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.STRING(255) },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  sale_id: { type: DataTypes.INTEGER }
}, { tableName: 'stock_movements', updatedAt: false });

module.exports = StockMovement;
