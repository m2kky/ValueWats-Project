const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const tenantContext = require('../middleware/tenantContext');

// All routes here are protected by tenant context
router.use(tenantContext);

router.get('/stats', dashboardController.getStats);

module.exports = router;
