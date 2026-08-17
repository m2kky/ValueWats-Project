const {
  PAGE_AGENT_ROUTING_ERROR_CODES,
  createPageAgentRoutingService
} = require('../../../src/agents/pageAgentRoutingService');

function createFixture({ agent = {}, profile = {}, binding = {} } = {}) {
  const instanceRow = {
    id: 'instance-1',
    tenantId: 'tenant-1',
    primaryAgentId: 'agent-old',
    channelType: 'messenger',
    instanceName: 'Greens Facebook'
  };
  const agentRow = {
    id: 'agent-new',
    tenantId: 'tenant-1',
    isActive: true,
    isPublished: true,
    deletedAt: null,
    ...agent
  };
  const profileRow = profile === null ? null : {
    id: 'profile-new',
    tenantId: 'tenant-1',
    agentId: 'agent-new',
    configVersion: 3,
    ...profile
  };
  const bindingRow = binding === null ? null : {
    id: 'binding-1',
    tenantId: 'tenant-1',
    instanceId: 'instance-1',
    profileId: 'profile-old',
    isEnabled: true,
    ...binding
  };
  const tx = {
    instance: {
      findFirst: vi.fn().mockResolvedValue(instanceRow),
      update: vi.fn(({ data }) => Promise.resolve({ ...instanceRow, ...data, primaryAgent: agentRow }))
    },
    aIAgent: { findFirst: vi.fn().mockResolvedValue(agentRow) },
    commentReplyProfile: {
      findUnique: vi.fn().mockResolvedValue(profileRow),
      create: vi.fn(({ data }) => Promise.resolve({ id: 'profile-created', configVersion: 1, ...data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    },
    commentChannelBinding: {
      findFirst: vi.fn().mockResolvedValue(bindingRow),
      update: vi.fn(({ data }) => Promise.resolve({ ...bindingRow, ...data })),
      updateMany: vi.fn().mockResolvedValue({ count: bindingRow ? 1 : 0 })
    }
  };
  const prisma = {
    $transaction: vi.fn((operation) => operation(tx))
  };
  return { agentRow, bindingRow, instanceRow, prisma, profileRow, tx };
}

describe('page Agent routing service', () => {
  it('atomically assigns one eligible Agent and moves the existing comment binding', async () => {
    const { prisma, tx } = createFixture();
    const service = createPageAgentRoutingService({ prisma });

    await expect(service.assignPrimaryAgent({
      tenantId: 'tenant-1',
      instanceId: 'instance-1',
      primaryAgentId: 'agent-new'
    })).resolves.toMatchObject({
      id: 'instance-1',
      primaryAgentId: 'agent-new',
      primaryAgent: { id: 'agent-new' }
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(tx.aIAgent.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'agent-new',
        tenantId: 'tenant-1',
        isActive: true,
        isPublished: true,
        deletedAt: null
      }
    });
    expect(tx.instance.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'instance-1' },
      data: { primaryAgentId: 'agent-new' }
    }));
    expect(tx.commentChannelBinding.update).toHaveBeenCalledWith({
      where: { id: 'binding-1' },
      data: { profileId: 'profile-new' }
    });
    expect(tx.commentReplyProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 'profile-old', tenantId: 'tenant-1' },
      data: { configVersion: { increment: 1 } }
    });
    expect(tx.commentReplyProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 'profile-new', tenantId: 'tenant-1' },
      data: { configVersion: { increment: 1 } }
    });
  });

  it('creates the Agent comment profile inside the assignment transaction when missing', async () => {
    const { tx, prisma } = createFixture({ profile: null, binding: null });

    await createPageAgentRoutingService({ prisma }).assignPrimaryAgent({
      tenantId: 'tenant-1',
      instanceId: 'instance-1',
      primaryAgentId: 'agent-new'
    });

    expect(tx.commentReplyProfile.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        agentId: 'agent-new',
        isEnabled: false
      }
    });
    expect(tx.commentChannelBinding.update).not.toHaveBeenCalled();
  });

  it('unassigns the account and disables its existing comment binding', async () => {
    const { prisma, tx } = createFixture();

    const result = await createPageAgentRoutingService({ prisma }).assignPrimaryAgent({
      tenantId: 'tenant-1',
      instanceId: 'instance-1',
      primaryAgentId: null
    });

    expect(result.primaryAgentId).toBeNull();
    expect(tx.aIAgent.findFirst).not.toHaveBeenCalled();
    expect(tx.commentChannelBinding.updateMany).toHaveBeenCalledWith({
      where: { id: 'binding-1', tenantId: 'tenant-1' },
      data: { isEnabled: false }
    });
    expect(tx.commentReplyProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 'profile-old', tenantId: 'tenant-1' },
      data: { configVersion: { increment: 1 } }
    });
  });

  it.each([
    [{ isActive: false }, 'PRIMARY_AGENT_INELIGIBLE'],
    [{ isPublished: false }, 'PRIMARY_AGENT_INELIGIBLE'],
    [{ deletedAt: new Date() }, 'PRIMARY_AGENT_INELIGIBLE'],
    [{ tenantId: 'tenant-2' }, 'PRIMARY_AGENT_INELIGIBLE']
  ])('fails closed for an ineligible or cross-tenant Agent %#', async (agent, code) => {
    const { prisma, tx } = createFixture({ agent });
    tx.aIAgent.findFirst.mockResolvedValue(null);

    await expect(createPageAgentRoutingService({ prisma }).assignPrimaryAgent({
      tenantId: 'tenant-1',
      instanceId: 'instance-1',
      primaryAgentId: 'agent-new'
    })).rejects.toMatchObject({ code: PAGE_AGENT_ROUTING_ERROR_CODES[code] });

    expect(tx.instance.update).not.toHaveBeenCalled();
    expect(tx.commentChannelBinding.update).not.toHaveBeenCalled();
  });

  it('tenant-scopes the connected account and rejects a missing instance', async () => {
    const { prisma, tx } = createFixture();
    tx.instance.findFirst.mockResolvedValue(null);

    await expect(createPageAgentRoutingService({ prisma }).assignPrimaryAgent({
      tenantId: 'tenant-1',
      instanceId: 'instance-2',
      primaryAgentId: 'agent-new'
    })).rejects.toMatchObject({ code: PAGE_AGENT_ROUTING_ERROR_CODES.INSTANCE_NOT_FOUND });

    expect(tx.instance.findFirst).toHaveBeenCalledWith({
      where: { id: 'instance-2', tenantId: 'tenant-1' }
    });
  });
});
