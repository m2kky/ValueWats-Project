const { createOutboxService } = require('../events/outboxService');

const OWNERSHIP_ERROR_CODES = Object.freeze({
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  OWNERSHIP_STALE: 'OWNERSHIP_STALE',
  TARGET_INELIGIBLE: 'TARGET_INELIGIBLE',
  SOURCE_TARGET_DENIED: 'SOURCE_TARGET_DENIED',
  CONVERSATION_CLOSED: 'CONVERSATION_CLOSED',
  HANDOFF_CONTEXT_INVALID: 'HANDOFF_CONTEXT_INVALID'
});

class ConversationOwnershipError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'ConversationOwnershipError';
    this.code = code;
  }
}

function ownershipError(code) {
  return new ConversationOwnershipError(code);
}

function isScopedId(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function expectedOwnerWhere(expectedOwner) {
  if (expectedOwner?.kind === 'ai' && expectedOwner.id) {
    return { currentAgentId: expectedOwner.id, assignedUserId: null };
  }
  if (expectedOwner?.kind === 'human' && expectedOwner.id) {
    return { currentAgentId: null, assignedUserId: expectedOwner.id };
  }
  if (expectedOwner?.kind === 'unassigned') {
    return { currentAgentId: null, assignedUserId: null };
  }
  throw ownershipError(OWNERSHIP_ERROR_CODES.OWNERSHIP_STALE);
}

function compactMetadata(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

function createConversationOwnershipService({ clock = () => new Date() } = {}) {
  function requireTransaction(transaction) {
    if (!transaction || typeof transaction.$transaction === 'function') {
      throw new Error('Transaction-scoped Prisma client is required');
    }
  }

  function validateConversationOperation(transaction, input) {
    requireTransaction(transaction);
    if (!isScopedId(input?.tenantId) || !isScopedId(input?.conversationId)) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.TENANT_MISMATCH);
    }
    if (!Number.isInteger(input.expectedAssignmentVersion)) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.OWNERSHIP_STALE);
    }
    expectedOwnerWhere(input.expectedOwner);
  }

  async function loadConversation(transaction, { tenantId, conversationId }) {
    requireTransaction(transaction);
    if (!isScopedId(tenantId) || !isScopedId(conversationId)) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.TENANT_MISMATCH);
    }
    const conversation = await transaction.conversation.findFirst({
      where: { id: conversationId, tenantId },
      select: {
        id: true,
        tenantId: true,
        channelType: true,
        status: true,
        currentAgentId: true,
        assignedUserId: true,
        assignmentVersion: true
      }
    });
    if (!conversation) throw ownershipError(OWNERSHIP_ERROR_CODES.TENANT_MISMATCH);
    return conversation;
  }

  async function requireEligibleAgent(transaction, {
    tenantId,
    targetAgentId,
    expectedOwner
  }) {
    if (!isScopedId(targetAgentId)) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.TARGET_INELIGIBLE);
    }
    if (expectedOwner?.kind === 'ai' && expectedOwner.id === targetAgentId) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.SOURCE_TARGET_DENIED);
    }
    const target = await transaction.aIAgent.findFirst({
      where: {
        id: targetAgentId,
        tenantId,
        isActive: true,
        isPublished: true,
        deletedAt: null
      },
      select: { id: true }
    });
    if (!target) throw ownershipError(OWNERSHIP_ERROR_CODES.TARGET_INELIGIBLE);
    return target;
  }

  async function requireEligibleUser(transaction, { tenantId, targetUserId }) {
    if (targetUserId === null || targetUserId === undefined) return null;
    if (!isScopedId(targetUserId)) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.TARGET_INELIGIBLE);
    }
    const target = await transaction.user.findFirst({
      where: {
        id: targetUserId,
        tenantId,
        isActive: true,
        role: { in: ['agent', 'admin'] }
      },
      select: { id: true }
    });
    if (!target) throw ownershipError(OWNERSHIP_ERROR_CODES.TARGET_INELIGIBLE);
    return target;
  }

  async function claimOwnershipChange(transaction, input, data) {
    validateConversationOperation(transaction, input);
    const conversation = await loadConversation(transaction, input);
    if (conversation.status === 'closed') {
      throw ownershipError(OWNERSHIP_ERROR_CODES.CONVERSATION_CLOSED);
    }
    const changed = await transaction.conversation.updateMany({
      where: {
        id: input.conversationId,
        tenantId: input.tenantId,
        assignmentVersion: input.expectedAssignmentVersion,
        status: { not: 'closed' },
        ...expectedOwnerWhere(input.expectedOwner)
      },
      data: {
        ...data,
        assignmentVersion: { increment: 1 },
        assignmentChangedAt: clock()
      }
    });
    if (changed.count !== 1) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.OWNERSHIP_STALE);
    }
    return {
      ...conversation,
      assignmentVersion: input.expectedAssignmentVersion + 1
    };
  }

  async function endActiveSessions(transaction, input) {
    await transaction.conversationAgent.updateMany({
      where: {
        conversationId: input.conversationId,
        endedAt: null,
        conversation: { tenantId: input.tenantId }
      },
      data: {
        endedAt: clock(),
        handoffReason: input.reasonCode || input.reason || null
      }
    });
  }

  async function createActivity(transaction, input, {
    actionType,
    description,
    target
  }) {
    return transaction.activityLog.create({
      data: {
        tenantId: input.tenantId,
        contactId: null,
        conversationId: input.conversationId,
        userId: input.actorUserId || null,
        agentId: input.actorAgentId || null,
        actionType,
        description,
        metadata: compactMetadata({
          runId: input.runId,
          commandId: input.commandId,
          reasonCode: input.reasonCode,
          target
        })
      }
    });
  }

  async function createHandoff(transaction, input, conversation) {
    if (!input.handoffMessage) return {};
    if (!input.commandId || !input.runId || !input.inboundMessageId) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.HANDOFF_CONTEXT_INVALID);
    }
    const inbound = await transaction.chatMessage.findFirst({
      where: {
        id: input.inboundMessageId,
        conversationId: input.conversationId,
        conversation: { tenantId: input.tenantId }
      },
      select: {
        instanceId: true,
        channelType: true,
        senderNumber: true,
        recipientNumber: true
      }
    });
    if (!inbound?.instanceId) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.HANDOFF_CONTEXT_INVALID);
    }
    const instance = await transaction.instance.findFirst({
      where: {
        id: inbound.instanceId,
        tenantId: input.tenantId
      },
      select: {
        id: true,
        channelType: true,
        phoneNumberId: true,
        accessToken: true
      }
    });
    if (!instance) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.HANDOFF_CONTEXT_INVALID);
    }
    const pendingMessage = await transaction.chatMessage.create({
      data: {
        conversationId: input.conversationId,
        instanceId: instance.id,
        direction: 'outgoing',
        channelType: inbound.channelType || conversation.channelType,
        senderNumber: inbound.recipientNumber,
        recipientNumber: inbound.senderNumber,
        messageType: 'text',
        content: input.handoffMessage,
        status: 'pending'
      }
    });
    const provider = (
      ['messenger', 'instagram'].includes(instance.channelType)
      || (
        instance.channelType === 'whatsapp'
        && instance.phoneNumberId
        && instance.accessToken
      )
    ) ? 'meta' : 'evolution';
    const outboxEvent = await createOutboxService(transaction).createOrGet({
      tenantId: input.tenantId,
      commandId: input.commandId,
      runId: input.runId,
      aggregateType: 'channel_message',
      aggregateId: input.conversationId,
      eventType: 'channel.message.send',
      idempotencyKey: `${input.commandId}:handoff`,
      payload: {
        providerReference: {
          provider,
          instanceId: instance.id
        },
        pendingMessageId: pendingMessage.id
      }
    });
    return {
      handoffMessageId: pendingMessage.id,
      outboxEventId: outboxEvent.id
    };
  }

  async function assignAi(transaction, input) {
    validateConversationOperation(transaction, input);
    await requireEligibleAgent(transaction, input);
    const conversation = await claimOwnershipChange(transaction, input, {
      currentAgentId: input.targetAgentId,
      assignedUserId: null,
      aiEnabled: true,
      escalated: false,
      escalatedAt: null,
      escalationReason: null,
      status: 'open'
    });
    await endActiveSessions(transaction, input);
    await transaction.conversationAgent.create({
      data: {
        conversationId: input.conversationId,
        agentId: input.targetAgentId,
        startedAt: clock()
      }
    });
    await createActivity(transaction, input, {
      actionType: 'assigned',
      description: input.reason || 'Conversation assigned to AI agent',
      target: { kind: 'ai', id: input.targetAgentId }
    });
    const handoff = await createHandoff(transaction, input, conversation);
    return {
      conversationId: input.conversationId,
      assignmentVersion: conversation.assignmentVersion,
      owner: { kind: 'ai', id: input.targetAgentId },
      ...handoff
    };
  }

  async function assignHuman(transaction, input) {
    validateConversationOperation(transaction, input);
    await requireEligibleUser(transaction, input);
    const conversation = await claimOwnershipChange(transaction, input, {
      currentAgentId: null,
      assignedUserId: input.targetUserId || null,
      aiEnabled: false,
      escalated: true,
      escalatedAt: clock(),
      escalationReason: input.reason || 'Human handoff',
      status: 'open'
    });
    await endActiveSessions(transaction, input);
    await createActivity(transaction, input, {
      actionType: 'assigned',
      description: input.reason || 'Conversation assigned to human',
      target: { kind: 'human', id: input.targetUserId || null }
    });
    const handoff = await createHandoff(transaction, input, conversation);
    return {
      conversationId: input.conversationId,
      assignmentVersion: conversation.assignmentVersion,
      owner: { kind: 'human', id: input.targetUserId || null },
      ...handoff
    };
  }

  async function ensureDefaultOwner(transaction, input) {
    return assignAi(transaction, {
      ...input,
      expectedOwner: input.expectedOwner || { kind: 'unassigned' },
      reasonCode: input.reasonCode || 'default_owner'
    });
  }

  async function unassign(transaction, input) {
    validateConversationOperation(transaction, input);
    const conversation = await claimOwnershipChange(transaction, input, {
      currentAgentId: null,
      assignedUserId: null,
      aiEnabled: false,
      escalated: false,
      escalatedAt: null,
      escalationReason: null
    });
    await endActiveSessions(transaction, input);
    await createActivity(transaction, input, {
      actionType: 'unassigned',
      description: input.reason || 'Conversation unassigned',
      target: { kind: 'unassigned', id: null }
    });
    return {
      conversationId: input.conversationId,
      assignmentVersion: conversation.assignmentVersion,
      owner: { kind: 'unassigned', id: null }
    };
  }

  async function close(transaction, input) {
    validateConversationOperation(transaction, input);
    const conversation = await claimOwnershipChange(transaction, input, {
      status: 'closed',
      currentAgentId: null,
      assignedUserId: null,
      aiEnabled: false,
      escalated: false,
      escalatedAt: null,
      escalationReason: null
    });
    await endActiveSessions(transaction, input);
    await createActivity(transaction, input, {
      actionType: 'closed',
      description: input.reason || 'Conversation closed',
      target: { kind: 'closed', id: null }
    });
    return {
      conversationId: input.conversationId,
      assignmentVersion: conversation.assignmentVersion,
      status: 'closed'
    };
  }

  async function drainAgent(transaction, input) {
    requireTransaction(transaction);
    if (!isScopedId(input?.tenantId) || !isScopedId(input?.agentId)) {
      throw ownershipError(OWNERSHIP_ERROR_CODES.TENANT_MISMATCH);
    }
    const agent = await transaction.aIAgent.findFirst({
      where: { id: input.agentId, tenantId: input.tenantId },
      select: { id: true }
    });
    if (!agent) throw ownershipError(OWNERSHIP_ERROR_CODES.TENANT_MISMATCH);

    const assignments = input.expectedAssignments || await transaction.conversation.findMany({
      where: {
        tenantId: input.tenantId,
        currentAgentId: input.agentId,
        status: { not: 'closed' }
      },
      select: { id: true, assignmentVersion: true },
      orderBy: { id: 'asc' }
    }).then((rows) => rows.map((row) => ({
      conversationId: row.id,
      assignmentVersion: row.assignmentVersion
    })));

    let lastAssignmentVersion = null;
    for (const assignment of assignments) {
      const result = await unassign(transaction, {
        ...input,
        conversationId: assignment.conversationId,
        expectedAssignmentVersion: assignment.assignmentVersion,
        expectedOwner: { kind: 'ai', id: input.agentId },
        reasonCode: input.reasonCode || 'agent_drain'
      });
      lastAssignmentVersion = result.assignmentVersion;
    }
    await transaction.conversationAgent.updateMany({
      where: {
        agentId: input.agentId,
        endedAt: null,
        conversation: { tenantId: input.tenantId }
      },
      data: {
        endedAt: clock(),
        handoffReason: input.reasonCode || 'agent_drain'
      }
    });
    return {
      drained: assignments.length,
      assignmentVersion: lastAssignmentVersion
    };
  }

  return Object.freeze({
    ensureDefaultOwner,
    assignAi,
    assignHuman,
    unassign,
    close,
    drainAgent
  });
}

module.exports = {
  OWNERSHIP_ERROR_CODES,
  ConversationOwnershipError,
  createConversationOwnershipService
};
