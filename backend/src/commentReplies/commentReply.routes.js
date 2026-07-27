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
  const bodyWithoutIdentity = (req, extraBlocked = []) => {
    const body = { ...req.body };
    for (const field of ['tenantId', 'agentId', 'profileId', ...extraBlocked]) delete body[field];
    return body;
  };
  const mutation = (req, ids = {}, extraBlocked = []) => ({
    ...bodyWithoutIdentity(req, extraBlocked), ...context(req), ...ids
  });

  router.get('/agents/:agentId/comment-replies', run((req) => service.getWorkspace(context(req))));
  router.put('/agents/:agentId/comment-replies', checkPermission('agents.manage'), run((req) => service.updateProfile(mutation(req, {}, ['ruleId', 'bindingId', 'overrideId']))));
  router.post('/agents/:agentId/comment-replies/bindings', checkPermission('agents.manage'), checkPermission('channels.manage'), run(async (req, res) => {
    const result = await service.bindInstance(mutation(req, {}, ['ruleId', 'bindingId', 'overrideId']));
    res.status(201); return { ...result.binding, configVersion: result.configVersion };
  }));
  router.delete('/agents/:agentId/comment-replies/bindings/:bindingId', checkPermission('agents.manage'), checkPermission('channels.manage'), run((req) => service.unbindInstance(mutation(req, { bindingId: req.params.bindingId }, ['ruleId', 'bindingId', 'overrideId']))));
  router.get('/agents/:agentId/comment-replies/rules', run((req) => service.listRules(context(req))));
  router.post('/agents/:agentId/comment-replies/rules', checkPermission('agents.manage'), run(async (req, res) => {
    const result = await service.saveRule(mutation(req, {}, ['ruleId', 'bindingId', 'overrideId']));
    res.status(201); return { ...result.rule, configVersion: result.configVersion };
  }));
  router.put('/agents/:agentId/comment-replies/rules/:ruleId', checkPermission('agents.manage'), run(async (req) => {
    const result = await service.saveRule(mutation(req, { ruleId: req.params.ruleId }, ['ruleId', 'bindingId', 'overrideId']));
    return { ...result.rule, configVersion: result.configVersion };
  }));
  router.delete('/agents/:agentId/comment-replies/rules/:ruleId', checkPermission('agents.manage'), run((req) => service.deleteRule(mutation(req, { ruleId: req.params.ruleId }, ['ruleId', 'bindingId', 'overrideId']))));
  router.get('/agents/:agentId/comment-replies/overrides', run((req) => service.listOverrides(context(req))));
  router.post('/agents/:agentId/comment-replies/overrides', checkPermission('agents.manage'), run(async (req) => {
    const result = await service.saveOverride(mutation(req, {}, ['ruleId', 'overrideId']));
    return { ...result.override, configVersion: result.configVersion };
  }));
  router.delete('/agents/:agentId/comment-replies/overrides/:overrideId', checkPermission('agents.manage'), run((req) => service.deleteOverride(mutation(req, { overrideId: req.params.overrideId }, ['ruleId', 'bindingId', 'overrideId']))));
  router.get('/instances/:instanceId/comment-reply-binding', run((req) => service.getInstanceBinding({ tenantId: req.tenantId || req.user.tenantId, instanceId: req.params.instanceId })));
  return router;
}

module.exports = { createCommentReplyRouter };
