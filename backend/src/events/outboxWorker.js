const { sanitizeError } = require('../logging/redaction');

function createOutboxWorker({
  prisma,
  dispatchers = {},
  clock = () => new Date(),
  leaseMs = 30_000,
  maxAttempts = 3,
  retryDelayMs = 1000
}) {
  if (!prisma) throw new Error('Prisma client is required');

  const dispatcherFor = (eventType) => dispatchers[eventType];

  async function recoverStaleDispatches() {
    const now = clock();
    const stale = await prisma.outboxEvent.findMany({
      where: {
        status: 'dispatching',
        leaseExpiresAt: { lte: now }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    const recovered = { retried: 0, outcomeUnknown: 0 };

    for (const event of stale) {
      const canRetry = dispatcherFor(event.eventType)?.supportsIdempotency === true
        && event.attempts < maxAttempts;
      const update = canRetry
        ? {
            status: 'pending',
            leaseExpiresAt: null,
            availableAt: now,
            errorCode: null,
            errorMessage: null
          }
        : {
            status: 'outcome_unknown',
            leaseExpiresAt: null,
            completedAt: now,
            errorCode: 'AMBIGUOUS_DISPATCH',
            errorMessage: 'Worker lease expired after dispatch began'
          };

      const result = await prisma.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: 'dispatching',
          leaseExpiresAt: { lte: now }
        },
        data: update
      });
      if (result.count === 1) {
        if (canRetry) recovered.retried += 1;
        else recovered.outcomeUnknown += 1;
      }
    }
    return recovered;
  }

  async function claimNext() {
    const now = clock();
    const eventTypes = Object.entries(dispatchers)
      .filter(([, dispatcher]) => typeof dispatcher?.dispatch === 'function')
      .map(([eventType]) => eventType);
    if (eventTypes.length === 0) return null;

    const event = await prisma.outboxEvent.findFirst({
      where: {
        status: 'pending',
        availableAt: { lte: now },
        eventType: { in: eventTypes }
      },
      orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }]
    });
    if (!event) return null;

    const claimed = await prisma.outboxEvent.updateMany({
      where: {
        id: event.id,
        status: 'pending',
        availableAt: { lte: now }
      },
      data: {
        status: 'dispatching',
        attempts: { increment: 1 },
        dispatchedAt: now,
        leaseExpiresAt: new Date(now.getTime() + leaseMs)
      }
    });
    if (claimed.count !== 1) return null;
    return prisma.outboxEvent.findUnique({ where: { id: event.id } });
  }

  async function runOnce() {
    const event = await claimNext();
    if (!event) return null;

    const dispatcher = dispatcherFor(event.eventType);
    if (!dispatcher?.dispatch) {
      await prisma.outboxEvent.updateMany({
        where: { id: event.id, status: 'dispatching', attempts: event.attempts },
        data: {
          status: 'failed',
          completedAt: clock(),
          leaseExpiresAt: null,
          errorCode: 'OUTBOX_DISPATCHER_NOT_FOUND',
          errorMessage: `No dispatcher registered for ${event.eventType}`
        }
      });
      return prisma.outboxEvent.findUnique({ where: { id: event.id } });
    }

    try {
      await dispatcher.dispatch(event, { idempotencyKey: event.idempotencyKey });
    } catch (error) {
      const sanitized = sanitizeError(error);
      const canRetry = event.attempts < maxAttempts
        && (dispatcher.supportsIdempotency === true
          || (error?.retryable === true && error?.outcomeUnknown !== true));
      await prisma.outboxEvent.updateMany({
        where: { id: event.id, status: 'dispatching', attempts: event.attempts },
        data: canRetry
          ? {
              status: 'pending',
              availableAt: new Date(clock().getTime() + retryDelayMs * (2 ** (event.attempts - 1))),
              leaseExpiresAt: null,
              errorCode: sanitized.code,
              errorMessage: sanitized.message
            }
          : {
              status: error?.outcomeUnknown ? 'outcome_unknown' : 'failed',
              completedAt: clock(),
              leaseExpiresAt: null,
              errorCode: sanitized.code,
              errorMessage: sanitized.message
            }
      });
      return prisma.outboxEvent.findUnique({ where: { id: event.id } });
    }

    // Keep dispatching leased if this write fails; stale recovery owns ambiguity.
    await prisma.outboxEvent.updateMany({
      where: { id: event.id, status: 'dispatching', attempts: event.attempts },
      data: {
        status: 'succeeded',
        completedAt: clock(),
        leaseExpiresAt: null,
        errorCode: null,
        errorMessage: null
      }
    });
    return prisma.outboxEvent.findUnique({ where: { id: event.id } });
  }

  return { claimNext, recoverStaleDispatches, runOnce };
}

module.exports = { createOutboxWorker };
