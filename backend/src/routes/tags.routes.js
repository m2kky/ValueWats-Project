const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const tenantContext = require('../middleware/tenantContext');

// All routes here are scoped to tenant
router.use(tenantContext);

/**
 * @route GET /api/tags
 * @desc Get all tags for the tenant
 */
router.get('/', async (req, res) => {
    try {
        const tags = await prisma.contactLabel.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { name: 'asc' }
        });
        res.json({ tags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

/**
 * @route POST /api/tags
 * @desc Create a new tag
 */
router.post('/', async (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Tag name is required' });

    try {
        const tag = await prisma.contactLabel.create({
            data: {
                name,
                color: color || '#6366f1',
                tenantId: req.tenantId
            }
        });
        res.json(tag);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Tag already exists' });
        }
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

/**
 * @route DELETE /api/tags/:id
 * @desc Delete a tag
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.contactLabel.delete({
            where: {
                id: req.params.id,
                tenantId: req.tenantId
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

module.exports = router;
