const { createConversationOwnershipService } = require('../../conversations/conversationOwnershipService');
const { createCommandExecutor } = require('../commands/commandExecutor');
const { createAssignmentTargetService } = require('../commands/internal/assignmentTargetService');

function createAgentCommandExecutor(prisma) {
  const ownership = createConversationOwnershipService();

  return createCommandExecutor({
    prisma,
    createPolicyScope: ({ prisma: scopedPrisma }) => {
      const targets = createAssignmentTargetService(scopedPrisma);
      return Object.freeze({
        resolveAssignmentTarget: (input) => targets.resolve(input)
      });
    },
    createExecutionScope: ({ transaction }) => {
      const targets = createAssignmentTargetService(transaction);
      return Object.freeze({
        resolveAssignmentTarget: (input) => targets.resolve(input),
        assignAi: (input) => ownership.assignAi(transaction, input),
        assignHuman: (input) => ownership.assignHuman(transaction, input),
        closeConversation: (input) => ownership.close(transaction, input)
      });
    }
  });
}

module.exports = { createAgentCommandExecutor };
