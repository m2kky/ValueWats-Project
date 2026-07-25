const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const prisma = new PrismaClient();

function clearModule(request) {
  delete require.cache[require.resolve(request)];
}

function createTask2App() {
  [
    '../../../src/config/database',
    '../../../src/middleware/tenantContext',
    '../../../src/agents/config/agentSetupService',
    '../../../src/agents/agent.routes'
  ].forEach(clearModule);

  const app = express();
  app.use(express.json());
  app.use('/api/agents', require('../../../src/agents/agent.routes'));
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

async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "tenants" CASCADE');
}

async function seedOwner() {
  const tenant = await prisma.tenant.create({
    data: { id: 'tenant-lifecycle', name: 'Lifecycle Tenant', email: 'life-owner@example.test', status: 'active' }
  });
  const user = await prisma.user.create({
    data: {
      id: 'owner-lifecycle',
      tenantId: tenant.id,
      email: 'life-admin@example.test',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'owner',
      emailVerified: true
    }
  });
  return { tenant, user };
}

async function createAgent(tenantId, overrides = {}) {
  return prisma.aIAgent.create({
    data: {
      tenantId,
      name: 'Lifecycle Agent',
      instructions: 'Handle lifecycle transitions.',
      isActive: true,
      isPublished: true,
      ...overrides
    }
  });
}

async function createOpenConversation(tenantId, agentId) {
  const id = `conversation-${Math.floor(Math.random() * 1000000)}`;
  await prisma.$executeRawUnsafe(
    'INSERT INTO "conversations" (id, tenant_id, channel_type, contact_number, unread_count, status, "currentAgentId", "created_at", "updated_at", assignment_version) VALUES ($1, $2, $3, $4, 0, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)',
    id,
    tenantId,
    'whatsapp',
    `+1555${Math.floor(Math.random() * 1000000)}`,
    'open',
    agentId
  );
  return { id };
}

describe('agent lifecycle setup boundaries', () => {
  let app;
  let tenant;
  let auth;

  beforeAll(() => {
    app = createTask2App();
  });

  beforeEach(async () => {
    await resetDatabase();
    const seeded = await seedOwner();
    tenant = seeded.tenant;
    auth = tokenFor(seeded.user);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('blocks deactivate, unpublish, and delete while the agent owns open conversations', async () => {
    const agent = await createAgent(tenant.id);
    await createOpenConversation(tenant.id, agent.id);

    await request(app)
      .put(`/api/agents/${agent.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ expectedConfigVersion: 1, isActive: false })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('AGENT_HAS_OPEN_CONVERSATIONS'));

    await request(app)
      .put(`/api/agents/${agent.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ expectedConfigVersion: 1, isPublished: false })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('AGENT_HAS_OPEN_CONVERSATIONS'));

    await request(app)
      .delete(`/api/agents/${agent.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('AGENT_HAS_OPEN_CONVERSATIONS'));
  });

  it('soft deletes eligible agents and preserves audited history', async () => {
    const agent = await createAgent(tenant.id);
    const closedConversation = { id: 'closed-conversation' };
    await prisma.$executeRawUnsafe(
      'INSERT INTO "conversations" (id, tenant_id, channel_type, contact_number, unread_count, status, "currentAgentId", "created_at", "updated_at", assignment_version) VALUES ($1, $2, $3, $4, 0, $5, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)',
      closedConversation.id,
      tenant.id,
      'whatsapp',
      '+15550001111',
      'closed'
    );
    await prisma.conversationAgent.create({
      data: {
        conversationId: closedConversation.id,
        agentId: agent.id
      }
    });

    await request(app)
      .delete(`/api/agents/${agent.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .expect(200)
      .expect(({ body }) => expect(body.success).toBe(true));

    const storedAgent = await prisma.aIAgent.findUnique({ where: { id: agent.id } });
    expect(storedAgent.deletedAt).toBeInstanceOf(Date);
    expect(storedAgent.isActive).toBe(false);
    const historyCount = await prisma.conversationAgent.count({ where: { agentId: agent.id } });
    expect(historyCount).toBe(1);
  });
});
