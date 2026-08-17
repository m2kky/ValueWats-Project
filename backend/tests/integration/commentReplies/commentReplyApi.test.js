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
      { id: 'agent-a', tenantId: 'tenant-a', name: 'Price Agent', isActive: true, isPublished: true, deletedAt: null },
      { id: 'agent-b', tenantId: 'tenant-b', name: 'Other Tenant Agent', deletedAt: null },
      { id: 'agent-empty', tenantId: 'tenant-a', name: 'Unconfigured Agent', deletedAt: null }
    ],
    profiles: [{ id: 'profile-a', tenantId: 'tenant-a', agentId: 'agent-a', isEnabled: false, aiFallbackEnabled: false, aiMode: 'rules_only', commentAiInstructions: '', privateReplyEnabled: false, privateReplyInstructions: '', publicAfterPrivateSuccess: true, defaultMatchMode: 'contains_any', configVersion: 1, deletedAt: null }],
    instances: [
      { id: 'instance-a', tenantId: 'tenant-a', channelType: 'messenger', instanceName: 'Main Page', phoneNumberId: 'page-a', accessToken: 'secret-token', status: 'connected' },
      { id: 'instance-private', tenantId: 'tenant-a', channelType: 'instagram', instanceName: 'Private Replies', phoneNumberId: 'ig-a', accessToken: 'private-token', status: 'connected' },
      { id: 'instance-b', tenantId: 'tenant-b', channelType: 'messenger', instanceName: 'Other Page', phoneNumberId: 'page-b', accessToken: 'other-token', status: 'connected' }
    ],
    bindings: [], rules: [], variants: [], overrides: []
  };
  const calls = { agentFinds: [], profileCreates: 0, profileUpdates: 0 };
  const faults = { profileCreate: null };
  let sequence = 0;
  const id = (prefix) => `${prefix}-${++sequence}`;
  const decorateRule = (rule) => ({ ...rule, variants: rows.variants.filter((variant) => variant.ruleId === rule.id && variant.deletedAt == null) });

  const prisma = {
    $transaction: async (callback) => callback(prisma),
    aIAgent: {
      findFirst: async ({ where }) => {
        calls.agentFinds.push(clone(where));
        return clone(rows.agents.find((row) => matches(row, where)) || null);
      }
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
        calls.profileCreates += 1;
        if (faults.profileCreate) throw faults.profileCreate;
        const row = { id: id('profile'), isEnabled: false, aiFallbackEnabled: false, defaultMatchMode: 'contains_any', configVersion: 1, deletedAt: null, ...data };
        rows.profiles.push(row);
        return clone(row);
      },
      updateMany: async ({ where, data }) => {
        calls.profileUpdates += 1;
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
        rows.overrides = rows.overrides.filter((row) => {
          if (where.binding?.profileId) {
            const binding = rows.bindings.find((candidate) => candidate.id === row.bindingId);
            if (binding?.profileId !== where.binding.profileId) return true;
          }
          const { binding, ...directWhere } = where;
          return !matches(row, directWhere);
        });
        return { count: before - rows.overrides.length };
      }
    }
  };
  return { prisma, rows, calls, faults };
}

function applyData(row, data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value?.increment != null ? row[key] + value.increment : value]));
}

function createTestApp({ prisma, privateReplyInstances = [], readyInstances = [], decisionService } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.tenantId = req.get('x-tenant-id') || 'tenant-a';
    req.user = { tenantId: req.tenantId, role: req.get('x-role') || 'owner' };
    next();
  });
  app.use('/api', createCommentReplyRouter({
    prisma,
    getChannelConfig: async ({ instanceId }) => ({
      privateReplies: { enabled: privateReplyInstances.includes(instanceId) },
      commentReplies: {
        permissionsReady: readyInstances.includes(instanceId),
        checkedAt: '2026-07-27T12:00:00.000Z'
      }
    }),
    decisionService
  }));
  return app;
}

describe('Comment Reply configuration API', () => {
  let app;
  let prisma;
  let rows;
  let calls;
  let faults;

  beforeEach(() => {
    ({ prisma, rows, calls, faults } = createPrismaFixture());
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

  it('persists explicit AI settings and previews without creating operational records', async () => {
    const decisionService = {
      decide: vi.fn().mockResolvedValue({
        action: 'reply_and_dm',
        publicReply: 'Check your inbox.',
        privateReply: 'Welcome! Which grade?',
        reasonCode: 'admissions_question'
      })
    };
    app = createTestApp({ prisma, readyInstances: ['instance-a'], decisionService });
    await request(app).post('/api/agents/agent-a/comment-replies/bindings')
      .send({ expectedConfigVersion: 1, instanceId: 'instance-a', isEnabled: true })
      .expect(201);
    const updated = await request(app).put('/api/agents/agent-a/comment-replies')
      .send({
        expectedConfigVersion: 2,
        aiMode: 'ai_only',
        commentAiInstructions: 'Answer admissions questions.',
        privateReplyEnabled: true,
        privateReplyInstructions: 'Collect the grade.',
        publicAfterPrivateSuccess: true
      })
      .expect(200);
    expect(updated.body.profile).toEqual(expect.objectContaining({
      aiMode: 'ai_only', privateReplyEnabled: true, publicAfterPrivateSuccess: true
    }));
    const before = clone({ profiles: rows.profiles.length, bindings: rows.bindings.length, rules: rows.rules.length });
    const preview = await request(app).post('/api/agents/agent-a/comment-replies/preview')
      .send({ platform: 'facebook', commentText: 'How can I apply?', instanceId: 'instance-a', postName: 'Admissions' })
      .expect(200);

    expect(preview.body).toEqual(expect.objectContaining({
      route: 'ai',
      agent: { id: 'agent-a', name: 'Price Agent' },
      decision: expect.objectContaining({ action: 'reply_and_dm' })
    }));
    expect(decisionService.decide).toHaveBeenCalledOnce();
    expect({ profiles: rows.profiles.length, bindings: rows.bindings.length, rules: rows.rules.length }).toEqual(before);
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

  it('rejects a private-DM channel even when the requested binding is disabled', async () => {
    await request(app).post('/api/agents/agent-a/comment-replies/bindings')
      .send({ expectedConfigVersion: 1, instanceId: 'instance-private', isEnabled: false })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('PRIVATE_REPLIES_ENABLED'));
  });

  it('marks a binding ready only after the channel permission check passed', async () => {
    app = createTestApp({ prisma, readyInstances: ['instance-a'] });
    await request(app).post('/api/agents/agent-a/comment-replies/bindings')
      .send({ expectedConfigVersion: 1, instanceId: 'instance-a', isEnabled: true })
      .expect(201)
      .expect(({ body }) => {
        expect(body.permissionState).toBe('ready');
        expect(body.lastPermissionCheckAt).toBe('2026-07-27T12:00:00.000Z');
      });
  });

  it('uses tenant and route IDs instead of hostile body identity fields for mutations', async () => {
    rows.profiles.push({ id: 'profile-b', tenantId: 'tenant-b', agentId: 'agent-b', isEnabled: false, aiFallbackEnabled: false, defaultMatchMode: 'contains_any', configVersion: 1, deletedAt: null });
    rows.rules.push(
      { id: 'rule-a', tenantId: 'tenant-a', profileId: 'profile-a', name: 'A', isEnabled: false, priority: 1, matchMode: 'contains_any', keywords: ['a'], deletedAt: null },
      { id: 'rule-b', tenantId: 'tenant-b', profileId: 'profile-b', name: 'B', isEnabled: false, priority: 1, matchMode: 'contains_any', keywords: ['b'], deletedAt: null }
    );
    rows.bindings.push(
      { id: 'binding-a', tenantId: 'tenant-a', profileId: 'profile-a', instanceId: 'instance-a', provider: 'facebook', externalAccountId: 'page-a', isEnabled: false },
      { id: 'binding-b', tenantId: 'tenant-b', profileId: 'profile-b', instanceId: 'instance-b', provider: 'facebook', externalAccountId: 'page-b', isEnabled: false }
    );
    rows.overrides.push(
      { id: 'override-a', tenantId: 'tenant-a', bindingId: 'binding-a', externalPostId: 'post-a', mode: 'inherit' },
      { id: 'override-b', tenantId: 'tenant-b', bindingId: 'binding-b', externalPostId: 'post-b', mode: 'inherit' }
    );
    const hostile = {
      tenantId: 'tenant-b', agentId: 'agent-b', profileId: 'profile-b', ruleId: 'rule-b', bindingId: 'binding-b', overrideId: 'override-b'
    };

    await request(app).delete('/api/agents/agent-a/comment-replies/rules/rule-a')
      .send({ expectedConfigVersion: 1, ...hostile })
      .expect(200);
    expect(rows.rules.find((rule) => rule.id === 'rule-a').deletedAt).toEqual(expect.anything());
    expect(rows.rules.find((rule) => rule.id === 'rule-b').deletedAt).toBeNull();

    await request(app).delete('/api/agents/agent-a/comment-replies/overrides/override-a')
      .send({ expectedConfigVersion: 2, ...hostile })
      .expect(200);
    expect(rows.overrides.some((override) => override.id === 'override-a')).toBe(false);
    expect(rows.overrides.some((override) => override.id === 'override-b')).toBe(true);

    await request(app).delete('/api/agents/agent-a/comment-replies/bindings/binding-a')
      .send({ expectedConfigVersion: 3, ...hostile })
      .expect(200);
    expect(rows.bindings.some((binding) => binding.id === 'binding-a')).toBe(false);
    expect(rows.bindings.some((binding) => binding.id === 'binding-b')).toBe(true);
    expect(calls.agentFinds).toEqual([
      { id: 'agent-a', tenantId: 'tenant-a', deletedAt: null },
      { id: 'agent-a', tenantId: 'tenant-a', deletedAt: null },
      { id: 'agent-a', tenantId: 'tenant-a', deletedAt: null }
    ]);
  });

  it('keeps workspace reads write-free and creates the initial profile only on version zero update', async () => {
    await request(app).get('/api/agents/agent-empty/comment-replies')
      .expect(200)
      .expect(({ body }) => expect(body).toEqual(expect.objectContaining({
        profile: expect.objectContaining({ id: null, agentId: 'agent-empty', isEnabled: false, configVersion: 0 }),
        bindings: [], rules: [], overrides: [], configVersion: 0
      })));
    await request(app).get('/api/agents/agent-empty/comment-replies/rules').expect(200);
    await request(app).get('/api/agents/agent-empty/comment-replies/overrides').expect(200);
    expect(calls.profileCreates).toBe(0);
    expect(calls.profileUpdates).toBe(0);

    const created = await request(app).put('/api/agents/agent-empty/comment-replies')
      .send({ expectedConfigVersion: 0, isEnabled: true })
      .expect(200);
    expect(created.body).toEqual(expect.objectContaining({ configVersion: 1, profile: expect.objectContaining({ configVersion: 1, isEnabled: true }) }));
    expect(calls.profileCreates).toBe(1);
  });

  it('requires a persisted profile for non-profile mutations', async () => {
    await request(app).post('/api/agents/agent-empty/comment-replies/rules')
      .send({ expectedConfigVersion: 0, name: 'Price', priority: 1, keywords: ['price'], variants: ['Ask our store'] })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('CONFIG_VERSION_CONFLICT'));
    expect(calls.profileCreates).toBe(0);
  });

  it('maps an initial profile unique conflict to the stable config conflict response', async () => {
    const error = new Error('Unique constraint failed');
    error.code = 'P2002';
    faults.profileCreate = error;

    await request(app).put('/api/agents/agent-empty/comment-replies')
      .send({ expectedConfigVersion: 0, isEnabled: true })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe('CONFIG_VERSION_CONFLICT'));
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
