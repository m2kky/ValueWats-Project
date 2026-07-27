const express = require('express');
const checkPermission = require('../middleware/checkPermission');
const { CommentReplyError, createCommentReplyService } = require('./commentReplyService');

function sendError(res, error) {
  if (error instanceof CommentReplyError) {
    return res.status(error.status).json({ error: error.message, code: error.code });
  }
  throw error;
}

function createCommentReplyRouter({ prisma, getChannelConfig } = {}) {
  const service = createCommentReplyService(prisma, { getChannelConfig });
  const router = express.Router();
  const run = (handler) => async (req, res) => {
    try {
      const result = await handler(req, res);
      if (result !== undefined) res.json(result);
    } catch (error) {
      try { return sendError(res, error); } catch {}
      console.error('[CommentReplies] Route error:', error);
      res.status(500).json({ error: 'Failed to manage comment replies' });
    }
  };
  const context = (req) => ({ tenantId: req.tenantId || req.user.tenantId, agentId: req.params.agentId });

  router.get('/agents/:agentId/comment-replies', run((req) => service.getWorkspace(context(req))));
  router.put('/agents/:agentId/comment-replies', checkPermission('agents.manage'), run((req) => service.updateProfile({ ...context(req), ...req.body })));
  router.post('/agents/:agentId/comment-replies/bindings', checkPermission('agents.manage'), checkPermission('channels.manage'), run(async (req, res) => {
    const result = await service.bindInstance({ ...context(req), ...req.body });
    res.status(201); return { ...result.binding, configVersion: result.configVersion };
  }));
  router.delete('/agents/:agentId/comment-replies/bindings/:bindingId', checkPermission('agents.manage'), checkPermission('channels.manage'), run((req) => service.unbindInstance({ ...context(req), bindingId: req.params.bindingId, ...req.body })));
  router.get('/agents/:agentId/comment-replies/rules', run((req) => service.listRules(context(req))));
  router.post('/agents/:agentId/comment-replies/rules', checkPermission('agents.manage'), run(async (req, res) => {
    const result = await service.saveRule({ ...context(req), ...req.body });
    res.status(201); return { ...result.rule, configVersion: result.configVersion };
  }));
  router.put('/agents/:agentId/comment-replies/rules/:ruleId', checkPermission('agents.manage'), run(async (req) => {
    const result = await service.saveRule({ ...context(req), ruleId: req.params.ruleId, ...req.body });
    return { ...result.rule, configVersion: result.configVersion };
  }));
  router.delete('/agents/:agentId/comment-replies/rules/:ruleId', checkPermission('agents.manage'), run((req) => service.deleteRule({ ...context(req), ruleId: req.params.ruleId, ...req.body })));
  router.get('/agents/:agentId/comment-replies/overrides', run((req) => service.listOverrides(context(req))));
  router.post('/agents/:agentId/comment-replies/overrides', checkPermission('agents.manage'), run(async (req) => {
    const result = await service.saveOverride({ ...context(req), ...req.body });
    return { ...result.override, configVersion: result.configVersion };
  }));
  router.delete('/agents/:agentId/comment-replies/overrides/:overrideId', checkPermission('agents.manage'), run((req) => service.deleteOverride({ ...context(req), overrideId: req.params.overrideId, ...req.body })));
  router.get('/instances/:instanceId/comment-reply-binding', run((req) => service.getInstanceBinding({ tenantId: req.tenantId || req.user.tenantId, instanceId: req.params.instanceId })));
  return router;
}

module.exports = { createCommentReplyRouter };
