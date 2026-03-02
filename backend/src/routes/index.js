// src/routes/index.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const { login, me } = require('../controllers/authController');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock, getStockMovements } = require('../controllers/productController');
const { createSale, getSales, getTodaySummary, closeDay } = require('../controllers/salesController');
const { getDashboard } = require('../controllers/dashboardController');
const { getUsers, createUser, updateUser, deleteUser, getRoles } = require('../controllers/usersController');
const { getCategories, createCategory } = require('../controllers/categoriesController');

// ============================================================
// AUTH
// ============================================================
router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);

// ============================================================
// PRODUCTS (público para cajeros y admins)
// ============================================================
router.get('/products', authenticate, getProducts);
router.get('/products/:id', authenticate, getProduct);
router.post('/products', authenticate, authorize('admin'), createProduct);
router.put('/products/:id', authenticate, authorize('admin'), updateProduct);
router.delete('/products/:id', authenticate, authorize('admin'), deleteProduct);
router.post('/products/:id/stock', authenticate, adjustStock);
router.get('/products/:id/movements', authenticate, getStockMovements);

// ============================================================
// CATEGORIES
// ============================================================
router.get('/categories', authenticate, getCategories);
router.post('/categories', authenticate, authorize('admin'), createCategory);

// ============================================================
// SALES
// ============================================================
router.post('/sales', authenticate, createSale);
router.get('/sales', authenticate, authorize('admin'), getSales);
router.get('/sales/today', authenticate, getTodaySummary);
router.post('/sales/close-day', authenticate, closeDay);

// ============================================================
// DASHBOARD (solo admin)
// ============================================================
router.get('/dashboard', authenticate, authorize('admin'), getDashboard);

// ============================================================
// USERS (solo admin)
// ============================================================
router.get('/users', authenticate, authorize('admin'), getUsers);
router.post('/users', authenticate, authorize('admin'), createUser);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
router.get('/roles', authenticate, authorize('admin'), getRoles);

// TEMPORAL - borrar después de usarlo
router.get('/reset-password-temp', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { User } = require('../models');
  const hash = await bcrypt.hash('Admin1234', 10);
  await User.update({ password: hash }, { where: { email: 'admin@cafeteria.com' } });
  res.json({ ok: true, message: 'Password actualizado' });
});

module.exports = router;
