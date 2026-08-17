const { createOutboxService, normalizeCommentReplyPayload } = require('../events/outboxService');

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
    'Meta accepted a comment delivery but its result could not be stored',
    { dispatchOutcome: 'outcome_ambiguous', outcomeUnknown: true }
  );
}

function createCommentReplyDispatcher({ prisma, metaApi, clock = () => new Date() }) {
  if (!prisma) throw new Error('Prisma client is required');
  if (!metaApi) throw new Error('Meta API is required');
  const outboxService = createOutboxService(prisma, { clock });

  async function loadDelivery(event) {
    const payload = normalizeCommentReplyPayload(event.payload);
    const delivery = await prisma.commentReplyDelivery.findFirst({
      where: {
        id: event.aggregateId,
        tenantId: event.tenantId,
        executionId: payload.executionId,
        outboxEventId: event.id
      },
      include: { execution: true }
    });
    const execution = delivery?.execution;
    if (!delivery || !execution
      || execution.instanceId !== payload.providerReference.instanceId
      || execution.platform !== payload.providerReference.provider
      || !['pending', 'dispatching', 'succeeded'].includes(delivery.status)) {
      throw deliveryError('COMMENT_REPLY_DELIVERY_NOT_FOUND', 'Comment reply delivery reference was not found');
    }
    return { delivery, execution, payload };
  }

  async function loadInstance(event, execution, payload) {
    const instance = await prisma.instance.findFirst({
      where: { id: payload.providerReference.instanceId, tenantId: event.tenantId }
    });
    const expectedChannel = execution.platform === 'instagram' ? 'instagram' : 'messenger';
    if (!instance || instance.channelType !== expectedChannel) {
      throw deliveryError('COMMENT_REPLY_INSTANCE_NOT_FOUND', 'Comment reply provider instance was not found');
    }
    return instance;
  }

  function providerMethod(delivery, execution) {
    if (delivery.kind === 'private_message') {
      return execution.platform === 'instagram'
        ? ['sendInstagramPrivateReply', [execution.externalCommentId, delivery.renderedText]]
        : ['sendMessengerPrivateReply', [{ commentId: execution.externalCommentId, postId: null, text: delivery.renderedText }]];
    }
    return execution.platform === 'instagram'
      ? ['replyToInstagramComment', [execution.externalCommentId, delivery.renderedText]]
      : ['replyToFacebookComment', [execution.externalCommentId, delivery.renderedText]];
  }

  async function enqueueDependentPublic(tx, event, execution) {
    const publicDelivery = await tx.commentReplyDelivery.findUnique({
      where: { executionId_kind: { executionId: execution.id, kind: 'public_reply' } }
    });
    if (!publicDelivery || publicDelivery.status !== 'pending' || publicDelivery.outboxEventId) return;
    const outboxEvent = await outboxService.createOrGet({
      tenantId: event.tenantId,
      aggregateType: 'comment_reply_delivery',
      aggregateId: publicDelivery.id,
      eventType: 'comment_reply.delivery_requested',
      idempotencyKey: `${publicDelivery.idempotencyKey}:outbox`,
      payload: {
        executionId: execution.id,
        providerReference: { provider: execution.platform, instanceId: execution.instanceId }
      }
    }, { prisma: tx });
    await tx.commentReplyDelivery.updateMany({
      where: { id: publicDelivery.id, tenantId: event.tenantId, status: 'pending', outboxEventId: null },
      data: { outboxEventId: outboxEvent.id, availableAt: clock() }
    });
  }

  async function markFailure(delivery, error) {
    const status = error?.outcomeUnknown
      ? 'outcome_unknown'
      : (error?.retryable ? 'pending' : 'failed');
    await prisma.commentReplyDelivery.updateMany({
      where: { id: delivery.id, tenantId: delivery.tenantId, providerMessageId: null },
      data: {
        status,
        attempts: { increment: 1 },
        errorCode: String(error?.code || 'COMMENT_REPLY_DELIVERY_FAILED').slice(0, 120),
        errorMessage: String(error?.message || 'Comment reply delivery failed').slice(0, 1_000),
        completedAt: status === 'pending' ? null : clock()
      }
    });
  }

  async function dispatch(event) {
    const { delivery, execution, payload } = await loadDelivery(event);
    if (delivery.providerMessageId) return { id: delivery.providerMessageId };
    const instance = await loadInstance(event, execution, payload);
    const [methodName, args] = providerMethod(delivery, execution);
    const publish = metaApi[methodName];
    if (typeof publish !== 'function') {
      throw deliveryError('COMMENT_REPLY_PROVIDER_UNAVAILABLE', 'Comment reply provider adapter is unavailable');
    }

    let result;
    try {
      result = await publish.call(metaApi, instance, ...args);
    } catch (error) {
      await markFailure(delivery, error);
      throw error;
    }
    const providerMessageId = String(result?.id || result?.message_id || result?.recipient_id || '').trim().slice(0, 512);
    if (!providerMessageId) {
      const error = deliveryError('COMMENT_REPLY_OUTCOME_AMBIGUOUS', 'Meta returned an invalid comment delivery result', {
        dispatchOutcome: 'outcome_ambiguous', outcomeUnknown: true
      });
      await markFailure(delivery, error);
      throw error;
    }

    try {
      await prisma.$transaction(async (tx) => {
        const stored = await tx.commentReplyDelivery.updateMany({
          where: { id: delivery.id, tenantId: event.tenantId, providerMessageId: null },
          data: {
            providerMessageId,
            status: 'succeeded',
            attempts: { increment: 1 },
            completedAt: clock(),
            errorCode: null,
            errorMessage: null
          }
        });
        if (stored.count !== 1) throw ambiguousPersistenceError();
        if (delivery.kind === 'private_message') await enqueueDependentPublic(tx, event, execution);
      });
    } catch (error) {
      if (error?.outcomeUnknown) throw error;
      throw ambiguousPersistenceError();
    }
    return { id: providerMessageId };
  }

  async function reconcile(event) {
    const { delivery } = await loadDelivery(event);
    return delivery.providerMessageId && delivery.status === 'succeeded'
      ? { status: 'succeeded' }
      : { status: 'outcome_unknown' };
  }

  return { dispatch, reconcile, supportsIdempotency: false };
}

module.exports = { createCommentReplyDispatcher };
