const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const tenantContext = require('../middleware/tenantContext');

// GET /api/contact-fields/definitions — List all field definitions for tenant
router.get('/definitions', tenantContext, async (req, res) => {
    try {
        const definitions = await prisma.contactFieldDefinition.findMany({
            where: { tenantId: req.user.tenantId },
            orderBy: { sortOrder: 'asc' }
        });
        res.json(definitions);
    } catch (error) {
        console.error('[ContactFields] List definitions error:', error);
        res.status(500).json({ error: 'Failed to fetch field definitions' });
    }
});

// POST /api/contact-fields/definitions — Create a new field definition
router.post('/definitions', tenantContext, async (req, res) => {
    try {
        const { name, key, description, fieldType, options, isRequired, visibility, sortOrder } = req.body;

        if (!name || !key) {
            return res.status(400).json({ error: 'Name and key are required' });
        }

        const definition = await prisma.contactFieldDefinition.create({
            data: {
                tenantId: req.user.tenantId,
                name,
                key: key.toLowerCase().replace(/\s+/g, '_'),
                description: description || null,
                fieldType: fieldType || 'text',
                options: options || [],
                isRequired: isRequired || false,
                visibility: visibility || 'always_show',
                sortOrder: sortOrder || 0
            }
        });

        res.status(201).json(definition);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A field with this key already exists' });
        }
        console.error('[ContactFields] Create definition error:', error);
        res.status(500).json({ error: 'Failed to create field definition' });
    }
});

// PUT /api/contact-fields/definitions/:id — Update a field definition
router.put('/definitions/:id', tenantContext, async (req, res) => {
    try {
        const { name, description, fieldType, options, isRequired, visibility, sortOrder } = req.body;

        const existing = await prisma.contactFieldDefinition.findFirst({
            where: { id: req.params.id, tenantId: req.user.tenantId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Field definition not found' });
        }

        const updated = await prisma.contactFieldDefinition.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(fieldType !== undefined && { fieldType }),
                ...(options !== undefined && { options }),
                ...(isRequired !== undefined && { isRequired }),
                ...(visibility !== undefined && { visibility }),
                ...(sortOrder !== undefined && { sortOrder })
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('[ContactFields] Update definition error:', error);
        res.status(500).json({ error: 'Failed to update field definition' });
    }
});

// DELETE /api/contact-fields/definitions/:id — Delete a field definition
router.delete('/definitions/:id', tenantContext, async (req, res) => {
    try {
        const existing = await prisma.contactFieldDefinition.findFirst({
            where: { id: req.params.id, tenantId: req.user.tenantId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Field definition not found' });
        }

        await prisma.contactFieldDefinition.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('[ContactFields] Delete definition error:', error);
        res.status(500).json({ error: 'Failed to delete field definition' });
    }
});

// POST /api/contact-fields/definitions/seed — Seed default field definitions for a tenant
router.post('/definitions/seed', tenantContext, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        // Check if already seeded
        const existing = await prisma.contactFieldDefinition.count({ where: { tenantId } });
        if (existing > 0) {
            return res.json({ message: 'Fields already seeded', count: existing });
        }

        const defaults = [
            { name: 'First Name', key: 'firstName', fieldType: 'text', isDefault: true, sortOrder: 1 },
            { name: 'Last Name', key: 'lastName', fieldType: 'text', isDefault: true, sortOrder: 2 },
            { name: 'Phone Number', key: 'phone', fieldType: 'phone', isDefault: true, sortOrder: 3 },
            { name: 'Email Address', key: 'email', fieldType: 'email', isDefault: true, sortOrder: 4 },
            { name: 'Language', key: 'language', fieldType: 'text', isDefault: true, sortOrder: 5 },
            { name: 'Country', key: 'country', fieldType: 'text', isDefault: true, sortOrder: 6 },
            { name: 'Tags', key: 'tags', fieldType: 'text', isDefault: true, sortOrder: 7 },
        ];

        const created = await prisma.contactFieldDefinition.createMany({
            data: defaults.map(d => ({ ...d, tenantId }))
        });

        res.status(201).json({ success: true, count: created.count });
    } catch (error) {
        console.error('[ContactFields] Seed error:', error);
        res.status(500).json({ error: 'Failed to seed field definitions' });
    }
});

module.exports = router;
