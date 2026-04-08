const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

// All routes under /api/admin are protected by isAdmin middleware
router.use(isAdmin);

// --- Dashboard Stats ---
router.get('/stats', adminController.getSystemStats);

// --- Tenants Management ---
router.get('/tenants', adminController.getTenants);
router.get('/tenants/:id', adminController.getTenantDetails);
router.patch('/tenants/:id/status', adminController.updateTenantStatus);
router.patch('/tenants/:id/plan', adminController.updateTenantPlan);
router.post('/tenants/:id/impersonate', adminController.impersonateTenant);

// --- Plans Management ---
router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);

// --- Users Management ---
router.get('/users', adminController.getUsers);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// --- Global Notifications ---
router.get('/notifications', adminController.getGlobalNotifications);
router.post('/notifications', adminController.createGlobalNotification);
router.put('/notifications/:id', adminController.updateGlobalNotification);
router.patch('/notifications/:id/toggle', adminController.toggleGlobalNotification);
router.delete('/notifications/:id', adminController.deleteGlobalNotification);

module.exports = router;
