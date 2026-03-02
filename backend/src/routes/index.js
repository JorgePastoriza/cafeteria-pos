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


// DIAGNÓSTICO LOGIN TEMPORAL
router.get('/debug-login', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { User, Role } = require('../models');
  
  try {
    // 1. Buscar usuario
    const user = await User.findOne({ 
      where: { email: 'admin@cafeteria.com' },
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) return res.json({ error: 'Usuario no encontrado en BD' });
    
    // 2. Mostrar estado actual
    const hashEnBD = user.password;
    
    // 3. Comparar con varias contraseñas
    const tests = ['Admin1234', 'admin123', 'password', 'Admin1234!'];
    const results = {};
    for (const pwd of tests) {
      results[pwd] = await bcrypt.compare(pwd, hashEnBD);
    }
    
    res.json({
      usuarioEncontrado: true,
      email: user.email,
      activo: user.active,
      rol: user.role?.name,
      hashEnBD: hashEnBD,
      hashPrefix: hashEnBD.substring(0, 7),
      comparaciones: results
    });
  } catch (err) {
    res.json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
