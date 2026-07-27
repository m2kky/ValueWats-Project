const {
  createConversationOwnershipService
} = require('../../../src/conversations/conversationOwnershipService');

describe('conversation ownership service', () => {
  it('allows an active tenant owner to receive a manual assignment', async () => {
    const transaction = {
      user: {
        findFirst: vi.fn(({ where }) => (
          where.role.in.includes('owner') ? { id: 'owner-1' } : null
        ))
      },
      conversation: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'conversation-1',
          tenantId: 'tenant-1',
          channelType: 'messenger',
          status: 'open',
          currentAgentId: 'agent-1',
          assignedUserId: null,
          assignmentVersion: 2
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      conversationAgent: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      activityLog: { create: vi.fn().mockResolvedValue({ id: 'activity-1' }) }
    };

    await expect(createConversationOwnershipService().assignHuman(transaction, {
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      targetUserId: 'owner-1',
      actorUserId: 'owner-1',
      expectedAssignmentVersion: 2,
      expectedOwner: { kind: 'ai', id: 'agent-1' }
    })).resolves.toMatchObject({
      owner: { kind: 'human', id: 'owner-1' },
      assignmentVersion: 3
    });
  });
});
