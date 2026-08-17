const { createAgentService } = require('../../../src/agents/agent.service');

function createServiceFixture(primaryAgent) {
  const tenantFallback = {
    id: 'agent-nasa',
    tenantId: 'tenant-1',
    name: 'NASA Agent',
    isActive: true,
    isPublished: true,
    deletedAt: null
  };
  const prisma = {
    conversation: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'conversation-1',
        tenantId: 'tenant-1',
        instanceId: 'instance-greens',
        instance: primaryAgent === undefined ? null : {
          id: 'instance-greens',
          tenantId: 'tenant-1',
          primaryAgentId: primaryAgent?.id || null,
          primaryAgent: primaryAgent || null
        }
      })
    },
    aIAgent: { findFirst: vi.fn().mockResolvedValue(tenantFallback) }
  };
  const ownershipGateway = { ensureDefaultOwner: vi.fn().mockResolvedValue({}) };
  return {
    ownershipGateway,
    prisma,
    service: createAgentService({ prisma, ownershipGateway })
  };
}

describe('Instance-scoped default Agent resolution', () => {
  it('selects only the connected account Primary Agent and never tenant priority', async () => {
    const greensAgent = {
      id: 'agent-greens',
      tenantId: 'tenant-1',
      name: 'Greens Agent',
      isActive: true,
      isPublished: true,
      deletedAt: null,
      knowledgeSources: [],
      actions: []
    };
    const { ownershipGateway, prisma, service } = createServiceFixture(greensAgent);

    await expect(service.assignDefaultAgent('conversation-1', 'tenant-1'))
      .resolves.toMatchObject({ id: 'agent-greens' });

    expect(prisma.aIAgent.findFirst).not.toHaveBeenCalled();
    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: { id: 'conversation-1', tenantId: 'tenant-1' },
      include: {
        instance: {
          include: {
            primaryAgent: {
              include: {
                knowledgeSources: { where: { isActive: true } },
                actions: { where: { isEnabled: true } }
              }
            }
          }
        }
      }
    });
    expect(ownershipGateway.ensureDefaultOwner).toHaveBeenCalledWith(expect.objectContaining({
      targetAgentId: 'agent-greens'
    }));
  });

  it.each([
    [undefined],
    [null],
    [{ id: 'agent-greens', tenantId: 'tenant-2', isActive: true, isPublished: true, deletedAt: null }],
    [{ id: 'agent-greens', tenantId: 'tenant-1', isActive: false, isPublished: true, deletedAt: null }],
    [{ id: 'agent-greens', tenantId: 'tenant-1', isActive: true, isPublished: false, deletedAt: null }],
    [{ id: 'agent-greens', tenantId: 'tenant-1', isActive: true, isPublished: true, deletedAt: new Date() }]
  ])('fails closed without a usable account Primary Agent %#', async (primaryAgent) => {
    const { ownershipGateway, prisma, service } = createServiceFixture(primaryAgent);

    await expect(service.assignDefaultAgent('conversation-1', 'tenant-1')).resolves.toBeNull();
    expect(prisma.aIAgent.findFirst).not.toHaveBeenCalled();
    expect(ownershipGateway.ensureDefaultOwner).not.toHaveBeenCalled();
  });
});
