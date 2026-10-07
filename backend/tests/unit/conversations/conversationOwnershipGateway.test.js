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

  describe('automatic default ownership', () => {
    function fixture(state = {}) {
      const conversation = {
        id: 'conversation-1', status: 'open', currentAgentId: null, assignedUserId: null,
        aiEnabled: false, escalated: false, assignmentVersion: 4,
        instance: { primaryAgentId: 'agent-1', tenantId: 'tenant-1' },
        ...state
      };
      const transaction = { conversation: { findFirst: vi.fn().mockResolvedValue(conversation) } };
      const prisma = { $transaction: vi.fn((callback) => callback(transaction)) };
      const ownershipService = { ensureDefaultOwner: vi.fn().mockResolvedValue({ owner: { kind: 'ai', id: 'agent-1' } }) };
      return { transaction, ownershipService, gateway: createConversationOwnershipGateway({ prisma, ownershipService }) };
    }

    it('assigns the configured account Primary Agent even when an unassigned conversation has AI disabled', async () => {
      const { gateway, transaction, ownershipService } = fixture();
      await expect(gateway.ensureDefaultOwner({
        tenantId: 'tenant-1', conversationId: 'conversation-1', targetAgentId: 'agent-1'
      })).resolves.toMatchObject({ owner: { kind: 'ai', id: 'agent-1' } });
      expect(ownershipService.ensureDefaultOwner).toHaveBeenCalledWith(transaction, expect.objectContaining({
        expectedAssignmentVersion: 4, expectedOwner: { kind: 'unassigned' }, targetAgentId: 'agent-1'
      }));
    });

    it.each([
      { currentAgentId: 'specialist-1' },
      { assignedUserId: 'human-1' },
      { escalated: true },
      { status: 'closed' },
      { instance: { primaryAgentId: 'different-agent', tenantId: 'tenant-1' } },
      { instance: { primaryAgentId: 'agent-1', tenantId: 'tenant-2' } },
      { instance: null }
    ])('does not replace a fresh ownership decision or a changed account Primary Agent %#', async (state) => {
      const { gateway, ownershipService } = fixture(state);
      await expect(gateway.ensureDefaultOwner({
        tenantId: 'tenant-1', conversationId: 'conversation-1', targetAgentId: 'agent-1'
      })).resolves.toMatchObject({ assigned: false });
      expect(ownershipService.ensureDefaultOwner).not.toHaveBeenCalled();
    });
  });
});
