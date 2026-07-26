const {
  resolveAgentRuntimeMode,
  areAgentMutationsEnabled
} = require('../runtime/runtimeFlags');
const { COMMAND_ERROR_CODES, normalizeCommandErrorCode } = require('./commandErrors');
const { sanitizeCommandError } = require('./commandSanitizer');

const NOT_EVALUATED = 'not_evaluated';

function denial(code, checks) {
  return { allowed: false, code, checks };
}

async function loadCapability(prisma, sourceAgentId, capabilityType) {
  return prisma.agentAction.findMany({
    where: { agentId: sourceAgentId, key: capabilityType },
    select: {
      id: true,
      key: true,
      isEnabled: true,
      config: true,
      integrationId: true,
      integration: {
        select: {
          id: true,
          tenantId: true,
          type: true,
          status: true
        }
      }
    },
    take: 2,
    orderBy: { id: 'asc' }
  });
}

async function loadLiveCommandContext({
  prisma,
  tenantId,
  runId,
  expectedAssignmentVersion,
  definition
}) {
  const run = await prisma.agentRun.findFirst({
    where: { id: runId, tenantId },
    select: {
      id: true,
      tenantId: true,
      conversationId: true,
      inboundMessageId: true,
      sourceAgentId: true,
      agentConfigVersion: true,
      tenant: {
        select: {
          id: true,
          status: true,
          agentRuntimeMode: true
        }
      },
      conversation: {
        select: {
          id: true,
          tenantId: true,
          currentAgentId: true,
          assignmentVersion: true
        }
      },
      sourceAgent: {
        select: {
          id: true,
          tenantId: true,
          isActive: true,
          isPublished: true,
          configVersion: true,
          deletedAt: true
        }
      }
    }
  });
  if (!run) return { errorCode: COMMAND_ERROR_CODES.TENANT_MISMATCH };

  const capabilityRows = run.sourceAgentId
    ? await loadCapability(prisma, run.sourceAgentId, definition.capabilityType)
    : [];

  return {
    run,
    tenant: run.tenant,
    conversation: run.conversation,
    sourceAgent: run.sourceAgent,
    capabilityRows,
    expectedAssignmentVersion,
    runtimeMode: resolveAgentRuntimeMode(run.tenant)
  };
}

async function loadPreviewCommandContext({
  prisma,
  tenantId,
  sourceAgentId,
  sourceConfigVersion,
  definition,
  mockContact
}) {
  const [tenant, sourceAgent, capabilityRows] = await Promise.all([
    prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { id: true, status: true }
    }),
    prisma.aIAgent.findFirst({
      where: { id: sourceAgentId, tenantId },
      select: {
        id: true,
        tenantId: true,
        isActive: true,
        isPublished: true,
        configVersion: true,
        deletedAt: true
      }
    }),
    loadCapability(prisma, sourceAgentId, definition.capabilityType)
  ]);

  return {
    tenant,
    sourceAgent,
    capabilityRows,
    sourceConfigVersion,
    conversation: {
      id: `preview:${sourceAgentId}`,
      tenantId,
      currentAgentId: sourceAgentId,
      assignmentVersion: 0
    },
    mockContact,
    runtimeMode: 'preview'
  };
}

function toCommandContext(state, executionMode) {
  const sourceConfigVersion = state.run?.agentConfigVersion ?? state.sourceConfigVersion;
  return Object.freeze({
    tenantId: state.tenant?.id,
    runId: state.run?.id || null,
    inboundMessageId: state.run?.inboundMessageId || null,
    conversationId: state.conversation?.id,
    sourceAgentId: state.sourceAgent?.id,
    sourceConfigVersion,
    assignmentVersion: state.conversation?.assignmentVersion ?? 0,
    expectedAssignmentVersion: state.expectedAssignmentVersion,
    executionMode,
    capability: state.capabilityRows?.length === 1
      ? Object.freeze({
        type: state.capabilityRows[0].key,
        config: state.capabilityRows[0].config,
        integration: state.capabilityRows[0].integration
          ? Object.freeze({
            id: state.capabilityRows[0].integration.id,
            type: state.capabilityRows[0].integration.type
          })
          : null
      })
      : null,
    mockContact: executionMode === 'preview' ? state.mockContact : undefined
  });
}

async function evaluateCommandPolicy({
  prisma,
  state,
  definition,
  catalog,
  args,
  executionMode,
  createPolicyScope
}) {
  const preview = executionMode === 'preview';
  const checks = {
    schema: 'passed',
    source: 'pending',
    capability: 'pending',
    config: 'pending',
    tenant: 'pending',
    ownership: preview ? NOT_EVALUATED : 'pending',
    command: 'pending'
  };

  if (!preview) {
    if (!areAgentMutationsEnabled()) {
      return denial(COMMAND_ERROR_CODES.MUTATIONS_DISABLED, checks);
    }
    if (executionMode === 'live' && state.runtimeMode !== 'v2') {
      return denial(COMMAND_ERROR_CODES.MUTATIONS_DISABLED, checks);
    }
  }

  if (!state.tenant || state.tenant.id !== state.conversation?.tenantId || state.tenant.status !== 'active') {
    checks.tenant = 'failed';
    return denial(COMMAND_ERROR_CODES.TENANT_MISMATCH, checks);
  }
  checks.tenant = 'passed';

  if (
    !state.sourceAgent
    || state.sourceAgent.tenantId !== state.tenant.id
    || !state.sourceAgent.isActive
    || !state.sourceAgent.isPublished
    || state.sourceAgent.deletedAt
  ) {
    checks.source = 'failed';
    return denial(COMMAND_ERROR_CODES.CAPABILITY_DISABLED, checks);
  }
  checks.source = 'passed';

  const capability = state.capabilityRows?.length === 1 ? state.capabilityRows[0] : null;
  const capabilityDefinition = catalog.get(definition.capabilityType);
  if (
    !capability
    || !capability.isEnabled
    || !capabilityDefinition
    || !capabilityDefinition.validateConfig(capability.config)
  ) {
    checks.capability = 'failed';
    return denial(COMMAND_ERROR_CODES.CAPABILITY_DISABLED, checks);
  }
  checks.capability = 'passed';

  const integrationPolicy = capabilityDefinition.integration;
  const integration = capability.integration;
  checks.integration = 'pending';
  if (capability.integrationId) {
    if (!integration || integration.tenantId !== state.tenant.id) {
      checks.integration = 'failed';
      return denial(COMMAND_ERROR_CODES.TENANT_MISMATCH, checks);
    }
    if (
      integration.status !== 'active'
      || !integrationPolicy.types.includes(integration.type)
    ) {
      checks.integration = 'failed';
      return denial(COMMAND_ERROR_CODES.CAPABILITY_DISABLED, checks);
    }
  } else if (integrationPolicy.required) {
    checks.integration = 'failed';
    return denial(COMMAND_ERROR_CODES.CAPABILITY_DISABLED, checks);
  }
  checks.integration = 'passed';

  const sourceConfigVersion = state.run?.agentConfigVersion ?? state.sourceConfigVersion;
  if (
    !Number.isInteger(sourceConfigVersion)
    || sourceConfigVersion !== state.sourceAgent.configVersion
  ) {
    checks.config = 'failed';
    return denial(COMMAND_ERROR_CODES.CONFIG_STALE, checks);
  }
  checks.config = 'passed';

  if (!preview) {
    if (
      state.conversation.currentAgentId !== state.sourceAgent.id
      || state.conversation.assignmentVersion !== state.expectedAssignmentVersion
    ) {
      checks.ownership = 'failed';
      return denial(COMMAND_ERROR_CODES.OWNERSHIP_STALE, checks);
    }
    checks.ownership = 'passed';
  }

  const context = toCommandContext(state, executionMode);
  const policyScope = createPolicyScope
    ? createPolicyScope({ prisma, context, executionMode })
    : Object.freeze({});
  let commandDecision;
  try {
    commandDecision = definition.authorize
      ? await definition.authorize(context, args, policyScope)
      : { allowed: true };
  } catch (error) {
    const sanitized = sanitizeCommandError(error);
    checks.command = 'failed';
    return {
      ...denial(sanitized.code, checks),
      context,
      error: sanitized
    };
  }
  if (!commandDecision?.allowed) {
    checks.command = 'failed';
    return {
      ...denial(commandDecision?.code || COMMAND_ERROR_CODES.CAPABILITY_DISABLED, checks),
      code: normalizeCommandErrorCode(commandDecision?.code || COMMAND_ERROR_CODES.CAPABILITY_DISABLED),
      context
    };
  }
  checks.command = 'passed';

  return { allowed: true, checks, context };
}

module.exports = {
  NOT_EVALUATED,
  evaluateCommandPolicy,
  loadLiveCommandContext,
  loadPreviewCommandContext
};
