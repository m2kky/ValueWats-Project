const { normalizeCommentReplyPayload } = require('../events/outboxService');

function deliveryError(code, message, options = {}) {
  return Object.assign(new Error(message), {
    code,
    dispatchOutcome: 'before_request',
    outcomeUnknown: false,
    retryable: false,
    ...options
  });
}

function ambiguousPersistenceError() {
  return deliveryError(
    'COMMENT_REPLY_OUTCOME_AMBIGUOUS',
    'Provider reply succeeded but its result could not be stored',
    {
      dispatchOutcome: 'outcome_ambiguous',
      outcomeUnknown: true
    }
  );
}

function createCommentReplyDispatcher({ prisma, metaApi }) {
  if (!prisma) throw new Error('Prisma client is required');
  if (!metaApi) throw new Error('Meta API is required');

  async function loadExecution(event) {
    const payload = normalizeCommentReplyPayload(event.payload);
    const execution = await prisma.commentReplyExecution.findFirst({
      where: {
        id: payload.executionId,
        tenantId: event.tenantId,
        instanceId: payload.providerReference.instanceId,
        platform: payload.providerReference.provider,
        status: 'ready'
      }
    });
    if (!execution) {
      throw deliveryError(
        'COMMENT_REPLY_DELIVERY_NOT_FOUND',
        'Comment reply delivery reference was not found'
      );
    }
    return { execution, payload };
  }

  async function dispatch(event) {
    const { execution, payload } = await loadExecution(event);
    if (execution.providerReplyId) return { id: execution.providerReplyId };

    const instance = await prisma.instance.findFirst({
      where: {
        id: payload.providerReference.instanceId,
        tenantId: event.tenantId
      }
    });
    const expectedChannel = execution.platform === 'instagram' ? 'instagram' : 'messenger';
    if (!instance || instance.channelType !== expectedChannel) {
      throw deliveryError(
        'COMMENT_REPLY_INSTANCE_NOT_FOUND',
        'Comment reply provider instance was not found'
      );
    }

    const publish = execution.platform === 'instagram'
      ? metaApi.replyToInstagramComment
      : metaApi.replyToFacebookComment;
    if (typeof publish !== 'function') {
      throw deliveryError(
        'COMMENT_REPLY_PROVIDER_UNAVAILABLE',
        'Comment reply provider adapter is unavailable'
      );
    }

    const result = await publish.call(
      metaApi,
      instance,
      execution.externalCommentId,
      execution.renderedReply
    );
    const providerReplyId = String(result?.id || '').trim().slice(0, 512);
    if (!providerReplyId) {
      throw deliveryError(
        'COMMENT_REPLY_OUTCOME_AMBIGUOUS',
        'Meta returned an invalid public reply result',
        {
          dispatchOutcome: 'outcome_ambiguous',
          outcomeUnknown: true
        }
      );
    }

    try {
      const stored = await prisma.commentReplyExecution.updateMany({
        where: {
          id: execution.id,
          tenantId: event.tenantId,
          status: 'ready',
          providerReplyId: null
        },
        data: { providerReplyId }
      });
      if (stored.count !== 1) throw ambiguousPersistenceError();
    } catch (error) {
      if (error?.outcomeUnknown) throw error;
      throw ambiguousPersistenceError();
    }
    return { id: providerReplyId };
  }

  async function reconcile(event) {
    const { execution } = await loadExecution(event);
    return execution.providerReplyId
      ? { status: 'succeeded' }
      : { status: 'outcome_unknown' };
  }

  return {
    dispatch,
    reconcile,
    supportsIdempotency: false
  };
}

module.exports = { createCommentReplyDispatcher };
