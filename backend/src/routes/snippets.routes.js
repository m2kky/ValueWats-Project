const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const tenantContext = require('../middleware/tenantContext');

router.use(tenantContext);

/**
 * @route GET /api/snippets
 * @desc List all snippets for the tenant
 */
router.get('/', async (req, res) => {
    try {
        const snippets = await prisma.snippet.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ snippets });
    } catch (error) {
        console.error('Error fetching snippets:', error);
        res.status(500).json({ error: 'Failed to fetch snippets' });
    }
});

/**
 * @route POST /api/snippets
 * @desc Create a new snippet
 */
router.post('/', async (req, res) => {
    const { title, content, shortcut } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const snippet = await prisma.snippet.create({
            data: {
                title,
                content,
                shortcut: shortcut || null,
                tenantId: req.tenantId
            }
        });
        res.json(snippet);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Shortcut already exists' });
        }
        console.error('Error creating snippet:', error);
        res.status(500).json({ error: 'Failed to create snippet' });
    }
});

/**
 * @route PUT /api/snippets/:id
 * @desc Update a snippet
 */
router.put('/:id', async (req, res) => {
    const { title, content, shortcut } = req.body;

    try {
        const snippet = await prisma.snippet.update({
            where: { id: req.params.id, tenantId: req.tenantId },
            data: { title, content, shortcut: shortcut || null }
        });
        res.json(snippet);
    } catch (error) {
        console.error('Error updating snippet:', error);
        res.status(500).json({ error: 'Failed to update snippet' });
    }
});

/**
 * @route DELETE /api/snippets/:id
 * @desc Delete a snippet
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.snippet.delete({
            where: { id: req.params.id, tenantId: req.tenantId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting snippet:', error);
        res.status(500).json({ error: 'Failed to delete snippet' });
    }
});

module.exports = router;
