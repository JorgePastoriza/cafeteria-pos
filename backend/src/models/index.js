// src/models/index.js
const sequelize = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const Tenant = require('./Tenant');
const SuperAdmin = require('./SuperAdmin');
const Category = require('./Category');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const StockMovement = require('./StockMovement');
const DailyClosure = require('./DailyClosure');

// ── Tenant ──
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(User, { foreignKey: 'tenant_id' });
Category.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(Category, { foreignKey: 'tenant_id' });
Product.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(Product, { foreignKey: 'tenant_id' });
Sale.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(Sale, { foreignKey: 'tenant_id' });
StockMovement.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
DailyClosure.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(DailyClosure, { foreignKey: 'tenant_id' });
Tenant.belongsTo(SuperAdmin, { foreignKey: 'created_by', as: 'creator' });
SuperAdmin.hasMany(Tenant, { foreignKey: 'created_by' });

// ── User / Role ──
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id' });

// ── Product / Category ──
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id' });

// ── Sale ──
Sale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Sale, { foreignKey: 'user_id' });
Sale.belongsTo(DailyClosure, { foreignKey: 'closure_id', as: 'closure' });
DailyClosure.hasMany(Sale, { foreignKey: 'closure_id' });
Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(SaleItem, { foreignKey: 'product_id' });

// ── StockMovement ──
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });
StockMovement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── DailyClosure ──
DailyClosure.belongsTo(User, { foreignKey: 'closed_by', as: 'closedByUser' });

module.exports = {
  sequelize, Role, User, Tenant, SuperAdmin,
  Category, Product, Sale, SaleItem, StockMovement, DailyClosure
};
