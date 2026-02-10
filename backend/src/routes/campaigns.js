const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authenticate = require('../middleware/tenantContext');

router.use(authenticate);

const upload = require('../middleware/upload');

// Handle both CSV file (contacts) and Media file (attachment)
router.post('/', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'media', maxCount: 1 }]), campaignController.createCampaign);
router.get('/', campaignController.getCampaigns);
router.get('/active', campaignController.getActiveCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);
router.post('/:id/stop', campaignController.stopCampaign);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
