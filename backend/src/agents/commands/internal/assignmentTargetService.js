const ASSIGNMENT_TARGET_ERROR_CODES = Object.freeze({
  TARGET_INVALID: 'TARGET_INVALID',
  TARGET_INELIGIBLE: 'TARGET_INELIGIBLE',
  SOURCE_TARGET_DENIED: 'SOURCE_TARGET_DENIED',
  TEAM_EMPTY: 'TEAM_EMPTY'
});

const TEAM_ROLES = Object.freeze({
  'team:agents': Object.freeze(['agent']),
  'team:admins': Object.freeze(['admin']),
  'team:humans': Object.freeze(['agent', 'admin'])
});

class AssignmentTargetError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'AssignmentTargetError';
    this.code = code;
  }
}

function targetError(code) {
  return new AssignmentTargetError(code);
}

function parseExactTarget(target) {
  if (target === 'human') return { kind: 'human', id: null };
  if (Object.prototype.hasOwnProperty.call(TEAM_ROLES, target)) {
    return { kind: 'team', team: target };
  }
  const match = /^(agent|user):([^:\s]+)$/.exec(target);
  if (!match) throw targetError(ASSIGNMENT_TARGET_ERROR_CODES.TARGET_INVALID);
  return {
    kind: match[1] === 'agent' ? 'ai' : 'human',
    id: match[2]
  };
}

function createAssignmentTargetService(prisma) {
  if (!prisma) throw new Error('Transaction-scoped Prisma client is required');

  async function resolveExact({ tenantId, sourceAgentId, parsed }) {
    if (parsed.kind === 'ai') {
      if (parsed.id === sourceAgentId) {
        throw targetError(ASSIGNMENT_TARGET_ERROR_CODES.SOURCE_TARGET_DENIED);
      }
      const agent = await prisma.aIAgent.findFirst({
        where: {
          id: parsed.id,
          tenantId,
          isActive: true,
          isPublished: true,
          deletedAt: null
        },
        select: { id: true }
      });
      if (!agent) throw targetError(ASSIGNMENT_TARGET_ERROR_CODES.TARGET_INELIGIBLE);
      return { kind: 'ai', id: agent.id };
    }

    const user = await prisma.user.findFirst({
      where: {
        id: parsed.id,
        tenantId,
        isActive: true,
        role: { in: ['owner', 'admin', 'agent'] }
      },
      select: { id: true }
    });
    if (!user) throw targetError(ASSIGNMENT_TARGET_ERROR_CODES.TARGET_INELIGIBLE);
    return { kind: 'human', id: user.id };
  }

  async function resolveTeam({ tenantId, team, strategy }) {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { in: TEAM_ROLES[team] }
      },
      select: { id: true },
      orderBy: { id: 'asc' }
    });
    if (users.length === 0) throw targetError(ASSIGNMENT_TARGET_ERROR_CODES.TEAM_EMPTY);

    const userIds = users.map(({ id }) => id);
    if (strategy === 'least_open') {
      const counts = await prisma.conversation.groupBy({
        by: ['assignedUserId'],
        where: {
          tenantId,
          status: { not: 'closed' },
          assignedUserId: { in: userIds }
        },
        _count: { _all: true }
      });
      const countByUser = new Map(
        counts.map((row) => [row.assignedUserId, row._count?._all || 0])
      );
      users.sort((left, right) => (
        (countByUser.get(left.id) || 0) - (countByUser.get(right.id) || 0)
        || left.id.localeCompare(right.id)
      ));
      return { kind: 'human', id: users[0].id };
    }

    if (strategy !== 'round_robin') {
      throw targetError(ASSIGNMENT_TARGET_ERROR_CODES.TARGET_INVALID);
    }
    const assignments = await prisma.conversation.groupBy({
      by: ['assignedUserId'],
      where: {
        tenantId,
        assignedUserId: { in: userIds }
      },
      _max: { assignmentChangedAt: true }
    });
    const lastAssignmentByUser = new Map(
      assignments.map((row) => [row.assignedUserId, row._max?.assignmentChangedAt || null])
    );
    users.sort((left, right) => {
      const leftTime = lastAssignmentByUser.get(left.id)?.getTime?.() || 0;
      const rightTime = lastAssignmentByUser.get(right.id)?.getTime?.() || 0;
      return leftTime - rightTime || left.id.localeCompare(right.id);
    });
    return { kind: 'human', id: users[0].id };
  }

  async function resolve({ tenantId, sourceAgentId, target, strategy = 'round_robin' }) {
    if (
      typeof tenantId !== 'string'
      || !tenantId.trim()
      || typeof sourceAgentId !== 'string'
      || !sourceAgentId.trim()
    ) {
      throw targetError(ASSIGNMENT_TARGET_ERROR_CODES.TARGET_INVALID);
    }
    const parsed = parseExactTarget(target);
    if (parsed.kind === 'human' && parsed.id === null) return parsed;
    if (parsed.kind === 'team') {
      return resolveTeam({ tenantId, team: parsed.team, strategy });
    }
    return resolveExact({ tenantId, sourceAgentId, parsed });
  }

  return Object.freeze({ resolve });
}

module.exports = {
  ASSIGNMENT_TARGET_ERROR_CODES,
  AssignmentTargetError,
  TEAM_ROLES,
  createAssignmentTargetService,
  parseExactTarget
};
