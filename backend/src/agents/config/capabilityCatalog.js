const { compileStrictObjectSchema } = require('./capabilitySchemas');
const {
  assignmentCapabilityConfigSchema,
  closeCapabilityConfigSchema,
  emptyCapabilityConfigSchema
} = require('./capabilitySchemas');

function createCapabilityCatalog(entries = []) {
  const capabilities = new Map();

  for (const entry of entries) {
    if (!entry?.type || capabilities.has(entry.type)) {
      throw Object.assign(new Error(`Duplicate capability: ${entry?.type}`), {
        code: 'CAPABILITY_DUPLICATE'
      });
    }
    if (
      !['internal', 'outbox'].includes(entry.delivery)
      || (entry.risk === 'external' && entry.delivery !== 'outbox')
    ) {
      throw Object.assign(new Error(`Invalid capability delivery: ${entry.type}`), {
        code: 'CAPABILITY_DELIVERY_INVALID'
      });
    }
    const integration = entry.integration || { required: false, types: [] };
    if (
      typeof integration.required !== 'boolean'
      || !Array.isArray(integration.types)
      || integration.types.some((type) => typeof type !== 'string' || !type)
    ) {
      throw Object.assign(new Error(`Invalid integration policy: ${entry.type}`), {
        code: 'CAPABILITY_INTEGRATION_INVALID'
      });
    }
    capabilities.set(entry.type, Object.freeze({
      ...entry,
      integration: Object.freeze({
        required: integration.required,
        types: Object.freeze([...integration.types])
      }),
      validateConfig: compileStrictObjectSchema(entry.configSchema)
    }));
  }

  return Object.freeze({
    get(type) {
      return capabilities.get(type);
    },
    list() {
      return [...capabilities.values()];
    }
  });
}

const capabilityCatalog = createCapabilityCatalog([
  {
    type: 'assign_conversation',
    risk: 'ownership_change',
    delivery: 'internal',
    terminalConversationCommand: true,
    configSchema: assignmentCapabilityConfigSchema
  },
  {
    type: 'close_conversation',
    risk: 'ownership_change',
    delivery: 'internal',
    terminalConversationCommand: true,
    configSchema: closeCapabilityConfigSchema
  },
  ...['update_contact', 'update_lifecycle', 'modify_tags', 'add_internal_comment'].map((type) => ({
    type,
    risk: 'crm_write',
    delivery: 'internal',
    terminalConversationCommand: false,
    configSchema: emptyCapabilityConfigSchema
  }))
]);

module.exports = { capabilityCatalog, createCapabilityCatalog };
