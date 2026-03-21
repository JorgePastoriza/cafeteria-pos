// src/models/Sale.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sale_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  payment_method: {
    type: DataTypes.ENUM('efectivo', 'qr', 'debito'),
    allowNull: false
  },
  // ── DELIVERY ──
  delivery_type: {
    type: DataTypes.ENUM('local', 'delivery'),
    allowNull: false,
    defaultValue: 'local',
    comment: 'Modalidad: local = mostrador, delivery = con recargo'
  },
  delivery_surcharge_pct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Snapshot del % de recargo al momento de la venta'
  },
  delivery_surcharge_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Monto del recargo en pesos'
  },
  subtotal_before_surcharge: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Total de los productos antes del recargo'
  },
  // ─────────────
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('completed', 'cancelled'), defaultValue: 'completed' },
  closure_id: { type: DataTypes.INTEGER }
}, { tableName: 'sales' });

module.exports = Sale;
