const {
  assignmentInput,
  createOwnershipExecutor,
  ownershipService,
  seedOwnershipContext
} = require('../../helpers/ownershipFixtures');
const {
  createTestDatabase,
  resetDatabase
} = require('../../helpers/database');

const prisma = createTestDatabase(process.env.DATABASE_URL);

function winnerCount(results) {
  return results.filter((result) => (
    result.status === 'fulfilled'
    && (result.value?.status === 'succeeded' || result.value?.owner || result.value?.drained)
  )).length;
}

describe('ownership races', () => {
  beforeEach(async () => {
    delete process.env.AGENT_RUNTIME_KILL_SWITCH;
    delete process.env.AGENT_MUTATIONS_KILL_SWITCH;
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allows one winner for two different AI assignment commands', async () => {
    const allowedTargets = ['agent:agent-target', 'agent:agent-other'];
    const context = await seedOwnershipContext(prisma, { allowedTargets });
    const executor = createOwnershipExecutor(prisma, allowedTargets);

    const results = await Promise.all([
      executor.execute(assignmentInput(context, 'agent:agent-target')),
      executor.execute(assignmentInput(context, 'agent:agent-other'))
    ]);

    expect(results.filter(({ status }) => status === 'succeeded')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'conflict')).toHaveLength(1);
    expect(await prisma.activityLog.count()).toBe(1);
    expect(await prisma.outboxEvent.count()).toBe(1);
  });

  it.each([
    ['manual human assignment', async (transaction, context) => (
      ownershipService.assignHuman(transaction, {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        targetUserId: context.humanAgent.id,
        expectedAssignmentVersion: 0,
        expectedOwner: { kind: 'ai', id: context.sourceAgent.id },
        reason: 'Manual assignment'
      })
    )],
    ['workflow AI assignment', async (transaction, context) => (
      ownershipService.assignAi(transaction, {
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        targetAgentId: context.otherAgent.id,
        expectedAssignmentVersion: 0,
        expectedOwner: { kind: 'ai', id: context.sourceAgent.id },
        reason: 'Workflow assignment'
      })
    )],
    ['agent drain', async (transaction, context) => (
      ownershipService.drainAgent(transaction, {
        tenantId: context.tenant.id,
        agentId: context.sourceAgent.id,
        expectedAssignments: [{
          conversationId: context.conversation.id,
          assignmentVersion: 0
        }],
        reason: 'Drain source'
      })
    )]
  ])('allows one winner for AI assignment versus %s', async (label, competitor) => {
    const context = await seedOwnershipContext(prisma);
    const executor = createOwnershipExecutor(prisma, ['agent:agent-target']);

    const results = await Promise.allSettled([
      executor.execute(assignmentInput(context, 'agent:agent-target')),
      prisma.$transaction(
        (transaction) => competitor(transaction, context),
        { isolationLevel: 'Serializable' }
      )
    ]);

    expect(winnerCount(results)).toBe(1);
    const conversation = await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: {
        assignmentVersion: true,
        currentAgentId: true,
        assignedUserId: true
      }
    });
    expect(conversation.assignmentVersion).toBe(1);
    expect(await prisma.conversationAgent.count({
      where: { conversationId: context.conversation.id, endedAt: null }
    })).toBeLessThanOrEqual(1);
  });

  it('allows assignment or close, but not both, to claim the terminal slot', async () => {
    const context = await seedOwnershipContext(prisma);
    const executor = createOwnershipExecutor(prisma, ['agent:agent-target']);

    const results = await Promise.all([
      executor.execute(assignmentInput(context, 'agent:agent-target')),
      executor.execute({
        tenantId: context.tenant.id,
        runId: context.run.id,
        type: 'close_conversation',
        arguments: { reason: 'Resolved' },
        expectedAssignmentVersion: 0
      })
    ]);

    expect(results.filter(({ status }) => status === 'succeeded')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'conflict')).toHaveLength(1);
    expect(await prisma.agentCommand.count({
      where: { runId: context.run.id, terminalSlot: true }
    })).toBe(1);
    expect(await prisma.activityLog.count()).toBe(1);
  });
});
