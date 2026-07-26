const closeConversationCommand = Object.freeze({
  type: 'close_conversation',
  capabilityType: 'close_conversation',
  risk: 'ownership_change',
  delivery: 'internal',
  terminalConversationCommand: true,
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['reason'],
    properties: {
      reason: { type: 'string', minLength: 1, maxLength: 500 }
    }
  },
  async execute(scope, context, args) {
    return scope.closeConversation({
      tenantId: context.tenantId,
      conversationId: context.conversationId,
      expectedAssignmentVersion: context.assignmentVersion,
      expectedOwner: { kind: 'ai', id: context.sourceAgentId },
      actorAgentId: context.sourceAgentId,
      reason: args.reason,
      runId: context.runId,
      commandId: context.commandId
    });
  }
});

module.exports = { closeConversationCommand };
