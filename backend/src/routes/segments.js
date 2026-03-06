const express = require('express');
const router = express.Router();
const segmentController = require('../controllers/segmentController');
const { requireAuth } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

router.use(requireAuth);
router.use(tenantContext);

router.post('/', segmentController.createSegment);
router.get('/', segmentController.getSegments);
router.delete('/:id', segmentController.deleteSegment);

module.exports = router;
