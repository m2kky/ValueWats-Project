const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const {
  createTestDatabase,
  resetDatabase
} = require('../../helpers/database');
const {
  createAgentCapabilityService,
  normalizeCapabilities
} = require('../../../src/agents/config/agentCapabilityService');

const prisma = createTestDatabase(process.env.DATABASE_URL);
const service = createAgentCapabilityService({ prisma });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

let app;

function tokenFor(user) {
  return jwt.sign({ userId: user.id, tenantId: user.tenantId }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
}

async function createTenantAgentAndIntegration() {
  const tenant = await prisma.tenant.create({
    data: { name: 'Store Capability Tenant', email: 'store-capability@example.test' }
  });
  const agent = await prisma.aIAgent.create({
    data: {
      tenantId: tenant.id,
      name: 'Store Capability Agent',
      instructions: 'Answer product questions.'
    }
  });
  const integration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: 'store_salla',
      name: 'Salla Store',
      credentials: 'store:v1:test',
      status: 'active'
    }
  });
  return { tenant, agent, integration };
}

describe('Store capability normalization', () => {
  it('normalizes enabled and disabled Store settings to canonical persistence values', () => {
    expect(normalizeCapabilities({
      store: {
        enabled: true,
        integrationId: ' integration-1 ',
        instructions: ' Check Store. ',
        maxResults: 4
      }
    }).store_catalog_read).toEqual({
      isEnabled: true,
      integrationId: 'integration-1',
      instructions: 'Check Store.',
      config: { maxResults: 4 }
    });
    expect(normalizeCapabilities({
      store: {
        enabled: false,
        integrationId: 'integration-1',
        instructions: 'Ignore this.',
        maxResults: 1
      }
    }).store_catalog_read).toEqual({
      isEnabled: false,
      integrationId: null,
      instructions: '',
      config: { maxResults: 5 }
    });
  });

  it.each([0, 6, 1.5])('rejects invalid enabled maxResults %s without persistence', (maxResults) => {
    expect(() => normalizeCapabilities({ store: { enabled: true, maxResults } }))
      .toThrow(expect.objectContaining({ code: 'CAPABILITY_CONFIG_INVALID' }));
  });
});

describe('Store capability setup', () => {
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/agents', require('../../../src/agents/agent.routes'));
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('stores one tenant-owned Salla connection as a canonical Store capability', async () => {
    const { tenant, agent, integration } = await createTenantAgentAndIntegration();

    const updated = await service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: {
        store: {
          enabled: true,
          integrationId: integration.id,
          instructions: 'Check the store for product questions.',
          maxResults: 5
        }
      }
    });

    expect(updated.configVersion).toBe(2);
    expect(updated.actions.filter((row) => row.key === 'store_catalog_read')).toHaveLength(1);
    expect(updated.actions.find((row) => row.key === 'store_catalog_read')).toMatchObject({
      type: 'store_catalog_read',
      integrationId: integration.id,
      isEnabled: true,
      instructions: 'Check the store for product questions.',
      config: { maxResults: 5 }
    });
    expect(updated.actionConfig.store).toEqual({
      enabled: true,
      instructions: 'Check the store for product questions.',
      config: { maxResults: 5 }
    });
  });

  it.each([
    ['foreign', async ({ integration }) => {
      const foreignTenant = await prisma.tenant.create({
        data: { name: 'Foreign Store Tenant', email: 'foreign-store@example.test' }
      });
      return prisma.integration.update({
        where: { id: integration.id },
        data: { tenantId: foreignTenant.id }
      });
    }],
    ['inactive', async ({ integration }) => prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'revoked' }
    })],
    ['non-store', async ({ integration }) => prisma.integration.update({
      where: { id: integration.id },
      data: { type: 'google_sheets' }
    })],
    ['missing', async () => ({ id: 'missing-store-integration' })]
  ])('rejects a %s integration', async (_label, integrationForCase) => {
    const context = await createTenantAgentAndIntegration();
    const integration = await integrationForCase(context);

    await expect(service.update({
      tenantId: context.tenant.id,
      agentId: context.agent.id,
      expectedConfigVersion: 1,
      capabilities: {
        store: { enabled: true, integrationId: integration.id, maxResults: 5 }
      }
    })).rejects.toMatchObject({ code: 'CAPABILITY_INTEGRATION_INVALID' });

    expect(await prisma.agentAction.count({ where: { agentId: context.agent.id } })).toBe(0);
    expect((await prisma.aIAgent.findUnique({ where: { id: context.agent.id } })).configVersion).toBe(1);
  });

  it('persists disabled Store with no integration and default config', async () => {
    const { tenant, agent, integration } = await createTenantAgentAndIntegration();

    const updated = await service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: {
        store: {
          enabled: false,
          integrationId: integration.id,
          instructions: 'Ignore this when disabled.',
          maxResults: 1
        }
      }
    });

    expect(updated.actions.find((row) => row.key === 'store_catalog_read')).toMatchObject({
      integrationId: null,
      isEnabled: false,
      instructions: '',
      config: { maxResults: 5 }
    });
  });

  it.each([0, 6, 1.5])('rejects invalid enabled maxResults %s', async (maxResults) => {
    const { tenant, agent, integration } = await createTenantAgentAndIntegration();

    await expect(service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: {
        store: { enabled: true, integrationId: integration.id, maxResults }
      }
    })).rejects.toMatchObject({ code: 'CAPABILITY_CONFIG_INVALID' });
  });

  it('fails closed when the canonical Store capability is duplicated', async () => {
    const { tenant, agent, integration } = await createTenantAgentAndIntegration();
    await prisma.agentAction.createMany({
      data: [1, 2].map(() => ({
        agentId: agent.id,
        key: 'store_catalog_read',
        type: 'store_catalog_read',
        integrationId: integration.id,
        isEnabled: true,
        instructions: '',
        config: { maxResults: 5 }
      }))
    });

    await expect(service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: { store: { enabled: true, integrationId: integration.id, maxResults: 5 } }
    })).rejects.toMatchObject({ code: 'CAPABILITY_DUPLICATE' });

    expect((await prisma.aIAgent.findUnique({ where: { id: agent.id } })).configVersion).toBe(1);
  });

  it('uses the preferred and terminal endpoints with agents.manage without duplicating Store', async () => {
    const { tenant, agent, integration } = await createTenantAgentAndIntegration();
    const [owner, restricted] = await Promise.all([
      prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'store-owner@example.test',
          passwordHash: 'unused',
          role: 'owner',
          emailVerified: true
        }
      }),
      prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'store-agent@example.test',
          passwordHash: 'unused',
          role: 'agent',
          emailVerified: true
        }
      })
    ]);
    const capabilities = {
      store: { enabled: true, integrationId: integration.id, maxResults: 5 }
    };

    await request(app)
      .put(`/api/agents/${agent.id}/capabilities`)
      .set('Authorization', `Bearer ${tokenFor(owner)}`)
      .send({ expectedConfigVersion: 1, capabilities })
      .expect(200)
      .expect(({ body }) => expect(body.configVersion).toBe(2));

    await request(app)
      .put(`/api/agents/${agent.id}/terminal-capabilities`)
      .set('Authorization', `Bearer ${tokenFor(owner)}`)
      .send({ expectedConfigVersion: 2, capabilities })
      .expect(200)
      .expect(({ body }) => expect(body.configVersion).toBe(3));

    await request(app)
      .put(`/api/agents/${agent.id}/capabilities`)
      .set('Authorization', `Bearer ${tokenFor(restricted)}`)
      .send({ expectedConfigVersion: 3, capabilities })
      .expect(403);

    expect(await prisma.agentAction.count({
      where: { agentId: agent.id, key: 'store_catalog_read' }
    })).toBe(1);
    expect((await prisma.aIAgent.findUnique({ where: { id: agent.id } })).configVersion).toBe(3);
  });
});
