const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// All routes here are protected by the auth middleware mounted in server.js

// List all templates
router.get('/', templateController.getTemplates);

// Create a template
router.post('/', templateController.createTemplate);

// Update a template
router.patch('/:id', templateController.updateTemplate);

// Delete a template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
