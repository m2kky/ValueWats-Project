const express = require('express');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const campaignController = require('../controllers/campaignController');
const authenticate = require('../middleware/tenantContext');

router.use(authenticate);

const upload = require('../middleware/upload');

// Handle both CSV file (contacts) and Media file (attachment)
router.post('/', checkPermission('campaigns.manage'), upload.fields([{ name: 'file', maxCount: 1 }, { name: 'media', maxCount: 1 }]), campaignController.createCampaign);
router.post('/preview-sheet', checkPermission('campaigns.manage'), campaignController.previewSheet);
router.post('/estimate-audience', checkPermission('campaigns.manage'), campaignController.calculateAudienceCoverage);
router.get('/', campaignController.getCampaigns);
router.get('/active', campaignController.getActiveCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.get('/:id/messages', campaignController.getCampaignMessages);
router.get('/:id/export', campaignController.exportCampaignContacts);
router.post('/:id/pause', checkPermission('campaigns.manage'), campaignController.pauseCampaign);
router.post('/:id/resume', checkPermission('campaigns.manage'), campaignController.resumeCampaign);
router.post('/:id/stop', checkPermission('campaigns.manage'), campaignController.stopCampaign);
router.post('/:id/duplicate', checkPermission('campaigns.manage'), campaignController.duplicateCampaign);
router.put('/:id', checkPermission('campaigns.manage'), campaignController.updateCampaign);
router.delete('/:id', checkPermission('campaigns.manage'), campaignController.deleteCampaign);

module.exports = router;
