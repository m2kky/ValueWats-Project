const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const tenantContext = require('../middleware/tenantContext');

router.use(tenantContext);

router.get('/', automationController.getAutomations);
router.post('/', automationController.createAutomation);
router.put('/:id', automationController.updateAutomation);
router.delete('/:id', automationController.deleteAutomation);

module.exports = router;
