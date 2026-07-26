const {
  canonicalizeCommandArguments,
  createCommandIdempotencyKey
} = require('../commands/commandIdempotency');
const { sanitizeCommandError } = require('../commands/commandSanitizer');

const TRANSITIONS = {
  authorized: ['proposed'],
  running: ['authorized'],
  succeeded: ['running'],
  failed: ['running'],
  denied: ['proposed', 'authorized'],
  conflict: ['proposed', 'authorized'],
  shadowed: ['proposed', 'authorized'],
  outcome_unknown: ['running']
};
const TERMINAL_STATUSES = new Set([
  'succeeded', 'failed', 'denied', 'conflict', 'shadowed', 'outcome_unknown'
]);

function sameCommandIdentity(existing, data, args) {
  return existing.runId === data.runId
    && existing.conversationId === data.conversationId
    && existing.sourceAgentId === (data.sourceAgentId || null)
    && existing.type === data.type
    && JSON.stringify(canonicalizeCommandArguments(existing.arguments)) === JSON.stringify(args);
}

function createAgentCommandRepository(prisma, {
  clock = () => new Date(),
  commandLeaseMs = 30_000
} = {}) {
  if (!prisma) throw new Error('Prisma client is required');

  async function getForTenant(tenantId, commandId) {
    const command = await prisma.agentCommand.findFirst({
      where: { id: commandId, tenantId }
    });
    if (!command) {
      throw Object.assign(new Error('Agent command not found'), { code: 'COMMAND_NOT_FOUND' });
    }
    return command;
  }

  async function transition({ tenantId, commandId, to, result, error, expectedAttempt }) {
    const deniedRunningAttempt = to === 'denied' && Number.isInteger(expectedAttempt);
    const from = deniedRunningAttempt ? [...TRANSITIONS.denied, 'running'] : TRANSITIONS[to];
    if (!from) throw Object.assign(new Error(`Unsupported command status: ${to}`), { code: 'INVALID_COMMAND_STATUS' });
    const requiresAttempt = ['succeeded', 'failed', 'outcome_unknown'].includes(to)
      || deniedRunningAttempt;
    if (requiresAttempt && !Number.isInteger(expectedAttempt)) {
      throw Object.assign(
        new Error(`Command attempt is required for status: ${to}`),
        { code: 'COMMAND_ATTEMPT_REQUIRED' }
      );
    }

    const now = clock();
    const data = { status: to };
    if (result !== undefined) data.result = result;
    if (error) {
      const sanitized = sanitizeCommandError(error);
      data.errorCode = sanitized.code;
      data.errorMessage = sanitized.message;
    }
    if (to === 'running') {
      data.startedAt = now;
      data.attempts = { increment: 1 };
      data.leaseExpiresAt = new Date(now.getTime() + commandLeaseMs);
    }
    if (TERMINAL_STATUSES.has(to)) {
      data.completedAt = now;
      data.leaseExpiresAt = null;
    }

    const where = {
      id: commandId,
      tenantId,
      status: { in: from }
    };
    if (requiresAttempt) where.attempts = expectedAttempt;

    const updated = await prisma.agentCommand.updateMany({
      where,
      data
    });

    return {
      changed: updated.count === 1,
      command: await getForTenant(tenantId, commandId)
    };
  }

  return {
    async createOrGet(data) {
      const args = canonicalizeCommandArguments(data.arguments);
      const idempotencyKey = data.idempotencyKey || createCommandIdempotencyKey({
        tenantId: data.tenantId,
        runId: data.runId,
        type: data.type,
        arguments: args
      });

      try {
        return await prisma.agentCommand.create({
          data: {
            tenantId: data.tenantId,
            runId: data.runId,
            conversationId: data.conversationId,
            sourceAgentId: data.sourceAgentId || null,
            type: data.type,
            arguments: args,
            idempotencyKey
          }
        });
      } catch (error) {
        if (error?.code !== 'P2002') throw error;
        const existing = await prisma.agentCommand.findUniqueOrThrow({
          where: {
            tenantId_idempotencyKey: {
              tenantId: data.tenantId,
              idempotencyKey
            }
          }
        });
        if (!sameCommandIdentity(existing, data, args)) {
          throw Object.assign(
            new Error('Command idempotency key already belongs to another intent'),
            { code: 'COMMAND_IDEMPOTENCY_CONFLICT' }
          );
        }
        return existing;
      }
    },

    transition,

    async claimTerminalSlot({ tenantId, commandId, conflictError }) {
      const current = await getForTenant(tenantId, commandId);
      if (current.terminalSlot === true) return { claimed: true, command: current };
      if (current.status !== 'authorized') return { claimed: false, command: current };

      try {
        const claimed = await prisma.agentCommand.updateMany({
          where: {
            id: commandId,
            tenantId,
            status: 'authorized',
            terminalSlot: null
          },
          data: { terminalSlot: true }
        });
        if (claimed.count === 1) {
          return { claimed: true, command: await getForTenant(tenantId, commandId) };
        }
      } catch (error) {
        if (error?.code !== 'P2002') throw error;
      }

      const latest = await getForTenant(tenantId, commandId);
      if (latest.terminalSlot === true) return { claimed: true, command: latest };

      const conflicted = await transition({
        tenantId,
        commandId,
        to: 'conflict',
        error: conflictError
      });
      return { claimed: false, command: conflicted.command };
    }
  };
}

module.exports = { createAgentCommandRepository, TERMINAL_STATUSES };
