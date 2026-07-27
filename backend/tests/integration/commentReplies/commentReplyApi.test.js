const express = require('express');
const request = require('supertest');
const { createApp } = require('../../../src/app');
const { createCommentReplyRouter } = require('../../../src/commentReplies/commentReply.routes');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('not' in value) return row[key] !== value.not;
      return false;
    }
    return row[key] === value;
  });
}

function createPrismaFixture() {
  const rows = {
    agents: [
      { id: 'agent-a', tenantId: 'tenant-a', name: 'Price Agent', deletedAt: null },
      { id: 'agent-b', tenantId: 'tenant-b', name: 'Other Tenant Agent', deletedAt: null }
    ],
    profiles: [{ id: 'profile-a', tenantId: 'tenant-a', agentId: 'agent-a', isEnabled: false, aiFallbackEnabled: false, defaultMatchMode: 'contains_any', configVersion: 1, deletedAt: null }],
    instances: [
      { id: 'instance-a', tenantId: 'tenant-a', channelType: 'messenger', instanceName: 'Main Page', phoneNumberId: 'page-a', accessToken: 'secret-token', status: 'connected' },
      { id: 'instance-private', tenantId: 'tenant-a', channelType: 'instagram', instanceName: 'Private Replies', phoneNumberId: 'ig-a', accessToken: 'private-token', status: 'connected' },
      { id: 'instance-b', tenantId: 'tenant-b', channelType: 'messenger', instanceName: 'Other Page', phoneNumberId: 'page-b', accessToken: 'other-token', status: 'connected' }
    ],
    bindings: [], rules: [], variants: [], overrides: []
  };
  let sequence = 0;
  const id = (prefix) => `${prefix}-${++sequence}`;
  const decorateRule = (rule) => ({ ...rule, variants: rows.variants.filter((variant) => variant.ruleId === rule.id && variant.deletedAt == null) });

  const prisma = {
    $transaction: async (callback) => callback(prisma),
    aIAgent: {
      findFirst: async ({ where }) => clone(rows.agents.find((row) => matches(row, where)) || null)
    },
    instance: {
      findFirst: async ({ where }) => clone(rows.instances.find((row) => matches(row, where)) || null)
    },
    commentReplyProfile: {
      findFirst: async ({ where, include }) => {
        const profile = rows.profiles.find((row) => matches(row, where));
        if (!profile) return null;
        const result = { ...profile };
        if (include?.agent) result.agent = rows.agents.find((agent) => agent.id === profile.agentId);
        if (include?.bindings) result.bindings = rows.bindings.filter((binding) => binding.profileId === profile.id).map((binding) => ({ ...binding, instance: rows.instances.find((instance) => instance.id === binding.instanceId) }));
        return clone(result);
      },
      create: async ({ data }) => {
        const row = { id: id('profile'), isEnabled: false, aiFallbackEnabled: false, defaultMatchMode: 'contains_any', configVersion: 1, deletedAt: null, ...data };
        rows.profiles.push(row);
        return clone(row);
      },
      updateMany: async ({ where, data }) => {
        const found = rows.profiles.filter((row) => matches(row, where));
        found.forEach((row) => Object.assign(row, applyData(row, data)));
        return { count: found.length };
      }
    },
    commentChannelBinding: {
      findMany: async ({ where }) => clone(rows.bindings.filter((row) => matches(row, where))),
      findFirst: async ({ where, include }) => {
        const binding = rows.bindings.find((row) => matches(row, where));
        if (!binding) return null;
        return clone(include?.instance ? { ...binding, instance: rows.instances.find((instance) => instance.id === binding.instanceId) } : binding);
      },
      create: async ({ data }) => {
        if (rows.bindings.some((row) => row.provider === data.provider && row.externalAccountId === data.externalAccountId)) {
          const error = new Error('Unique constraint'); error.code = 'P2002'; throw error;
        }
        const row = { id: id('binding'), isEnabled: false, permissionState: 'unknown', lastPermissionCheckAt: null, ...data };
        rows.bindings.push(row);
        return clone({ ...row, instance: rows.instances.find((instance) => instance.id === row.instanceId) });
      },
      deleteMany: async ({ where }) => {
        const before = rows.bindings.length;
        rows.bindings = rows.bindings.filter((row) => !matches(row, where));
        return { count: before - rows.bindings.length };
      }
    },
    commentReplyRule: {
      findMany: async ({ where }) => clone(rows.rules.filter((row) => matches(row, where)).map(decorateRule)),
      findFirst: async ({ where }) => clone((rows.rules.find((row) => matches(row, where)) && decorateRule(rows.rules.find((row) => matches(row, where)))) || null),
      create: async ({ data }) => {
        const row = { id: id('rule'), isEnabled: false, deletedAt: null, ...data };
        rows.rules.push(row);
        return clone(decorateRule(row));
      },
      updateMany: async ({ where, data }) => {
        const found = rows.rules.filter((row) => matches(row, where));
        found.forEach((row) => Object.assign(row, applyData(row, data)));
        return { count: found.length };
      }
    },
    commentReplyVariant: {
      updateMany: async ({ where, data }) => {
        const found = rows.variants.filter((row) => matches(row, where));
        found.forEach((row) => Object.assign(row, applyData(row, data)));
        return { count: found.length };
      },
      deleteMany: async ({ where }) => {
        rows.variants = rows.variants.filter((row) => !matches(row, where));
        return { count: 1 };
      },
      createMany: async ({ data }) => { rows.variants.push(...data.map((row) => ({ id: id('variant'), deletedAt: null, isEnabled: true, ...row }))); return { count: data.length }; }
    },
    commentPostOverride: {
      findMany: async ({ where }) => clone(rows.overrides.filter((row) => matches(row, where))),
      findFirst: async ({ where }) => clone(rows.overrides.find((row) => matches(row, where)) || null),
      upsert: async ({ where, create, update }) => {
        let row = rows.overrides.find((candidate) => candidate.tenantId_bindingId_externalPostId && false);
        row = rows.overrides.find((candidate) => candidate.tenantId === where.tenantId_bindingId_externalPostId.tenantId && candidate.bindingId === where.tenantId_bindingId_externalPostId.bindingId && candidate.externalPostId === where.tenantId_bindingId_externalPostId.externalPostId);
        if (row) Object.assign(row, update); else { row = { id: id('override'), ...create }; rows.overrides.push(row); }
        return clone(row);
      },
      deleteMany: async ({ where }) => {
        const before = rows.overrides.length;
        rows.overrides = rows.overrides.filter((row) => !matches(row, where));
        return { count: before - rows.overrides.length };
      }
    }
  };
  return { prisma, rows };
}

function applyData(row, data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value?.increment != null ? row[key] + value.increment : value]));
}

function createTestApp({ prisma, privateReplyInstances = [] }) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.tenantId = req.get('x-tenant-id') || 'tenant-a';
    req.user = { tenantId: req.tenantId, role: req.get('x-role') || 'owner' };
    next();
  });
  app.use('/api', createCommentReplyRouter({
    prisma,
    getChannelConfig: async ({ instanceId }) => ({ privateReplies: { enabled: privateReplyInstances.includes(instanceId) } })
  }));
  return app;
}

describe('Comment Reply configuration API', () => {
  let app;
  let prisma;

  beforeEach(() => {
    ({ prisma } = createPrismaFixture());
    app = createTestApp({ prisma, privateReplyInstances: ['instance-private'] });
  });

  it('requires agents.manage for rule mutations', async () => {
    await request(app).post('/api/agents/agent-a/comment-replies/rules')
      .set('x-role', 'agent')
      .send({ expectedConfigVersion: 1, name: 'Price', priority: 1, keywords: ['price'], variants: ['Ask our store'] })
      .expect(403);
  });

  it('rejects stale config versions', async () => {
    const response = await request(app).put('/api/agents/agent-a/comment-replies')
      .send({ expectedConfigVersion: 0, isEnabled: true })
      .expect(409);
    expect(response.body.code).toBe('CONFIG_VERSION_CONFLICT');
  });

  it('returns a minimal workspace and never serializes an instance access token', async () => {
    const binding = await request(app).post('/api/agents/agent-a/comment-replies/bindings')
      .send({ expectedConfigVersion: 1, instanceId: 'instance-a', isEnabled: true })
      .expect(201);

    expect(binding.body.instance).toEqual(expect.objectContaining({ id: 'instance-a', channelType: 'messenger', instanceName: 'Main Page' }));
    expect(binding.body.instance.accessToken).toBeUndefined();
    const workspace = await request(app).get('/api/agents/agent-a/comment-replies').expect(200);
    expect(workspace.body).toEqual(expect.objectContaining({ agent: { id: 'agent-a', name: 'Price Agent' }, profile: expect.any(Object), bindings: expect.any(Array), configVersion: 2 }));
  });

  it('tenant-scopes agent and instance reads', async () => {
    await request(app).get('/api/agents/agent-b/comment-replies').expect(404);
    await request(app).get('/api/instances/instance-b/comment-reply-binding').expect(404);
  });

  it('mounts both agent and instance endpoints through the application DI path', async () => {
    const mounted = createApp({
      routes: {
        commentReplies: ({ prisma: injectedPrisma }) => createCommentReplyRouter({
          prisma: injectedPrisma,
          getChannelConfig: async () => ({ privateReplies: { enabled: false } })
        })
      },
      middleware: {
        tenantContext: (req, res, next) => {
          req.tenantId = 'tenant-a';
          req.user = { tenantId: 'tenant-a', role: 'owner' };
          next();
        }
      },
      dependencies: { prisma }
    });

    await request(mounted).get('/api/agents/agent-a/comment-replies').expect(200);
    await request(mounted).get('/api/instances/instance-a/comment-reply-binding').expect(404);
  });

  it('rejects unsupported channels and enabled private DM replies when binding', async () => {
    await request(app).post('/api/agents/agent-a/comment-replies/bindings')
      .send({ expectedConfigVersion: 1, instanceId: 'instance-a', provider: 'instagram' })
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('COMMENT_REPLY_INVALID_BINDING'));

    await request(app).post('/api/agents/agent-a/comment-replies/bindings')
      .send({ expectedConfigVersion: 1, instanceId: 'instance-private', isEnabled: true })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('PRIVATE_REPLIES_ENABLED'));
  });

  it('validates and persists rule variants and post overrides under one config version', async () => {
    await request(app).post('/api/agents/agent-a/comment-replies/rules')
      .send({ expectedConfigVersion: 1, name: 'Empty', priority: 1, keywords: [], variants: [] })
      .expect(400)
      .expect(({ body }) => expect(body.code).toBe('COMMENT_REPLY_VALIDATION_FAILED'));

    const binding = await request(app).post('/api/agents/agent-a/comment-replies/bindings')
      .send({ expectedConfigVersion: 1, instanceId: 'instance-a' })
      .expect(201);
    const rule = await request(app).post('/api/agents/agent-a/comment-replies/rules')
      .send({ expectedConfigVersion: 2, name: 'Price', priority: 1, keywords: ['price'], variants: ['Ask our store', { platform: 'instagram', body: 'Send us a DM' }] })
      .expect(201);
    expect(rule.body.variants).toHaveLength(2);

    const override = await request(app).post('/api/agents/agent-a/comment-replies/overrides')
      .send({ expectedConfigVersion: 3, bindingId: binding.body.id, externalPostId: 'post-1', mode: 'disabled', postName: 'Launch post' })
      .expect(200);
    expect(override.body).toEqual(expect.objectContaining({ externalPostId: 'post-1', mode: 'disabled' }));
  });
});
