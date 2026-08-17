const { createOutboxService } = require('../events/outboxService');
const { createOutboxWorker } = require('../events/outboxWorker');
const { sanitizeError } = require('../logging/redaction');
const { createCommentAiDecisionService } = require('./commentAiDecisionService');
const { createCommentReplyDispatcher } = require('./commentReplyDispatcher');
const { createCommentReplyRuntime } = require('./commentReplyRuntime');
const { createCommentReplyWorker } = require('./commentReplyWorker');

const PUBLISH_EVENT = 'comment_reply.delivery_requested';
const defaultSleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function buildCommentReplyWorkers({
  prisma,
  metaApi,
  decisionService,
  clock = () => new Date(),
  dispatchers = {},
  leaseMs = 30_000,
  maxAttempts = 3
}) {
  const outboxService = createOutboxService(prisma, { clock });
  const lazyDecisionService = decisionService || {
    decide: async (input) => createCommentAiDecisionService().decide(input)
  };
  const runtime = createCommentReplyRuntime({ prisma, outboxService, decisionService: lazyDecisionService, clock });
  const commentReplyWorker = createCommentReplyWorker({
    prisma,
    runtime,
    clock,
    leaseMs,
    maxAttempts
  });
  const commentReplyDispatcher = createCommentReplyDispatcher({ prisma, metaApi });
  const outboxWorker = createOutboxWorker({
    prisma,
    clock,
    leaseMs,
    maxAttempts,
    dispatchers: {
      ...dispatchers,
      [PUBLISH_EVENT]: commentReplyDispatcher
    }
  });
  return {
    commentReplyDispatcher,
    commentReplyWorker,
    outboxWorker,
    runtime
  };
}

function createCommentReplyProcessingRuntime({
  commentReplyWorker,
  outboxWorker,
  sleep = defaultSleep,
  pollMs = 1_000,
  logger = console
}) {
  let stopping = false;
  let activeWork = null;

  function stop() {
    stopping = true;
  }

  async function safeRun(label, operation) {
    try {
      return await operation();
    } catch (error) {
      logger.error(`[CommentReplies] ${label} failed:`, sanitizeError(error));
      return null;
    }
  }

  async function start() {
    while (!stopping) {
      activeWork = (async () => {
        await safeRun('inbound lease recovery', () => commentReplyWorker.recoverStale());
        await safeRun('outbox lease recovery', () => outboxWorker.recoverStaleDispatches());
        const execution = await safeRun('execution processing', () => commentReplyWorker.runOnce());
        const event = await safeRun('outbox processing', () => outboxWorker.runOnce());
        return { event, execution };
      })();
      const work = await activeWork;
      activeWork = null;
      if (!work.event && !work.execution && !stopping) await sleep(pollMs);
    }
  }

  async function shutdown() {
    stop();
    if (activeWork) await activeWork.catch(() => {});
  }

  return { shutdown, start, stop };
}

function startCommentReplyProcessing(options) {
  const workers = buildCommentReplyWorkers(options);
  const processing = createCommentReplyProcessingRuntime({
    ...options,
    ...workers
  });
  processing.completion = processing.start().catch((error) => {
    (options.logger || console).error(
      '[CommentReplies] Processing loop stopped:',
      sanitizeError(error)
    );
  });
  return processing;
}

module.exports = {
  buildCommentReplyWorkers,
  createCommentReplyProcessingRuntime,
  startCommentReplyProcessing
};
