const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
// CORRECTED: Use tenantContext instead of missing auth middleware
const tenantContext = require('../middleware/tenantContext');
const checkPermission = require('../middleware/checkPermission');
const agentService = require('./agent.service');

// Get all agents for tenant
router.get('/', tenantContext, async (req, res) => {
  try {
    const agents = await prisma.aIAgent.findMany({
      where: { tenantId: req.user.tenantId },
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
        tenantId: req.user.tenantId
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
    const {
      name,
      description,
      avatar,
      templateType,
      instructions,
      aiProvider,
      aiModel,
      temperature,
      maxTokens,
      greeting,
      tone,
      responseStyle,
      useHistory,
      historyLength,
      followUpEnabled,
      followUpDelay,
      followUpMessage,
      workingHoursEnabled,
      workingHours,
      outOfHoursMessage,
      allowGroupResponse,
      allowedGroups,
      actionConfig,
      isActive,
      priority
    } = req.body;

    const normalizedInstructions = typeof instructions === 'string' ? instructions.trim() : '';
    if (!name || !normalizedInstructions) {
      return res.status(400).json({ error: 'Name and instructions are required' });
    }

    if (normalizedInstructions.length > 10000) {
      return res.status(400).json({ error: 'Instructions cannot exceed 10000 characters' });
    }

    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        description,
        avatar,
        templateType,
        instructions: normalizedInstructions,
        aiProvider: aiProvider || 'deepseek',
        aiModel: aiModel || 'deepseek-chat',
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 500,
        greeting,
        tone: tone || 'professional',
        responseStyle: responseStyle || 'concise',
        useHistory: useHistory ?? true,
        historyLength: historyLength ?? 10,
        followUpEnabled: followUpEnabled ?? false,
        followUpDelay: followUpDelay ?? 300,
        followUpMessage,
        workingHoursEnabled: workingHoursEnabled ?? false,
        workingHours,
        outOfHoursMessage,
        allowGroupResponse: allowGroupResponse ?? false,
        allowedGroups: Array.isArray(allowedGroups) ? allowedGroups : [],
        actionConfig: actionConfig || undefined,
        isActive: isActive ?? true,
        priority: priority ?? 0
      }
    });

    res.status(201).json(agent);
  } catch (error) {
    console.error('[Agents] Create error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Map 'model' to 'aiModel' if present to satisfy Prisma schema
    if (updateData.model) {
      updateData.aiModel = updateData.model;
      delete updateData.model;
    }

    if (updateData.instructions !== undefined) {
      const normalizedInstructions = typeof updateData.instructions === 'string'
        ? updateData.instructions.trim()
        : '';

      if (!normalizedInstructions) {
        return res.status(400).json({ error: 'Instructions cannot be empty' });
      }

      if (normalizedInstructions.length > 10000) {
        return res.status(400).json({ error: 'Instructions cannot exceed 10000 characters' });
      }

      updateData.instructions = normalizedInstructions;
    }

    // Filter only valid Prisma fields to prevent validation errors
    const validFields = [
      'name', 'description', 'avatar', 'templateType', 'instructions',
      'aiProvider', 'aiModel', 'temperature', 'maxTokens', 'greeting',
      'tone', 'responseStyle', 'useHistory', 'historyLength',
      'followUpEnabled', 'followUpDelay', 'followUpMessage',
      'workingHoursEnabled', 'workingHours', 'outOfHoursMessage',
      'isActive', 'priority', 'allowGroupResponse', 'allowedGroups', 'actionConfig'
    ];

    const finalData = {};
    validFields.forEach(field => {
      if (updateData[field] !== undefined) {
        finalData[field] = updateData[field];
      }
    });

    const agent = await prisma.aIAgent.updateMany({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      data: finalData
    });

    if (agent.count === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const updated = await prisma.aIAgent.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('[Agents] Update error:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    await prisma.aIAgent.deleteMany({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Agents] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Test chat with agent (for live preview in editor)
const deepseekService = require('../ai/deepseek.service');

router.post('/:id/test', tenantContext, checkPermission('agents.manage'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const agent = await prisma.aIAgent.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      include: {
        knowledgeSources: true
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const contextLines = (agent.knowledgeSources || [])
      .filter(k => k && k.content)
      .map(k => `${k.title || 'Knowledge'}: ${k.content}`);

    // Reuse production prompt builder so preview behavior matches real conversations.
    const systemPrompt = agentService.buildSystemPrompt(agent, contextLines);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const response = await deepseekService.chat({
      messages,
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.maxTokens ?? 500
    });

    const aiReply = typeof response === 'string' ? response : (response?.content || response?.message || 'No response');
    res.json({ response: aiReply });
  } catch (error) {
    console.error('[Agents] Test chat error:', error);
    res.status(500).json({ error: 'Failed to get test response', response: 'Error processing your message.' });
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

    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: req.user.tenantId,
        templateType: templateName,
        ...template,
        ...req.body // Allow overriding template defaults
      }
    });

    res.status(201).json(agent);
  } catch (error) {
    console.error('[Agents] Create from template error:', error);
    res.status(500).json({ error: 'Failed to create agent from template' });
  }
});

module.exports = router;
