const axios = require('axios');
const { encryptMetaToken } = require('../../../src/meta/metaTokenCrypto');
const metaApi = require('../../../src/services/metaApi');
const {
  createOutboxService,
  normalizeCommentReplyPayload
} = require('../../../src/events/outboxService');
const { createOutboxWorker } = require('../../../src/events/outboxWorker');
const { createCommentReplyDispatcher } = require('../../../src/commentReplies/commentReplyDispatcher');

function createDeliveryPrisma({ kind = 'public_reply', withDependentPublic = false } = {}) {
  const rows = {
    execution: {
      id: 'execution-1',
      tenantId: 'tenant-a',
      instanceId: 'instance-a',
      platform: 'facebook',
      externalCommentId: 'comment-1',
      status: 'ready'
    },
    deliveries: [{
      id: 'delivery-1', tenantId: 'tenant-a', executionId: 'execution-1', kind,
      status: 'pending', renderedText: kind === 'private_message' ? 'Private reply' : 'Public reply',
      providerMessageId: null, idempotencyKey: `delivery-${kind}`, outboxEventId: 'outbox-1', attempts: 0
    }],
    outbox: [],
    instance: {
      id: 'instance-a',
      tenantId: 'tenant-a',
      channelType: 'messenger',
      accessToken: 'encrypted-token'
    }
  };
  if (withDependentPublic) rows.deliveries.push({
    id: 'delivery-public', tenantId: 'tenant-a', executionId: 'execution-1', kind: 'public_reply',
    status: 'pending', renderedText: 'We sent you a DM.', providerMessageId: null,
    idempotencyKey: 'delivery-public', outboxEventId: null, attempts: 0
  });
  const prisma = {
    $transaction: async (callback) => callback(prisma),
    commentReplyDelivery: {
      findFirst: vi.fn(async ({ where }) => {
        const row = rows.deliveries.find((item) => item.id === where.id
          && item.tenantId === where.tenantId && item.executionId === where.executionId
          && item.outboxEventId === where.outboxEventId);
        return row ? { ...row, execution: { ...rows.execution } } : null;
      }),
      findUnique: vi.fn(async ({ where }) => {
        const identity = where.executionId_kind;
        return { ...rows.deliveries.find((item) => item.executionId === identity.executionId && item.kind === identity.kind) };
      }),
      updateMany: vi.fn(async ({ where, data }) => {
        const found = rows.deliveries.filter((item) => item.id === where.id && item.tenantId === where.tenantId
          && (where.providerMessageId !== null || item.providerMessageId === null)
          && (where.outboxEventId !== null || item.outboxEventId === null));
        found.forEach((row) => Object.entries(data).forEach(([key, value]) => {
          row[key] = value?.increment != null ? Number(row[key] || 0) + value.increment : value;
        }));
        return { count: found.length };
      })
    },
    outboxEvent: {
      create: vi.fn(async ({ data }) => {
        const row = { id: `outbox-${rows.outbox.length + 2}`, ...data };
        rows.outbox.push(row); return { ...row };
      }),
      findUniqueOrThrow: vi.fn()
    },
    instance: {
      findFirst: vi.fn(async ({ where }) => (
        where.id === rows.instance.id && where.tenantId === rows.instance.tenantId
          ? { ...rows.instance }
          : null
      ))
    }
  };
  return { prisma, rows };
}

function createOutboxPrisma(event, delivery = {}) {
  const row = {
    id: 'outbox-1',
    tenantId: 'tenant-a',
    aggregateType: 'comment_reply_delivery',
    aggregateId: 'delivery-1',
    eventType: 'comment_reply.delivery_requested',
    idempotencyKey: 'delivery-public:outbox',
    payload: {
      executionId: 'execution-1',
      providerReference: { provider: 'facebook', instanceId: 'instance-a' }
    },
    status: 'pending',
    attempts: 0,
    availableAt: new Date('2026-07-27T12:00:00.000Z'),
    createdAt: new Date('2026-07-27T12:00:00.000Z'),
    ...event
  };
  const prisma = {
    outboxEvent: {
      findMany: vi.fn(async ({ where }) => (
        row.status === where.status && row.leaseExpiresAt <= where.leaseExpiresAt.lte ? [{ ...row }] : []
      )),
      findFirst: vi.fn(async () => row.status === 'pending' ? { ...row } : null),
      findUnique: vi.fn(async () => ({ ...row })),
      updateMany: vi.fn(async ({ where, data }) => {
        if (where.id !== row.id || where.status !== row.status) return { count: 0 };
        if (where.attempts != null && where.attempts !== row.attempts) return { count: 0 };
        for (const [key, value] of Object.entries(data)) {
          row[key] = value?.increment != null ? row[key] + value.increment : value;
        }
        return { count: 1 };
      })
    },
    commentReplyDelivery: {
      findFirst: vi.fn(async () => ({
        id: 'delivery-1', tenantId: 'tenant-a', executionId: 'execution-1', kind: 'public_reply',
        status: 'succeeded', providerMessageId: null, outboxEventId: 'outbox-1',
        execution: { id: 'execution-1', tenantId: 'tenant-a', instanceId: 'instance-a', platform: 'facebook' },
        ...delivery
      }))
    }
  };
  return { prisma, row };
}

describe('comment reply delivery', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  it('accepts only the exact comment outbox reference payload', () => {
    const payload = {
      executionId: 'execution-1',
      providerReference: { provider: ' FACEBOOK ', instanceId: ' instance-a ' }
    };
    expect(normalizeCommentReplyPayload(payload)).toEqual({
      executionId: 'execution-1',
      providerReference: { provider: 'facebook', instanceId: 'instance-a' }
    });
    expect(() => normalizeCommentReplyPayload({ ...payload, replyText: 'secret text' }))
      .toThrow(/exact/i);
    expect(() => normalizeCommentReplyPayload({
      ...payload,
      providerReference: { ...payload.providerReference, accessToken: 'secret-token' }
    })).toThrow(/exact/i);
  });

  it('persists a provider reply ID before the outbox worker can mark success', async () => {
    const { prisma, rows } = createDeliveryPrisma();
    const provider = {
      replyToFacebookComment: vi.fn().mockResolvedValue({ id: 'provider-reply-1' }),
      replyToInstagramComment: vi.fn()
    };
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: provider });
    const event = {
      id: 'outbox-1',
      tenantId: 'tenant-a',
      aggregateId: 'delivery-1',
      payload: {
        executionId: 'execution-1',
        providerReference: { provider: 'facebook', instanceId: 'instance-a' }
      }
    };

    await dispatcher.dispatch(event);

    expect(provider.replyToFacebookComment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'instance-a', tenantId: 'tenant-a' }),
      'comment-1',
      'Public reply'
    );
    expect(rows.deliveries[0]).toEqual(expect.objectContaining({
      providerMessageId: 'provider-reply-1', status: 'succeeded'
    }));
  });

  it('rejects cross-tenant or mismatched provider references before publishing', async () => {
    const { prisma } = createDeliveryPrisma();
    const provider = {
      replyToFacebookComment: vi.fn(),
      replyToInstagramComment: vi.fn()
    };
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: provider });

    await expect(dispatcher.dispatch({
      id: 'outbox-1',
      tenantId: 'tenant-b',
      aggregateId: 'delivery-1',
      payload: {
        executionId: 'execution-1',
        providerReference: { provider: 'facebook', instanceId: 'instance-a' }
      }
    })).rejects.toMatchObject({ code: 'COMMENT_REPLY_DELIVERY_NOT_FOUND' });
    expect(provider.replyToFacebookComment).not.toHaveBeenCalled();
  });

  it('confirms the private reply before atomically enqueueing the dependent public reply', async () => {
    const { prisma, rows } = createDeliveryPrisma({ kind: 'private_message', withDependentPublic: true });
    const provider = {
      sendMessengerPrivateReply: vi.fn().mockResolvedValue({ message_id: 'private-provider-1' }),
      replyToFacebookComment: vi.fn()
    };
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: provider });

    await dispatcher.dispatch({
      id: 'outbox-1', tenantId: 'tenant-a', aggregateId: 'delivery-1',
      payload: {
        executionId: 'execution-1',
        providerReference: { provider: 'facebook', instanceId: 'instance-a' }
      }
    });

    expect(provider.sendMessengerPrivateReply).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'instance-a' }),
      { commentId: 'comment-1', postId: null, text: 'Private reply' }
    );
    expect(provider.replyToFacebookComment).not.toHaveBeenCalled();
    expect(rows.deliveries.find((item) => item.kind === 'private_message')).toEqual(expect.objectContaining({
      status: 'succeeded', providerMessageId: 'private-provider-1'
    }));
    expect(rows.deliveries.find((item) => item.kind === 'public_reply').outboxEventId).toMatch(/^outbox-/);
    expect(rows.outbox).toHaveLength(1);
  });

  it('does not repeat a succeeded private reply when the public delivery is retried', async () => {
    const { prisma } = createDeliveryPrisma();
    const provider = {
      sendMessengerPrivateReply: vi.fn(),
      replyToFacebookComment: vi.fn().mockResolvedValue({ id: 'public-provider-1' })
    };
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: provider });
    await dispatcher.dispatch({
      id: 'outbox-1', tenantId: 'tenant-a', aggregateId: 'delivery-1',
      payload: {
        executionId: 'execution-1',
        providerReference: { provider: 'facebook', instanceId: 'instance-a' }
      }
    });
    expect(provider.replyToFacebookComment).toHaveBeenCalledOnce();
    expect(provider.sendMessengerPrivateReply).not.toHaveBeenCalled();
  });

  it('never enqueues the dependent public reply after a permanent private failure', async () => {
    const { prisma, rows } = createDeliveryPrisma({ kind: 'private_message', withDependentPublic: true });
    const provider = {
      sendMessengerPrivateReply: vi.fn().mockRejectedValue(Object.assign(new Error('Not eligible'), {
        code: 'META_PRIVATE_REPLY_REJECTED', retryable: false, outcomeUnknown: false
      }))
    };
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: provider });
    await expect(dispatcher.dispatch({
      id: 'outbox-1', tenantId: 'tenant-a', aggregateId: 'delivery-1',
      payload: {
        executionId: 'execution-1',
        providerReference: { provider: 'facebook', instanceId: 'instance-a' }
      }
    })).rejects.toMatchObject({ code: 'META_PRIVATE_REPLY_REJECTED' });

    expect(rows.deliveries.find((item) => item.kind === 'private_message').status).toBe('failed');
    expect(rows.deliveries.find((item) => item.kind === 'public_reply').outboxEventId).toBeNull();
    expect(rows.outbox).toHaveLength(0);
  });

  it('publishes Facebook and Instagram replies without logging token or reply text', async () => {
    const token = 'public-reply-token';
    const encryptedToken = encryptMetaToken(token);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const post = vi.spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { id: 'fb-reply' } })
      .mockResolvedValueOnce({ data: { id: 'ig-reply' } });

    await expect(metaApi.replyToFacebookComment({ accessToken: encryptedToken }, 'fb-comment', 'Facebook reply'))
      .resolves.toEqual({ id: 'fb-reply' });
    await expect(metaApi.replyToInstagramComment({ accessToken: encryptedToken }, 'ig-comment', 'Instagram reply'))
      .resolves.toEqual({ id: 'ig-reply' });

    expect(post.mock.calls[0][0]).toMatch(/\/fb-comment\/comments$/);
    expect(post.mock.calls[0][1]).toEqual({ message: 'Facebook reply' });
    expect(post.mock.calls[1][0]).toMatch(/\/ig-comment\/replies$/);
    expect(post.mock.calls[1][1]).toEqual({ message: 'Instagram reply' });
    expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain(token);
    expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('Facebook reply');
    expect(JSON.stringify([...log.mock.calls, ...warn.mock.calls])).not.toContain('Instagram reply');
  });

  it('uses the source comment for Facebook and Instagram private replies', async () => {
    const encryptedToken = encryptMetaToken('private-reply-token');
    const post = vi.spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { message_id: 'fb-private' } })
      .mockResolvedValueOnce({ data: { id: 'ig-private' } });

    await expect(metaApi.sendMessengerPrivateReply(
      { phoneNumberId: 'page-a', accessToken: encryptedToken },
      { commentId: 'fb-comment', postId: null, text: 'Facebook DM' }
    )).resolves.toEqual({ message_id: 'fb-private' });
    await expect(metaApi.sendInstagramPrivateReply(
      { accessToken: encryptedToken }, 'ig-comment', 'Instagram DM'
    )).resolves.toEqual({ id: 'ig-private' });

    expect(post.mock.calls[0][0]).toMatch(/\/page-a\/messages$/);
    expect(post.mock.calls[0][1]).toEqual(expect.objectContaining({
      recipient: { comment_id: 'fb-comment' }, message: { text: 'Facebook DM' }
    }));
    expect(post.mock.calls[1][0]).toMatch(/\/ig-comment\/private_replies$/);
    expect(post.mock.calls[1][1]).toEqual({ message: 'Instagram DM' });
  });

  it('classifies explicit rejection, proven pre-request failure, and ambiguous transmission', async () => {
    const encryptedToken = encryptMetaToken('classification-token');
    vi.spyOn(axios, 'post')
      .mockRejectedValueOnce({ response: { status: 400, data: { error: { message: 'raw provider body' } } } })
      .mockRejectedValueOnce(Object.assign(new Error('DNS unavailable'), { requestTransmitted: false, code: 'ENOTFOUND' }))
      .mockRejectedValueOnce(Object.assign(new Error('Timed out'), { code: 'ETIMEDOUT', request: {} }));

    await expect(metaApi.replyToFacebookComment({ accessToken: encryptedToken }, 'comment-1', 'Reply'))
      .rejects.toMatchObject({ dispatchOutcome: 'response_received', retryable: false, outcomeUnknown: false });
    await expect(metaApi.replyToFacebookComment({ accessToken: encryptedToken }, 'comment-2', 'Reply'))
      .rejects.toMatchObject({ dispatchOutcome: 'before_request', retryable: true, outcomeUnknown: false });
    await expect(metaApi.replyToFacebookComment({ accessToken: encryptedToken }, 'comment-3', 'Reply'))
      .rejects.toMatchObject({ dispatchOutcome: 'outcome_ambiguous', outcomeUnknown: true });
  });

  it('maps classified delivery errors to retry, failed, and outcome_unknown states', async () => {
    const now = new Date('2026-07-27T12:00:00.000Z');
    const cases = [
      [{ retryable: true, outcomeUnknown: false, dispatchOutcome: 'before_request' }, 'pending'],
      [{ retryable: false, outcomeUnknown: false, dispatchOutcome: 'response_received' }, 'failed'],
      [{ retryable: false, outcomeUnknown: true, dispatchOutcome: 'outcome_ambiguous' }, 'outcome_unknown']
    ];

    for (const [classification, status] of cases) {
      const { prisma, row } = createOutboxPrisma();
      const worker = createOutboxWorker({
        prisma,
        clock: () => now,
        dispatchers: {
          'comment_reply.delivery_requested': {
            supportsIdempotency: false,
            dispatch: vi.fn(async () => {
              throw Object.assign(new Error('Sanitized delivery failure'), {
                code: 'COMMENT_REPLY_DELIVERY_FAILED',
                ...classification
              });
            })
          }
        }
      });
      await worker.runOnce();
      expect(row.status).toBe(status);
    }
  });

  it('reconciles a stale dispatch as succeeded only when the provider reply ID is durable', async () => {
    const now = new Date('2026-07-27T12:00:00.000Z');
    const { prisma, row } = createOutboxPrisma({
      status: 'dispatching',
      attempts: 1,
      leaseExpiresAt: new Date('2026-07-27T11:59:00.000Z')
    }, { providerMessageId: 'provider-reply-1' });
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: {} });
    const worker = createOutboxWorker({
      prisma,
      clock: () => now,
      dispatchers: { 'comment_reply.delivery_requested': dispatcher }
    });

    await worker.recoverStaleDispatches();

    expect(row.status).toBe('succeeded');
    expect(row.completedAt).toEqual(now);
  });

  it('creates comment outbox events without retaining text or tokens', async () => {
    const created = [];
    const service = createOutboxService({
      outboxEvent: {
        create: vi.fn(async ({ data }) => {
          created.push(data);
          return { id: 'outbox-1', ...data };
        })
      }
    });

    await service.createOrGet({
      tenantId: 'tenant-a',
      aggregateType: 'comment_reply_delivery',
      aggregateId: 'delivery-1',
      eventType: 'comment_reply.delivery_requested',
      idempotencyKey: 'delivery-public:outbox',
      payload: {
        executionId: 'execution-1',
        providerReference: { provider: 'facebook', instanceId: 'instance-a' }
      }
    });

    expect(JSON.stringify(created)).not.toContain('Public reply text');
    expect(JSON.stringify(created)).not.toContain('secret-token');
    expect(created[0].payload).toEqual({
      executionId: 'execution-1',
      providerReference: { provider: 'facebook', instanceId: 'instance-a' }
    });
  });
});
