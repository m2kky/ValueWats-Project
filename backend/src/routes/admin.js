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
router.post('/tenants/:id/impersonate', adminController.impersonateTenant);

// --- Plans Management ---
router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);

// --- Users Management ---
router.get('/users', adminController.getUsers);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// --- Webhooks & Logs ---
// router.get('/logs/webhooks', adminController.getWebhookLogs);
// router.get('/logs/system', adminController.getSystemLogs);

module.exports = router;
