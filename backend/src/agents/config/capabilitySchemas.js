const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, removeAdditional: false });
const FORBIDDEN_SCHEMA_KEYS = ['$ref', '$defs', 'definitions', 'dependencies', 'dependentSchemas'];
const SUPPORTED_SCHEMA_KEYS = new Set([
  'type',
  'additionalProperties',
  'properties',
  'required',
  'items',
  'enum',
  'const',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minItems',
  'maxItems',
  'uniqueItems',
  'anyOf',
  'oneOf',
  'allOf',
  'not',
  'if',
  'then',
  'else',
  'contains',
  'patternProperties'
]);

const ASSIGNMENT_REASON_CODES = Object.freeze([
  'customer_request',
  'specialist_required',
  'policy_required',
  'automation_rule',
  'repeated_failure'
]);

const assignmentCapabilityConfigSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['allowedTargets', 'allowUnassignedHuman', 'teamStrategies', 'handoffMessage'],
  properties: {
    allowedTargets: {
      type: 'array',
      items: { type: 'string', minLength: 1, maxLength: 200 },
      maxItems: 100,
      uniqueItems: true
    },
    allowUnassignedHuman: { type: 'boolean' },
    teamStrategies: {
      type: 'object',
      additionalProperties: false,
      properties: {
        'team:agents': { type: 'string', enum: ['least_open', 'round_robin'] },
        'team:admins': { type: 'string', enum: ['least_open', 'round_robin'] },
        'team:humans': { type: 'string', enum: ['least_open', 'round_robin'] }
      }
    },
    handoffMessage: { type: 'string', minLength: 1, maxLength: 1000 },
    requiresReview: { type: 'boolean' }
  }
});

const closeCapabilityConfigSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  properties: {}
});
const storeCapabilityConfigSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['maxResults'],
  properties: {
    maxResults: { type: 'integer', minimum: 1, maximum: 5 }
  }
});
const googleSheetsCapabilityConfigSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['sources'],
  properties: {
    sources: {
      type: 'array',
      minItems: 0,
      maxItems: 20,
      uniqueItems: true,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'spreadsheetId', 'range', 'purpose', 'useWhen', 'priority'],
        properties: {
          id: { type: 'string', minLength: 36, maxLength: 36, pattern: '^[0-9a-fA-F-]{36}$' },
          name: { type: 'string', minLength: 1, maxLength: 120 },
          spreadsheetId: { type: 'string', minLength: 20, maxLength: 200, pattern: '^[A-Za-z0-9_-]+$' },
          range: { type: 'string', minLength: 1, maxLength: 200 },
          purpose: { type: 'string', minLength: 1, maxLength: 500 },
          useWhen: { type: 'string', minLength: 1, maxLength: 500 },
          priority: { type: 'integer', minimum: 0, maximum: 1000 }
        }
      }
    }
  }
});
const emptyCapabilityConfigSchema = closeCapabilityConfigSchema;
function assertStrictObjectNode(schema) {
  if (
    !schema
    || schema.type !== 'object'
    || schema.additionalProperties !== false
    || !schema.properties
  ) {
    throw Object.assign(
      new Error('Command and capability schemas must reject additional properties'),
      { code: 'SCHEMA_NOT_STRICT' }
    );
  }
}

function assertStrictObjectSchema(schema) {
  assertStrictObjectNode(schema);

  function visit(node) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      throw Object.assign(
        new Error('Command and capability schema nodes must be plain objects'),
        { code: 'SCHEMA_NOT_STRICT' }
      );
    }
    if (
      Array.isArray(node.type)
      || FORBIDDEN_SCHEMA_KEYS.some((key) => Object.prototype.hasOwnProperty.call(node, key))
    ) {
      throw Object.assign(
        new Error('Command and capability schemas must use the supported strict subset'),
        { code: 'SCHEMA_NOT_STRICT' }
      );
    }
    for (const key of Object.keys(node)) {
      if (!SUPPORTED_SCHEMA_KEYS.has(key)) {
        throw Object.assign(
          new Error(`Unsupported command and capability schema keyword: ${key}`),
          { code: 'SCHEMA_NOT_STRICT' }
        );
      }
    }
    if (!node.type) {
      throw Object.assign(
        new Error('Command and capability schema nodes must declare a type'),
        { code: 'SCHEMA_NOT_STRICT' }
      );
    }
    if (node.type === 'object') {
      assertStrictObjectNode(node);
      Object.values(node.properties).forEach(visit);
      Object.values(node.patternProperties || {}).forEach(visit);
    }
    if (node.items) visit(node.items);
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
      if (Array.isArray(node[key])) node[key].forEach(visit);
    }
    for (const key of ['not', 'if', 'then', 'else', 'contains']) {
      if (node[key]) visit(node[key]);
    }
  }

  visit(schema);
  return schema;
}

function compileStrictObjectSchema(schema) {
  return ajv.compile(assertStrictObjectSchema(schema));
}

module.exports = {
  ASSIGNMENT_REASON_CODES,
  assignmentCapabilityConfigSchema,
  closeCapabilityConfigSchema,
  storeCapabilityConfigSchema,
  googleSheetsCapabilityConfigSchema,
  emptyCapabilityConfigSchema,
  assertStrictObjectSchema,
  compileStrictObjectSchema
};
