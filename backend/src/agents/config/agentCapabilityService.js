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
  'add_internal_comment',
  'store_catalog_read'
];

function normalizeTarget(value) {
  return String(value || '').trim().replace(/^@/, '').toLowerCase();
}

function normalizeCapabilities(input = {}) {
  const assignment = input.assignConversation || {};
  const close = input.closeConversation || {};
  const store = input.store || {};
  const storeEnabled = store.enabled === true;
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
  const storeConfig = { maxResults: storeEnabled ? (store.maxResults ?? 5) : 5 };
  if (!capabilityCatalog.get('store_catalog_read').validateConfig(storeConfig)) {
    throw new AgentSetupError(400, 'CAPABILITY_CONFIG_INVALID', 'Invalid Store capability configuration');
  }

  return {
    assign_conversation: {
      isEnabled: assignment.enabled === true,
      integrationId: null,
      instructions: String(assignment.instructions || '').trim(),
      config: assignConfig
    },
    close_conversation: {
      isEnabled: close.enabled === true,
      integrationId: null,
      instructions: String(close.instructions || '').trim(),
      config: {}
    },
    ...Object.fromEntries(Object.entries(internal).map(([key, value]) => [key, {
      isEnabled: value.enabled === true,
      integrationId: null,
      instructions: String(value.instructions || '').trim(),
      config: {}
    }])),
    store_catalog_read: {
      isEnabled: storeEnabled,
      integrationId: storeEnabled && typeof store.integrationId === 'string'
        ? store.integrationId.trim() || null
        : null,
      instructions: storeEnabled ? String(store.instructions || '').trim() : '',
      config: storeConfig
    }
  };
}

function createAgentCapabilityService({ prisma = prismaDefault } = {}) {
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

          const store = normalized.store_catalog_read;
          if (store.isEnabled) {
            if (!store.integrationId) {
              throw new AgentSetupError(400, 'CAPABILITY_INTEGRATION_INVALID', 'Invalid Store capability integration');
            }
            const integrationPolicy = capabilityCatalog.get('store_catalog_read').integration;
            const integration = await transaction.integration.findFirst({
              where: {
                id: store.integrationId,
                tenantId,
                status: 'active',
                type: { in: integrationPolicy.types }
              }
            });
            if (!integration) {
              throw new AgentSetupError(400, 'CAPABILITY_INTEGRATION_INVALID', 'Invalid Store capability integration');
            }
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
              integrationId: normalized[key].integrationId,
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

const agentCapabilityService = createAgentCapabilityService();

module.exports = {
  createAgentCapabilityService,
  normalizeCapabilities,
  agentCapabilityService
};
