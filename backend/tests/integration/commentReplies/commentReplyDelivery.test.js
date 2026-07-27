const axios = require('axios');
const { encryptMetaToken } = require('../../../src/meta/metaTokenCrypto');
const metaApi = require('../../../src/services/metaApi');
const {
  createOutboxService,
  normalizeCommentReplyPayload
} = require('../../../src/events/outboxService');
const { createOutboxWorker } = require('../../../src/events/outboxWorker');
const { createCommentReplyDispatcher } = require('../../../src/commentReplies/commentReplyDispatcher');

function createDeliveryPrisma() {
  const rows = {
    execution: {
      id: 'execution-1',
      tenantId: 'tenant-a',
      instanceId: 'instance-a',
      platform: 'facebook',
      externalCommentId: 'comment-1',
      renderedReply: 'Public reply',
      status: 'ready',
      providerReplyId: null
    },
    instance: {
      id: 'instance-a',
      tenantId: 'tenant-a',
      channelType: 'messenger',
      accessToken: 'encrypted-token'
    }
  };
  const prisma = {
    commentReplyExecution: {
      findFirst: vi.fn(async ({ where }) => (
        where.id === rows.execution.id
        && where.tenantId === rows.execution.tenantId
        && where.instanceId === rows.execution.instanceId
        && where.platform === rows.execution.platform
        && where.status === rows.execution.status
          ? { ...rows.execution }
          : null
      )),
      updateMany: vi.fn(async ({ where, data }) => {
        if (where.id !== rows.execution.id || where.tenantId !== rows.execution.tenantId) return { count: 0 };
        if (where.providerReplyId === null && rows.execution.providerReplyId !== null) return { count: 0 };
        Object.assign(rows.execution, data);
        return { count: 1 };
      })
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

function createOutboxPrisma(event, execution = {}) {
  const row = {
    id: 'outbox-1',
    tenantId: 'tenant-a',
    aggregateType: 'comment_reply_execution',
    aggregateId: 'execution-1',
    eventType: 'comment_reply.publish_requested',
    idempotencyKey: 'comment-reply:execution-1:publish',
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
    commentReplyExecution: {
      findFirst: vi.fn(async () => ({ id: 'execution-1', providerReplyId: null, ...execution }))
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
      tenantId: 'tenant-a',
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
    expect(rows.execution.providerReplyId).toBe('provider-reply-1');
  });

  it('rejects cross-tenant or mismatched provider references before publishing', async () => {
    const { prisma } = createDeliveryPrisma();
    const provider = {
      replyToFacebookComment: vi.fn(),
      replyToInstagramComment: vi.fn()
    };
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: provider });

    await expect(dispatcher.dispatch({
      tenantId: 'tenant-b',
      payload: {
        executionId: 'execution-1',
        providerReference: { provider: 'facebook', instanceId: 'instance-a' }
      }
    })).rejects.toMatchObject({ code: 'COMMENT_REPLY_DELIVERY_NOT_FOUND' });
    expect(provider.replyToFacebookComment).not.toHaveBeenCalled();
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
          'comment_reply.publish_requested': {
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
    }, { providerReplyId: 'provider-reply-1' });
    const dispatcher = createCommentReplyDispatcher({ prisma, metaApi: {} });
    const worker = createOutboxWorker({
      prisma,
      clock: () => now,
      dispatchers: { 'comment_reply.publish_requested': dispatcher }
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
      aggregateType: 'comment_reply_execution',
      aggregateId: 'execution-1',
      eventType: 'comment_reply.publish_requested',
      idempotencyKey: 'comment-reply:execution-1:publish',
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
