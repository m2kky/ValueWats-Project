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

module.exports = { assertStrictObjectSchema, compileStrictObjectSchema };
