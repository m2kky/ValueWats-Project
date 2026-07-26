const {
  assignmentInput,
  createExecutionScope,
  createOwnershipExecutor,
  ownershipService,
  seedOwnershipContext,
  createPolicyScope
} = require('../../helpers/ownershipFixtures');
const { createCommandExecutor } = require('../../../src/agents/commands/commandExecutor');
const { commandRegistry } = require('../../../src/agents/commands/commandRegistry');
const { capabilityCatalog } = require('../../../src/agents/config/capabilityCatalog');
const {
  createTestDatabase,
  resetDatabase
} = require('../../helpers/database');

const prisma = createTestDatabase(process.env.DATABASE_URL);

describe('atomic assignment command core', () => {
  beforeEach(async () => {
    delete process.env.AGENT_RUNTIME_KILL_SWITCH;
    delete process.env.AGENT_MUTATIONS_KILL_SWITCH;
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('assigns an exact eligible AI target and commits the complete handoff atomically', async () => {
    const context = await seedOwnershipContext(prisma);
    const result = await createOwnershipExecutor(prisma, ['agent:agent-target'])
      .execute(assignmentInput(context, 'agent:agent-target'));

    expect(result).toMatchObject({
      status: 'succeeded',
      result: {
        owner: { kind: 'ai', id: context.targetAgent.id },
        assignmentVersion: 1
      }
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: {
        currentAgentId: true,
        assignedUserId: true,
        assignmentVersion: true,
        aiEnabled: true,
        escalated: true
      }
    })).toEqual({
      currentAgentId: context.targetAgent.id,
      assignedUserId: null,
      assignmentVersion: 1,
      aiEnabled: true,
      escalated: false
    });
    expect(await prisma.conversationAgent.findMany({
      where: { conversationId: context.conversation.id },
      select: { agentId: true, endedAt: true },
      orderBy: { startedAt: 'asc' }
    })).toEqual([
      { agentId: context.sourceAgent.id, endedAt: expect.any(Date) },
      { agentId: context.targetAgent.id, endedAt: null }
    ]);
    const activity = await prisma.activityLog.findMany({
      where: { conversationId: context.conversation.id, actionType: 'assigned' }
    });
    expect(activity).toHaveLength(1);
    expect(activity[0].metadata).toMatchObject({
      runId: context.run.id,
      commandId: result.commandId,
      reasonCode: 'specialist_required',
      target: { kind: 'ai', id: context.targetAgent.id }
    });
    const outgoing = await prisma.chatMessage.findMany({
      where: { conversationId: context.conversation.id, direction: 'outgoing' }
    });
    expect(outgoing).toEqual([
      expect.objectContaining({
        status: 'pending',
        content: 'I am transferring this conversation to the right specialist.'
      })
    ]);
    expect(await prisma.outboxEvent.findMany({
      where: { commandId: result.commandId }
    })).toEqual([
      expect.objectContaining({
        runId: context.run.id,
        aggregateType: 'channel_message',
        aggregateId: context.conversation.id,
        eventType: 'channel.message.send',
        status: 'pending',
        payload: {
          providerReference: {
            provider: 'evolution',
            instanceId: context.instance.id
          },
          pendingMessageId: outgoing[0].id
        }
      })
    ]);
    expect(await prisma.agentRun.findMany({
      where: { conversationId: context.conversation.id },
      select: { sourceAgentId: true, inboundMessageId: true }
    })).toEqual([{
      sourceAgentId: context.sourceAgent.id,
      inboundMessageId: context.inboundMessage.id
    }]);
  });

  it('routes Meta-backed WhatsApp handoffs without persisting credentials', async () => {
    const context = await seedOwnershipContext(prisma);
    await prisma.instance.update({
      where: { id: context.instance.id },
      data: {
        phoneNumberId: 'meta-phone-number-id',
        accessToken: 'meta-access-token'
      }
    });

    const result = await createOwnershipExecutor(prisma, ['agent:agent-target'])
      .execute(assignmentInput(context, 'agent:agent-target'));

    expect(result.status).toBe('succeeded');
    const outbox = await prisma.outboxEvent.findFirstOrThrow({
      where: { commandId: result.commandId }
    });
    expect(outbox.payload).toEqual({
      providerReference: {
        provider: 'meta',
        instanceId: context.instance.id
      },
      pendingMessageId: result.result.handoffMessageId
    });
    expect(JSON.stringify(outbox.payload)).not.toContain('meta-phone-number-id');
    expect(JSON.stringify(outbox.payload)).not.toContain('meta-access-token');
  });

  it('rejects a cross-tenant inbound instance before handoff writes', async () => {
    const context = await seedOwnershipContext(prisma);
    const otherTenant = await prisma.tenant.create({
      data: {
        id: 'tenant-handoff-other',
        name: 'Handoff Other',
        email: 'handoff-other@example.test'
      }
    });
    const crossTenantInstance = await prisma.instance.create({
      data: {
        id: 'instance-handoff-cross',
        tenantId: otherTenant.id,
        instanceName: 'handoff-cross',
        phoneNumber: '+15550003999',
        status: 'connected'
      }
    });
    await prisma.chatMessage.update({
      where: { id: context.inboundMessage.id },
      data: { instanceId: crossTenantInstance.id }
    });

    const result = await createOwnershipExecutor(prisma, ['agent:agent-target'])
      .execute(assignmentInput(context, 'agent:agent-target'));

    expect(result).toMatchObject({
      status: 'failed',
      code: 'COMMAND_FAILED'
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { currentAgentId: true, assignmentVersion: true }
    })).toEqual({
      currentAgentId: context.sourceAgent.id,
      assignmentVersion: 0
    });
    expect(await prisma.activityLog.count()).toBe(0);
    expect(await prisma.chatMessage.count({ where: { direction: 'outgoing' } })).toBe(0);
    expect(await prisma.outboxEvent.count()).toBe(0);
  });

  it('uses the reviewed runtime allowlist through the static production registry', async () => {
    const context = await seedOwnershipContext(prisma, {
      allowedTargets: ['agent:agent-target']
    });
    const executor = createCommandExecutor({
      prisma,
      registry: commandRegistry,
      catalog: capabilityCatalog,
      createPolicyScope,
      createExecutionScope
    });

    const result = await executor.execute(assignmentInput(context, 'agent:agent-target'));

    expect(result).toMatchObject({
      status: 'succeeded',
      result: { owner: { kind: 'ai', id: context.targetAgent.id } }
    });
  });

  it.each([
    ['agent', 'user-agent'],
    ['admin', 'user-admin']
  ])('assigns an exact active %s user', async (role, userId) => {
    const context = await seedOwnershipContext(prisma, {
      allowedTargets: [`user:${userId}`]
    });
    const result = await createOwnershipExecutor(prisma, [`user:${userId}`])
      .execute(assignmentInput(context, `user:${userId}`));

    expect(result).toMatchObject({
      status: 'succeeded',
      result: {
        owner: { kind: 'human', id: userId },
        assignmentVersion: 1
      }
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: {
        currentAgentId: true,
        assignedUserId: true,
        aiEnabled: true,
        escalated: true
      }
    })).toEqual({
      currentAgentId: null,
      assignedUserId: userId,
      aiEnabled: false,
      escalated: true
    });
  });

  it.each([
    {
      label: 'viewer',
      target: 'user:viewer',
      seed: async (context) => prisma.user.create({
        data: {
          id: 'viewer',
          tenantId: context.tenant.id,
          email: 'viewer@example.test',
          passwordHash: 'test',
          role: 'viewer'
        }
      })
    },
    {
      label: 'inactive user',
      target: 'user:inactive-user',
      seed: async (context) => prisma.user.create({
        data: {
          id: 'inactive-user',
          tenantId: context.tenant.id,
          email: 'inactive@example.test',
          passwordHash: 'test',
          role: 'agent',
          isActive: false
        }
      })
    },
    {
      label: 'inactive agent',
      target: 'agent:agent-target',
      seed: async (context) => prisma.aIAgent.update({
        where: { id: context.targetAgent.id },
        data: { isActive: false }
      })
    },
    {
      label: 'unpublished agent',
      target: 'agent:agent-target',
      seed: async (context) => prisma.aIAgent.update({
        where: { id: context.targetAgent.id },
        data: { isPublished: false }
      })
    },
    {
      label: 'deleted agent',
      target: 'agent:agent-target',
      seed: async (context) => prisma.aIAgent.update({
        where: { id: context.targetAgent.id },
        data: { deletedAt: new Date() }
      })
    },
    {
      label: 'source agent',
      target: 'agent:agent-source',
      seed: async () => undefined
    },
    {
      label: 'cross-tenant agent',
      target: 'agent:cross-agent',
      seed: async () => {
        const tenant = await prisma.tenant.create({
          data: {
            id: 'tenant-cross',
            name: 'Cross Tenant',
            email: 'cross@example.test'
          }
        });
        await prisma.aIAgent.create({
          data: {
            id: 'cross-agent',
            tenantId: tenant.id,
            name: 'Cross Agent',
            instructions: 'Cross',
            isActive: true,
            isPublished: true
          }
        });
      }
    }
  ])('denies $label without domain writes', async ({ target, seed }) => {
    const context = await seedOwnershipContext(prisma, {
      allowedTargets: [target]
    });
    await seed(context);
    const result = await createOwnershipExecutor(prisma, [target])
      .execute(assignmentInput(context, target));

    expect(result).toMatchObject({ status: 'denied', code: 'CAPABILITY_DISABLED' });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { currentAgentId: true, assignmentVersion: true }
    })).toEqual({
      currentAgentId: context.sourceAgent.id,
      assignmentVersion: 0
    });
    expect(await prisma.activityLog.count()).toBe(0);
    expect(await prisma.outboxEvent.count()).toBe(0);
    expect(await prisma.chatMessage.count({ where: { direction: 'outgoing' } })).toBe(0);
  });

  it('produces zero writes when the assignment capability is disabled', async () => {
    const context = await seedOwnershipContext(prisma);
    await prisma.agentAction.updateMany({
      where: { agentId: context.sourceAgent.id, key: 'assign_conversation' },
      data: { isEnabled: false }
    });

    const result = await createOwnershipExecutor(prisma, ['agent:agent-target'])
      .execute(assignmentInput(context, 'agent:agent-target'));

    expect(result).toMatchObject({ status: 'denied', code: 'CAPABILITY_DISABLED' });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { currentAgentId: true, assignmentVersion: true }
    })).toEqual({ currentAgentId: context.sourceAgent.id, assignmentVersion: 0 });
    expect(await prisma.activityLog.count()).toBe(0);
    expect(await prisma.outboxEvent.count()).toBe(0);
  });

  it.each([
    {
      label: 'source owner',
      code: 'OWNERSHIP_STALE',
      mutate: async (context) => prisma.conversation.updateMany({
        where: { id: context.conversation.id, tenantId: context.tenant.id },
        data: { currentAgentId: context.otherAgent.id }
      })
    },
    {
      label: 'source config version',
      code: 'CONFIG_STALE',
      mutate: async (context) => prisma.aIAgent.update({
        where: { id: context.sourceAgent.id },
        data: { configVersion: { increment: 1 } }
      })
    },
    {
      label: 'assignment version',
      code: 'OWNERSHIP_STALE',
      mutate: async (context) => prisma.conversation.updateMany({
        where: { id: context.conversation.id, tenantId: context.tenant.id },
        data: { assignmentVersion: { increment: 1 } }
      })
    }
  ])('denies stale $label before assignment side effects', async ({ code, mutate }) => {
    const context = await seedOwnershipContext(prisma);
    await mutate(context);

    const result = await createOwnershipExecutor(prisma, ['agent:agent-target'])
      .execute(assignmentInput(context, 'agent:agent-target'));

    expect(result).toMatchObject({ status: 'denied', code });
    expect(await prisma.activityLog.count()).toBe(0);
    expect(await prisma.outboxEvent.count()).toBe(0);
    expect(await prisma.chatMessage.count({ where: { direction: 'outgoing' } })).toBe(0);
  });

  it('denies unreviewed assignment policy without mutation', async () => {
    const context = await seedOwnershipContext(prisma, {
      assignmentConfig: { requiresReview: true }
    });

    const result = await createOwnershipExecutor(prisma, ['agent:agent-target'])
      .execute(assignmentInput(context, 'agent:agent-target'));

    expect(result).toMatchObject({ status: 'denied', code: 'CAPABILITY_DISABLED' });
    expect(await prisma.activityLog.count()).toBe(0);
    expect(await prisma.outboxEvent.count()).toBe(0);
  });

  it('previews an eligible assignment without transaction writes', async () => {
    const context = await seedOwnershipContext(prisma);
    const executor = createOwnershipExecutor(prisma, ['agent:agent-target']);
    const before = {
      commands: await prisma.agentCommand.count(),
      activities: await prisma.activityLog.count(),
      messages: await prisma.chatMessage.count(),
      outbox: await prisma.outboxEvent.count()
    };

    const result = await executor.preview({
      tenantId: context.tenant.id,
      sourceAgentId: context.sourceAgent.id,
      sourceConfigVersion: context.sourceAgent.configVersion,
      type: 'assign_conversation',
      arguments: assignmentInput(context, 'agent:agent-target').arguments,
      mockContact: {}
    });

    expect(result).toMatchObject({
      mode: 'preview',
      status: 'previewed',
      allowed: true,
      checks: {
        ownership: 'not_evaluated',
        transactionWrites: 'not_evaluated'
      }
    });
    expect({
      commands: await prisma.agentCommand.count(),
      activities: await prisma.activityLog.count(),
      messages: await prisma.chatMessage.count(),
      outbox: await prisma.outboxEvent.count()
    }).toEqual(before);
  });

  it('closes through the static terminal command and ends the active session', async () => {
    const context = await seedOwnershipContext(prisma);
    const result = await createOwnershipExecutor(prisma, ['agent:agent-target']).execute({
      tenantId: context.tenant.id,
      runId: context.run.id,
      type: 'close_conversation',
      arguments: { reason: 'Resolved' },
      expectedAssignmentVersion: 0
    });

    expect(result).toMatchObject({
      status: 'succeeded',
      result: {
        conversationId: context.conversation.id,
        status: 'closed',
        assignmentVersion: 1
      }
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: {
        status: true,
        currentAgentId: true,
        assignedUserId: true,
        assignmentVersion: true
      }
    })).toEqual({
      status: 'closed',
      currentAgentId: null,
      assignedUserId: null,
      assignmentVersion: 1
    });
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id, endedAt: null }
    })).toBe(0);
    expect(await prisma.activityLog.findFirst({
      where: { conversationId: context.conversation.id, actionType: 'closed' },
      select: { metadata: true }
    })).toEqual({
      metadata: expect.objectContaining({
        runId: context.run.id,
        commandId: result.commandId
      })
    });
  });

  it('replays without duplicating session, activity, message, or outbox intent', async () => {
    const context = await seedOwnershipContext(prisma);
    const executor = createOwnershipExecutor(prisma, ['agent:agent-target']);
    const input = assignmentInput(context, 'agent:agent-target');
    const first = await executor.execute(input);
    const replay = await executor.execute(input);

    expect(first.status).toBe('succeeded');
    expect(replay).toMatchObject({
      commandId: first.commandId,
      status: 'succeeded',
      replayed: true
    });
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id }
    })).toBe(2);
    expect(await prisma.activityLog.count()).toBe(1);
    expect(await prisma.chatMessage.count({ where: { direction: 'outgoing' } })).toBe(1);
    expect(await prisma.outboxEvent.count()).toBe(1);
  });

  it('supports default ownership, unassign, close, and agent drain through one service', async () => {
    const context = await seedOwnershipContext(prisma);
    await prisma.conversation.updateMany({
      where: { id: context.conversation.id, tenantId: context.tenant.id },
      data: {
        currentAgentId: null,
        assignmentVersion: { increment: 1 }
      }
    });
    await prisma.conversationAgent.updateMany({
      where: { conversationId: context.conversation.id, endedAt: null },
      data: { endedAt: new Date() }
    });

    const ensured = await prisma.$transaction((transaction) => (
      ownershipService.ensureDefaultOwner(transaction, {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        targetAgentId: context.targetAgent.id,
        expectedAssignmentVersion: 1,
        expectedOwner: { kind: 'unassigned' },
        reason: 'Default owner'
      })
    ));
    const unassigned = await prisma.$transaction((transaction) => (
      ownershipService.unassign(transaction, {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        expectedAssignmentVersion: ensured.assignmentVersion,
        expectedOwner: { kind: 'ai', id: context.targetAgent.id },
        reason: 'Queue'
      })
    ));
    const reassigned = await prisma.$transaction((transaction) => (
      ownershipService.assignAi(transaction, {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        targetAgentId: context.otherAgent.id,
        expectedAssignmentVersion: unassigned.assignmentVersion,
        expectedOwner: { kind: 'unassigned' },
        reason: 'Drain setup'
      })
    ));
    const drained = await prisma.$transaction((transaction) => (
      ownershipService.drainAgent(transaction, {
        tenantId: context.tenant.id,
        agentId: context.otherAgent.id,
        expectedAssignments: [{
          conversationId: context.conversation.id,
          assignmentVersion: reassigned.assignmentVersion
        }],
        reason: 'Agent drain'
      })
    ));
    const closed = await prisma.$transaction((transaction) => (
      ownershipService.close(transaction, {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        expectedAssignmentVersion: drained.assignmentVersion,
        expectedOwner: { kind: 'unassigned' },
        reason: 'Resolved'
      })
    ));

    expect(ensured.owner).toEqual({ kind: 'ai', id: context.targetAgent.id });
    expect(unassigned.owner).toEqual({ kind: 'unassigned', id: null });
    expect(drained).toMatchObject({ drained: 1, assignmentVersion: 5 });
    expect(closed).toMatchObject({ status: 'closed', assignmentVersion: 6 });
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id, endedAt: null }
    })).toBe(0);
    expect(await prisma.activityLog.count({
      where: { conversationId: context.conversation.id }
    })).toBe(5);
  });

  it.each([
    ['omits', undefined],
    ['uses a non-integer', '0']
  ])('fails closed when an ownership operation %s assignmentVersion', async (label, expectedAssignmentVersion) => {
    const context = await seedOwnershipContext(prisma);

    await expect(prisma.$transaction((transaction) => (
      ownershipService.assignAi(transaction, {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        targetAgentId: context.targetAgent.id,
        expectedAssignmentVersion,
        expectedOwner: { kind: 'ai', id: context.sourceAgent.id },
        reason: `${label} version`
      })
    ))).rejects.toMatchObject({ code: 'OWNERSHIP_STALE' });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { currentAgentId: true, assignmentVersion: true }
    })).toEqual({
      currentAgentId: context.sourceAgent.id,
      assignmentVersion: 0
    });
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id, endedAt: null }
    })).toBe(1);
    expect(await prisma.activityLog.count()).toBe(0);
    expect(await prisma.chatMessage.count()).toBe(1);
    expect(await prisma.outboxEvent.count()).toBe(0);
  });

  it('rejects a root Prisma client before an ownership write', async () => {
    const context = await seedOwnershipContext(prisma);

    await expect(ownershipService.assignAi(prisma, {
      tenantId: context.tenant.id,
      conversationId: context.conversation.id,
      targetAgentId: context.targetAgent.id,
      expectedAssignmentVersion: 0,
      expectedOwner: { kind: 'ai', id: context.sourceAgent.id },
      reason: 'Root client must not write ownership'
    })).rejects.toThrow('Transaction-scoped Prisma client is required');
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { currentAgentId: true, assignmentVersion: true }
    })).toEqual({
      currentAgentId: context.sourceAgent.id,
      assignmentVersion: 0
    });
    expect(await prisma.activityLog.count()).toBe(0);
  });

  it('fails closed when an ownership operation omits tenant scope', async () => {
    const context = await seedOwnershipContext(prisma);

    await expect(prisma.$transaction((transaction) => (
      ownershipService.assignAi(transaction, {
        conversationId: context.conversation.id,
        targetAgentId: context.targetAgent.id,
        expectedAssignmentVersion: 0,
        expectedOwner: { kind: 'ai', id: context.sourceAgent.id },
        reason: 'Missing tenant'
      })
    ))).rejects.toMatchObject({ code: 'TENANT_MISMATCH' });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { currentAgentId: true, assignmentVersion: true }
    })).toEqual({
      currentAgentId: context.sourceAgent.id,
      assignmentVersion: 0
    });
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id, endedAt: null }
    })).toBe(1);
    expect(await prisma.activityLog.count()).toBe(0);
  });

  it('fails closed when an ownership operation omits the conversation', async () => {
    const context = await seedOwnershipContext(prisma);

    await expect(prisma.$transaction((transaction) => (
      ownershipService.assignHuman(transaction, {
        tenantId: context.tenant.id,
        targetUserId: context.humanAgent.id,
        expectedAssignmentVersion: 0,
        expectedOwner: { kind: 'ai', id: context.sourceAgent.id },
        reason: 'Missing conversation'
      })
    ))).rejects.toMatchObject({ code: 'TENANT_MISMATCH' });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: {
        currentAgentId: true,
        assignedUserId: true,
        assignmentVersion: true
      }
    })).toEqual({
      currentAgentId: context.sourceAgent.id,
      assignedUserId: null,
      assignmentVersion: 0
    });
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id, endedAt: null }
    })).toBe(1);
    expect(await prisma.activityLog.count()).toBe(0);
  });

  it('tenant-checks an empty agent drain', async () => {
    const context = await seedOwnershipContext(prisma);
    const otherTenant = await prisma.tenant.create({
      data: {
        id: 'tenant-drain-other',
        name: 'Drain Other',
        email: 'drain-other@example.test'
      }
    });
    const crossTenantAgent = await prisma.aIAgent.create({
      data: {
        id: 'agent-drain-cross',
        tenantId: otherTenant.id,
        name: 'Cross Drain',
        instructions: 'Cross tenant',
        isActive: true,
        isPublished: true
      }
    });

    await expect(prisma.$transaction((transaction) => (
      ownershipService.drainAgent(transaction, {
        tenantId: context.tenant.id,
        agentId: crossTenantAgent.id,
        expectedAssignments: [],
        reason: 'Cross tenant drain'
      })
    ))).rejects.toMatchObject({ code: 'TENANT_MISMATCH' });
  });

  it('fails closed when an empty agent drain omits the source agent', async () => {
    const context = await seedOwnershipContext(prisma);

    await expect(prisma.$transaction((transaction) => (
      ownershipService.drainAgent(transaction, {
        tenantId: context.tenant.id,
        expectedAssignments: [],
        reason: 'Missing source agent'
      })
    ))).rejects.toMatchObject({ code: 'TENANT_MISMATCH' });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { currentAgentId: true, assignmentVersion: true }
    })).toEqual({
      currentAgentId: context.sourceAgent.id,
      assignmentVersion: 0
    });
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id, endedAt: null }
    })).toBe(1);
    expect(await prisma.activityLog.count()).toBe(0);
  });
});
