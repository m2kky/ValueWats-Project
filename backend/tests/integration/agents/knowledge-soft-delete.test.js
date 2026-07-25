const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createTestDatabase, resetDatabase: resetRegisteredDatabase } = require('../../helpers/database');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const prisma = createTestDatabase(process.env.DATABASE_URL);

const knowledgeServiceMock = {
  listKnowledge: vi.fn(),
  addTextKnowledge: vi.fn(),
  addFileKnowledge: vi.fn(),
  addTableKnowledge: vi.fn(),
  deleteKnowledge: vi.fn()
};

function clearModule(requestPath) {
  delete require.cache[require.resolve(requestPath)];
}

function setCommonJsMock(requestPath, exports) {
  const filename = require.resolve(requestPath);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

function createKnowledgeApp() {
  [
    '../../../src/config/database',
    '../../../src/middleware/tenantContext',
    '../../../src/agents/knowledge.routes',
    '../../../src/services/knowledgeService'
  ].forEach(clearModule);
  setCommonJsMock('../../../src/services/knowledgeService', knowledgeServiceMock);

  const app = express();
  app.use(express.json());
  app.use('/api/agents', require('../../../src/agents/knowledge.routes'));
  return app;
}

function tokenFor(user) {
  return jwt.sign({
    userId: user.id,
    email: user.email,
    role: user.role,
    isSuperAdmin: false,
    tenantId: user.tenantId
  }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function seedOwner() {
  const tenant = await prisma.tenant.create({
    data: { id: 'tenant-knowledge', name: 'Knowledge Tenant', email: 'knowledge-owner@example.test', status: 'active' }
  });
  const user = await prisma.user.create({
    data: {
      id: 'owner-knowledge',
      tenantId: tenant.id,
      email: 'knowledge-admin@example.test',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'owner',
      emailVerified: true
    }
  });
  return { tenant, user };
}

async function createSoftDeletedAgentWithKnowledge(tenantId) {
  const agent = await prisma.aIAgent.create({
    data: {
      tenantId,
      name: 'Deleted knowledge agent',
      instructions: 'Do not expose knowledge.',
      deletedAt: new Date(),
      isActive: false,
      isPublished: false
    }
  });
  const knowledge = await prisma.agentKnowledge.create({
    data: {
      agentId: agent.id,
      title: 'Deleted source',
      content: 'Hidden content',
      sourceType: 'text',
      tags: []
    }
  });
  return { agent, knowledge };
}

describe('agent knowledge soft-delete boundaries', () => {
  let app;
  let tenant;
  let auth;

  beforeAll(() => {
    app = createKnowledgeApp();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await resetRegisteredDatabase(prisma);
    const seeded = await seedOwner();
    tenant = seeded.tenant;
    auth = tokenFor(seeded.user);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('does not show soft-deleted agents in workspace knowledge', async () => {
    await createSoftDeletedAgentWithKnowledge(tenant.id);

    const response = await request(app)
      .get('/api/agents/knowledge')
      .set('Authorization', `Bearer ${auth}`)
      .expect(200);

    expect(response.body.sources).toEqual([]);
  });

  it('rejects list, add text, add table, upload file, and delete knowledge for soft-deleted agents before service work', async () => {
    const { agent, knowledge } = await createSoftDeletedAgentWithKnowledge(tenant.id);

    await request(app)
      .get(`/api/agents/${agent.id}/knowledge`)
      .set('Authorization', `Bearer ${auth}`)
      .expect(404);

    await request(app)
      .post(`/api/agents/${agent.id}/knowledge/text`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ title: 'Blocked text', content: 'blocked' })
      .expect(404);

    await request(app)
      .post(`/api/agents/${agent.id}/knowledge/table`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ title: 'Blocked table', headers: ['sku'], rows: [['1']] })
      .expect(404);

    await request(app)
      .post(`/api/agents/${agent.id}/knowledge/file`)
      .set('Authorization', `Bearer ${auth}`)
      .attach('file', Buffer.from('blocked'), 'blocked.txt')
      .expect(404);

    await request(app)
      .delete(`/api/agents/${agent.id}/knowledge/${knowledge.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .expect(404);

    expect(knowledgeServiceMock.listKnowledge).not.toHaveBeenCalled();
    expect(knowledgeServiceMock.addTextKnowledge).not.toHaveBeenCalled();
    expect(knowledgeServiceMock.addTableKnowledge).not.toHaveBeenCalled();
    expect(knowledgeServiceMock.addFileKnowledge).not.toHaveBeenCalled();
    expect(knowledgeServiceMock.deleteKnowledge).not.toHaveBeenCalled();
  });
});
