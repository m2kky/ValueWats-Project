const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createTestDatabase, resetDatabase: resetRegisteredDatabase } = require('../../helpers/database');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const prisma = createTestDatabase(process.env.DATABASE_URL);

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
    await resetRegisteredDatabase(prisma);
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

  it('rejects template payload tenant overrides before normalization and creates no cross-tenant row', async () => {
    await request(app)
      .post('/api/agents/templates/receptionist')
      .set('Authorization', `Bearer ${auth}`)
      .send({ tenantId: 'tenant-b', name: 'Tenant escape attempt' })
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('SETUP_FIELD_NOT_ALLOWED'));

    await request(app)
      .post('/api/agents/templates/receptionist')
      .set('Authorization', `Bearer ${auth}`)
      .send({ unknownTemplateField: true })
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('SETUP_FIELD_NOT_ALLOWED'));

    expect(await prisma.aIAgent.count({ where: { tenantId: 'tenant-b' } })).toBe(0);
    expect(await prisma.aIAgent.count({ where: { name: 'Tenant escape attempt' } })).toBe(0);
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

  it('rejects raw actionConfig on create, update, and template creation', async () => {
    await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload({ actionConfig: { closeConversation: { enabled: true } } }))
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('SETUP_FIELD_NOT_ALLOWED'));

    const created = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload({ name: 'No raw action config' }))
      .expect(201);

    expect(created.body.actionConfig).toBeNull();

    await request(app)
      .put(`/api/agents/${created.body.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ expectedConfigVersion: 1, actionConfig: { closeConversation: { enabled: true } } })
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('SETUP_FIELD_NOT_ALLOWED'));

    await request(app)
      .post('/api/agents/templates/receptionist')
      .set('Authorization', `Bearer ${auth}`)
      .send({ actionConfig: { closeConversation: { enabled: true } } })
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('SETUP_FIELD_NOT_ALLOWED'));
  });

  it('preserves unmigrated legacy actionConfig while canonical actions override projected keys on update', async () => {
    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: 'tenant-a',
        name: 'Legacy config agent',
        instructions: 'Keep legacy action config safe.',
        actionConfig: {
          closeConversation: { enabled: false, instructions: 'legacy stale', config: { stale: true } },
          unmigratedCustomAction: { enabled: true, instructions: 'keep me', config: { custom: 1 } }
        }
      }
    });
    await prisma.agentAction.create({
      data: {
        agentId: agent.id,
        key: 'closeConversation',
        type: 'close_conversation',
        isEnabled: true,
        instructions: 'canonical close',
        config: { reason: 'done' }
      }
    });

    await request(app)
      .put(`/api/agents/${agent.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ expectedConfigVersion: 1, temperature: 0.9 })
      .expect(200);

    const stored = await prisma.aIAgent.findUnique({ where: { id: agent.id } });
    expect(stored.actionConfig).toMatchObject({
      closeConversation: { enabled: true, instructions: 'canonical close', config: { reason: 'done' } },
      unmigratedCustomAction: { enabled: true, instructions: 'keep me', config: { custom: 1 } }
    });
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

  it('returns stale-version conflicts before lifecycle open-conversation checks on update', async () => {
    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: 'tenant-a',
        name: 'Precedence agent',
        instructions: 'Check stale precedence.',
        isActive: true,
        isPublished: true,
        configVersion: 2
      }
    });
    await prisma.$executeRawUnsafe(
      'INSERT INTO "conversations" (id, tenant_id, channel_type, contact_number, unread_count, status, "currentAgentId", "created_at", "updated_at", assignment_version) VALUES ($1, $2, $3, $4, 0, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)',
      'open-precedence-conversation',
      'tenant-a',
      'whatsapp',
      '+15550123000',
      'open',
      agent.id
    );

    await request(app)
      .put(`/api/agents/${agent.id}`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ expectedConfigVersion: 1, isActive: false })
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

  it('allows permission checks to use the fresh active database role instead of the JWT role', async () => {
    const staleRoleToken = jwt.sign({
      userId: owner.id,
      email: 'stale@example.test',
      role: 'agent',
      isSuperAdmin: false,
      tenantId: owner.tenantId
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${staleRoleToken}`)
      .send(validAgentPayload({ name: 'Fresh role agent' }))
      .expect(201);
  });

  it('commits exactly one concurrent update for the same expected config version', async () => {
    const created = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${auth}`)
      .send(validAgentPayload())
      .expect(201);

    const updates = await Promise.all([
      request(app)
        .put(`/api/agents/${created.body.id}`)
        .set('Authorization', `Bearer ${auth}`)
        .send({ expectedConfigVersion: 1, temperature: 0.5 }),
      request(app)
        .put(`/api/agents/${created.body.id}`)
        .set('Authorization', `Bearer ${auth}`)
        .send({ expectedConfigVersion: 1, temperature: 1.5 })
    ]);

    const statuses = updates.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 409]);
    const conflict = updates.find((response) => response.status === 409);
    expect(conflict.body.code).toBe('CONFIG_VERSION_CONFLICT');
    const stored = await prisma.aIAgent.findUnique({ where: { id: created.body.id } });
    expect(stored.configVersion).toBe(2);
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

  it('excludes soft-deleted agents from test chat lookup', async () => {
    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: 'tenant-a',
        name: 'Deleted test agent',
        instructions: 'Do not test deleted agents.',
        deletedAt: new Date(),
        isActive: false,
        isPublished: false
      }
    });

    await request(app)
      .post(`/api/agents/${agent.id}/test`)
      .set('Authorization', `Bearer ${auth}`)
      .send({ message: 'hello' })
      .expect(404);
  });

  it('documents migration-copy safeguards and legacy vector declaration', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const script = fs.readFileSync(path.join(__dirname, '../../../scripts/verify-migration-on-copy.js'), 'utf8');
    const schema = fs.readFileSync(path.join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
    const migration = fs.readFileSync(path.join(__dirname, '../../../prisma/migrations/20260805000000_expand_agent_platform/migration.sql'), 'utf8');

    expect(script).toContain('valuewats_agent_migration_test');
    expect(script).toContain('valuewats_agent_pre_migration_test');
    expect(script).toContain('verifyTask2Schema');
    expect(script).toContain('vector(1536)');
    expect(script).toContain('pg_dump');
    expect(script).toContain('pg_restore');
    expect(schema).toContain('Unsupported("vector(768)")');
    expect(migration).not.toMatch(/ALTER\s+TABLE\s+"AgentKnowledge"\s+ALTER\s+COLUMN\s+"embedding"/i);
  });
});
