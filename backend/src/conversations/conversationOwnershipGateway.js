const prismaDefault = require('../config/database');
const {
  createConversationOwnershipService
} = require('./conversationOwnershipService');
const {
  exposedAssignmentTargets
} = require('../agents/commands/internal/assignmentPolicy');
const {
  createAssignmentTargetService
} = require('../agents/commands/internal/assignmentTargetService');

const ownershipServiceDefault = createConversationOwnershipService();

function ownerFromConversation(conversation) {
  if (conversation.currentAgentId) {
    return { kind: 'ai', id: conversation.currentAgentId };
  }
  if (conversation.assignedUserId) {
    return { kind: 'human', id: conversation.assignedUserId };
  }
  return { kind: 'unassigned' };
}

function createConversationOwnershipGateway({
  prisma = prismaDefault,
  ownershipService = ownershipServiceDefault
} = {}) {
  async function runSerializable(callback) {
    try {
      return await prisma.$transaction(callback, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error?.code === 'P2034') {
        const conflict = new Error('Conversation ownership changed');
        conflict.code = 'OWNERSHIP_STALE';
        throw conflict;
      }
      throw error;
    }
  }

  async function mutate({ tenantId, conversationId, operation, input = {} }) {
    return runSerializable(async (transaction) => {
      const conversation = await transaction.conversation.findFirst({
        where: { id: conversationId, tenantId },
        select: {
          id: true,
          status: true,
          currentAgentId: true,
          assignedUserId: true,
          assignmentVersion: true
        }
      });
      if (!conversation) {
        const error = new Error('Conversation not found');
        error.code = 'TENANT_MISMATCH';
        throw error;
      }
      if (operation === 'close' && conversation.status === 'closed') {
        return {
          conversationId,
          status: 'closed',
          assignmentVersion: conversation.assignmentVersion
        };
      }

      return ownershipService[operation](transaction, {
        ...input,
        tenantId,
        conversationId,
        expectedAssignmentVersion: conversation.assignmentVersion,
        expectedOwner: ownerFromConversation(conversation)
      });
    });
  }

  async function assignConfiguredTarget({
    tenantId,
    conversationId,
    sourceAgentId,
    target,
    reasonCode,
    reason,
    actorAgentId
  }) {
    return runSerializable(async (transaction) => {
      const [conversation, capability] = await Promise.all([
        transaction.conversation.findFirst({
          where: { id: conversationId, tenantId },
          select: {
            id: true,
            currentAgentId: true,
            assignedUserId: true,
            assignmentVersion: true
          }
        }),
        transaction.agentAction.findFirst({
          where: {
            agentId: sourceAgentId,
            key: 'assign_conversation',
            isEnabled: true,
            agent: { tenantId, deletedAt: null }
          },
          select: { config: true }
        })
      ]);
      if (!conversation || !capability) {
        const error = new Error('Assignment capability is unavailable');
        error.code = 'CAPABILITY_DISABLED';
        throw error;
      }

      const allowedTargets = exposedAssignmentTargets(capability.config);
      if (!allowedTargets.includes(target)) {
        const error = new Error('Assignment target is not authorized');
        error.code = 'CAPABILITY_DISABLED';
        throw error;
      }

      const resolved = await createAssignmentTargetService(transaction).resolve({
        tenantId,
        sourceAgentId,
        target,
        strategy: capability.config?.teamStrategies?.[target] || 'round_robin'
      });
      const operationInput = {
        tenantId,
        conversationId,
        expectedAssignmentVersion: conversation.assignmentVersion,
        expectedOwner: ownerFromConversation(conversation),
        reasonCode,
        reason,
        actorAgentId
      };
      const result = resolved.kind === 'ai'
        ? await ownershipService.assignAi(transaction, {
          ...operationInput,
          targetAgentId: resolved.id
        })
        : await ownershipService.assignHuman(transaction, {
          ...operationInput,
          targetUserId: resolved.id
        });
      return { ...result, resolvedTarget: resolved };
    });
  }

  return Object.freeze({
    assignAi(input) {
      return mutate({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        operation: 'assignAi',
        input
      });
    },
    assignHuman(input) {
      return mutate({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        operation: 'assignHuman',
        input
      });
    },
    ensureDefaultOwner(input) {
      return mutate({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        operation: 'ensureDefaultOwner',
        input
      });
    },
    unassign(input) {
      return mutate({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        operation: 'unassign',
        input
      });
    },
    close(input) {
      return mutate({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        operation: 'close',
        input
      });
    },
    assignConfiguredTarget,
    drainAgent(transaction, input) {
      return ownershipService.drainAgent(transaction, input);
    }
  });
}

const conversationOwnershipGateway = createConversationOwnershipGateway();

module.exports = {
  conversationOwnershipGateway,
  createConversationOwnershipGateway,
  ownerFromConversation
};
