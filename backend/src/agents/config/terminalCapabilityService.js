const prismaDefault = require('../../config/database');
const { capabilityCatalog } = require('./capabilityCatalog');
const { buildLegacyActionConfigProjection } = require('./legacyActionConfigProjection');
const { AgentSetupError } = require('./agentSetupService');

const CAPABILITY_KEYS = [
  'assign_conversation',
  'close_conversation',
  'update_contact',
  'update_lifecycle',
  'modify_tags',
  'add_internal_comment'
];

function normalizeTarget(value) {
  return String(value || '').trim().replace(/^@/, '').toLowerCase();
}

function normalizeCapabilities(input = {}) {
  const assignment = input.assignConversation || {};
  const close = input.closeConversation || {};
  const internal = {
    update_contact: input.updateContact || {},
    update_lifecycle: input.updateLifecycle || {},
    modify_tags: input.modifyTags || {},
    add_internal_comment: input.addInternalComment || {}
  };
  const allowedTargets = [...new Set(
    (Array.isArray(assignment.allowedTargets) ? assignment.allowedTargets : [])
      .map(normalizeTarget)
      .filter((target) => (
        /^agent:[^:\s]+$/.test(target)
        || /^user:[^:\s]+$/.test(target)
        || ['team:agents', 'team:admins', 'team:humans'].includes(target)
      ))
  )];
  const allowUnassignedHuman = assignment.allowUnassignedHuman === true;
  const assignConfig = {
    allowedTargets,
    allowUnassignedHuman,
    teamStrategies: assignment.teamStrategies || {},
    handoffMessage: String(
      assignment.handoffMessage
      || 'I am transferring this conversation to the right specialist.'
    ).trim(),
    requiresReview: assignment.enabled === true
      && allowedTargets.length === 0
      && !allowUnassignedHuman
  };
  if (!capabilityCatalog.get('assign_conversation').validateConfig(assignConfig)) {
    throw new AgentSetupError(400, 'CAPABILITY_CONFIG_INVALID', 'Invalid assignment capability configuration');
  }

  return {
    assign_conversation: {
      isEnabled: assignment.enabled === true,
      instructions: String(assignment.instructions || '').trim(),
      config: assignConfig
    },
    close_conversation: {
      isEnabled: close.enabled === true,
      instructions: String(close.instructions || '').trim(),
      config: {}
    },
    ...Object.fromEntries(Object.entries(internal).map(([key, value]) => [key, {
      isEnabled: value.enabled === true,
      instructions: String(value.instructions || '').trim(),
      config: {}
    }]))
  };
}

function createTerminalCapabilityService({ prisma = prismaDefault } = {}) {
  return {
    async update({ tenantId, agentId, expectedConfigVersion, capabilities }) {
      const normalized = normalizeCapabilities(capabilities);
      try {
        return await prisma.$transaction(async (transaction) => {
          const agent = await transaction.aIAgent.findFirst({
            where: { id: agentId, tenantId, deletedAt: null }
          });
          if (!agent) {
            throw new AgentSetupError(404, 'AGENT_NOT_FOUND', 'Agent not found');
          }
          if (!Number.isInteger(expectedConfigVersion) || agent.configVersion !== expectedConfigVersion) {
            throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
          }

          const existingRows = await transaction.agentAction.findMany({
            where: { agentId, key: { in: CAPABILITY_KEYS } },
            orderBy: { id: 'asc' }
          });
          for (const key of CAPABILITY_KEYS) {
            const rows = existingRows.filter((row) => row.key === key);
            if (rows.length > 1) {
              throw new AgentSetupError(409, 'CAPABILITY_DUPLICATE', `Duplicate capability: ${key}`);
            }
            const data = {
              key,
              type: key,
              isEnabled: normalized[key].isEnabled,
              instructions: normalized[key].instructions,
              config: normalized[key].config
            };
            if (rows[0]) {
              await transaction.agentAction.update({
                where: { id: rows[0].id },
                data
              });
            } else {
              await transaction.agentAction.create({
                data: { ...data, agentId }
              });
            }
          }

          const canonicalActions = await transaction.agentAction.findMany({
            where: { agentId },
            orderBy: { createdAt: 'asc' }
          });
          const updated = await transaction.aIAgent.updateMany({
            where: {
              id: agentId,
              tenantId,
              deletedAt: null,
              configVersion: expectedConfigVersion
            },
            data: {
              actionConfig: buildLegacyActionConfigProjection({
                existingActionConfig: agent.actionConfig,
                canonicalActions
              }),
              configVersion: { increment: 1 }
            }
          });
          if (updated.count !== 1) {
            throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
          }
          return transaction.aIAgent.findFirst({
            where: { id: agentId, tenantId },
            include: { actions: true }
          });
        }, { isolationLevel: 'Serializable' });
      } catch (error) {
        if (error?.code === 'P2034') {
          throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
        }
        throw error;
      }
    }
  };
}

const terminalCapabilityService = createTerminalCapabilityService();

module.exports = {
  createTerminalCapabilityService,
  normalizeCapabilities,
  terminalCapabilityService
};
