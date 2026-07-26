const { capabilityCatalog } = require('../config/capabilityCatalog');
const { compileStrictObjectSchema } = require('../config/capabilitySchemas');
const { assignConversationCommand } = require('./internal/assignConversation');
const { closeConversationCommand } = require('./internal/closeConversation');

function createCommandRegistry(definitions = [], { catalog = capabilityCatalog } = {}) {
  const commands = new Map();

  for (const definition of definitions) {
    if (!definition?.type || commands.has(definition.type)) {
      throw Object.assign(new Error(`Duplicate command: ${definition?.type}`), {
        code: 'COMMAND_DUPLICATE'
      });
    }

    const capability = catalog.get(definition.capabilityType);
    if (
      !capability
      || capability.risk !== definition.risk
      || capability.delivery !== definition.delivery
      || capability.terminalConversationCommand !== definition.terminalConversationCommand
    ) {
      throw Object.assign(
        new Error(`Command ${definition.type} does not match its capability`),
        { code: 'COMMAND_CAPABILITY_MISMATCH' }
      );
    }
    if (
      definition.delivery === 'outbox'
      && (typeof definition.buildOutboxIntent !== 'function' || definition.execute)
    ) {
      throw Object.assign(new Error(`Command ${definition.type} has no outbox intent builder`), {
        code: 'OUTBOX_INTENT_REQUIRED'
      });
    }
    if (definition.delivery === 'internal' && typeof definition.execute !== 'function') {
      throw Object.assign(new Error(`Command ${definition.type} has no executor`), {
        code: 'COMMAND_EXECUTOR_REQUIRED'
      });
    }

    commands.set(definition.type, Object.freeze({
      ...definition,
      validateArguments: compileStrictObjectSchema(definition.parameters)
    }));
  }

  return Object.freeze({
    get(type) {
      return commands.get(type);
    },
    list() {
      return [...commands.values()];
    }
  });
}

const commandRegistry = createCommandRegistry([
  assignConversationCommand,
  closeConversationCommand
]);

module.exports = { commandRegistry, createCommandRegistry };
