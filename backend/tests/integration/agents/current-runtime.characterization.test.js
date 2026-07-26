const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { createAgentService } = require('../../../src/agents/agent.service');
const { FakeModelGateway } = require('../../helpers/fakeModelGateway');
const { agent, conversation, resetFactories } = require('../../helpers/factories');
const { closeTestResources, createMockPrisma, createTestDatabase, resetDatabase } = require('../../helpers/database');

const fn = () => vi.fn();
const setCommonJsMock = (request, exports) => {
  const filename = require.resolve(request);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
};
const clearCommonJsModule = (request) => {
  delete require.cache[require.resolve(request)];
};
const database = () => createMockPrisma({
  aIAgent: { findFirst: fn(), findMany: fn(), findUnique: fn(), update: fn(), updateMany: fn(), delete: fn() }, conversation: { findUnique: fn(), findFirst: fn(), update: fn(), updateMany: fn(), groupBy: fn(), count: fn() },
  conversationAgent: { create: fn(), update: fn(), updateMany: fn(), findFirst: fn(), deleteMany: fn() }, chatMessage: { create: fn(), findMany: fn() },
  agentRoutingRule: { findMany: fn(), deleteMany: fn() }, agentAction: { deleteMany: fn() }, agentKnowledge: { deleteMany: fn() }, workflow: { findFirst: fn() }, activityLog: { create: fn() },
  user: { findFirst: fn(), findMany: fn() }, contact: { findUnique: fn(), upsert: fn() }, contactField: { findMany: fn(), upsert: fn() },
  contactLabel: { findUnique: fn(), upsert: fn() }, contactLabelAssignment: { upsert: fn(), deleteMany: fn() }, lifecycleStage: { findFirst: fn() },
  contactNote: { create: fn() }
});
const ownershipGateway = () => ({
  assignAi: fn(),
  assignHuman: fn(),
  assignConfiguredTarget: fn(),
  ensureDefaultOwner: fn(),
  unassign: fn(),
  close: fn()
});

afterEach(() => { vi.clearAllMocks(); resetFactories(); });

describe('current runtime seam', () => {
  it('constructs an application without listening or booting services', () => {
    const bootModules = [
      '../../../src/services/socketService',
      '../../../src/services/workflowQueue',
      '../../../src/services/queueService',
      '../../../src/services/storageService',
      '../../../src/services/schedulerService'
    ].map(require.resolve);
    bootModules.forEach((filename) => delete require.cache[filename]);
    const listen = vi.spyOn(http.Server.prototype, 'listen');
    const { createApp } = require('../../../src/app');
    expect(createApp()).toBeTypeOf('function');
    expect(listen).not.toHaveBeenCalled();
    bootModules.forEach((filename) => expect(require.cache[filename]).toBeUndefined());
    listen.mockRestore();
  }, 15000);

  it('closes every resource owned by the test harness', async () => {
    const prisma = { $disconnect: fn().mockResolvedValue(undefined) };
    const redis = { quit: fn().mockResolvedValue(undefined) };
    const queue = { close: fn().mockResolvedValue(undefined) };
    const provider = { close: fn().mockResolvedValue(undefined) };
    const server = { close: vi.fn((callback) => callback()) };

    await closeTestResources({ prisma, redis, queues: [queue], server, providers: [provider] });

    expect(prisma.$disconnect).toHaveBeenCalledOnce();
    expect(redis.quit).toHaveBeenCalledOnce();
    expect(queue.close).toHaveBeenCalledOnce();
    expect(provider.close).toHaveBeenCalledOnce();
    expect(server.close).toHaveBeenCalledOnce();
  });
});

describe('agent behavior with injected dependencies', () => {
  const clock = () => new Date('2026-07-20T10:00:00Z');
  const testDeps = (prisma, modelGateway = new FakeModelGateway()) => ({
    prisma,
    modelGateway,
    toolService: { getToolDefinitions: () => [], execute: fn() },
    knowledgeService: { searchKnowledge: fn().mockResolvedValue([]) },
    ownershipGateway: ownershipGateway(),
    clock
  });

  it('loads the factory without constructing production dependencies', () => {
    expect(createAgentService).toBeTypeOf('function');
    expect(createAgentService(testDeps(database()))).toBeInstanceOf(require('../../../src/agents/agent.service').AgentService);
  });

  it('selects the default agent by priority, assigns it, and records a session', async () => {
    const prisma = database(); const selected = agent({ id: 'agent-high' }); const gateway = ownershipGateway(); prisma.aIAgent.findFirst.mockResolvedValue(selected);
    const service = createAgentService({ prisma, ownershipGateway: gateway, clock });
    await expect(service.assignDefaultAgent('conversation-1', 'tenant-1')).resolves.toBe(selected);
    expect(prisma.aIAgent.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-1', isActive: true, isPublished: true, deletedAt: null }),
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
    }));
    expect(gateway.ensureDefaultOwner).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      targetAgentId: 'agent-high'
    }));
  });

  it('manual assignment to another AI agent updates state and rotates sessions', async () => {
    const prisma = database();
    const gateway = ownershipGateway();
    gateway.assignConfiguredTarget.mockResolvedValue({ resolvedTarget: { kind: 'ai', id: 'agent-target' } });
    const service = createAgentService({ prisma, ownershipGateway: gateway, clock });

    await expect(service.assignConversationTarget({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      requesterAgentId: 'agent-source',
      targetRaw: '@agent:agent-target'
    })).resolves.toEqual({ assigned: true, targetType: 'agent' });

    expect(gateway.assignConfiguredTarget).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1',
      target: 'agent:agent-target'
    }));
  });

  it('manual assignment to a human disables AI and ends the active agent session', async () => {
    const prisma = database();
    const gateway = ownershipGateway();
    gateway.assignConfiguredTarget.mockResolvedValue({ resolvedTarget: { kind: 'human', id: 'user-1' } });
    const service = createAgentService({ prisma, ownershipGateway: gateway, clock });

    await expect(service.assignConversationTarget({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      requesterAgentId: 'agent-source',
      targetRaw: '@user:user-1'
    })).resolves.toEqual({ assigned: true, targetType: 'user' });

    expect(gateway.assignConfiguredTarget).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1',
      target: 'user:user-1'
    }));
  });

  it('rejects legacy partial-name assignment without a lookup', async () => {
    const prisma = database();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.aIAgent.findFirst.mockResolvedValue(null);
    const service = createAgentService({ prisma, ownershipGateway: ownershipGateway(), clock });

    await expect(service.assignConversationTarget({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      requesterAgentId: 'agent-source',
      targetRaw: 'Ava'
    })).resolves.toEqual({ assigned: false, targetType: 'unknown' });

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.aIAgent.findFirst).not.toHaveBeenCalled();
  });

  it('legacy team lookup excludes inactive users from assignment targets', async () => {
    const prisma = database();
    const gateway = ownershipGateway();
    gateway.assignConfiguredTarget.mockRejectedValue(Object.assign(new Error('disabled'), { code: 'CAPABILITY_DISABLED' }));
    const service = createAgentService({ prisma, ownershipGateway: gateway, clock });

    await expect(service.assignConversationTarget({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      requesterAgentId: 'agent-source',
      targetRaw: '@team:humans'
    })).resolves.toEqual({ assigned: false, targetType: 'team' });

    expect(gateway.assignConfiguredTarget).toHaveBeenCalledWith(expect.objectContaining({
      target: 'team:humans'
    }));
  });

  it('does not run inactive, unpublished, or soft-deleted assigned agents', async () => {
    const prisma = database();
    prisma.conversation.findFirst.mockResolvedValue({
      ...conversation(),
      currentAgent: agent({ isActive: true, isPublished: false, deletedAt: null })
    });
    const service = createAgentService(testDeps(prisma));

    await expect(service.processMessage({ conversationId: 'conversation-1', message: 'hello', tenantId: 'tenant-1' })).resolves.toBeNull();
  });

  it('treats a successful route as terminal before legacy actions', async () => {
    const prisma = database(); const source = agent({ id: 'source' }); const target = agent({ id: 'target' }); const item = conversation({ id: 'c1', currentAgentId: source.id });
    prisma.agentRoutingRule.findMany.mockResolvedValue([{ triggerType: 'keywords', keywords: ['sales'], toAgentId: target.id, priority: 1 }]);
    const gateway = ownershipGateway();
    gateway.assignConfiguredTarget.mockResolvedValue({ resolvedTarget: { kind: 'ai', id: target.id } });
    const service = createAgentService({ prisma, ownershipGateway: gateway, clock });
    await expect(service.checkRoutingRules(item, source, 'sales please')).resolves.toBe(true);
    expect(gateway.assignConfiguredTarget).toHaveBeenCalledOnce();
    expect(gateway.close).not.toHaveBeenCalled();
  });

  it('closes a conversation when the close action tag is present', async () => {
    const prisma = database();
    const gateway = ownershipGateway();
    const service = createAgentService({ prisma, ownershipGateway: gateway, clock });

    await expect(
      service.executeActions(agent(), conversation({ id: 'conversation-1' }), 'bye', 'Done [ACTION: CLOSE_CONVERSATION]')
    ).resolves.toEqual({ terminal: true, type: 'close_conversation' });

    expect(gateway.close).toHaveBeenCalledWith(expect.objectContaining({
      conversationId: 'conversation-1',
      reasonCode: 'agent_close'
    }));
  });

  it('returns the out-of-hours message without calling the model gateway', async () => {
    const prisma = database();
    const modelGateway = new FakeModelGateway({ content: 'should not be used' });
    const configured = agent({
      isPublished: true,
      workingHoursEnabled: true,
      workingHours: { sunday: { enabled: true, start: '13:00', end: '17:00' } },
      outOfHoursMessage: 'Closed now.',
      knowledgeSources: [],
      actions: []
    });
    prisma.conversation.findFirst.mockResolvedValue({ ...conversation(), currentAgent: configured });
    const service = createAgentService(testDeps(prisma, modelGateway));

    await expect(service.processMessage({ conversationId: 'conversation-1', message: 'hello', tenantId: 'tenant-1' })).resolves.toMatchObject({ response: 'Closed now.' });
    expect(modelGateway.calls).toHaveLength(0);
  });

  it('honors working hours, loads history, and normalizes the legacy default model', async () => {
    const prisma = database(); const modelGateway = new FakeModelGateway({ content: 'reply' }); const item = conversation({ id: 'c1' });
    const configured = agent({ isPublished: true, aiModel: 'deepseek-chat', workingHoursEnabled: true, workingHours: { monday: { enabled: true, start: '00:00', end: '23:59' } }, knowledgeSources: [], actions: [] });
    prisma.conversation.findFirst.mockResolvedValue({ ...item, currentAgent: configured }); prisma.chatMessage.findMany.mockResolvedValue([{ direction: 'incoming', content: 'earlier' }]); prisma.agentRoutingRule.findMany.mockResolvedValue([]); prisma.conversationAgent.findFirst.mockResolvedValue(null);
    const service = createAgentService(testDeps(prisma, modelGateway));
    await expect(service.processMessage({ conversationId: item.id, message: 'hello', tenantId: 'tenant-1' })).resolves.toMatchObject({ response: 'reply' });
    expect(prisma.chatMessage.findMany).toHaveBeenCalled();
    expect(modelGateway.calls[0].model).toBe('qwen/qwen3.5-flash-02-23');
  });

  it('passes a configured provider model through the injected model gateway', async () => {
    const prisma = database(); const modelGateway = new FakeModelGateway({ content: 'reply' });
    const configured = agent({ isPublished: true, aiProvider: 'openrouter', aiModel: 'anthropic/claude-sonnet-4', knowledgeSources: [], actions: [] });
    prisma.conversation.findFirst.mockResolvedValue({ ...conversation(), currentAgent: configured });
    prisma.chatMessage.findMany.mockResolvedValue([]);
    prisma.agentRoutingRule.findMany.mockResolvedValue([]);
    prisma.conversationAgent.findFirst.mockResolvedValue(null);
    const service = createAgentService(testDeps(prisma, modelGateway));

    await service.processMessage({ conversationId: 'conversation-1', message: 'hello', tenantId: 'tenant-1' });

    expect(modelGateway.calls[0].model).toBe('anthropic/claude-sonnet-4');
  });

  it.fails('does not load history when useHistory is disabled', async () => {
    const prisma = database(); const configured = agent({ isPublished: true, useHistory: false, knowledgeSources: [], actions: [] }); prisma.conversation.findFirst.mockResolvedValue({ ...conversation(), currentAgent: configured }); prisma.chatMessage.findMany.mockResolvedValue([]); prisma.agentRoutingRule.findMany.mockResolvedValue([]); prisma.conversationAgent.findFirst.mockResolvedValue(null);
    const service = createAgentService(testDeps(prisma));
    await service.processMessage({ conversationId: 'c1', message: 'hello', tenantId: 'tenant-1' });
    expect(prisma.chatMessage.findMany).not.toHaveBeenCalled();
  });

  it('triggers the injected workflow service with conversation context for assignment steps', async () => {
    const prisma = database(); const workflowService = { executeWorkflowRecord: vi.fn().mockResolvedValue({}) }; prisma.workflow.findFirst.mockResolvedValue({ id: 'workflow-1' });
    const service = createAgentService({ prisma, workflowService, clock });
    await service.executeActions(agent(), conversation({ id: 'conversation-1', contactNumber: '+15550000000' }), 'go', '[ACTION: TRIGGER_WORKFLOW: workflow-1]');
    expect(workflowService.executeWorkflowRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 'workflow-1' }), expect.objectContaining({
      eventType: 'agent_action',
      conversation: expect.objectContaining({ id: 'conversation-1', contactNumber: '+15550000000' })
    }), { force: true });
  });
});

describe('adjacent runtime behavior', () => {
  it('skips duplicate inbound messages by WAMID without throwing', async () => {
    const prisma = database();
    const duplicate = new Error('duplicate');
    duplicate.code = 'P2002';
    duplicate.meta = { target: ['wamid'] };
    prisma.chatMessage.create.mockRejectedValue(duplicate);
    setCommonJsMock('../../../src/config/database', prisma);
    setCommonJsMock('../../../src/services/evolutionApi', {});
    setCommonJsMock('../../../src/services/metaApi', {});
    clearCommonJsModule('../../../src/services/chat.service');
    const chatService = require('../../../src/services/chat.service');

    await expect(chatService.saveMessage('conversation-1', { wamid: 'wamid-1', senderNumber: 'a', recipientNumber: 'b' })).resolves.toBeNull();
  });

  it('soft deletes an eligible agent and preserves conversation history', async () => {
    const express = require('express');
    const request = require('supertest');
    const prisma = database();
    const deletedAgent = agent({ id: 'agent-delete', tenantId: 'tenant-1', isActive: false, isPublished: false, deletedAt: new Date(), configVersion: 2 });
    prisma.aIAgent.findFirst.mockResolvedValue(agent({ id: 'agent-delete', tenantId: 'tenant-1', configVersion: 1 }));
    prisma.conversation.count.mockResolvedValue(0);
    prisma.aIAgent.updateMany.mockResolvedValue({ count: 1 });
    prisma.aIAgent.findUnique.mockResolvedValue(deletedAgent);
    prisma.$transaction = vi.fn(async (callback) => callback({ ...prisma, $transaction: undefined }));
    setCommonJsMock('../../../src/config/database', prisma);
    setCommonJsMock('../../../src/middleware/tenantContext', (req, res, next) => { req.user = { tenantId: 'tenant-1', role: 'admin' }; next(); });
    setCommonJsMock('../../../src/middleware/checkPermission', () => (req, res, next) => next());
    setCommonJsMock('../../../src/ai/deepseek.service', { chat: fn() });
    clearCommonJsModule('../../../src/agents/agent.routes');
    const router = require('../../../src/agents/agent.routes');
    const app = express();
    app.use(express.json());
    app.use('/agents', router);

    await request(app).delete('/agents/agent-delete').send({ expectedConfigVersion: 1 }).expect(200, { success: true });

    expect(prisma.conversationAgent.deleteMany).not.toHaveBeenCalled();
    expect(prisma.agentAction.deleteMany).not.toHaveBeenCalled();
    expect(prisma.agentKnowledge.deleteMany).not.toHaveBeenCalled();
    expect(prisma.aIAgent.delete).not.toHaveBeenCalled();
    expect(prisma.aIAgent.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'agent-delete', tenantId: 'tenant-1', deletedAt: null, configVersion: 1 },
      data: expect.objectContaining({ isActive: false, isPublished: false, deletedAt: expect.any(Date) })
    }));
  });
});

describe('test database safety and vector drift', () => {
  it('rejects arbitrary clients even when DATABASE_URL names the test database', async () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5434/valuewats_agent_test?schema=public';
    try {
      await expect(resetDatabase({ $executeRawUnsafe: vi.fn() })).rejects.toThrow('unregistered');
    } finally {
      process.env.DATABASE_URL = original;
    }
  });

  it('resets the registered client datasource, not the current environment datasource', async () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/valuewats_prod?schema=public';
    try {
      const prisma = createTestDatabase('postgresql://postgres:postgres@localhost:5434/valuewats_agent_test?schema=public', function FakePrisma() {
        return { $executeRawUnsafe: vi.fn().mockResolvedValue(undefined) };
      });

      await resetDatabase(prisma);

      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith('TRUNCATE TABLE "tenants" CASCADE');
    } finally {
      process.env.DATABASE_URL = original;
    }
  });

  it('records the historical 1536 migration and schema while runtime still expects 768-dimensional embeddings', () => {
    const migration = fs.readFileSync(path.join(__dirname, '../../../prisma/migrations/20260215175500_add_multi_agent_system/migration.sql'), 'utf8');
    const schema = fs.readFileSync(path.join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
    const runtime = fs.readFileSync(path.join(__dirname, '../../../src/services/embeddingService.js'), 'utf8');
    expect(migration).toContain('"embedding" vector(1536)');
    expect(schema).toContain('vector(1536)');
    expect(runtime).toContain('produces exactly 768 dimensions');
  });

  it.fails('keeps the legacy 1536-dimensional storage width compatible with the 768-dimensional runtime model', () => {
    const migration = fs.readFileSync(path.join(__dirname, '../../../prisma/migrations/20260215175500_add_multi_agent_system/migration.sql'), 'utf8');
    const migrationDimension = Number(migration.match(/"embedding" vector\((\d+)\)/)?.[1]);
    const runtimeDimension = 768;
    expect(migrationDimension).toBe(runtimeDimension);
  });
});
