const {
  createConversationOwnershipGateway
} = require('../../../src/conversations/conversationOwnershipGateway');

describe('conversation ownership gateway', () => {
  it('forwards assignment input to the ownership service', async () => {
    const transaction = {
      conversation: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'conversation-1',
          status: 'open',
          currentAgentId: null,
          assignedUserId: null,
          assignmentVersion: 4
        })
      }
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(transaction))
    };
    const ownershipService = {
      assignAi: vi.fn().mockResolvedValue({ conversationId: 'conversation-1' })
    };
    const gateway = createConversationOwnershipGateway({ prisma, ownershipService });

    await gateway.assignAi({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      targetAgentId: 'agent-1',
      actorUserId: 'user-1',
      reason: 'Manual assignment'
    });

    expect(ownershipService.assignAi).toHaveBeenCalledWith(transaction, expect.objectContaining({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      targetAgentId: 'agent-1',
      actorUserId: 'user-1',
      reason: 'Manual assignment',
      expectedAssignmentVersion: 4,
      expectedOwner: { kind: 'unassigned' }
    }));
  });
});
