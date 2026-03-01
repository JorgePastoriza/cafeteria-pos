// src/models/index.js
const sequelize = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const StockMovement = require('./StockMovement');
const DailyClosure = require('./DailyClosure');

// ============================================================
// ASOCIACIONES
// ============================================================

// User <-> Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id' });

// Product <-> Category
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id' });

// Sale <-> User
Sale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Sale, { foreignKey: 'user_id' });

// Sale <-> DailyClosure
Sale.belongsTo(DailyClosure, { foreignKey: 'closure_id', as: 'closure' });
DailyClosure.hasMany(Sale, { foreignKey: 'closure_id' });

// Sale <-> SaleItem
Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });

// SaleItem <-> Product
SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(SaleItem, { foreignKey: 'product_id' });

// StockMovement <-> Product
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });

// StockMovement <-> User
StockMovement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// DailyClosure <-> User
DailyClosure.belongsTo(User, { foreignKey: 'closed_by', as: 'closedByUser' });

module.exports = {
  sequelize,
  Role,
  User,
  Category,
  Product,
  Sale,
  SaleItem,
  StockMovement,
  DailyClosure
};
