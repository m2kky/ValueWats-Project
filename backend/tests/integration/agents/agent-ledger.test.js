const {
  canonicalizeCommandArguments,
  createCommandIdempotencyKey
} = require('../../../src/agents/commands/commandIdempotency');
const { createAgentRunRepository } = require('../../../src/agents/persistence/agentRunRepository');
const { createAgentCommandRepository } = require('../../../src/agents/persistence/agentCommandRepository');
const {
  createTestDatabase,
  resetDatabase: resetRegisteredDatabase
} = require('../../helpers/database');

const prisma = createTestDatabase(process.env.DATABASE_URL);

async function seedLedgerContext() {
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant-ledger',
      name: 'Ledger Tenant',
      email: 'ledger@example.test'
    }
  });
  const agent = await prisma.aIAgent.create({
    data: {
      id: 'agent-ledger',
      tenantId: tenant.id,
      name: 'Ledger Agent',
      instructions: 'Handle ledger tests.',
      isPublished: true
    }
  });
  const conversation = { id: 'conversation-ledger' };
  await prisma.$executeRawUnsafe(
    'INSERT INTO "conversations" (id, tenant_id, channel_type, contact_number, unread_count, status, "currentAgentId", "created_at", "updated_at", assignment_version) VALUES ($1, $2, $3, $4, 0, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)',
    conversation.id,
    tenant.id,
    'whatsapp',
    '+15550001000',
    'open',
    agent.id
  );
  return { tenant, agent, conversation };
}

describe('agent command idempotency', () => {
  it('produces the same key for semantically identical argument objects', () => {
    const context = {
      tenantId: 'tenant-1',
      runId: 'run-1',
      type: 'assign_conversation'
    };

    const first = createCommandIdempotencyKey({
      ...context,
      arguments: { target: { type: 'agent', id: 'agent-2' }, reason: 'sales' }
    });
    const second = createCommandIdempotencyKey({
      ...context,
      arguments: { reason: 'sales', target: { id: 'agent-2', type: 'agent' } }
    });

    expect(first).toBe(second);
    expect(canonicalizeCommandArguments({ z: 1, a: { y: 2, x: 3 } })).toEqual({
      a: { x: 3, y: 2 },
      z: 1
    });
  });

  it('rejects secret-bearing keys anywhere in command arguments', () => {
    for (const key of ['authorization', 'session', 'bearer']) {
      expect(() => createCommandIdempotencyKey({
        tenantId: 'tenant-1',
        runId: 'run-1',
        type: 'network_request',
        arguments: { request: { [key]: 'secret value' } }
      })).toThrow(expect.objectContaining({ code: 'SECRET_ARGUMENT_KEY' }));
    }
  });
});

describe('agent run and command ledgers', () => {
  const runRepository = createAgentRunRepository(prisma);
  const commandRepository = createAgentCommandRepository(prisma);
  let context;

  beforeEach(async () => {
    await resetRegisteredDatabase(prisma);
    context = await seedLedgerContext();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createRun(inboundMessageId = 'inbound-1') {
    return runRepository.createOrGet({
      tenantId: context.tenant.id,
      conversationId: context.conversation.id,
      inboundMessageId,
      sourceAgentId: context.agent.id,
      agentConfigVersion: context.agent.configVersion
    });
  }

  async function createCommand(run, type, args) {
    const command = await commandRepository.createOrGet({
      tenantId: context.tenant.id,
      runId: run.id,
      conversationId: context.conversation.id,
      sourceAgentId: context.agent.id,
      type,
      arguments: args
    });
    await commandRepository.transition({
      tenantId: context.tenant.id,
      commandId: command.id,
      to: 'authorized'
    });
    return command;
  }

  it('creates at most one run for an inbound message and keeps a soft-deleted source-agent reference', async () => {
    const [first, second] = await Promise.all([createRun(), createRun()]);

    expect(second.id).toBe(first.id);
    expect(await prisma.agentRun.count({ where: { inboundMessageId: 'inbound-1' } })).toBe(1);

    await prisma.aIAgent.update({
      where: { id: context.agent.id },
      data: { deletedAt: new Date(), isActive: false, isPublished: false }
    });
    const stored = await prisma.agentRun.findUnique({
      where: { id: first.id },
      include: { sourceAgent: true }
    });
    expect(stored.sourceAgent.id).toBe(context.agent.id);
  });

  it('returns the recorded command for a duplicate local intent', async () => {
    const run = await createRun();
    const first = await commandRepository.createOrGet({
      tenantId: context.tenant.id,
      runId: run.id,
      conversationId: context.conversation.id,
      sourceAgentId: context.agent.id,
      type: 'update_contact',
      arguments: { fields: { name: 'Ada', city: 'Cairo' } }
    });
    const second = await commandRepository.createOrGet({
      tenantId: context.tenant.id,
      runId: run.id,
      conversationId: context.conversation.id,
      sourceAgentId: context.agent.id,
      type: 'update_contact',
      arguments: { fields: { city: 'Cairo', name: 'Ada' } }
    });

    expect(second.id).toBe(first.id);
    expect(await prisma.agentCommand.count()).toBe(1);
  });

  it('rejects reuse of an explicit idempotency key for a different command identity', async () => {
    const run = await createRun();
    await commandRepository.createOrGet({
      tenantId: context.tenant.id,
      runId: run.id,
      conversationId: context.conversation.id,
      sourceAgentId: context.agent.id,
      type: 'update_contact',
      arguments: { fields: { city: 'Cairo' } },
      idempotencyKey: 'explicit-command-key'
    });

    await expect(commandRepository.createOrGet({
      tenantId: context.tenant.id,
      runId: run.id,
      conversationId: context.conversation.id,
      sourceAgentId: context.agent.id,
      type: 'close_conversation',
      arguments: { reason: 'resolved' },
      idempotencyKey: 'explicit-command-key'
    })).rejects.toMatchObject({ code: 'COMMAND_IDEMPOTENCY_CONFLICT' });

    expect(await prisma.agentCommand.count()).toBe(1);
  });

  it('allows only one concurrent terminal command per run', async () => {
    const run = await createRun();
    const assign = await createCommand(run, 'assign_conversation', { targetAgentId: 'agent-2' });
    const close = await createCommand(run, 'close_conversation', { reason: 'resolved' });

    const results = await Promise.all([
      commandRepository.claimTerminalSlot({
        tenantId: context.tenant.id,
        commandId: assign.id
      }),
      commandRepository.claimTerminalSlot({
        tenantId: context.tenant.id,
        commandId: close.id
      })
    ]);

    expect(results.filter((result) => result.claimed)).toHaveLength(1);
    expect(await prisma.agentCommand.count({ where: { runId: run.id, terminalSlot: true } })).toBe(1);
    const commands = await prisma.agentCommand.findMany({
      where: { runId: run.id },
      orderBy: { type: 'asc' }
    });
    expect(commands.map((command) => command.status).sort()).toEqual(['authorized', 'conflict']);
  });

  it('does not change a command after it reaches a terminal state', async () => {
    const run = await createRun();
    const command = await createCommand(run, 'close_conversation', { reason: 'resolved' });
    await commandRepository.claimTerminalSlot({
      tenantId: context.tenant.id,
      commandId: command.id
    });
    const running = await commandRepository.transition({
      tenantId: context.tenant.id,
      commandId: command.id,
      to: 'running'
    });
    await commandRepository.transition({
      tenantId: context.tenant.id,
      commandId: command.id,
      to: 'succeeded',
      expectedAttempt: running.command.attempts,
      result: { status: 'closed' }
    });

    const replay = await commandRepository.transition({
      tenantId: context.tenant.id,
      commandId: command.id,
      to: 'running'
    });

    expect(replay.changed).toBe(false);
    expect(replay.command.status).toBe('succeeded');
    expect(replay.command.result).toEqual({ status: 'closed' });
  });

  it('prevents an expired command attempt from completing a newer attempt', async () => {
    const run = await createRun();
    const command = await createCommand(run, 'close_conversation', { reason: 'resolved' });
    await commandRepository.claimTerminalSlot({
      tenantId: context.tenant.id,
      commandId: command.id
    });
    const firstAttempt = await commandRepository.transition({
      tenantId: context.tenant.id,
      commandId: command.id,
      to: 'running'
    });
    await prisma.agentCommand.update({
      where: { id: command.id },
      data: {
        attempts: { increment: 1 },
        leaseExpiresAt: new Date('2026-07-26T12:01:00.000Z')
      }
    });

    const staleCompletion = await commandRepository.transition({
      tenantId: context.tenant.id,
      commandId: command.id,
      to: 'succeeded',
      expectedAttempt: firstAttempt.command.attempts,
      result: { status: 'closed' }
    });

    expect(staleCompletion.changed).toBe(false);
    expect(staleCompletion.command.status).toBe('running');
    expect(staleCompletion.command.attempts).toBe(2);
  });
});
