const crypto = require('crypto');
const { sanitizeError } = require('../logging/redaction');

function createCommentReplyWorker({
  prisma,
  runtime,
  clock = () => new Date(),
  leaseMs = 30_000,
  maxAttempts = 3
}) {
  if (!prisma) throw new Error('Prisma client is required');
  if (!runtime?.process) throw new Error('Comment reply runtime is required');

  async function recoverStale() {
    const now = clock();
    const stale = await prisma.commentReplyExecution.findMany({
      where: {
        status: 'processing',
        leaseExpiresAt: { lte: now }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    const recovered = { recovered: 0, failed: 0 };

    for (const execution of stale) {
      const exhausted = execution.attempts >= maxAttempts;
      const result = await prisma.commentReplyExecution.updateMany({
        where: {
          id: execution.id,
          status: 'processing',
          leaseToken: execution.leaseToken,
          leaseExpiresAt: { lte: now }
        },
        data: exhausted
          ? {
              status: 'failed',
              completedAt: now,
              leaseExpiresAt: null,
              leaseToken: null,
              errorCode: 'PROCESSING_ATTEMPTS_EXHAUSTED',
              errorMessage: 'Comment reply processing attempts exhausted'
            }
          : {
              status: 'received',
              availableAt: now,
              leaseExpiresAt: null,
              leaseToken: null,
              errorCode: null,
              errorMessage: null
            }
      });
      if (result.count === 1) {
        if (exhausted) recovered.failed += 1;
        else recovered.recovered += 1;
      }
    }
    return recovered;
  }

  async function claimNext() {
    const now = clock();
    await prisma.commentReplyExecution.updateMany({
      where: {
        status: 'received',
        attempts: { gte: maxAttempts },
        availableAt: { lte: now }
      },
      data: {
        status: 'failed',
        completedAt: now,
        errorCode: 'PROCESSING_ATTEMPTS_EXHAUSTED',
        errorMessage: 'Comment reply processing attempts exhausted'
      }
    });
    const execution = await prisma.commentReplyExecution.findFirst({
      where: {
        status: 'received',
        availableAt: { lte: now },
        attempts: { lt: maxAttempts }
      },
      orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }]
    });
    if (!execution) return null;

    const leaseToken = crypto.randomUUID();
    const claimed = await prisma.commentReplyExecution.updateMany({
      where: {
        id: execution.id,
        status: 'received',
        availableAt: { lte: now },
        attempts: { lt: maxAttempts }
      },
      data: {
        status: 'processing',
        attempts: { increment: 1 },
        leaseToken,
        leaseExpiresAt: new Date(now.getTime() + leaseMs),
        errorCode: null,
        errorMessage: null
      }
    });
    if (claimed.count !== 1) return null;
    return prisma.commentReplyExecution.findUnique({ where: { id: execution.id } });
  }

  async function renew(executionId, leaseToken) {
    const now = clock();
    const renewed = await prisma.commentReplyExecution.updateMany({
      where: { id: executionId, status: 'processing', leaseToken },
      data: { leaseExpiresAt: new Date(now.getTime() + leaseMs) }
    });
    if (renewed.count !== 1) {
      throw Object.assign(new Error('Comment reply execution lease is stale'), { code: 'STALE_LEASE' });
    }
  }

  async function fail(execution, error) {
    const sanitized = sanitizeError(error);
    await prisma.commentReplyExecution.updateMany({
      where: {
        id: execution.id,
        status: 'processing',
        leaseToken: execution.leaseToken
      },
      data: {
        status: 'failed',
        completedAt: clock(),
        leaseExpiresAt: null,
        leaseToken: null,
        errorCode: bounded(sanitized.code || 'COMMENT_REPLY_PROCESSING_FAILED', 120),
        errorMessage: bounded(sanitized.message || 'Comment reply processing failed', 1_000)
      }
    });
  }

  async function runOnce() {
    const execution = await claimNext();
    if (!execution) return null;
    try {
      await runtime.process(execution.id, execution.leaseToken);
    } catch (error) {
      if (error?.code !== 'STALE_LEASE') await fail(execution, error);
    }
    return prisma.commentReplyExecution.findUnique({ where: { id: execution.id } });
  }

  return { claimNext, recoverStale, renew, runOnce };
}

function bounded(value, limit) {
  return String(value || '').slice(0, limit);
}

module.exports = { createCommentReplyWorker };
