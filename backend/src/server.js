require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const socketService = require('./services/socketService');
const { startCommentReplyProcessing } = require('./commentReplies/commentReplyBoot');
const { createStoreSyncQueue } = require('./stores/storeSyncQueue');
const { createStoreToolService } = require('./stores/storeToolService');
const { createGracefulShutdown, createSignalHandler } = require('./serverShutdown');

const prisma = require('./config/database');
const storeSyncQueue = createStoreSyncQueue({ prisma });
require('./services/toolService').configureStoreToolService(createStoreToolService({
  prisma,
  storeService: storeSyncQueue.storeService
}));

// Keep queue workers and provider clients in process boot, never in app construction.
const dependencies = {
  prisma,
  modelGateway: require('./ai/deepseek.service'),
  queues: {
    workflow: require('./services/workflowQueue').workflowQueue,
    campaign: require('./services/queueService').messageQueue,
    storeSync: storeSyncQueue
  },
  providers: { evolution: require('./services/evolutionApi'), meta: require('./services/metaApi') },
  clock: () => new Date()
};

const routes = {
  auth: require('./routes/auth'), instances: require('./routes/instances'), campaigns: require('./routes/campaigns'),
  webhooks: require('./routes/webhooks'), chat: require('./routes/chat'), agents: require('./agents/agent.routes'),
  sallaWebhooks: require('./stores/providers/salla/sallaWebhook.routes').createSallaWebhookRouter,
  commentReplies: require('./commentReplies/commentReply.routes').createCommentReplyRouter,
  knowledge: require('./agents/knowledge.routes'), integrations: require('./routes/integrations'), workflows: require('./routes/workflows'),
  plans: require('./routes/plans'), onboarding: require('./routes/onboarding'), dashboard: require('./routes/dashboard'),
  automations: require('./routes/automations'), team: require('./routes/team'), lifecycle: require('./routes/lifecycle.routes'),
  contacts: require('./routes/contacts'), templates: require('./routes/templates'), contactFields: require('./routes/contactFields.routes'),
  tags: require('./routes/tags.routes'), snippets: require('./routes/snippets.routes'), lifecycleRules: require('./routes/lifecycleRules.routes'),
  segments: require('./routes/segments'), settings: require('./routes/settings'), notifications: require('./routes/notifications'),
  admin: require('./routes/admin'), oauth: require('./routes/oauth')
};

const app = createApp({ routes, middleware: { tenantContext: require('./middleware/tenantContext') }, dependencies });
const server = http.createServer(app);
socketService.init(server);
const PORT = process.env.PORT || 3000;
let commentReplyProcessing = null;
const { closeQueue, shutdown } = createGracefulShutdown({ server, storeSyncQueue });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  require('./services/storageService').initBucket().catch((err) => console.error('[Boot] MinIO bucket init failed:', err.message));
  commentReplyProcessing = startCommentReplyProcessing({
    prisma: dependencies.prisma,
    metaApi: dependencies.providers.meta,
    clock: dependencies.clock
  });
  require('./services/schedulerService').startScheduler();
  storeSyncQueue.enqueueReconciliation().catch(() => {
    console.error('[Boot] Store reconciliation registration failed', { errorCode: 'STORE_QUEUE_UNAVAILABLE' });
  });
});

server.on('close', () => {
  commentReplyProcessing?.stop();
  closeQueue().catch(() => {
    console.error('[Shutdown] Store queue close failed', { errorCode: 'STORE_QUEUE_CLOSE_FAILED' });
  });
});

const handleSignal = createSignalHandler({ shutdown });
process.once('SIGTERM', handleSignal);
process.once('SIGINT', handleSignal);

module.exports = app;
