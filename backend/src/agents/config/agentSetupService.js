const prismaDefault = require('../../config/database');
const {
  validateCreateAgent,
  validateTemplateCreateAgent,
  validateUpdateAgent,
  validateDeleteAgent,
  providerModelSupported
} = require('./agentSetupSchemas');
const { buildLegacyActionConfigProjection } = require('./legacyActionConfigProjection');
const {
  createConversationOwnershipService
} = require('../../conversations/conversationOwnershipService');
const {
  DEFAULT_CHAT_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS
} = require('../../ai/modelPolicy');

class AgentSetupError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const SETUP_FIELDS = [
  'name',
  'description',
  'avatar',
  'templateType',
  'instructions',
  'aiProvider',
  'aiModel',
  'temperature',
  'maxTokens',
  'greeting',
  'tone',
  'responseStyle',
  'useHistory',
  'historyLength',
  'followUpEnabled',
  'followUpDelay',
  'followUpMessage',
  'workingHoursEnabled',
  'workingHours',
  'workingHoursTimezone',
  'outOfHoursMessage',
  'allowGroupResponse',
  'allowedGroups',
  'isActive',
  'isPublished',
  'priority'
];

const FIELD_DEFAULTS = {
  aiProvider: 'openrouter',
  aiModel: DEFAULT_CHAT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  maxTokens: DEFAULT_MAX_TOKENS,
  tone: 'professional',
  responseStyle: 'concise',
  useHistory: true,
  historyLength: 10,
  followUpEnabled: false,
  followUpDelay: 300,
  workingHoursEnabled: false,
  workingHoursTimezone: 'Africa/Cairo',
  allowGroupResponse: false,
  allowedGroups: [],
  isActive: true,
  isPublished: false,
  priority: 0
};

function normalizePayload(input) {
  const payload = {};
  for (const field of SETUP_FIELDS) {
    if (input[field] !== undefined) payload[field] = input[field];
  }
  if (typeof payload.instructions === 'string') {
    payload.instructions = payload.instructions.trim();
  }
  return payload;
}

function validatePayload(validator, payload) {
  if (!validator(payload)) {
    const hasAdditionalField = validator.errors?.some((error) => error.keyword === 'additionalProperties');
    throw new AgentSetupError(
      400,
      hasAdditionalField ? 'SETUP_FIELD_NOT_ALLOWED' : 'SETUP_VALIDATION_FAILED',
      hasAdditionalField ? 'Unsupported setup field' : 'Invalid agent setup payload',
      validator.errors
    );
  }

  const provider = payload.aiProvider || FIELD_DEFAULTS.aiProvider;
  const model = payload.aiModel || FIELD_DEFAULTS.aiModel;
  if (!providerModelSupported(provider, model)) {
    throw new AgentSetupError(400, 'UNSUPPORTED_PROVIDER_MODEL', 'Unsupported provider/model pair');
  }
}

function validateSetupInput(validator, input) {
  validatePayload(validator, input);
  const payload = normalizePayload(input);
  validatePayload(validator, payload);
  return payload;
}

function validateUpdateInput(input) {
  validatePayload(validateUpdateAgent, input);
  const payload = normalizePayload(input);
  payload.expectedConfigVersion = input.expectedConfigVersion;
  validatePayload(validateUpdateAgent, payload);
  return payload;
}

function buildCreateData({ tenantId, payload, templateType }) {
  return {
    tenantId,
    name: payload.name,
    instructions: payload.instructions,
    description: payload.description ?? null,
    avatar: payload.avatar ?? null,
    templateType: templateType ?? payload.templateType ?? null,
    aiProvider: payload.aiProvider ?? FIELD_DEFAULTS.aiProvider,
    aiModel: payload.aiModel ?? FIELD_DEFAULTS.aiModel,
    temperature: payload.temperature ?? FIELD_DEFAULTS.temperature,
    maxTokens: payload.maxTokens ?? FIELD_DEFAULTS.maxTokens,
    greeting: payload.greeting ?? null,
    tone: payload.tone ?? FIELD_DEFAULTS.tone,
    responseStyle: payload.responseStyle ?? FIELD_DEFAULTS.responseStyle,
    useHistory: payload.useHistory ?? FIELD_DEFAULTS.useHistory,
    historyLength: payload.historyLength ?? FIELD_DEFAULTS.historyLength,
    followUpEnabled: payload.followUpEnabled ?? FIELD_DEFAULTS.followUpEnabled,
    followUpDelay: payload.followUpDelay ?? FIELD_DEFAULTS.followUpDelay,
    followUpMessage: payload.followUpMessage ?? null,
    workingHoursEnabled: payload.workingHoursEnabled ?? FIELD_DEFAULTS.workingHoursEnabled,
    workingHours: payload.workingHours ?? undefined,
    workingHoursTimezone: payload.workingHoursTimezone ?? FIELD_DEFAULTS.workingHoursTimezone,
    outOfHoursMessage: payload.outOfHoursMessage ?? null,
    allowGroupResponse: payload.allowGroupResponse ?? FIELD_DEFAULTS.allowGroupResponse,
    allowedGroups: Array.isArray(payload.allowedGroups) ? payload.allowedGroups : FIELD_DEFAULTS.allowedGroups,
    isActive: payload.isActive ?? FIELD_DEFAULTS.isActive,
    isPublished: payload.isPublished ?? FIELD_DEFAULTS.isPublished,
    priority: payload.priority ?? FIELD_DEFAULTS.priority
  };
}

function buildUpdateData(payload) {
  const data = {};
  for (const field of SETUP_FIELDS) {
    if (payload[field] === undefined) continue;
    data[field] = payload[field];
  }
  return data;
}

function templatePayload(template, body) {
  const result = {};
  for (const field of SETUP_FIELDS) {
    if (template[field] !== undefined) result[field] = template[field];
  }
  for (const field of SETUP_FIELDS) {
    if (body[field] !== undefined) result[field] = body[field];
  }
  return result;
}

async function serializableTransaction(prisma, callback) {
  try {
    return await prisma.$transaction(callback, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error?.code === 'P2034') {
      throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
    }
    throw error;
  }
}

function createAgentSetupService({
  prisma = prismaDefault,
  clock = () => new Date(),
  ownershipService = createConversationOwnershipService({ clock })
} = {}) {
  return {
    async createAgent({ tenantId, body }) {
      const payload = validateSetupInput(validateCreateAgent, body);
      return prisma.$transaction((tx) => tx.aIAgent.create({
        data: buildCreateData({ tenantId, payload })
      }));
    },

    async createAgentFromTemplate({ tenantId, templateName, template, body }) {
      validatePayload(validateTemplateCreateAgent, body || {});
      const payload = normalizePayload(templatePayload(template, body || {}));
      validatePayload(validateCreateAgent, payload);
      return prisma.$transaction((tx) => tx.aIAgent.create({
        data: buildCreateData({ tenantId, payload, templateType: templateName })
      }));
    },

    async updateAgent({ tenantId, agentId, body }) {
      const payload = validateUpdateInput(body);
      const updateData = buildUpdateData(payload);
      delete updateData.expectedConfigVersion;

      return serializableTransaction(prisma, async (tx) => {
        const existing = await tx.aIAgent.findFirst({
          where: { id: agentId, tenantId, deletedAt: null }
        });
        if (!existing) {
          throw new AgentSetupError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        if (existing.configVersion !== body.expectedConfigVersion) {
          throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
        }
        if ((updateData.isActive === false && existing.isActive) || (updateData.isPublished === false && existing.isPublished)) {
          await ownershipService.drainAgent(tx, {
            tenantId,
            agentId,
            reasonCode: 'agent_lifecycle'
          });
        }
        const prismaData = {};
        for (const field of Object.keys(updateData)) {
          prismaData[field] = updateData[field];
        }
        const canonicalActions = await tx.agentAction.findMany({
          where: { agentId },
          orderBy: { createdAt: 'asc' }
        });
        prismaData.actionConfig = buildLegacyActionConfigProjection({
          existingActionConfig: existing.actionConfig,
          canonicalActions
        });
        prismaData.configVersion = { increment: 1 };

        const updateResult = await tx.aIAgent.updateMany({
          where: {
            id: agentId,
            tenantId,
            deletedAt: null,
            configVersion: body.expectedConfigVersion
          },
          data: prismaData
        });
        if (updateResult.count !== 1) {
          throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
        }

        return tx.aIAgent.findUnique({ where: { id: agentId } });
      });
    },

    async deleteAgent({ tenantId, agentId, body }) {
      validatePayload(validateDeleteAgent, body || {});
      return serializableTransaction(prisma, async (tx) => {
        const existing = await tx.aIAgent.findFirst({
          where: { id: agentId, tenantId, deletedAt: null }
        });
        if (!existing) {
          throw new AgentSetupError(404, 'AGENT_NOT_FOUND', 'Agent not found');
        }
        if (existing.configVersion !== body.expectedConfigVersion) {
          throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
        }
        await ownershipService.drainAgent(tx, {
          tenantId,
          agentId,
          reasonCode: 'agent_delete'
        });
        const updateResult = await tx.aIAgent.updateMany({
          where: {
            id: agentId,
            tenantId,
            deletedAt: null,
            configVersion: body.expectedConfigVersion
          },
          data: {
            isActive: false,
            isPublished: false,
            deletedAt: clock(),
            configVersion: { increment: 1 }
          }
        });
        if (updateResult.count !== 1) {
          throw new AgentSetupError(409, 'CONFIG_VERSION_CONFLICT', 'Agent config version is stale');
        }
        return tx.aIAgent.findUnique({ where: { id: agentId } });
      });
    }
  };
}

const agentSetupService = createAgentSetupService();

module.exports = { AgentSetupError, createAgentSetupService, agentSetupService };
