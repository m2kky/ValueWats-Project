const { createAgentService } = require('../../../src/agents/agent.service');
const express = require('express');
const request = require('supertest');

const mockedModules = [
  '../../../src/config/database',
  '../../../src/middleware/tenantContext',
  '../../../src/middleware/checkPermission',
  '../../../src/agents/agent.service',
  '../../../src/agents/agent.routes',
  '../../../src/agents/config/agentSetupService',
  '../../../src/agents/config/agentCapabilityService',
].map(require.resolve);
let originalModules;

beforeEach(() => {
  originalModules = mockedModules.map((filename) => require.cache[filename]);
});
afterEach(() => {
  mockedModules.forEach((filename, index) => {
    if (originalModules[index]) require.cache[filename] = originalModules[index];
    else delete require.cache[filename];
  });
});

function previewApp(overrides = {}) {
  const agent = {
    id: 'agent-1', tenantId: 'tenant-1', name: 'Support', instructions: 'Help customers.',
    isActive: true, isPublished: false, deletedAt: null, useHistory: true, historyLength: 2,
    tone: 'friendly', responseStyle: 'concise', actionConfig: {}, actions: [], knowledgeSources: [],
    ...overrides
  };
  const prisma = { aIAgent: { findFirst: async ({ where }) =>
    Object.entries(where).every(([key, value]) => agent[key] === value) ? agent : null
  } };
  const modelGateway = { chat: vi.fn().mockResolvedValue({ role: 'assistant', content: 'Preview reply' }) };
  const service = createAgentService({
    prisma, modelGateway,
    toolService: { getToolDefinitions: () => [], execute: vi.fn() },
    knowledgeService: { searchKnowledge: async () => [] }
  });
  const replaceModule = (modulePath, exports) => {
    const filename = require.resolve(modulePath);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  };
  replaceModule('../../../src/config/database', prisma);
  replaceModule('../../../src/middleware/tenantContext', (req, res, next) => {
    req.user = { tenantId: 'tenant-1', role: 'admin' }; next();
  });
  replaceModule('../../../src/middleware/checkPermission', () => (req, res, next) => next());
  replaceModule('../../../src/agents/agent.service', service);
  delete require.cache[require.resolve('../../../src/agents/agent.routes')];
  const app = express();
  app.use(express.json());
  app.use('/agents', require('../../../src/agents/agent.routes'));
  return { app, modelGateway };
}

describe('saved agent preview', () => {
  it.each([
    { isPublished: false, isActive: true },
    { isPublished: true, isActive: false },
  ])('allows testing a saved draft or paused agent: %j', async (flags) => {
    const { app } = previewApp(flags);
    const response = await request(app).post('/agents/agent-1/test').send({ message: 'hello' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ response: 'Preview reply' });
  });

  it.each([{ deletedAt: new Date() }, { tenantId: 'other-tenant' }])(
    'keeps deleted and foreign tenant agents inaccessible: %j', async (overrides) => {
      const { app, modelGateway } = previewApp(overrides);
      const response = await request(app).post('/agents/agent-1/test').send({ message: 'hello' });
      expect(response.status).toBe(404);
      expect(modelGateway.chat).not.toHaveBeenCalled();
    }
  );

  it('omits previous messages when history is disabled', async () => {
    const { app, modelGateway } = previewApp({ isPublished: true, useHistory: false });
    await request(app).post('/agents/agent-1/test').send({
      message: 'hello', history: [{ role: 'user', content: 'private earlier topic' }]
    }).expect(200);
    const messages = modelGateway.chat.mock.calls[0][0].messages;
    expect(messages.filter((entry) => entry.role === 'user')).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('limits history to the saved history length and ignores error bubbles', async () => {
    const { app, modelGateway } = previewApp({ isPublished: true });
    await request(app).post('/agents/agent-1/test').send({ message: 'hello', history: [
      { role: 'user', content: 'old topic' },
      { role: 'assistant', content: 'old reply' },
      { role: 'user', content: 'recent topic' },
      { role: 'assistant', content: 'recent reply' },
      { role: 'error', content: 'Provider error' },
    ] }).expect(200);
    expect(modelGateway.chat.mock.calls[0][0].messages.filter((entry) => entry.role !== 'system')).toEqual([
      { role: 'user', content: 'recent topic' },
      { role: 'assistant', content: 'recent reply' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'Preview reply' },
    ]);
  });
});
