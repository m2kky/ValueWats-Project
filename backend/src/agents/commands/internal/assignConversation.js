const {
  authorizeAssignment,
  buildAssignmentArgumentSchema
} = require('./assignmentPolicy');

function createAssignConversationDefinition({ allowedTargets } = {}) {
  const parameters = Array.isArray(allowedTargets)
    ? buildAssignmentArgumentSchema({
      allowedTargets,
      allowUnassignedHuman: allowedTargets.includes('human'),
      teamStrategies: {},
      handoffMessage: 'Configured at runtime.'
    })
    : {
      type: 'object',
      additionalProperties: false,
      required: ['target', 'reasonCode', 'reason'],
      properties: {
        // The production registry is shared by all capability configurations.
        // Exact target authorization is rechecked from the live capability below.
        target: { type: 'string', minLength: 1, maxLength: 200 },
        reasonCode: {
          type: 'string',
          enum: [
            'customer_request',
            'specialist_required',
            'policy_required',
            'automation_rule',
            'repeated_failure'
          ]
        },
        reason: { type: 'string', minLength: 1, maxLength: 500 }
      }
    };
  return Object.freeze({
    type: 'assign_conversation',
    capabilityType: 'assign_conversation',
    risk: 'ownership_change',
    delivery: 'internal',
    terminalConversationCommand: true,
    parameters,
    authorize: authorizeAssignment,
    async execute(scope, context, args) {
      const config = context.capability.config;
      const target = await scope.resolveAssignmentTarget({
        tenantId: context.tenantId,
        sourceAgentId: context.sourceAgentId,
        target: args.target,
        strategy: config.teamStrategies?.[args.target] || 'round_robin'
      });
      const ownership = {
        tenantId: context.tenantId,
        conversationId: context.conversationId,
        expectedAssignmentVersion: context.assignmentVersion,
        expectedOwner: { kind: 'ai', id: context.sourceAgentId },
        actorAgentId: context.sourceAgentId,
        reasonCode: args.reasonCode,
        reason: args.reason,
        runId: context.runId,
        commandId: context.commandId,
        inboundMessageId: context.inboundMessageId,
        handoffMessage: config.handoffMessage
      };
      return target.kind === 'ai'
        ? scope.assignAi({ ...ownership, targetAgentId: target.id })
        : scope.assignHuman({ ...ownership, targetUserId: target.id });
    }
  });
}

const assignConversationCommand = createAssignConversationDefinition();

module.exports = { assignConversationCommand, createAssignConversationDefinition };
