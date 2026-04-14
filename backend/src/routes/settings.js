const express = require('express');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const prisma = require('../config/database');

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: {
        optoutEnabled: true,
        optoutMessage: true,
        optoutKeywords: true,
      }
    });
    res.json(tenant);
  } catch (error) {
    console.error('[Settings] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', checkPermission('settings.manage'), async (req, res) => {
  try {
    const { optoutEnabled, optoutMessage, optoutKeywords } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        ...(optoutEnabled !== undefined && { optoutEnabled }),
        ...(optoutMessage !== undefined && { optoutMessage }),
        ...(optoutKeywords !== undefined && { optoutKeywords }),
      },
      select: {
        optoutEnabled: true,
        optoutMessage: true,
        optoutKeywords: true,
      }
    });
    res.json(tenant);
  } catch (error) {
    console.error('[Settings] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
