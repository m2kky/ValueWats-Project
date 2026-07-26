const { capabilityCatalog } = require('../../src/agents/config/capabilityCatalog');
const { createCommandExecutor } = require('../../src/agents/commands/commandExecutor');
const { createCommandRegistry } = require('../../src/agents/commands/commandRegistry');
const {
  createAssignConversationDefinition
} = require('../../src/agents/commands/internal/assignConversation');
const { closeConversationCommand } = require('../../src/agents/commands/internal/closeConversation');
const {
  createAssignmentTargetService
} = require('../../src/agents/commands/internal/assignmentTargetService');
const {
  createConversationOwnershipService
} = require('../../src/conversations/conversationOwnershipService');

const ownershipService = createConversationOwnershipService();

function createPolicyScope({ prisma }) {
  const targets = createAssignmentTargetService(prisma);
  return Object.freeze({
    resolveAssignmentTarget: (input) => targets.resolve(input)
  });
}

function createExecutionScope({ transaction }) {
  const targets = createAssignmentTargetService(transaction);
  return Object.freeze({
    resolveAssignmentTarget: (input) => targets.resolve(input),
    assignAi: (input) => ownershipService.assignAi(transaction, input),
    assignHuman: (input) => ownershipService.assignHuman(transaction, input),
    closeConversation: (input) => ownershipService.close(transaction, input)
  });
}

function createOwnershipExecutor(prisma, allowedTargets) {
  const registry = createCommandRegistry([
    createAssignConversationDefinition({ allowedTargets }),
    closeConversationCommand
  ], { catalog: capabilityCatalog });
  return createCommandExecutor({
    prisma,
    registry,
    catalog: capabilityCatalog,
    createPolicyScope,
    createExecutionScope
  });
}

async function seedOwnershipContext(prisma, {
  allowedTargets = ['agent:agent-target'],
  assignmentConfig = {},
  sourceAgentId = 'agent-source'
} = {}) {
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant-ownership',
      name: 'Ownership Tenant',
      email: 'ownership@example.test',
      agentRuntimeMode: 'v2'
    }
  });
  const sourceAgent = await prisma.aIAgent.create({
    data: {
      id: sourceAgentId,
      tenantId: tenant.id,
      name: 'Source Agent',
      instructions: 'Source',
      isActive: true,
      isPublished: true,
      configVersion: 1
    }
  });
  const targetAgent = await prisma.aIAgent.create({
    data: {
      id: 'agent-target',
      tenantId: tenant.id,
      name: 'Target Agent',
      instructions: 'Target',
      isActive: true,
      isPublished: true
    }
  });
  const otherAgent = await prisma.aIAgent.create({
    data: {
      id: 'agent-other',
      tenantId: tenant.id,
      name: 'Other Agent',
      instructions: 'Other',
      isActive: true,
      isPublished: true
    }
  });
  const humanAgent = await prisma.user.create({
    data: {
      id: 'user-agent',
      tenantId: tenant.id,
      email: 'agent-user@example.test',
      passwordHash: 'test',
      role: 'agent',
      isActive: true
    }
  });
  const humanAdmin = await prisma.user.create({
    data: {
      id: 'user-admin',
      tenantId: tenant.id,
      email: 'admin-user@example.test',
      passwordHash: 'test',
      role: 'admin',
      isActive: true
    }
  });
  const instance = await prisma.instance.create({
    data: {
      id: 'instance-ownership',
      tenantId: tenant.id,
      instanceName: 'ownership-instance',
      phoneNumber: '+15550003000',
      status: 'connected'
    }
  });
  const conversation = {
    id: 'conversation-ownership',
    tenantId: tenant.id,
    channelType: 'whatsapp',
    contactNumber: '+15550003001',
    currentAgentId: sourceAgent.id
  };
  await prisma.$executeRawUnsafe(
    'INSERT INTO "conversations" (id, tenant_id, channel_type, contact_number, unread_count, status, "currentAgentId", "created_at", "updated_at", assignment_version) VALUES ($1, $2, $3, $4, 0, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)',
    conversation.id,
    tenant.id,
    conversation.channelType,
    conversation.contactNumber,
    'open',
    sourceAgent.id
  );
  await prisma.conversationAgent.create({
    data: {
      conversationId: conversation.id,
      agentId: sourceAgent.id
    }
  });
  const inboundMessage = await prisma.chatMessage.create({
    data: {
      id: 'inbound-ownership',
      conversationId: conversation.id,
      instanceId: instance.id,
      direction: 'incoming',
      channelType: 'whatsapp',
      senderNumber: conversation.contactNumber,
      recipientNumber: instance.phoneNumber,
      content: 'Please transfer me.',
      status: 'received'
    }
  });
  const run = await prisma.agentRun.create({
    data: {
      id: 'run-ownership',
      tenantId: tenant.id,
      conversationId: conversation.id,
      inboundMessageId: inboundMessage.id,
      sourceAgentId: sourceAgent.id,
      agentConfigVersion: sourceAgent.configVersion
    }
  });
  await prisma.agentAction.createMany({
    data: [
      {
        agentId: sourceAgent.id,
        key: 'assign_conversation',
        type: 'assign_conversation',
        config: {
          allowedTargets,
          allowUnassignedHuman: false,
          teamStrategies: {},
          handoffMessage: 'I am transferring this conversation to the right specialist.',
          ...assignmentConfig
        },
        instructions: 'Assign only to configured targets.',
        isEnabled: true
      },
      {
        agentId: sourceAgent.id,
        key: 'close_conversation',
        type: 'close_conversation',
        config: {},
        instructions: 'Close resolved conversations.',
        isEnabled: true
      }
    ]
  });
  return {
    tenant,
    sourceAgent,
    targetAgent,
    otherAgent,
    humanAgent,
    humanAdmin,
    instance,
    conversation,
    inboundMessage,
    run
  };
}

function assignmentInput(context, target, overrides = {}) {
  return {
    tenantId: context.tenant.id,
    runId: context.run.id,
    type: 'assign_conversation',
    arguments: {
      target,
      reasonCode: 'specialist_required',
      reason: 'A specialist is required.'
    },
    expectedAssignmentVersion: 0,
    ...overrides
  };
}

module.exports = {
  assignmentInput,
  createExecutionScope,
  createOwnershipExecutor,
  createPolicyScope,
  ownershipService,
  seedOwnershipContext
};
