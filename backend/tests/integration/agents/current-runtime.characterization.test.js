const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const boot = vi.hoisted(() => ({
  initSocket: vi.fn(),
  initBucket: vi.fn(),
  startScheduler: vi.fn(),
  startQueue: vi.fn()
}));

vi.mock('../../../src/services/socketService', () => ({ init: boot.initSocket }));
vi.mock('../../../src/services/storageService', () => ({ initBucket: boot.initBucket }));
vi.mock('../../../src/services/schedulerService', () => ({ startScheduler: boot.startScheduler }));
vi.mock('../../../src/services/workflowQueue', () => ({ workflowQueue: { process: boot.startQueue } }));

afterEach(() => {
  vi.clearAllMocks();
});

describe('current runtime seam', () => {
  it('constructs an application without listening or booting services', () => {
    const listen = vi.spyOn(http.Server.prototype, 'listen');
    const { createApp } = require('../../../src/app');

    const app = createApp();

    expect(app).toBeTypeOf('function');
    expect(listen).not.toHaveBeenCalled();
    expect(boot.initSocket).not.toHaveBeenCalled();
    expect(boot.initBucket).not.toHaveBeenCalled();
    expect(boot.startScheduler).not.toHaveBeenCalled();
    expect(boot.startQueue).not.toHaveBeenCalled();
    listen.mockRestore();
  }, 15000);
});

describe('current agent behavior', () => {
  const read = (...parts) => fs.readFileSync(path.join(__dirname, '../../../src', ...parts), 'utf8');

  it('characterizes selection, assignment, routing, closing, history, provider, duplicate, workflow, and deletion paths', () => {
    const agents = read('agents', 'agent.service.js');
    const agentRoutes = read('agents', 'agent.routes.js');
    const chat = read('services', 'chat.service.js');
    const webhooks = read('controllers', 'webhookController.js');

    expect(agents).toMatch(/assignDefaultAgent[\s\S]*priority: 'desc'[\s\S]*createdAt: 'asc'/);
    expect(chat).toContain("type === 'agent'");
    expect(agents).toContain('checkRoutingRules');
    expect(agents).toContain("actionString === 'CLOSE_CONVERSATION'");
    expect(agents).toContain('isWithinWorkingHours');
    expect(agents).toContain('getConversationHistory(conversationId, agent.historyLength)');
    expect(agents).toContain("qwen/qwen3.5-flash-02-23");
    expect(webhooks).toContain('wamid');
    expect(agents).toContain('TRIGGER_WORKFLOW:');
    expect(agentRoutes).toContain('tx.aIAgent.delete');
  });

  it.fails('keeps migration embeddings compatible with the 768-dimensional runtime model', () => {
    const migration = fs.readFileSync(path.join(__dirname, '../../../prisma/migrations/20260215175500_add_multi_agent_system/migration.sql'), 'utf8');
    expect(migration).toContain('"embedding" vector(768)');
  });
});
