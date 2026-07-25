const { createOutboxService } = require('../../../src/events/outboxService');
const { createOutboxWorker } = require('../../../src/events/outboxWorker');
const { createWorkerRuntime } = require('../../../src/worker');
const {
  createTestDatabase,
  resetDatabase: resetRegisteredDatabase
} = require('../../helpers/database');

const prisma = createTestDatabase(process.env.DATABASE_URL);
const now = new Date('2026-07-26T12:00:00.000Z');

describe('durable outbox', () => {
  const service = createOutboxService(prisma, { clock: () => now });
  let tenant;

  beforeEach(async () => {
    await resetRegisteredDatabase(prisma);
    tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-outbox',
        name: 'Outbox Tenant',
        email: 'outbox@example.test'
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function createEvent(idempotencyKey = 'send-1') {
    return service.createOrGet({
      tenantId: tenant.id,
      aggregateType: 'channel_message',
      aggregateId: 'conversation-1',
      eventType: 'channel.send',
      idempotencyKey,
      payload: {
        providerReference: {
          provider: ' META ',
          instanceId: ' instance-1 ',
          accessToken: 'must-not-persist'
        },
        pendingMessageId: ' message-1 ',
        rawText: 'must-not-persist',
        accessToken: 'must-not-persist'
      }
    });
  }

  it('replays one local intent and stores only normalized channel references', async () => {
    const [first, second] = await Promise.all([createEvent(), createEvent()]);

    expect(second.id).toBe(first.id);
    expect(await prisma.outboxEvent.count()).toBe(1);
    expect(first.payload).toEqual({
      providerReference: {
        provider: 'meta',
        instanceId: 'instance-1'
      },
      pendingMessageId: 'message-1'
    });
  });

  it('rejects reuse of an idempotency key for a different outbox identity', async () => {
    await createEvent('explicit-outbox-key');

    await expect(service.createOrGet({
      tenantId: tenant.id,
      aggregateType: 'channel_message',
      aggregateId: 'conversation-2',
      eventType: 'channel.send',
      idempotencyKey: 'explicit-outbox-key',
      payload: {
        providerReference: { provider: 'meta', instanceId: 'instance-1' },
        pendingMessageId: 'message-2'
      }
    })).rejects.toMatchObject({ code: 'OUTBOX_IDEMPOTENCY_CONFLICT' });

    expect(await prisma.outboxEvent.count()).toBe(1);
  });

  it('leaves events pending until a dispatcher for their type is registered', async () => {
    const event = await createEvent('no-dispatcher');
    const worker = createOutboxWorker({ prisma, clock: () => now, dispatchers: {} });

    expect(await worker.runOnce()).toBeNull();

    const stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(stored.status).toBe('pending');
    expect(stored.attempts).toBe(0);
  });

  it('persists dispatching before the network call and does not replay success', async () => {
    const event = await createEvent();
    const dispatch = vi.fn(async () => {
      const stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
      expect(stored.status).toBe('dispatching');
      expect(stored.attempts).toBe(1);
      expect(stored.leaseExpiresAt).toEqual(new Date('2026-07-26T12:00:30.000Z'));
    });
    const worker = createOutboxWorker({
      prisma,
      clock: () => now,
      leaseMs: 30_000,
      dispatchers: {
        'channel.send': { supportsIdempotency: true, dispatch }
      }
    });

    await worker.runOnce();
    await worker.runOnce();

    expect(dispatch).toHaveBeenCalledTimes(1);
    const stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(stored.status).toBe('succeeded');
    expect(stored.completedAt).toEqual(now);
  });

  it('recovers a stale dispatch only when the provider supports idempotency', async () => {
    const event = await createEvent('recoverable-send');
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: 'dispatching',
        leaseExpiresAt: new Date('2026-07-26T11:59:00.000Z')
      }
    });
    const dispatch = vi.fn();
    const worker = createOutboxWorker({
      prisma,
      clock: () => now,
      dispatchers: {
        'channel.send': { supportsIdempotency: true, dispatch }
      }
    });

    const recovered = await worker.recoverStaleDispatches();
    await worker.runOnce();

    expect(recovered).toEqual({ retried: 1, outcomeUnknown: 0 });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect((await prisma.outboxEvent.findUnique({ where: { id: event.id } })).status).toBe('succeeded');
  });

  it('marks a stale non-idempotent dispatch outcome_unknown without calling the provider', async () => {
    const event = await createEvent('ambiguous-send');
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: 'dispatching',
        leaseExpiresAt: new Date('2026-07-26T11:59:00.000Z')
      }
    });
    const dispatch = vi.fn();
    const worker = createOutboxWorker({
      prisma,
      clock: () => now,
      dispatchers: {
        'channel.send': { supportsIdempotency: false, dispatch }
      }
    });

    const recovered = await worker.recoverStaleDispatches();
    await worker.runOnce();

    expect(recovered).toEqual({ retried: 0, outcomeUnknown: 1 });
    expect(dispatch).not.toHaveBeenCalled();
    const stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(stored.status).toBe('outcome_unknown');
    expect(stored.errorCode).toBe('AMBIGUOUS_DISPATCH');
  });

  it('persists an explicitly ambiguous provider failure as outcome_unknown', async () => {
    const event = await createEvent('provider-ambiguous');
    const worker = createOutboxWorker({
      prisma,
      clock: () => now,
      dispatchers: {
        'channel.send': {
          supportsIdempotency: false,
          dispatch: async () => {
            throw Object.assign(new Error('Timed out for person@example.com'), {
              code: 'PROVIDER_TIMEOUT',
              outcomeUnknown: true
            });
          }
        }
      }
    });

    await worker.runOnce();

    const stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(stored.status).toBe('outcome_unknown');
    expect(stored.errorMessage).toBe('Timed out for [REDACTED_EMAIL]');
  });

  it('retries a transient failure when the provider supports idempotency', async () => {
    const event = await createEvent('retry-idempotent');
    let currentTime = now;
    const dispatch = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('Temporary failure'), { code: 'TEMPORARY_FAILURE' }))
      .mockResolvedValueOnce();
    const worker = createOutboxWorker({
      prisma,
      clock: () => currentTime,
      retryDelayMs: 1000,
      dispatchers: {
        'channel.send': { supportsIdempotency: true, dispatch }
      }
    });

    await worker.runOnce();
    let stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(stored.status).toBe('pending');
    expect(stored.attempts).toBe(1);
    expect(stored.availableAt).toEqual(new Date('2026-07-26T12:00:01.000Z'));

    currentTime = new Date('2026-07-26T12:00:01.000Z');
    await worker.runOnce();
    stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(stored.status).toBe('succeeded');
    expect(stored.attempts).toBe(2);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('leaves a successful remote dispatch leased when persisting success fails', async () => {
    const event = await createEvent('success-write-failed');
    const updateMany = prisma.outboxEvent.updateMany.bind(prisma.outboxEvent);
    const updateSpy = vi.spyOn(prisma.outboxEvent, 'updateMany').mockImplementation((args) => {
      if (args.data.status === 'succeeded') {
        throw Object.assign(new Error('Database write failed'), { code: 'DATABASE_WRITE_FAILED' });
      }
      return updateMany(args);
    });
    const worker = createOutboxWorker({
      prisma,
      clock: () => now,
      dispatchers: {
        'channel.send': {
          supportsIdempotency: false,
          dispatch: vi.fn().mockResolvedValue()
        }
      }
    });

    await expect(worker.runOnce()).rejects.toMatchObject({ code: 'DATABASE_WRITE_FAILED' });

    updateSpy.mockRestore();
    const stored = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(stored.status).toBe('dispatching');
    expect(stored.leaseExpiresAt).toEqual(new Date('2026-07-26T12:00:30.000Z'));
  });

  it('prevents an expired worker from completing a newer dispatch attempt', async () => {
    const event = await createEvent('fenced-dispatch');
    let currentTime = now;
    let releaseFirst;
    let releaseSecond;
    let firstStarted;
    let secondStarted;
    const firstStartedPromise = new Promise((resolve) => { firstStarted = resolve; });
    const secondStartedPromise = new Promise((resolve) => { secondStarted = resolve; });
    const firstDispatch = new Promise((resolve) => { releaseFirst = resolve; });
    const secondDispatch = new Promise((resolve) => { releaseSecond = resolve; });
    const firstWorker = createOutboxWorker({
      prisma,
      clock: () => currentTime,
      leaseMs: 30_000,
      dispatchers: {
        'channel.send': {
          supportsIdempotency: true,
          dispatch: async () => {
            firstStarted();
            await firstDispatch;
          }
        }
      }
    });
    const secondWorker = createOutboxWorker({
      prisma,
      clock: () => currentTime,
      leaseMs: 30_000,
      dispatchers: {
        'channel.send': {
          supportsIdempotency: true,
          dispatch: async () => {
            secondStarted();
            await secondDispatch;
          }
        }
      }
    });

    const firstRun = firstWorker.runOnce();
    await firstStartedPromise;
    currentTime = new Date('2026-07-26T12:01:00.000Z');
    await secondWorker.recoverStaleDispatches();
    const secondRun = secondWorker.runOnce();
    await secondStartedPromise;

    releaseFirst();
    await firstRun;
    const whileSecondRuns = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(whileSecondRuns.status).toBe('dispatching');
    expect(whileSecondRuns.attempts).toBe(2);

    releaseSecond();
    await secondRun;
    expect((await prisma.outboxEvent.findUnique({ where: { id: event.id } })).status).toBe('succeeded');
  });
});

describe('worker runtime', () => {
  it('checks dependencies, recovers leases, heartbeats, and shuts down gracefully', async () => {
    const prismaClient = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ ok: 1 }]),
      $disconnect: vi.fn().mockResolvedValue()
    };
    const redis = {
      ping: vi.fn().mockResolvedValue('PONG'),
      set: vi.fn().mockResolvedValue('OK'),
      quit: vi.fn().mockResolvedValue()
    };
    const outboxWorker = {
      recoverStaleDispatches: vi.fn().mockResolvedValue({ retried: 0, outcomeUnknown: 0 }),
      runOnce: vi.fn().mockResolvedValue(null)
    };
    let runtime;
    runtime = createWorkerRuntime({
      prisma: prismaClient,
      redis,
      outboxWorker,
      workerId: 'worker-test',
      clock: () => now,
      sleep: async () => runtime.stop()
    });

    await runtime.start();
    await runtime.shutdown();

    expect(prismaClient.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    expect(redis.ping).toHaveBeenCalledOnce();
    expect(outboxWorker.recoverStaleDispatches).toHaveBeenCalled();
    expect(outboxWorker.runOnce).toHaveBeenCalledOnce();
    expect(redis.set).toHaveBeenCalledWith(
      'workers:agent-command:worker-test',
      now.toISOString(),
      'EX',
      30
    );
    expect(redis.quit).toHaveBeenCalledOnce();
    expect(prismaClient.$disconnect).toHaveBeenCalledOnce();
  });
});
