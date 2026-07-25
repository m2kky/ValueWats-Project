const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, removeAdditional: false });

const SUPPORTED_PROVIDER_MODELS = Object.freeze({
  deepseek: ['deepseek-chat'],
  openrouter: [
    'qwen/qwen3.5-flash-02-23',
    'anthropic/claude-sonnet-4',
    'openai/gpt-4o-mini'
  ]
});

const setupProperties = {
  name: { type: 'string', minLength: 1, maxLength: 200 },
  description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  avatar: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  templateType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  instructions: { type: 'string', minLength: 1, maxLength: 10000 },
  aiProvider: { type: 'string', enum: Object.keys(SUPPORTED_PROVIDER_MODELS) },
  aiModel: { type: 'string' },
  temperature: { type: 'number', minimum: 0, maximum: 2 },
  maxTokens: { type: 'integer', minimum: 64, maximum: 4096 },
  greeting: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  tone: { type: 'string', minLength: 1, maxLength: 80 },
  responseStyle: { type: 'string', minLength: 1, maxLength: 80 },
  useHistory: { type: 'boolean' },
  historyLength: { type: 'integer', minimum: 0, maximum: 100 },
  followUpEnabled: { type: 'boolean' },
  followUpDelay: { type: 'integer', minimum: 0, maximum: 31536000 },
  followUpMessage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  workingHoursEnabled: { type: 'boolean' },
  workingHours: { anyOf: [{ type: 'object' }, { type: 'array' }, { type: 'null' }] },
  workingHoursTimezone: { type: 'string', minLength: 1, maxLength: 120 },
  outOfHoursMessage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  allowGroupResponse: { type: 'boolean' },
  allowedGroups: { type: 'array', items: { type: 'string' } },
  isActive: { type: 'boolean' },
  isPublished: { type: 'boolean' },
  priority: { type: 'integer' }
};

const createAgentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'instructions'],
  properties: setupProperties
};

const templateCreateAgentSchema = {
  type: 'object',
  additionalProperties: false,
  properties: setupProperties
};

const updateAgentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedConfigVersion'],
  properties: {
    ...setupProperties,
    expectedConfigVersion: { type: 'integer', minimum: 0 }
  }
};

const deleteAgentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedConfigVersion'],
  properties: {
    expectedConfigVersion: { type: 'integer', minimum: 0 }
  }
};

const validateCreateAgent = ajv.compile(createAgentSchema);
const validateTemplateCreateAgent = ajv.compile(templateCreateAgentSchema);
const validateUpdateAgent = ajv.compile(updateAgentSchema);
const validateDeleteAgent = ajv.compile(deleteAgentSchema);

function providerModelSupported(provider = 'deepseek', model = 'deepseek-chat') {
  return Boolean(SUPPORTED_PROVIDER_MODELS[provider]?.includes(model));
}

module.exports = {
  SUPPORTED_PROVIDER_MODELS,
  createAgentSchema,
  templateCreateAgentSchema,
  updateAgentSchema,
  deleteAgentSchema,
  validateCreateAgent,
  validateTemplateCreateAgent,
  validateUpdateAgent,
  validateDeleteAgent,
  providerModelSupported
};
