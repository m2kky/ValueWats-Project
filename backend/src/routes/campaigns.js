const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authenticate = require('../middleware/tenantContext');

router.use(authenticate);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), campaignController.createCampaign);
router.get('/', campaignController.getCampaigns);
router.get('/active', campaignController.getActiveCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);
router.post('/:id/stop', campaignController.stopCampaign);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
