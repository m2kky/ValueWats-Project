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
    '../../../src/routes/auth',
    '../../../src/routes/team',
    '../../../src/agents/config/agentSetupService',
    '../../../src/agents/agent.routes'
  ].forEach(clearModule);

  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../../../src/routes/auth'));
  app.use('/api/agents', require('../../../src/agents/agent.routes'));
  app.use('/api/team', require('../../../src/routes/team'));
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

async function seedTenantWithUser({ tenantId, tenantEmail, userId, userEmail, role = 'owner', password = 'password123' }) {
  const tenant = await prisma.tenant.create({
    data: { id: tenantId, name: tenantId, email: tenantEmail, status: 'active' }
  });
  const user = await prisma.user.create({
    data: {
      id: userId,
      tenantId,
      email: userEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      emailVerified: true
    }
  });
  return { tenant, user, password };
}

const validAgentPayload = (overrides = {}) => ({
  name: 'Boundary Agent',
  instructions: 'Help customers with scoped setup.',
  aiProvider: 'openrouter',
  aiModel: 'qwen/qwen3.5-flash-02-23',
  temperature: 0.7,
  maxTokens: 500,
  ...overrides
});

describe('agent setup security boundaries', () => {
  let app;
  let owner;
  let auth;

  beforeAll(() => {
    app = createTask2App();
  });

  beforeEach(async () => {
    await resetDatabase();
    ({ user: owner } = await seedTenantWithUser({
      tenantId: 'tenant-a',
      tenantEmail: 'owner-a@example.test',
      userId: 'owner-a',
      userEmail: 'admin-a@example.test'
    }));
    await seedTenantWithUser({
      tenantId: 'tenant-b',
      tenantEmail: 'owner-b@example.test',
      userId: 'owner-b',
      userEmail: 'admin-b@example.test'
    });
    auth = tokenFor(owner);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('prevents template payloads from overriding tenant identity', async () => {
    const response = await request(app)
      .post('/api/agents/templates/receptionist')
      .set('Authorization', `Bearer ${auth}`)
      .send({ tenantId: 'tenant-b', name: 'Tenant escape attempt' })
      .expect(201);

    expect(response.body.tenantId).toBe('tenant-a');
    const agent = await prisma.aIAgent.findUnique({ where: { id: response.body.id } });
    expect(agent.tenantId).toBe('tenant-a');
  });

  it('denies unknown setup fields and direct tenant overrides', async () => {
    await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload({ unexpectedField: true }))
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('SETUP_FIELD_NOT_ALLOWED'));

    await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload({ tenantId: 'tenant-b' }))
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('SETUP_FIELD_NOT_ALLOWED'));
  });

  it('denies unsupported provider model pairs and invalid setup ranges', async () => {
    await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload({ aiProvider: 'openrouter', aiModel: 'deepseek-chat' }))
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('UNSUPPORTED_PROVIDER_MODEL'));

    for (const payload of [
      { temperature: -0.1 },
      { temperature: 2.1 },
      { maxTokens: 63 },
      { maxTokens: 4097 },
      { instructions: '   ' },
      { instructions: 'x'.repeat(10001) }
    ]) {
      await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${auth}`)
        .send(validAgentPayload(payload))
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe('SETUP_VALIDATION_FAILED'));
    }
  });

  it('returns the stable conflict code for stale runtime-state updates', async () => {
    const created = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload())
      .expect(201);

    await request(app)
      .put(`/api/agents/${created.body.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ expectedConfigVersion: 0, temperature: 0.9 })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('CONFIG_VERSION_CONFLICT'));
  });

  it('increments configVersion exactly once on create and update', async () => {
    const created = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload())
      .expect(201);

    expect(created.body.configVersion).toBe(1);

    const updated = await request(app)
      .put(`/api/agents/${created.body.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ expectedConfigVersion: 1, temperature: 1.1 })
      .expect(200);

    expect(updated.body.configVersion).toBe(2);
    const rows = await prisma.$queryRawUnsafe('SELECT "configVersion" FROM "AIAgent" WHERE id = $1', created.body.id);
    expect(rows[0].configVersion).toBe(2);
  });

  it('rejects inactive users in password login, tenant middleware, and active team listings', async () => {
    await prisma.$executeRawUnsafe('UPDATE "users" SET "is_active" = false WHERE id = $1', owner.id);

    await request(app)
      .post('/api/auth/login')
      .send({ email: owner.email, password: 'password123' })
      .expect(401);

    await request(app)
      .get('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .expect(403)
      .expect(({ body }) => expect(body.code).toBe('USER_INACTIVE'));

    await prisma.$executeRawUnsafe('UPDATE "users" SET "is_active" = true WHERE id = $1', owner.id);
    const inactiveMember = await prisma.user.create({
      data: {
        id: 'inactive-agent',
        tenantId: 'tenant-a',
        email: 'inactive-agent@example.test',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'agent',
        emailVerified: true
      }
    });
    await prisma.$executeRawUnsafe('UPDATE "users" SET "is_active" = false WHERE id = $1', inactiveMember.id);

    const team = await request(app)
      .get('/api/team')
      .set('Authorization', `Bearer ${auth}`)
      .expect(200);

    expect(team.body.users.map((user) => user.id)).not.toContain('inactive-agent');
  });

  it('runtime flags honor tenant mode plus both kill switches', () => {
    const { resolveAgentRuntimeMode, areAgentMutationsEnabled } = require('../../../src/agents/runtime/runtimeFlags');
    const previousRuntime = process.env.AGENT_RUNTIME_KILL_SWITCH;
    const previousMutations = process.env.AGENT_MUTATIONS_KILL_SWITCH;

    try {
      delete process.env.AGENT_RUNTIME_KILL_SWITCH;
      delete process.env.AGENT_MUTATIONS_KILL_SWITCH;
      expect(resolveAgentRuntimeMode({ agentRuntimeMode: 'v2' })).toBe('v2');
      expect(resolveAgentRuntimeMode({ agentRuntimeMode: 'shadow' })).toBe('shadow');

      process.env.AGENT_RUNTIME_KILL_SWITCH = 'true';
      expect(resolveAgentRuntimeMode({ agentRuntimeMode: 'v2' })).toBe('legacy');

      expect(areAgentMutationsEnabled()).toBe(true);
      process.env.AGENT_MUTATIONS_KILL_SWITCH = 'true';
      expect(areAgentMutationsEnabled()).toBe(false);
    } finally {
      if (previousRuntime === undefined) delete process.env.AGENT_RUNTIME_KILL_SWITCH;
      else process.env.AGENT_RUNTIME_KILL_SWITCH = previousRuntime;
      if (previousMutations === undefined) delete process.env.AGENT_MUTATIONS_KILL_SWITCH;
      else process.env.AGENT_MUTATIONS_KILL_SWITCH = previousMutations;
    }
  });

  it('documents migration-copy safeguards and legacy vector declaration', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const script = fs.readFileSync(path.join(__dirname, '../../../scripts/verify-migration-on-copy.js'), 'utf8');
    const schema = fs.readFileSync(path.join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
    const migration = fs.readFileSync(path.join(__dirname, '../../../prisma/migrations/20260805000000_expand_agent_platform/migration.sql'), 'utf8');

    expect(script).toContain('valuewats_agent_migration_test');
    expect(script).toContain('valuewats_agent_pre_migration_test');
    expect(script).toContain('pg_dump');
    expect(script).toContain('pg_restore');
    expect(schema).toContain('Unsupported("vector(1536)")');
    expect(migration).not.toMatch(/ALTER\s+TABLE\s+"AgentKnowledge"\s+ALTER\s+COLUMN\s+"embedding"/i);
  });
});
