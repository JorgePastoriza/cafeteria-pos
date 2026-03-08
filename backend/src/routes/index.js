// src/routes/index.js
const router = require('express').Router();
const { authenticate, authorize, authenticateSuperAdmin } = require('../middleware/auth');
const { resolveTenant, checkTenantAccess } = require('../middleware/tenant');

const authCtrl = require('../controllers/authController');
const productCtrl = require('../controllers/productController');
const categoryCtrl = require('../controllers/categoriesController');
const salesCtrl = require('../controllers/salesController');
const dashCtrl = require('../controllers/dashboardController');
const usersCtrl = require('../controllers/usersController');
const stockCtrl = require('../controllers/stockController');
const cierreCtrl = require('../controllers/cierreController');
const saCtrl = require('../controllers/superAdminController');

// ============================================================
// HEALTH
// ============================================================
router.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ============================================================
// TENANT INFO PÚBLICA
// ============================================================
router.get('/tenant-info/:slug', authCtrl.getTenantInfo);

// ============================================================
// SUPER ADMIN
// ============================================================
router.post('/superadmin/login', saCtrl.login);
router.get('/superadmin/me', authenticateSuperAdmin, saCtrl.me);
router.get('/superadmin/stats', authenticateSuperAdmin, saCtrl.getStats);
router.get('/superadmin/tenants', authenticateSuperAdmin, saCtrl.getTenants);
router.post('/superadmin/tenants', authenticateSuperAdmin, saCtrl.createTenant);
router.put('/superadmin/tenants/:id', authenticateSuperAdmin, saCtrl.updateTenant);
router.delete('/superadmin/tenants/:id', authenticateSuperAdmin, saCtrl.deleteTenant);

// Nuevas rutas superadmin
router.post('/superadmin/tenants/:id/toggle', authenticateSuperAdmin, saCtrl.toggleTenant);
router.get('/superadmin/tenants/:id/users', authenticateSuperAdmin, saCtrl.getTenantUsers);
router.put('/superadmin/tenants/:tenantId/users/:userId/password', authenticateSuperAdmin, saCtrl.changeUserPassword);

// ============================================================
// RUTAS POR TENANT: /api/:slug/...
// ============================================================
const tenantRouter = require('express').Router({ mergeParams: true });

tenantRouter.post('/auth/login', authCtrl.login);
tenantRouter.get('/auth/me', authenticate, checkTenantAccess, authCtrl.me);

tenantRouter.get('/products', authenticate, checkTenantAccess, productCtrl.getAll);
tenantRouter.get('/products/:id', authenticate, checkTenantAccess, productCtrl.getById);
tenantRouter.post('/products', authenticate, checkTenantAccess, authorize('admin'), productCtrl.create);
tenantRouter.put('/products/:id', authenticate, checkTenantAccess, authorize('admin'), productCtrl.update);
tenantRouter.delete('/products/:id', authenticate, checkTenantAccess, authorize('admin'), productCtrl.remove);

tenantRouter.get('/categories', authenticate, checkTenantAccess, categoryCtrl.getAll);
tenantRouter.post('/categories', authenticate, checkTenantAccess, authorize('admin'), categoryCtrl.create);
tenantRouter.put('/categories/:id', authenticate, checkTenantAccess, authorize('admin'), categoryCtrl.update);
tenantRouter.delete('/categories/:id', authenticate, checkTenantAccess, authorize('admin'), categoryCtrl.remove);

tenantRouter.post('/sales', authenticate, checkTenantAccess, salesCtrl.create);
tenantRouter.get('/sales', authenticate, checkTenantAccess, authorize('admin'), salesCtrl.getAll);
tenantRouter.get('/sales/:id', authenticate, checkTenantAccess, salesCtrl.getById);

tenantRouter.post('/stock/adjust', authenticate, checkTenantAccess, stockCtrl.adjustStock);
tenantRouter.get('/stock/movements', authenticate, checkTenantAccess, stockCtrl.getMovements);

tenantRouter.get('/cierre/today', authenticate, checkTenantAccess, cierreCtrl.getToday);
tenantRouter.post('/cierre/close', authenticate, checkTenantAccess, cierreCtrl.close);
tenantRouter.get('/cierre/history', authenticate, checkTenantAccess, authorize('admin'), cierreCtrl.getHistory);

tenantRouter.get('/dashboard/stats', authenticate, checkTenantAccess, authorize('admin'), dashCtrl.getStats);
tenantRouter.get('/dashboard/chart', authenticate, checkTenantAccess, authorize('admin'), dashCtrl.getSalesChart);
tenantRouter.get('/dashboard/top-products', authenticate, checkTenantAccess, authorize('admin'), dashCtrl.getTopProducts);

tenantRouter.get('/users', authenticate, checkTenantAccess, authorize('admin'), usersCtrl.getAll);
tenantRouter.post('/users', authenticate, checkTenantAccess, authorize('admin'), usersCtrl.create);
tenantRouter.put('/users/:id', authenticate, checkTenantAccess, authorize('admin'), usersCtrl.update);
tenantRouter.delete('/users/:id', authenticate, checkTenantAccess, authorize('admin'), usersCtrl.remove);
tenantRouter.get('/roles', authenticate, checkTenantAccess, usersCtrl.getRoles);

router.use('/:slug', resolveTenant, tenantRouter);

module.exports = router;
