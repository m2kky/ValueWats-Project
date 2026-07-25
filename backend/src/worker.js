const os = require('os');
const { createOutboxWorker } = require('./events/outboxWorker');
const { sanitizeError } = require('./logging/redaction');

const defaultSleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function createWorkerRuntime({
  prisma,
  redis,
  outboxWorker,
  workerId,
  clock = () => new Date(),
  sleep = defaultSleep,
  pollMs = 1000,
  heartbeatTtlSeconds = 30
}) {
  let stopping = false;
  let activeWork = null;
  let shutdownPromise = null;

  async function checkHealth() {
    await prisma.$queryRawUnsafe('SELECT 1');
    const response = await redis.ping();
    if (response !== 'PONG') throw new Error('Redis health check failed');
  }

  async function heartbeat() {
    await redis.set(
      `workers:agent-command:${workerId}`,
      clock().toISOString(),
      'EX',
      heartbeatTtlSeconds
    );
  }

  function stop() {
    stopping = true;
  }

  async function start() {
    await checkHealth();
    await outboxWorker.recoverStaleDispatches();

    while (!stopping) {
      await heartbeat();
      await outboxWorker.recoverStaleDispatches();
      activeWork = outboxWorker.runOnce();
      const event = await activeWork;
      activeWork = null;
      if (!event && !stopping) await sleep(pollMs);
    }
  }

  function shutdown() {
    if (shutdownPromise) return shutdownPromise;
    stop();
    shutdownPromise = (async () => {
      if (activeWork) await activeWork.catch(() => {});
      await Promise.allSettled([redis.quit(), prisma.$disconnect()]);
    })();
    return shutdownPromise;
  }

  return { checkHealth, heartbeat, shutdown, start, stop };
}

function buildWorkerRuntime(options = {}) {
  const prisma = options.prisma || new (require('@prisma/client').PrismaClient)();
  const Redis = require('ioredis');
  const redis = options.redis || new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
  });
  const workerId = options.workerId || process.env.WORKER_ID || `${os.hostname()}-${process.pid}`;
  const outboxWorker = options.outboxWorker || createOutboxWorker({
    prisma,
    dispatchers: options.dispatchers || {}
  });

  return createWorkerRuntime({ ...options, prisma, redis, outboxWorker, workerId });
}

async function runWorkerProcess(options = {}) {
  require('dotenv').config();
  const runtime = buildWorkerRuntime(options);
  let signalReceived = false;
  const shutdown = () => {
    if (signalReceived) return;
    signalReceived = true;
    runtime.shutdown().catch((error) => {
      console.error('[AgentWorker] Shutdown failed:', sanitizeError(error));
      process.exitCode = 1;
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  try {
    await runtime.start();
  } finally {
    await runtime.shutdown();
    process.removeListener('SIGINT', shutdown);
    process.removeListener('SIGTERM', shutdown);
  }
}

if (require.main === module) {
  runWorkerProcess().catch((error) => {
    console.error('[AgentWorker] Fatal error:', sanitizeError(error));
    process.exitCode = 1;
  });
}

module.exports = { buildWorkerRuntime, createWorkerRuntime, runWorkerProcess };
