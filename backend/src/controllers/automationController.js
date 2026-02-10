const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all automation rules for the tenant
const getAutomations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const automations = await prisma.automationRule.findMany({
      where: { tenantId },
      include: { instance: { select: { id: true, instanceName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ automations });
  } catch (error) {
    console.error('Get Automations Error:', error);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
};

// Create a new automation rule
const createAutomation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, instanceId, triggerType, triggerValue, responseText } = req.body;

    if (!name || !instanceId || !triggerType || !responseText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate trigger type
    const validTypes = ['keyword', 'any_message', 'welcome'];
    if (!validTypes.includes(triggerType)) {
      return res.status(400).json({ error: `Invalid trigger type. Must be one of: ${validTypes.join(', ')}` });
    }

    // If keyword trigger, triggerValue is required
    if (triggerType === 'keyword' && !triggerValue) {
      return res.status(400).json({ error: 'Trigger value (keyword) is required for keyword triggers' });
    }

    const automation = await prisma.automationRule.create({
      data: {
        name,
        instanceId,
        triggerType,
        triggerValue: triggerValue || null,
        responseText,
        tenantId
      },
      include: { instance: { select: { id: true, instanceName: true } } }
    });

    res.status(201).json(automation);
  } catch (error) {
    console.error('Create Automation Error:', error);
    res.status(500).json({ error: 'Failed to create automation' });
  }
};

// Update an automation rule
const updateAutomation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, triggerType, triggerValue, responseText, isActive } = req.body;

    // Check ownership
    const existing = await prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Automation not found' });

    const automation = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(triggerType !== undefined && { triggerType }),
        ...(triggerValue !== undefined && { triggerValue }),
        ...(responseText !== undefined && { responseText }),
        ...(isActive !== undefined && { isActive })
      },
      include: { instance: { select: { id: true, instanceName: true } } }
    });

    res.json(automation);
  } catch (error) {
    console.error('Update Automation Error:', error);
    res.status(500).json({ error: 'Failed to update automation' });
  }
};

// Delete an automation rule
const deleteAutomation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const existing = await prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Automation not found' });

    await prisma.automationRule.delete({ where: { id } });
    res.json({ message: 'Automation deleted' });
  } catch (error) {
    console.error('Delete Automation Error:', error);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
};

module.exports = {
  getAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation
};
