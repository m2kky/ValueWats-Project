const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const tenantContext = require('../middleware/tenantContext');
const knowledgeService = require('../services/knowledgeService');

// Multer config for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowed.join(', ')}`));
    }
  }
});

// List knowledge sources for an agent
router.get('/:agentId/knowledge', tenantContext, async (req, res) => {
  try {
    // Verify agent belongs to tenant
    const agent = await prisma.aIAgent.findFirst({
      where: { id: req.params.agentId, tenantId: req.user.tenantId }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const sources = await knowledgeService.listKnowledge(req.params.agentId);
    res.json(sources);
  } catch (error) {
    console.error('[Knowledge] List error:', error);
    res.status(500).json({ error: 'Failed to list knowledge sources' });
  }
});

// Add text knowledge source
router.post('/:agentId/knowledge/text', tenantContext, async (req, res) => {
  try {
    const agent = await prisma.aIAgent.findFirst({
      where: { id: req.params.agentId, tenantId: req.user.tenantId }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { title, content, category, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const results = await knowledgeService.addTextKnowledge({
      agentId: req.params.agentId,
      title, content, category, tags
    });

    res.json({ success: true, chunks: results.length, results });
  } catch (error) {
    console.error('[Knowledge] Add text error:', error);
    res.status(500).json({ error: 'Failed to add knowledge' });
  }
});

// Upload file knowledge source (PDF, TXT)
router.post('/:agentId/knowledge/file', tenantContext, upload.single('file'), async (req, res) => {
  try {
    const agent = await prisma.aIAgent.findFirst({
      where: { id: req.params.agentId, tenantId: req.user.tenantId }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await knowledgeService.addFileKnowledge({
      agentId: req.params.agentId,
      file: req.file,
      category: req.body.category,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Knowledge] Upload file error:', error);
    res.status(500).json({ error: error.message || 'Failed to process file' });
  }
});

// Delete knowledge source
router.delete('/:agentId/knowledge/:id', tenantContext, async (req, res) => {
  try {
    const agent = await prisma.aIAgent.findFirst({
      where: { id: req.params.agentId, tenantId: req.user.tenantId }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await knowledgeService.deleteKnowledge(req.params.id, req.params.agentId);
    res.json({ success: true });
  } catch (error) {
    console.error('[Knowledge] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete knowledge source' });
  }
});

module.exports = router;
