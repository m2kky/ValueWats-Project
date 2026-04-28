const express = require('express');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const prisma = require('../config/database');
const workflowService = require('../services/workflow.service');

const parseBodyJson = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const serializeWorkflow = (workflow) => ({
  ...workflow,
  triggerConfig: parseBodyJson(workflow.triggerConfig, {}),
  steps: parseBodyJson(workflow.steps, [])
});

const normalizeCreatePayload = (body) => {
  const name = String(body?.name || '').trim();
  const triggerType = String(body?.triggerType || '').trim().toLowerCase();
  const steps = parseBodyJson(body?.steps, null);
  const triggerConfig = parseBodyJson(body?.triggerConfig, {});

  if (!name) throw new Error('Workflow name is required');
  if (!triggerType) throw new Error('Trigger type is required');
  if (!steps) throw new Error('Workflow steps (graph) are required');

  return {
    name,
    description: body?.description ? String(body.description) : null,
    triggerType,
    triggerConfig,
    steps,
    isActive: body?.isActive !== false
  };
};

const normalizeUpdatePayload = (body) => {
  const data = {};
  if (body?.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) throw new Error('Workflow name cannot be empty');
    data.name = name;
  }
  if (body?.description !== undefined) {
    data.description = body.description ? String(body.description) : null;
  }
  if (body?.triggerType !== undefined) {
    data.triggerType = String(body.triggerType || '').trim().toLowerCase();
  }
  if (body?.triggerConfig !== undefined) {
    data.triggerConfig = JSON.stringify(parseBodyJson(body.triggerConfig, {}));
  }
  if (body?.steps !== undefined) {
    const steps = parseBodyJson(body.steps, null);
    if (!steps) throw new Error('Workflow steps (graph) cannot be empty');
    data.steps = JSON.stringify(steps);
  }
  if (body?.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }
  return data;
};

router.get('/templates', async (_req, res) => {
  res.json({ templates: workflowService.getTemplates() });
});

router.get('/executions/:executionId/logs', async (req, res) => {
  try {
    const execution = await prisma.workflowExecution.findFirst({
      where: {
        id: req.params.executionId,
        workflow: { tenantId: req.user.tenantId }
      },
      select: { id: true }
    });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });

    const logs = await prisma.workflowLog.findMany({
      where: { executionId: execution.id },
      orderBy: { timestamp: 'asc' },
      take: Math.min(Math.max(Number(req.query.limit || 200), 1), 500)
    });

    const parsedLogs = logs.map((log) => ({
      ...log,
      details: parseBodyJson(log.details, log.details)
    }));

    res.json({ logs: parsedLogs });
  } catch (error) {
    console.error('Get workflow execution logs error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow logs' });
  }
});

router.get('/:id/executions', async (req, res) => {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      select: { id: true }
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId: workflow.id },
      orderBy: { startedAt: 'desc' },
      include: {
        _count: { select: { logs: true } }
      },
      take: Math.min(Math.max(Number(req.query.limit || 30), 1), 200)
    });

    const parsed = executions.map((item) => ({
      ...item,
      input: parseBodyJson(item.input, item.input),
      output: parseBodyJson(item.output, item.output)
    }));

    res.json({ executions: parsed });
  } catch (error) {
    console.error('Get workflow executions error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow executions' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        _count: { select: { executions: true } }
      }
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ workflow: serializeWorkflow(workflow) });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

router.get('/', async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { executions: true } }
      }
    });
    res.json({ workflows: workflows.map(serializeWorkflow) });
  } catch (error) {
    console.error('List workflows error:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

router.post('/', checkPermission('automations.manage'), async (req, res) => {
  try {
    const payload = normalizeCreatePayload(req.body || {});
    const workflow = await prisma.workflow.create({
      data: {
        tenantId: req.user.tenantId,
        name: payload.name,
        description: payload.description,
        triggerType: payload.triggerType,
        triggerConfig: JSON.stringify(payload.triggerConfig || {}),
        steps: JSON.stringify(payload.steps || []),
        isActive: payload.isActive
      }
    });
    res.status(201).json({ workflow: serializeWorkflow(workflow) });
  } catch (error) {
    const message = error.message || 'Failed to create workflow';
    res.status(400).json({ error: message });
  }
});

router.put('/:id', checkPermission('automations.manage'), async (req, res) => {
  try {
    const existing = await prisma.workflow.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      select: { id: true }
    });
    if (!existing) return res.status(404).json({ error: 'Workflow not found' });

    const updateData = normalizeUpdatePayload(req.body || {});
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No workflow updates provided' });
    }

    const workflow = await prisma.workflow.update({
      where: { id: existing.id },
      data: updateData
    });
    res.json({ workflow: serializeWorkflow(workflow) });
  } catch (error) {
    const message = error.message || 'Failed to update workflow';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id/toggle', checkPermission('automations.manage'), async (req, res) => {
  try {
    const existing = await prisma.workflow.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      select: { id: true, isActive: true }
    });
    if (!existing) return res.status(404).json({ error: 'Workflow not found' });

    const workflow = await prisma.workflow.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive }
    });
    res.json({ workflow: serializeWorkflow(workflow) });
  } catch (error) {
    console.error('Toggle workflow error:', error);
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
});

router.post('/:id/test', checkPermission('automations.manage'), async (req, res) => {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const conversationId = req.body?.conversationId || null;
    const instanceId = req.body?.instanceId || null;
    const messageText = req.body?.messageText || 'Test inbound message';
    const providedContext = parseBodyJson(req.body?.context, {});

    let conversation = null;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: req.user.tenantId }
      });
    }

    let instance = null;
    if (instanceId) {
      instance = await prisma.instance.findFirst({
        where: { id: instanceId, tenantId: req.user.tenantId }
      });
    }

    const result = await workflowService.executeWorkflowRecord(
      workflow,
      {
        tenantId: req.user.tenantId,
        eventType: 'test',
        conversation,
        conversationId: conversation?.id || null,
        instance,
        instanceId: instance?.id || null,
        message: {
          content: messageText,
          text: messageText,
          hour: new Date().getHours()
        },
        contact: {
          number: conversation?.contactNumber || req.body?.contactNumber || '0000000000',
          name: conversation?.contactName || 'Test Contact'
        },
        ...providedContext
      },
      { force: true }
    );

    res.json({ result });
  } catch (error) {
    console.error('Workflow test error:', error);
    res.status(500).json({ error: error.message || 'Failed to test workflow' });
  }
});

router.delete('/:id', checkPermission('automations.manage'), async (req, res) => {
  try {
    const existing = await prisma.workflow.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      select: { id: true }
    });
    if (!existing) return res.status(404).json({ error: 'Workflow not found' });

    await prisma.workflow.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

module.exports = router;

