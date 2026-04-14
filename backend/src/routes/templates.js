const express = require('express');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const templateController = require('../controllers/templateController');

// All routes here are protected by the auth middleware mounted in server.js

// List all templates
router.get('/', templateController.getTemplates);

// Create a template
router.post('/', checkPermission('templates.manage'), templateController.createTemplate);

// Update a template
router.patch('/:id', checkPermission('templates.manage'), templateController.updateTemplate);

// Delete a template
router.delete('/:id', checkPermission('templates.manage'), templateController.deleteTemplate);

module.exports = router;
