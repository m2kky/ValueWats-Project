const { createConversationOwnershipService } = require('../../conversations/conversationOwnershipService');
const { createCommandExecutor } = require('../commands/commandExecutor');
const { createAssignmentTargetService } = require('../commands/internal/assignmentTargetService');
const { createContactMutationService } = require('../../contacts/contactMutationService');

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
      const contacts = createContactMutationService(transaction);
      return Object.freeze({
        resolveAssignmentTarget: (input) => targets.resolve(input),
        assignAi: (input) => ownership.assignAi(transaction, input),
        assignHuman: (input) => ownership.assignHuman(transaction, input),
        closeConversation: (input) => ownership.close(transaction, input),
        updateContact: (context, updates) => contacts.updateContact(context, updates),
        updateLifecycle: (context, stage) => contacts.updateLifecycle(context, stage),
        modifyTags: (context, args) => contacts.modifyTags(context, args),
        addInternalComment: (context, content) => contacts.addInternalComment(context, content)
      });
    }
  });
}

module.exports = { createAgentCommandExecutor };
