const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const tenantContext = require('../middleware/tenantContext');

router.use(tenantContext);

/**
 * @route GET /api/lifecycle-rules
 * @desc Get all lifecycle rules
 */
router.get('/', async (req, res) => {
    try {
        const rules = await prisma.lifecycleRule.findMany({
            where: { tenantId: req.tenantId },
            include: { targetStage: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rules);
    } catch (error) {
        console.error('Error fetching lifecycle rules:', error);
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
});

/**
 * @route POST /api/lifecycle-rules
 * @desc Create a new lifecycle rule
 */
router.post('/', async (req, res) => {
    const { triggerType, triggerValue, targetStageId } = req.body;

    if (!triggerType || !triggerValue || !targetStageId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const rule = await prisma.lifecycleRule.create({
            data: {
                triggerType,
                triggerValue,
                targetStageId,
                tenantId: req.tenantId
            },
            include: { targetStage: true }
        });
        res.json(rule);
    } catch (error) {
        console.error('Error creating lifecycle rule:', error);
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

/**
 * @route PUT /api/lifecycle-rules/:id
 * @desc Toggle active status or update rule
 */
router.put('/:id', async (req, res) => {
    try {
        const rule = await prisma.lifecycleRule.update({
            where: { id: req.params.id, tenantId: req.tenantId },
            data: req.body,
            include: { targetStage: true }
        });
        res.json(rule);
    } catch (error) {
        console.error('Error updating lifecycle rule:', error);
        res.status(500).json({ error: 'Failed to update rule' });
    }
});

/**
 * @route DELETE /api/lifecycle-rules/:id
 * @desc Delete rule
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.lifecycleRule.delete({
            where: { id: req.params.id, tenantId: req.tenantId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting lifecycle rule:', error);
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

module.exports = router;
