const { createOutboxService } = require('../../../src/events/outboxService');
const { createCommentReplyRuntime } = require('../../../src/commentReplies/commentReplyRuntime');
const { createCommentReplyWorker } = require('../../../src/commentReplies/commentReplyWorker');

function clone(value) {
  return structuredClone(value);
}

function matches(row, where = {}) {
  return Object.entries(where).every(([field, expected]) => {
    const actual = row[field];
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      if ('lte' in expected && !(actual <= expected.lte)) return false;
      if ('lt' in expected && !(actual < expected.lt)) return false;
      if ('gte' in expected && !(actual >= expected.gte)) return false;
      if ('in' in expected && !expected.in.includes(actual)) return false;
      if ('not' in expected && actual === expected.not) return false;
      return ['lte', 'lt', 'gte', 'in', 'not'].some((operator) => operator in expected);
    }
    return actual === expected;
  });
}

function applyData(row, data) {
  for (const [field, value] of Object.entries(data)) {
    row[field] = value && typeof value === 'object' && value.increment != null
      ? Number(row[field] || 0) + value.increment
      : value;
  }
}

function createRuntimeFixture({ decision } = {}) {
  let sequence = 0;
  let transactionDepth = 0;
  const currentTime = { value: new Date('2026-07-27T12:00:00.000Z') };
  const rows = {
    agents: [
      { id: 'agent-a', tenantId: 'tenant-a', name: 'Default Agent', isActive: true, isPublished: true, configVersion: 3, deletedAt: null },
      { id: 'agent-b', tenantId: 'tenant-a', name: 'Override Agent', isActive: true, isPublished: true, configVersion: 7, deletedAt: null }
    ],
    profiles: [
      { id: 'profile-a', tenantId: 'tenant-a', agentId: 'agent-a', isEnabled: true, aiFallbackEnabled: false, aiMode: 'rules_only', privateReplyEnabled: false, publicAfterPrivateSuccess: true, configVersion: 4, deletedAt: null }
    ],
    instances: [
      { id: 'instance-fb', tenantId: 'tenant-a', primaryAgentId: 'agent-a', channelType: 'messenger', instanceName: 'Value Page', phoneNumberId: 'page-a' },
      { id: 'instance-ig', tenantId: 'tenant-a', primaryAgentId: 'agent-a', channelType: 'instagram', instanceName: 'Value IG', phoneNumberId: 'ig-a' }
    ],
    bindings: [
      { id: 'binding-fb', tenantId: 'tenant-a', profileId: 'profile-a', instanceId: 'instance-fb', provider: 'facebook', externalAccountId: 'page-a', isEnabled: true, permissionState: 'ready' },
      { id: 'binding-ig', tenantId: 'tenant-a', profileId: 'profile-a', instanceId: 'instance-ig', provider: 'instagram', externalAccountId: 'ig-a', isEnabled: true, permissionState: 'ready' }
    ],
    overrides: [],
    rules: [{
      id: 'rule-a',
      tenantId: 'tenant-a',
      profileId: 'profile-a',
      name: 'Price',
      isEnabled: true,
      priority: 1,
      matchMode: 'contains_any',
      keywords: ['price'],
      sharedRotationCursor: 0,
      facebookRotationCursor: 0,
      instagramRotationCursor: 0,
      deletedAt: null,
      createdAt: new Date('2026-07-01T00:00:00.000Z')
    }],
    variants: [
      { id: 'variant-a', tenantId: 'tenant-a', ruleId: 'rule-a', platform: null, body: 'Hi {{customer_name}}, ask our store.', orderIndex: 0, isEnabled: true, deletedAt: null }
    ],
    executions: [],
    deliveries: [],
    outbox: []
  };
  const calls = { atomicOutboxCreates: 0, atomicReadyWrites: 0 };

  function profileWithAgent(profile) {
    return profile && {
      ...profile,
      agent: rows.agents.find((agent) => agent.id === profile.agentId) || null
    };
  }

  function bindingGraph(binding) {
    return binding && {
      ...binding,
      instance: rows.instances.find((instance) => instance.id === binding.instanceId) || null,
      profile: profileWithAgent(rows.profiles.find((profile) => profile.id === binding.profileId))
    };
  }

  function ruleGraph(rule) {
    return rule && {
      ...rule,
      variants: rows.variants.filter((variant) => variant.ruleId === rule.id)
    };
  }

  const prisma = {
    $transaction: async (callback) => {
      const snapshot = clone(rows);
      transactionDepth += 1;
      try {
        return await callback(prisma);
      } catch (error) {
        for (const key of Object.keys(rows)) rows[key].splice(0, rows[key].length, ...snapshot[key]);
        throw error;
      } finally {
        transactionDepth -= 1;
      }
    },
    commentChannelBinding: {
      findUnique: async ({ where }) => {
        const identity = where.provider_externalAccountId;
        return clone(bindingGraph(rows.bindings.find((binding) => (
          binding.provider === identity.provider && binding.externalAccountId === identity.externalAccountId
        ))) || null);
      },
      findFirst: async ({ where }) => clone(bindingGraph(rows.bindings.find((binding) => matches(binding, where))) || null)
    },
    commentPostOverride: {
      findFirst: async ({ where }) => {
        const override = rows.overrides.find((candidate) => matches(candidate, where));
        if (!override) return null;
        return clone({
          ...override,
          overrideProfile: profileWithAgent(rows.profiles.find((profile) => profile.id === override.overrideProfileId))
        });
      }
    },
    commentReplyRule: {
      findMany: async ({ where }) => clone(rows.rules.filter((rule) => matches(rule, where)).map(ruleGraph)),
      findFirst: async ({ where }) => clone(ruleGraph(rows.rules.find((rule) => matches(rule, where))) || null),
      updateMany: async ({ where, data }) => {
        const found = rows.rules.filter((rule) => matches(rule, where));
        found.forEach((rule) => applyData(rule, data));
        return { count: found.length };
      }
    },
    commentReplyExecution: {
      create: async ({ data }) => {
        if (rows.executions.some((execution) => (
          execution.platform === data.platform
          && execution.providerAccountId === data.providerAccountId
          && execution.externalCommentId === data.externalCommentId
        ))) {
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        }
        const row = {
          id: `execution-${++sequence}`,
          status: 'received',
          attempts: 0,
          availableAt: currentTime.value,
          leaseToken: null,
          leaseExpiresAt: null,
          outboxEventId: null,
          providerReplyId: null,
          receivedAt: currentTime.value,
          createdAt: currentTime.value,
          ...data
        };
        rows.executions.push(row);
        return clone(row);
      },
      findUnique: async ({ where }) => {
        if (where.id) return clone(rows.executions.find((execution) => execution.id === where.id) || null);
        const identity = where.platform_providerAccountId_externalCommentId;
        return clone(rows.executions.find((execution) => (
          execution.platform === identity.platform
          && execution.providerAccountId === identity.providerAccountId
          && execution.externalCommentId === identity.externalCommentId
        )) || null);
      },
      findFirst: async ({ where }) => clone(rows.executions.find((execution) => matches(execution, where)) || null),
      findMany: async ({ where }) => clone(rows.executions.filter((execution) => matches(execution, where))),
      updateMany: async ({ where, data }) => {
        const found = rows.executions.filter((execution) => matches(execution, where));
        found.forEach((execution) => applyData(execution, data));
        if (transactionDepth && data.status === 'ready') calls.atomicReadyWrites += found.length;
        return { count: found.length };
      }
    },
    commentReplyDelivery: {
      create: async ({ data }) => {
        if (rows.deliveries.some((delivery) => delivery.executionId === data.executionId && delivery.kind === data.kind)) {
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        }
        const row = {
          id: `delivery-${++sequence}`,
          status: 'pending', attempts: 0, availableAt: currentTime.value,
          outboxEventId: null, providerMessageId: null, createdAt: currentTime.value,
          ...data
        };
        rows.deliveries.push(row);
        return clone(row);
      },
      findUnique: async ({ where }) => clone(rows.deliveries.find((delivery) => (
        where.id ? delivery.id === where.id : (
          delivery.executionId === where.executionId_kind.executionId
          && delivery.kind === where.executionId_kind.kind
        )
      )) || null),
      updateMany: async ({ where, data }) => {
        const found = rows.deliveries.filter((delivery) => matches(delivery, where));
        found.forEach((delivery) => applyData(delivery, data));
        return { count: found.length };
      }
    },
    outboxEvent: {
      create: async ({ data }) => {
        if (rows.outbox.some((event) => event.tenantId === data.tenantId && event.idempotencyKey === data.idempotencyKey)) {
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        }
        const row = { id: `outbox-${++sequence}`, status: 'pending', attempts: 0, createdAt: currentTime.value, ...data };
        rows.outbox.push(row);
        if (transactionDepth) calls.atomicOutboxCreates += 1;
        return clone(row);
      },
      findUniqueOrThrow: async ({ where }) => {
        const identity = where.tenantId_idempotencyKey;
        const event = rows.outbox.find((candidate) => (
          candidate.tenantId === identity.tenantId && candidate.idempotencyKey === identity.idempotencyKey
        ));
        if (!event) throw new Error('Outbox not found');
        return clone(event);
      }
    }
  };

  const clock = () => currentTime.value;
  const outboxService = createOutboxService(prisma, { clock });
  const decisionService = {
    decide: vi.fn().mockResolvedValue(decision || {
      action: 'reply_only', publicReply: 'AI public reply', privateReply: null, reasonCode: 'ai_answer'
    })
  };
  const runtime = createCommentReplyRuntime({ prisma, outboxService, decisionService, clock });
  const worker = createCommentReplyWorker({ prisma, runtime, clock, leaseMs: 30_000 });

  function event(overrides = {}) {
    const platform = overrides.provider || 'facebook';
    return {
      provider: platform,
      externalAccountId: platform === 'instagram' ? 'ig-a' : 'page-a',
      externalCommentId: `comment-${++sequence}`,
      externalPostId: 'post-a',
      parentCommentId: null,
      text: 'price please',
      commenterId: 'person-a',
      commenterName: 'Mina',
      postName: 'Launch',
      createdAt: new Date('2026-07-27T11:59:00.000Z'),
      isSelf: false,
      ...overrides
    };
  }

  return { calls, clock, currentTime, decisionService, event, prisma, rows, runtime, worker };
}

describe('comment reply runtime', () => {
  it('deduplicates durably and derives tenant ownership only from the provider binding', async () => {
    const fixture = createRuntimeFixture();
    const input = fixture.event({ externalCommentId: 'same-comment', tenantId: 'tenant-hostile' });

    const first = await fixture.runtime.ingest(input);
    const duplicate = await fixture.runtime.ingest(input);

    expect(duplicate.id).toBe(first.id);
    expect(fixture.rows.executions).toHaveLength(1);
    expect(fixture.rows.executions[0]).toEqual(expect.objectContaining({
      tenantId: 'tenant-a',
      bindingId: 'binding-fb',
      instanceId: 'instance-fb',
      profileId: 'profile-a',
      agentId: 'agent-a'
    }));
  });

  it.each([
    ['self_comment', { isSelf: true }],
    ['event_too_old', { createdAt: new Date('2026-07-10T00:00:00.000Z') }],
    ['missing_text', { text: '   ' }]
  ])('fences and persists the %s eligibility skip', async (skipReason, overrides) => {
    const fixture = createRuntimeFixture();
    await fixture.runtime.ingest(fixture.event(overrides));

    await fixture.worker.runOnce();

    expect(fixture.rows.executions[0]).toEqual(expect.objectContaining({
      status: 'skipped',
      skipReason,
      leaseToken: null
    }));
    expect(fixture.rows.outbox).toHaveLength(0);
  });

  it('requires both the binding and profile to remain enabled', async () => {
    const fixture = createRuntimeFixture();
    await fixture.runtime.ingest(fixture.event());
    fixture.rows.bindings[0].isEnabled = false;
    await fixture.worker.runOnce();
    expect(fixture.rows.executions[0].skipReason).toBe('binding_disabled');

    fixture.rows.bindings[0].isEnabled = true;
    await fixture.runtime.ingest(fixture.event());
    fixture.rows.profiles[0].isEnabled = false;
    await fixture.worker.runOnce();
    expect(fixture.rows.executions[1].skipReason).toBe('profile_disabled');
    expect(fixture.rows.outbox).toHaveLength(0);
  });

  it('uses a valid post override profile and fails closed for disabled posts', async () => {
    const fixture = createRuntimeFixture();
    fixture.rows.profiles.push({
      id: 'profile-b', tenantId: 'tenant-a', agentId: 'agent-b', isEnabled: true,
      aiFallbackEnabled: false, configVersion: 8, deletedAt: null
    });
    fixture.rows.rules.push({
      id: 'rule-b', tenantId: 'tenant-a', profileId: 'profile-b', name: 'Override Price',
      isEnabled: true, priority: 1, matchMode: 'contains_any', keywords: ['price'],
      sharedRotationCursor: 0, facebookRotationCursor: 0, instagramRotationCursor: 0,
      deletedAt: null, createdAt: new Date('2026-07-02T00:00:00.000Z')
    });
    fixture.rows.variants.push({
      id: 'variant-b', tenantId: 'tenant-a', ruleId: 'rule-b', platform: null,
      body: 'Override reply', orderIndex: 0, isEnabled: true, deletedAt: null
    });
    fixture.rows.overrides.push({
      id: 'override-a', tenantId: 'tenant-a', bindingId: 'binding-fb',
      externalPostId: 'post-override', mode: 'rules_only', overrideProfileId: 'profile-b'
    });

    await fixture.runtime.ingest(fixture.event({ externalPostId: 'post-override' }));
    await fixture.worker.runOnce();
    expect(fixture.rows.executions[0]).toEqual(expect.objectContaining({
      status: 'ready',
      profileId: 'profile-b',
      agentId: 'agent-b',
      ruleId: 'rule-b'
    }));
    expect(fixture.rows.deliveries[0]).toEqual(expect.objectContaining({
      kind: 'public_reply', renderedText: 'Override reply'
    }));

    fixture.rows.overrides.push({
      id: 'override-disabled', tenantId: 'tenant-a', bindingId: 'binding-fb',
      externalPostId: 'post-disabled', mode: 'disabled', overrideProfileId: null
    });
    await fixture.runtime.ingest(fixture.event({ externalPostId: 'post-disabled' }));
    await fixture.worker.runOnce();
    expect(fixture.rows.executions[1]).toEqual(expect.objectContaining({
      status: 'skipped',
      skipReason: 'post_disabled'
    }));
  });

  it('rotates Facebook and Instagram variant pools independently', async () => {
    const fixture = createRuntimeFixture();
    fixture.rows.variants.splice(0, fixture.rows.variants.length,
      { id: 'fb-1', tenantId: 'tenant-a', ruleId: 'rule-a', platform: 'facebook', body: 'Facebook one', orderIndex: 0, isEnabled: true, deletedAt: null },
      { id: 'fb-2', tenantId: 'tenant-a', ruleId: 'rule-a', platform: 'facebook', body: 'Facebook two', orderIndex: 1, isEnabled: true, deletedAt: null },
      { id: 'ig-1', tenantId: 'tenant-a', ruleId: 'rule-a', platform: 'instagram', body: 'Instagram one', orderIndex: 0, isEnabled: true, deletedAt: null },
      { id: 'ig-2', tenantId: 'tenant-a', ruleId: 'rule-a', platform: 'instagram', body: 'Instagram two', orderIndex: 1, isEnabled: true, deletedAt: null }
    );

    await fixture.runtime.ingest(fixture.event({ provider: 'facebook' }));
    await fixture.runtime.ingest(fixture.event({ provider: 'instagram' }));
    await fixture.runtime.ingest(fixture.event({ provider: 'facebook' }));
    await fixture.worker.runOnce();
    await fixture.worker.runOnce();
    await fixture.worker.runOnce();

    expect(fixture.rows.deliveries.map((delivery) => delivery.renderedText)).toEqual([
      'Facebook one',
      'Instagram one',
      'Facebook two'
    ]);
    expect(fixture.rows.rules[0]).toEqual(expect.objectContaining({
      facebookRotationCursor: 2,
      instagramRotationCursor: 1,
      sharedRotationCursor: 0
    }));
  });

  it('rejects stale leases and creates one strict outbox intent atomically', async () => {
    const fixture = createRuntimeFixture();
    await fixture.runtime.ingest(fixture.event({ externalCommentId: 'fenced-comment' }));
    const first = await fixture.worker.claimNext();

    fixture.currentTime.value = new Date('2026-07-27T12:01:00.000Z');
    await fixture.worker.recoverStale();
    const second = await fixture.worker.claimNext();

    await expect(fixture.runtime.process(first.id, first.leaseToken))
      .rejects.toMatchObject({ code: 'STALE_LEASE' });
    expect(fixture.rows.outbox).toHaveLength(0);

    await fixture.runtime.process(second.id, second.leaseToken);
    expect(fixture.rows.outbox).toHaveLength(1);
    expect(fixture.rows.outbox[0].payload).toEqual({
      executionId: second.id,
      providerReference: { provider: 'facebook', instanceId: 'instance-fb' }
    });
    expect(fixture.calls).toEqual({ atomicOutboxCreates: 1, atomicReadyWrites: 1 });
  });

  it('fails received work that already exhausted its bounded processing attempts', async () => {
    const fixture = createRuntimeFixture();
    await fixture.runtime.ingest(fixture.event({ externalCommentId: 'exhausted-comment' }));
    fixture.rows.executions[0].attempts = 3;

    await fixture.worker.runOnce();

    expect(fixture.rows.executions[0]).toEqual(expect.objectContaining({
      status: 'failed',
      attempts: 3,
      errorCode: 'PROCESSING_ATTEMPTS_EXHAUSTED'
    }));
    expect(fixture.rows.outbox).toHaveLength(0);
  });

  it('uses AI after an unmatched rule and creates one public child delivery', async () => {
    const fixture = createRuntimeFixture();
    fixture.rows.profiles[0].aiMode = 'rules_then_ai';
    await fixture.runtime.ingest(fixture.event({ text: 'How do I apply?' }));

    await fixture.worker.runOnce();

    expect(fixture.decisionService.decide).toHaveBeenCalledOnce();
    expect(fixture.rows.executions[0]).toEqual(expect.objectContaining({ status: 'ready', routeSource: 'ai' }));
    expect(fixture.rows.deliveries).toEqual([
      expect.objectContaining({ kind: 'public_reply', renderedText: 'AI public reply', status: 'pending' })
    ]);
    expect(fixture.rows.outbox).toHaveLength(1);
  });

  it('ai_only reply_and_dm snapshots both texts but enqueues only the private delivery', async () => {
    const fixture = createRuntimeFixture({
      decision: {
        action: 'reply_and_dm', publicReply: 'We sent you a DM.',
        privateReply: 'Welcome! Which grade?', reasonCode: 'collect_grade'
      }
    });
    fixture.rows.profiles[0].aiMode = 'ai_only';
    fixture.rows.profiles[0].privateReplyEnabled = true;
    await fixture.runtime.ingest(fixture.event({ text: 'price please' }));

    await fixture.worker.runOnce();

    expect(fixture.rows.deliveries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'private_message', renderedText: 'Welcome! Which grade?', outboxEventId: expect.any(String) }),
      expect.objectContaining({ kind: 'public_reply', renderedText: 'We sent you a DM.', outboxEventId: null })
    ]));
    expect(fixture.rows.outbox).toHaveLength(1);
    expect(fixture.rows.outbox[0].aggregateId).toBe(fixture.rows.deliveries.find((item) => item.kind === 'private_message').id);
  });

  it.each(['skip', 'human_review'])('records AI %s without publishing', async (action) => {
    const fixture = createRuntimeFixture({
      decision: { action, publicReply: null, privateReply: null, reasonCode: 'not_actionable' }
    });
    fixture.rows.profiles[0].aiMode = 'ai_only';
    await fixture.runtime.ingest(fixture.event());
    await fixture.worker.runOnce();
    expect(fixture.rows.executions[0]).toEqual(expect.objectContaining({
      status: 'skipped', routeSource: 'ai', skipReason: `${action}:not_actionable`
    }));
    expect(fixture.rows.deliveries).toHaveLength(0);
    expect(fixture.rows.outbox).toHaveLength(0);
  });

  it('fails closed when the connected account Primary Agent and binding Agent disagree', async () => {
    const fixture = createRuntimeFixture();
    fixture.rows.instances[0].primaryAgentId = 'agent-b';
    await fixture.runtime.ingest(fixture.event());
    await fixture.worker.runOnce();
    expect(fixture.rows.executions[0]).toEqual(expect.objectContaining({
      status: 'skipped', skipReason: 'primary_agent_mismatch'
    }));
    expect(fixture.decisionService.decide).not.toHaveBeenCalled();
    expect(fixture.rows.outbox).toHaveLength(0);
  });
});
