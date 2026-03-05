const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const tenantContext = require('../middleware/tenantContext');

// Get all lifecycle stages
router.get('/', tenantContext, async (req, res) => {
  try {
    const stages = await prisma.lifecycleStage.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { conversations: true }
        }
      }
    });
    res.json(stages);
  } catch (error) {
    console.error('Get lifecycle stages error:', error);
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
});

// Create lifecycle stage
router.post('/', tenantContext, async (req, res) => {
  try {
    const { name, emoji, color, order } = req.body;

    // Default order if not provided
    let newOrder = order;
    if (newOrder === undefined) {
      const maxOrder = await prisma.lifecycleStage.aggregate({
        where: { tenantId: req.user.tenantId },
        _max: { order: true }
      });
      newOrder = (maxOrder._max.order || 0) + 1;
    }

    const stage = await prisma.lifecycleStage.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        emoji,
        color,
        order: newOrder
      }
    });
    res.status(201).json(stage);
  } catch (error) {
    console.error('Create lifecycle stage error:', error);
    res.status(500).json({ error: 'Failed to create stage' });
  }
});

// Update lifecycle stage
router.put('/:id', tenantContext, async (req, res) => {
  try {
    const stage = await prisma.lifecycleStage.updateMany({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      data: req.body
    });

    if (stage.count === 0) return res.status(404).json({ error: 'Stage not found' });

    const updated = await prisma.lifecycleStage.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (error) {
    console.error('Update lifecycle stage error:', error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// Delete lifecycle stage
router.delete('/:id', tenantContext, async (req, res) => {
  try {
    // Unassign contacts from this stage first
    await prisma.conversation.updateMany({
      where: { lifecycleStageId: req.params.id },
      data: { lifecycleStageId: null }
    });
    await prisma.contact.updateMany({
      where: { lifecycleStageId: req.params.id },
      data: { lifecycleStageId: null }
    });

    const deleted = await prisma.lifecycleStage.deleteMany({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });

    if (deleted.count === 0) return res.status(404).json({ error: 'Stage not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete lifecycle stage error:', error);
    res.status(500).json({ error: 'Failed to delete stage' });
  }
});

module.exports = router;
