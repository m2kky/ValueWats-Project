const {
  ASSIGNMENT_TARGET_ERROR_CODES,
  createAssignmentTargetService
} = require('../../../src/agents/commands/internal/assignmentTargetService');
const {
  authorizeAssignment,
  buildAssignmentArgumentSchema,
  exposedAssignmentTargets
} = require('../../../src/agents/commands/internal/assignmentPolicy');
const {
  createAssignConversationDefinition
} = require('../../../src/agents/commands/internal/assignConversation');

function createPrisma(overrides = {}) {
  return {
    aIAgent: { findFirst: vi.fn() },
    user: { findFirst: vi.fn(), findMany: vi.fn() },
    conversation: { groupBy: vi.fn() },
    ...overrides
  };
}

describe('assignment target policy', () => {
  it('exposes no targets for empty or unreviewed configuration', () => {
    const emptyConfig = {
      allowedTargets: [],
      allowUnassignedHuman: true
    };
    const unreviewedConfig = {
      allowedTargets: ['team:agents'],
      allowUnassignedHuman: true,
      requiresReview: true
    };

    expect(exposedAssignmentTargets(emptyConfig)).toEqual([]);
    expect(exposedAssignmentTargets(unreviewedConfig)).toEqual([]);
    expect(buildAssignmentArgumentSchema(emptyConfig)).toBeNull();
    expect(buildAssignmentArgumentSchema(unreviewedConfig)).toBeNull();
    expect(createAssignConversationDefinition({ allowedTargets: [] })).toBeNull();
    expect(createAssignConversationDefinition({
      allowedTargets: ['team:agents'],
      requiresReview: true
    })).toBeNull();
    expect(createAssignConversationDefinition()).toMatchObject({
      type: 'assign_conversation',
      parameters: {
        type: 'object',
        additionalProperties: false
      }
    });
  });

  it('exposes human only when explicitly enabled and builds an exact enum', () => {
    const config = {
      allowedTargets: ['agent:agent-2', 'team:agents'],
      allowUnassignedHuman: true,
      teamStrategies: {},
      handoffMessage: 'Transferring now.'
    };

    expect(exposedAssignmentTargets(config)).toEqual([
      'agent:agent-2',
      'team:agents',
      'human'
    ]);
    expect(buildAssignmentArgumentSchema(config).properties.target.enum).toEqual([
      'agent:agent-2',
      'team:agents',
      'human'
    ]);
  });

  it('denies targets outside the reviewed structured allowlist', async () => {
    const decision = await authorizeAssignment(
      {
        tenantId: 'tenant-1',
        sourceAgentId: 'agent-1',
        capability: {
          config: {
            allowedTargets: ['agent:agent-2'],
            allowUnassignedHuman: false,
            teamStrategies: {},
            handoffMessage: 'Transferring now.'
          }
        }
      },
      { target: 'agent:agent-3', reasonCode: 'specialist_required', reason: 'Specialist' },
      { resolveAssignmentTarget: vi.fn() }
    );

    expect(decision).toEqual({ allowed: false, code: 'CAPABILITY_DISABLED' });
  });
});

describe('assignment target resolution', () => {
  it('resolves exact eligible AI and human targets in the tenant', async () => {
    const prisma = createPrisma();
    prisma.aIAgent.findFirst.mockResolvedValue({
      id: 'agent-2',
      tenantId: 'tenant-1',
      isActive: true,
      isPublished: true,
      deletedAt: null
    });
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-2',
      tenantId: 'tenant-1',
      role: 'admin',
      isActive: true
    });
    const service = createAssignmentTargetService(prisma);

    await expect(service.resolve({
      tenantId: 'tenant-1',
      sourceAgentId: 'agent-1',
      target: 'agent:agent-2'
    })).resolves.toEqual({ kind: 'ai', id: 'agent-2' });
    await expect(service.resolve({
      tenantId: 'tenant-1',
      sourceAgentId: 'agent-1',
      target: 'user:user-2'
    })).resolves.toEqual({ kind: 'human', id: 'user-2' });
    expect(prisma.aIAgent.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'agent-2', tenantId: 'tenant-1' })
    }));
    expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'user-2',
        tenantId: 'tenant-1',
        role: { in: ['owner', 'admin', 'agent'] }
      })
    }));
  });

  it('fails closed before lookup when tenant identity is missing', async () => {
    const prisma = createPrisma();

    await expect(createAssignmentTargetService(prisma).resolve({
      sourceAgentId: 'agent-1',
      target: 'agent:agent-2'
    })).rejects.toMatchObject({
      code: ASSIGNMENT_TARGET_ERROR_CODES.TARGET_INVALID
    });
    expect(prisma.aIAgent.findFirst).not.toHaveBeenCalled();
  });

  it('fails closed before lookup when source agent identity is missing', async () => {
    const prisma = createPrisma();

    await expect(createAssignmentTargetService(prisma).resolve({
      tenantId: 'tenant-1',
      target: 'agent:agent-2'
    })).rejects.toMatchObject({
      code: ASSIGNMENT_TARGET_ERROR_CODES.TARGET_INVALID
    });
    expect(prisma.aIAgent.findFirst).not.toHaveBeenCalled();
  });

  it.each([
    ['agent:agent-1', 'SOURCE_TARGET_DENIED'],
    ['agent:missing', 'TARGET_INELIGIBLE'],
    ['user:missing', 'TARGET_INELIGIBLE'],
    ['viewer:user-1', 'TARGET_INVALID'],
    ['Agent:agent-2', 'TARGET_INVALID'],
    ['agent:', 'TARGET_INVALID']
  ])('denies ineligible or non-exact target %s', async (target, code) => {
    const prisma = createPrisma();
    prisma.aIAgent.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(createAssignmentTargetService(prisma).resolve({
      tenantId: 'tenant-1',
      sourceAgentId: 'agent-1',
      target
    })).rejects.toMatchObject({ code: ASSIGNMENT_TARGET_ERROR_CODES[code] });
  });

  it('selects least-open teams by count and then lowest user id', async () => {
    const prisma = createPrisma();
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-b' },
      { id: 'user-a' },
      { id: 'user-c' }
    ]);
    prisma.conversation.groupBy.mockResolvedValue([
      { assignedUserId: 'user-a', _count: { _all: 1 } },
      { assignedUserId: 'user-b', _count: { _all: 1 } },
      { assignedUserId: 'user-c', _count: { _all: 2 } }
    ]);

    await expect(createAssignmentTargetService(prisma).resolve({
      tenantId: 'tenant-1',
      sourceAgentId: 'agent-1',
      target: 'team:humans',
      strategy: 'least_open'
    })).resolves.toEqual({ kind: 'human', id: 'user-a' });
  });

  it('selects round-robin teams by oldest assignment and then lowest user id', async () => {
    const prisma = createPrisma();
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-c' },
      { id: 'user-a' },
      { id: 'user-b' }
    ]);
    prisma.conversation.groupBy.mockResolvedValue([
      { assignedUserId: 'user-c', _max: { assignmentChangedAt: new Date('2026-01-03') } },
      { assignedUserId: 'user-a', _max: { assignmentChangedAt: new Date('2026-01-01') } },
      { assignedUserId: 'user-b', _max: { assignmentChangedAt: new Date('2026-01-01') } }
    ]);

    await expect(createAssignmentTargetService(prisma).resolve({
      tenantId: 'tenant-1',
      sourceAgentId: 'agent-1',
      target: 'team:agents',
      strategy: 'round_robin'
    })).resolves.toEqual({ kind: 'human', id: 'user-a' });
  });
});
