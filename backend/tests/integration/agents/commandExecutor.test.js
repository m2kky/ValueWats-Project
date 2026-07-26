const { createCapabilityCatalog } = require('../../../src/agents/config/capabilityCatalog');
const { createCommandRegistry } = require('../../../src/agents/commands/commandRegistry');
const { createCommandExecutor } = require('../../../src/agents/commands/commandExecutor');
const { CommandError, COMMAND_ERROR_CODES } = require('../../../src/agents/commands/commandErrors');
const {
  evaluateCommandPolicy,
  loadLiveCommandContext,
  loadPreviewCommandContext
} = require('../../../src/agents/commands/commandPolicy');
const {
  createTestDatabase,
  resetDatabase: resetRegisteredDatabase
} = require('../../helpers/database');

const prisma = createTestDatabase(process.env.DATABASE_URL);
const strictConfig = {
  type: 'object',
  additionalProperties: false,
  properties: {}
};

const catalog = createCapabilityCatalog([
  {
    type: 'record_effect',
    risk: 'medium',
    delivery: 'internal',
    terminalConversationCommand: false,
    configSchema: strictConfig
  },
  {
    type: 'capture_command_id',
    risk: 'medium',
    delivery: 'internal',
    terminalConversationCommand: false,
    configSchema: strictConfig
  },
  {
    type: 'terminal_one',
    risk: 'ownership_change',
    delivery: 'internal',
    terminalConversationCommand: true,
    configSchema: strictConfig
  },
  {
    type: 'terminal_two',
    risk: 'ownership_change',
    delivery: 'internal',
    terminalConversationCommand: true,
    configSchema: strictConfig
  },
  {
    type: 'revoke_during_policy',
    risk: 'medium',
    delivery: 'internal',
    terminalConversationCommand: false,
    configSchema: strictConfig
  },
  {
    type: 'fail_after_effect',
    risk: 'medium',
    delivery: 'internal',
    terminalConversationCommand: false,
    configSchema: strictConfig
  },
  {
    type: 'send_email',
    risk: 'external',
    delivery: 'outbox',
    terminalConversationCommand: false,
    integration: { required: true, types: ['smtp'] },
    configSchema: strictConfig
  }
]);

function parameters(properties = {}, required = []) {
  return {
    type: 'object',
    additionalProperties: false,
    required,
    properties
  };
}

function makeDefinition({
  type,
  risk = 'medium',
  delivery = 'internal',
  terminalConversationCommand = false,
  authorize,
  execute,
  buildOutboxIntent
}) {
  const definition = {
    type,
    capabilityType: type,
    risk,
    delivery,
    terminalConversationCommand,
    parameters: parameters({
      amount: { type: 'integer', minimum: 1, maximum: 10 },
      resourceTenantId: { type: 'string', minLength: 1 }
    }, ['amount']),
    authorize
  };
  if (delivery === 'outbox') definition.buildOutboxIntent = buildOutboxIntent;
  else definition.execute = execute;
  return definition;
}

const buildEmailOutboxIntent = vi.fn(async (context) => ({
  aggregateType: 'email',
  aggregateId: context.conversationId,
  eventType: 'email.send',
  payload: {
    integrationId: context.capability.integration.id,
    template: 'agent-command'
  }
}));
const providerCall = vi.fn();
const revokeHandler = vi.fn(async (scope, context, args) => (
  scope.recordEffect(context, args.amount)
));
let revokeOnAuthorize = false;
const registry = createCommandRegistry([
  makeDefinition({
    type: 'record_effect',
    authorize: async (context, args, policyScope) => {
      expect(policyScope).toEqual(expect.any(Object));
      expect(policyScope).not.toHaveProperty('prisma');
      expect(policyScope).not.toHaveProperty('$queryRaw');
      return args.resourceTenantId && args.resourceTenantId !== context.tenantId
        ? { allowed: false, code: COMMAND_ERROR_CODES.TENANT_MISMATCH }
        : { allowed: true };
    },
    execute: async (scope, context, args) => {
      expect(scope).not.toHaveProperty('prisma');
      expect(scope).not.toHaveProperty('$queryRaw');
      expect(context).not.toHaveProperty('request');
      expect(context.capability).not.toHaveProperty('credentials');
      return scope.recordEffect(context, args.amount);
    }
  }),
  makeDefinition({
    type: 'capture_command_id',
    execute: async (scope, context) => ({
      contextCommandId: context.commandId,
      scopeCommandId: scope.commandId
    })
  }),
  makeDefinition({
    type: 'terminal_one',
    risk: 'ownership_change',
    terminalConversationCommand: true,
    execute: async (scope, context, args) => scope.recordEffect(context, args.amount)
  }),
  makeDefinition({
    type: 'terminal_two',
    risk: 'ownership_change',
    terminalConversationCommand: true,
    execute: async (scope, context, args) => scope.recordEffect(context, args.amount)
  }),
  makeDefinition({
    type: 'revoke_during_policy',
    authorize: async (context) => {
      if (revokeOnAuthorize) {
        revokeOnAuthorize = false;
        await prisma.agentAction.updateMany({
          where: { agentId: context.sourceAgentId, key: 'revoke_during_policy' },
          data: { isEnabled: false }
        });
      }
      return { allowed: true };
    },
    execute: revokeHandler
  }),
  makeDefinition({
    type: 'fail_after_effect',
    execute: async (scope, context, args) => {
      await scope.recordEffect(context, args.amount);
      throw new CommandError('TEST_HANDLER_FAILED', 'Expected handler failure');
    }
  }),
  makeDefinition({
    type: 'send_email',
    risk: 'external',
    delivery: 'outbox',
    buildOutboxIntent: buildEmailOutboxIntent
  })
], { catalog });

function createExecutionScope({ transaction, commandId }) {
  return Object.freeze({
    commandId,
    async recordEffect(context, amount) {
      const updated = await transaction.conversation.updateMany({
        where: {
          id: context.conversationId,
          tenantId: context.tenantId,
          currentAgentId: context.sourceAgentId,
          assignmentVersion: context.assignmentVersion
        },
        data: { failedAttempts: { increment: amount } }
      });
      if (updated.count !== 1) {
        throw new CommandError(
          COMMAND_ERROR_CODES.OWNERSHIP_STALE,
          'Conversation ownership changed'
        );
      }
      return { recorded: amount };
    }
  });
}

const executor = createCommandExecutor({
  prisma,
  registry,
  catalog,
  createExecutionScope,
  createPolicyScope: () => Object.freeze({})
});

async function seedContext() {
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant-command',
      name: 'Command Tenant',
      email: 'command@example.test',
      agentRuntimeMode: 'v2'
    }
  });
  const agent = await prisma.aIAgent.create({
    data: {
      id: 'agent-command',
      tenantId: tenant.id,
      name: 'Command Agent',
      instructions: 'Execute authorized commands.',
      isActive: true,
      isPublished: true,
      configVersion: 1
    }
  });
  const conversation = { id: 'conversation-command' };
  await prisma.$executeRawUnsafe(
    'INSERT INTO "conversations" (id, tenant_id, channel_type, contact_number, unread_count, status, "currentAgentId", "created_at", "updated_at", assignment_version) VALUES ($1, $2, $3, $4, 0, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)',
    conversation.id,
    tenant.id,
    'whatsapp',
    '+15550002000',
    'open',
    agent.id
  );
  const run = await prisma.agentRun.create({
    data: {
      id: 'run-command',
      tenantId: tenant.id,
      conversationId: conversation.id,
      inboundMessageId: 'inbound-command',
      sourceAgentId: agent.id,
      agentConfigVersion: agent.configVersion
    }
  });
  await prisma.agentAction.createMany({
    data: [
      'record_effect',
      'capture_command_id',
      'terminal_one',
      'terminal_two',
      'revoke_during_policy',
      'fail_after_effect'
    ].map((key) => ({
      agentId: agent.id,
      key,
      type: key,
      config: {},
      instructions: `Allow ${key}.`,
      isEnabled: true
    }))
  });
  return { tenant, agent, conversation, run };
}

function liveInput(context, overrides = {}) {
  return {
    tenantId: context.tenant.id,
    runId: context.run.id,
    type: 'record_effect',
    arguments: { amount: 1 },
    expectedAssignmentVersion: 0,
    ...overrides
  };
}

describe('authorized command executor', () => {
  let context;

  beforeEach(async () => {
    delete process.env.AGENT_RUNTIME_KILL_SWITCH;
    delete process.env.AGENT_MUTATIONS_KILL_SWITCH;
    buildEmailOutboxIntent.mockClear();
    providerCall.mockClear();
    revokeHandler.mockClear();
    revokeOnAuthorize = false;
    await resetRegisteredDatabase(prisma);
    context = await seedContext();
  });

  afterAll(async () => {
    delete process.env.AGENT_RUNTIME_KILL_SWITCH;
    delete process.env.AGENT_MUTATIONS_KILL_SWITCH;
    await prisma.$disconnect();
  });

  it('rejects unknown commands and invalid arguments before persistence', async () => {
    const unknown = await executor.execute(liveInput(context, {
      type: 'record_effect_typo'
    }));
    const invalid = await executor.execute(liveInput(context, {
      arguments: { amount: 1, hidden: true }
    }));

    expect(unknown).toMatchObject({
      status: 'rejected',
      code: COMMAND_ERROR_CODES.COMMAND_UNKNOWN
    });
    expect(invalid).toMatchObject({
      status: 'rejected',
      code: COMMAND_ERROR_CODES.ARGUMENTS_INVALID
    });
    expect(await prisma.agentCommand.count()).toBe(0);
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 0 });
  });

  it('records disabled capability and stale config as normal denials', async () => {
    await prisma.agentAction.updateMany({
      where: { agentId: context.agent.id, key: 'record_effect' },
      data: { isEnabled: false }
    });
    const disabled = await executor.execute(liveInput(context));

    await prisma.agentAction.updateMany({
      where: { agentId: context.agent.id, key: 'record_effect' },
      data: { isEnabled: true }
    });
    await prisma.aIAgent.update({
      where: { id: context.agent.id },
      data: { configVersion: { increment: 1 } }
    });
    const stale = await executor.execute(liveInput(context, {
      arguments: { amount: 2 }
    }));

    expect(disabled).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.CAPABILITY_DISABLED
    });
    expect(stale).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.CONFIG_STALE
    });
    expect(await prisma.agentCommand.findMany({
      select: { status: true, errorCode: true },
      orderBy: { createdAt: 'asc' }
    })).toEqual([
      { status: 'denied', errorCode: COMMAND_ERROR_CODES.CAPABILITY_DISABLED },
      { status: 'denied', errorCode: COMMAND_ERROR_CODES.CONFIG_STALE }
    ]);
  });

  it('denies cross-tenant resources and stale ownership before execution', async () => {
    const crossTenant = await executor.execute(liveInput(context, {
      arguments: { amount: 1, resourceTenantId: 'tenant-other' }
    }));
    const staleOwnership = await executor.execute(liveInput(context, {
      arguments: { amount: 2 },
      expectedAssignmentVersion: 1
    }));

    expect(crossTenant).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.TENANT_MISMATCH
    });
    expect(staleOwnership).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.OWNERSHIP_STALE
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 0 });
  });

  it('does not load or authorize cross-tenant AgentAction rows in live or preview contexts', async () => {
    const otherTenant = await prisma.tenant.create({
      data: {
        id: 'tenant-command-action-other',
        name: 'Command Action Other',
        email: 'command-action-other@example.test'
      }
    });
    const crossTenantAgent = await prisma.aIAgent.create({
      data: {
        id: 'agent-command-action-cross',
        tenantId: otherTenant.id,
        name: 'Cross Tenant Command Agent',
        instructions: 'Must not authorize in another tenant.',
        isActive: true,
        isPublished: true,
        configVersion: 1
      }
    });
    await prisma.agentAction.create({
      data: {
        agentId: crossTenantAgent.id,
        key: 'record_effect',
        type: 'record_effect',
        config: {},
        instructions: 'Cross-tenant capability.',
        isEnabled: true
      }
    });
    const crossTenantRun = await prisma.agentRun.create({
      data: {
        id: 'run-command-action-cross',
        tenantId: context.tenant.id,
        conversationId: context.conversation.id,
        inboundMessageId: 'inbound-command-action-cross',
        sourceAgentId: crossTenantAgent.id,
        agentConfigVersion: crossTenantAgent.configVersion
      }
    });
    const definition = registry.get('record_effect');

    const liveState = await loadLiveCommandContext({
      prisma,
      tenantId: context.tenant.id,
      runId: crossTenantRun.id,
      expectedAssignmentVersion: 0,
      definition
    });
    const previewState = await loadPreviewCommandContext({
      prisma,
      tenantId: context.tenant.id,
      sourceAgentId: crossTenantAgent.id,
      sourceConfigVersion: crossTenantAgent.configVersion,
      definition,
      mockContact: {}
    });

    expect(liveState.capabilityRows).toEqual([]);
    expect(previewState.capabilityRows).toEqual([]);
    await expect(evaluateCommandPolicy({
      prisma,
      state: liveState,
      definition,
      catalog,
      args: { amount: 1 },
      executionMode: 'live',
      createPolicyScope: () => Object.freeze({})
    })).resolves.toMatchObject({
      allowed: false,
      code: COMMAND_ERROR_CODES.CAPABILITY_DISABLED
    });
    await expect(evaluateCommandPolicy({
      prisma,
      state: previewState,
      definition,
      catalog,
      args: { amount: 1 },
      executionMode: 'preview',
      createPolicyScope: () => Object.freeze({})
    })).resolves.toMatchObject({
      allowed: false,
      code: COMMAND_ERROR_CODES.CAPABILITY_DISABLED
    });
  });

  it('executes a duplicated intent once and replays its durable result', async () => {
    const input = liveInput(context);
    await Promise.all([executor.execute(input), executor.execute(input)]);
    const replay = await executor.execute(input);

    expect(replay).toMatchObject({
      status: 'succeeded',
      replayed: true,
      result: { recorded: 1 }
    });
    expect(await prisma.agentCommand.count()).toBe(1);
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 1 });
  });

  it('passes the server-derived command id into internal execution context and scope', async () => {
    const result = await executor.execute(liveInput(context, {
      type: 'capture_command_id'
    }));

    expect(result.status).toBe('succeeded');
    expect(result.result).toEqual({
      contextCommandId: result.commandId,
      scopeCommandId: result.commandId
    });
  });

  it('allows only one different terminal command to mutate a run', async () => {
    const [first, second] = await Promise.all([
      executor.execute(liveInput(context, {
        type: 'terminal_one',
        arguments: { amount: 1 }
      })),
      executor.execute(liveInput(context, {
        type: 'terminal_two',
        arguments: { amount: 2 }
      }))
    ]);

    expect([first.status, second.status].sort()).toEqual(['conflict', 'succeeded']);
    expect([first.code, second.code]).toContain(COMMAND_ERROR_CODES.TERMINAL_COMMAND_EXISTS);
    expect(await prisma.agentCommand.findMany({
      where: { runId: context.run.id },
      select: { status: true, errorCode: true },
      orderBy: { type: 'asc' }
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({
        status: 'conflict',
        errorCode: COMMAND_ERROR_CODES.TERMINAL_COMMAND_EXISTS
      }),
      expect.objectContaining({ status: 'succeeded' })
    ]));
    expect((await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).failedAttempts).toBeOneOf([1, 2]);
  });

  it('replays duplicate terminal requests without conflicting their shared command', async () => {
    const input = liveInput(context, {
      type: 'terminal_one',
      arguments: { amount: 1 }
    });

    const [first, second] = await Promise.all([
      executor.execute(input),
      executor.execute(input)
    ]);
    const commands = await prisma.agentCommand.findMany({
      where: { runId: context.run.id, type: 'terminal_one' },
      select: { status: true, errorCode: true, terminalSlot: true }
    });

    expect([first.status, second.status]).not.toContain('conflict');
    expect(commands).toEqual([{
      status: 'succeeded',
      errorCode: null,
      terminalSlot: true
    }]);
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 1 });
  });

  it('previews policy without evaluating or writing live concurrency state', async () => {
    const before = await prisma.agentCommand.count();
    const preview = await executor.preview({
      tenantId: context.tenant.id,
      sourceAgentId: context.agent.id,
      sourceConfigVersion: 1,
      type: 'record_effect',
      arguments: { amount: 1 },
      mockContact: { lifecycleStage: 'lead' }
    });

    expect(preview).toMatchObject({
      mode: 'preview',
      status: 'previewed',
      allowed: true,
      checks: {
        schema: 'passed',
        source: 'passed',
        capability: 'passed',
        config: 'passed',
        ownership: 'not_evaluated',
        terminalSlot: 'not_evaluated',
        idempotency: 'not_evaluated',
        transactionWrites: 'not_evaluated',
        outboxDelivery: 'not_evaluated',
        providerOutcome: 'not_evaluated'
      }
    });
    expect(await prisma.agentCommand.count()).toBe(before);
  });

  it('records shadow evaluation without running the handler or claiming terminal state', async () => {
    await prisma.tenant.update({
      where: { id: context.tenant.id },
      data: { agentRuntimeMode: 'shadow' }
    });

    const result = await executor.execute(liveInput(context, {
      type: 'terminal_one'
    }));

    expect(result).toMatchObject({ status: 'shadowed', wouldExecute: true });
    expect(await prisma.agentCommand.findFirst({
      where: { runId: context.run.id },
      select: { status: true, terminalSlot: true, arguments: true }
    })).toEqual({
      status: 'shadowed',
      terminalSlot: null,
      arguments: { amount: 1 }
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 0 });
  });

  it('records mutation-disabled shadow policy without executing', async () => {
    await prisma.tenant.update({
      where: { id: context.tenant.id },
      data: { agentRuntimeMode: 'shadow' }
    });
    process.env.AGENT_MUTATIONS_KILL_SWITCH = 'true';

    const result = await executor.execute(liveInput(context));

    expect(result).toMatchObject({
      status: 'shadowed',
      wouldExecute: false,
      code: COMMAND_ERROR_CODES.MUTATIONS_DISABLED
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 0 });
  });

  it.each([
    'AGENT_RUNTIME_KILL_SWITCH',
    'AGENT_MUTATIONS_KILL_SWITCH'
  ])('denies live mutation when %s is enabled', async (flag) => {
    process.env[flag] = 'true';

    const result = await executor.execute(liveInput(context));

    expect(result).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.MUTATIONS_DISABLED
    });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 0 });
  });

  it('rechecks revoked authority inside the execution transaction', async () => {
    revokeOnAuthorize = true;

    const result = await executor.execute(liveInput(context, {
      type: 'revoke_during_policy'
    }));

    expect(result).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.CAPABILITY_DISABLED
    });
    expect(revokeHandler).not.toHaveBeenCalled();
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 0 });
  });

  it('rolls back domain writes when an internal handler fails', async () => {
    const result = await executor.execute(liveInput(context, {
      type: 'fail_after_effect'
    }));

    expect(result).toMatchObject({
      status: 'failed',
      code: COMMAND_ERROR_CODES.COMMAND_FAILED
    });
    expect(await prisma.agentCommand.findFirst({
      where: { type: 'fail_after_effect' },
      select: { errorCode: true }
    })).toEqual({ errorCode: COMMAND_ERROR_CODES.COMMAND_FAILED });
    expect(await prisma.conversation.findUnique({
      where: { id: context.conversation.id },
      select: { failedAttempts: true }
    })).toEqual({ failedAttempts: 0 });
  });

  it('fails closed when a capability key is ambiguous', async () => {
    await prisma.agentAction.create({
      data: {
        agentId: context.agent.id,
        key: 'record_effect',
        type: 'record_effect_duplicate',
        config: {},
        instructions: 'Duplicate capability.',
        isEnabled: true
      }
    });

    const result = await executor.execute(liveInput(context, {
      arguments: { amount: 7 }
    }));

    expect(result).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.CAPABILITY_DISABLED
    });
  });

  it('enforces integration tenant, status, and outbox-only execution', async () => {
    const otherTenant = await prisma.tenant.create({
      data: {
        id: 'tenant-command-other',
        name: 'Other Tenant',
        email: 'command-other@example.test'
      }
    });
    const crossTenantIntegration = await prisma.integration.create({
      data: {
        id: 'integration-cross-tenant',
        tenantId: otherTenant.id,
        type: 'smtp',
        name: 'Other SMTP',
        credentials: 'encrypted',
        status: 'active'
      }
    });
    const action = await prisma.agentAction.create({
      data: {
        agentId: context.agent.id,
        key: 'send_email',
        type: 'send_email',
        integrationId: crossTenantIntegration.id,
        config: {},
        instructions: 'Send email.',
        isEnabled: true
      }
    });

    const crossTenant = await executor.execute(liveInput(context, {
      type: 'send_email',
      arguments: { amount: 3 }
    }));
    const preview = await executor.preview({
      tenantId: context.tenant.id,
      sourceAgentId: context.agent.id,
      sourceConfigVersion: 1,
      type: 'send_email',
      arguments: { amount: 4 },
      mockContact: {}
    });

    expect(crossTenant).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.TENANT_MISMATCH
    });
    expect(preview).toMatchObject({
      status: 'previewed',
      allowed: false,
      code: COMMAND_ERROR_CODES.TENANT_MISMATCH
    });
    expect(buildEmailOutboxIntent).not.toHaveBeenCalled();

    const localIntegration = await prisma.integration.create({
      data: {
        id: 'integration-local',
        tenantId: context.tenant.id,
        type: 'smtp',
        name: 'Local SMTP',
        credentials: 'encrypted',
        status: 'revoked'
      }
    });
    await prisma.agentAction.update({
      where: { id: action.id },
      data: { integrationId: localIntegration.id }
    });
    const revoked = await executor.execute(liveInput(context, {
      type: 'send_email',
      arguments: { amount: 5 }
    }));

    expect(revoked).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.CAPABILITY_DISABLED
    });

    await prisma.integration.update({
      where: { id: localIntegration.id },
      data: { status: 'active' }
    });
    const queued = await executor.execute(liveInput(context, {
      type: 'send_email',
      arguments: { amount: 6 }
    }));

    expect(queued).toMatchObject({
      status: 'succeeded',
      result: {
        delivery: 'outbox',
        outboxStatus: 'pending'
      }
    });
    expect(buildEmailOutboxIntent).toHaveBeenCalledTimes(1);
    expect(providerCall).not.toHaveBeenCalled();
    expect(await prisma.outboxEvent.count({
      where: { tenantId: context.tenant.id, eventType: 'email.send' }
    })).toBe(1);
  });

  it('does not run a hidden handler without a registered enabled capability', async () => {
    const result = await executor.execute(liveInput(context, {
      type: 'send_email'
    }));

    expect(result).toMatchObject({
      status: 'denied',
      code: COMMAND_ERROR_CODES.CAPABILITY_DISABLED
    });
    expect(buildEmailOutboxIntent).not.toHaveBeenCalled();
  });
});
