const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
// CORRECTED: Use tenantContext instead of missing auth middleware
const tenantContext = require('../middleware/tenantContext');
const checkPermission = require('../middleware/checkPermission');
const agentService = require('./agent.service');
const { AgentSetupError, agentSetupService } = require('./config/agentSetupService');
const {
  agentCapabilityService
} = require('./config/agentCapabilityService');

const TEST_HISTORY_LIMIT = 20;
const TEST_MESSAGE_LIMIT = 4000;

function testHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-TEST_HISTORY_LIMIT)
    .filter((entry) => ['user', 'assistant'].includes(entry?.role) && typeof entry.content === 'string')
    .map((entry) => ({ role: entry.role, content: entry.content.trim().slice(0, TEST_MESSAGE_LIMIT) }))
    .filter((entry) => entry.content);
}

function sendSetupError(res, error) {
  if (error instanceof AgentSetupError) {
    return res.status(error.status).json({
      error: error.message,
      code: error.code,
      details: error.details
    });
  }
  throw error;
}

// Get all agents for tenant
router.get('/', tenantContext, async (req, res) => {
  try {
    const agents = await prisma.aIAgent.findMany({
      where: { tenantId: req.user.tenantId, deletedAt: null },
      include: {
        _count: {
          select: {
            conversations: true,
            knowledgeSources: true,
            actions: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(agents);
  } catch (error) {
    console.error('[Agents] Get all error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get single agent
router.get('/:id', tenantContext, async (req, res) => {
  try {
    const agent = await prisma.aIAgent.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId,
        deletedAt: null
      },
      include: {
        knowledgeSources: true,
        actions: true,
        routingRules: {
          include: {
            toAgent: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('[Agents] Get one error:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Create agent
router.post('/', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    const agent = await agentSetupService.createAgent({
      tenantId: req.user.tenantId,
      body: req.body
    });

    res.status(201).json(agent);
  } catch (error) {
    try {
      return sendSetupError(res, error);
    } catch {}
    console.error('[Agents] Create error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    const updated = await agentSetupService.updateAgent({
      tenantId: req.user.tenantId,
      agentId: req.params.id,
      body: req.body
    });

    res.json(updated);
  } catch (error) {
    try {
      return sendSetupError(res, error);
    } catch {}
    console.error('[Agents] Update error:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

router.put(['/:id/capabilities', '/:id/terminal-capabilities'], tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    const updated = await agentCapabilityService.update({
      tenantId: req.user.tenantId,
      agentId: req.params.id,
      expectedConfigVersion: req.body.expectedConfigVersion,
      capabilities: req.body.capabilities
    });
    res.json(updated);
  } catch (error) {
    try {
      return sendSetupError(res, error);
    } catch {}
    console.error('[Agents] Capability update error:', error);
    res.status(500).json({ error: 'Failed to update capabilities' });
  }
});

// Delete agent
router.delete('/:id', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    await agentSetupService.deleteAgent({
      tenantId: req.user.tenantId,
      agentId: req.params.id,
      body: req.body
    });

    res.json({ success: true });
  } catch (error) {
    try {
      return sendSetupError(res, error);
    } catch {}
    console.error('[Agents] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Test chat with agent (for live preview in editor)
router.post('/:id/test', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string'
      ? req.body.message.trim().slice(0, TEST_MESSAGE_LIMIT)
      : '';
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const agent = await prisma.aIAgent.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId,
        deletedAt: null,
        isActive: true,
        isPublished: true
      },
      include: {
        knowledgeSources: { where: { isActive: true } },
        actions: { where: { isEnabled: true } }
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Fix 6.1: Use RAG (Vector Search) in test chat so preview matches production behavior
    const contextLines = await agentService.buildContext(message, agent.knowledgeSources, agent.id);

    // Reuse production prompt builder so preview behavior matches real conversations.
    const systemPrompt = agentService.buildSystemPrompt(agent, contextLines);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...testHistory(req.body?.history),
      { role: 'user', content: message }
    ];

    const aiReply = await agentService.runModelToolLoop({
      agent,
      messages,
      tenantId: req.user.tenantId,
      conversationId: null,
      allowCommands: false
    });

    res.json({ response: aiReply || 'No response' });
  } catch (error) {
    console.error('[Agents] Test chat error:', error?.response?.data || error.message);
    const apiError = error?.response?.data?.error?.message || error.message || 'Error processing your message.';
    const statusCode = error?.response?.status || 500;
    res.status(statusCode).json({ error: 'Failed to get test response', response: `AI Error: ${apiError}` });
  }
});

// Template Routes
const agentTemplates = require('./templates');

// Get agent templates
router.get('/templates/list', tenantContext, async (req, res) => {
  res.json(agentTemplates);
});

// Create agent from template
router.post('/templates/:templateName', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    const { templateName } = req.params;
    const template = agentTemplates[templateName];

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const agent = await agentSetupService.createAgentFromTemplate({
      tenantId: req.user.tenantId,
      templateName,
      template,
      body: req.body
    });

    res.status(201).json(agent);
  } catch (error) {
    try {
      return sendSetupError(res, error);
    } catch {}
    console.error('[Agents] Create from template error:', error);
    res.status(500).json({ error: 'Failed to create agent from template' });
  }
});

module.exports = router;
