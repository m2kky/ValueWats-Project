const prisma = require('../config/database');

// Get all templates for the tenant
const getTemplates = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { category } = req.query;

        const query = { where: { tenantId } };
        if (category) {
            query.where.category = category;
        }

        const templates = await prisma.globalTemplate.findMany({
            ...query,
            orderBy: { createdAt: 'desc' }
        });

        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new template
const createTemplate = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { name, content, category } = req.body;

        if (!name || !content) {
            return res.status(400).json({ error: 'Name and content are required' });
        }

        const template = await prisma.globalTemplate.create({
            data: {
                tenantId,
                name,
                content,
                category: category || 'general'
            }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update an existing template
const updateTemplate = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const { name, content, category } = req.body;

        // Verify ownership
        const existingTemplate = await prisma.globalTemplate.findFirst({
            where: { id, tenantId }
        });

        if (!existingTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const template = await prisma.globalTemplate.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(content && { content }),
                ...(category && { category })
            }
        });

        res.json(template);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a template
const deleteTemplate = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { id } = req.params;

        const existingTemplate = await prisma.globalTemplate.findFirst({
            where: { id, tenantId }
        });

        if (!existingTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        await prisma.globalTemplate.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
};
