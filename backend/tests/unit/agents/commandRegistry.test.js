const { createCapabilityCatalog } = require('../../../src/agents/config/capabilityCatalog');
const { evaluateCommandPolicy } = require('../../../src/agents/commands/commandPolicy');
const { createCommandRegistry } = require('../../../src/agents/commands/commandRegistry');
const {
  canonicalizeCommandArguments,
  createCommandIdempotencyKey
} = require('../../../src/agents/commands/commandIdempotency');
const { COMMAND_ERROR_CODES, CommandError } = require('../../../src/agents/commands/commandErrors');
const { commandRegistry: staticCommandRegistry } = require('../../../src/agents/commands/commandRegistry');
const { capabilityCatalog: staticCapabilityCatalog } = require('../../../src/agents/config/capabilityCatalog');
const {
  sanitizeCommandError,
  sanitizeCommandValue
} = require('../../../src/agents/commands/commandSanitizer');

function createTestRegistry() {
  const catalog = createCapabilityCatalog([
    {
      type: 'record_effect',
      risk: 'medium',
      delivery: 'internal',
      terminalConversationCommand: false,
      configSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          maximum: { type: 'integer', minimum: 1 }
        }
      }
    }
  ]);

  return createCommandRegistry([
    {
      type: 'record_effect',
      capabilityType: 'record_effect',
      risk: 'medium',
      delivery: 'internal',
      terminalConversationCommand: false,
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['amount'],
        properties: {
          amount: { type: 'integer', minimum: 1, maximum: 10 }
        }
      },
      authorize: async () => ({ allowed: true }),
      execute: async () => ({ recorded: true })
    }
  ], { catalog });
}

describe('command registry', () => {
  it('registers exactly one command for each static terminal capability', () => {
    const terminalCapabilities = staticCapabilityCatalog.list()
      .filter((capability) => capability.terminalConversationCommand);
    const terminalCommands = staticCommandRegistry.list()
      .filter((command) => command.terminalConversationCommand);

    expect(terminalCapabilities.map(({ type }) => type).sort()).toEqual([
      'assign_conversation',
      'close_conversation'
    ]);
    expect(terminalCommands.map(({ capabilityType }) => capabilityType).sort()).toEqual([
      'assign_conversation',
      'close_conversation'
    ]);
    expect(new Set(terminalCommands.map(({ capabilityType }) => capabilityType)).size).toBe(2);
  });

  it('registers every static capability as an executable command', () => {
    expect(staticCommandRegistry.list().map(({ capabilityType }) => capabilityType).sort())
      .toEqual(staticCapabilityCatalog.list().map(({ type }) => type).sort());
  });

  it('resolves only exact, statically registered command names', () => {
    const registry = createTestRegistry();

    expect(registry.get('record_effect')?.type).toBe('record_effect');
    expect(registry.get('Record_Effect')).toBeUndefined();
    expect(registry.get('__proto__')).toBeUndefined();
    expect(registry.get('send_email')).toBeUndefined();
  });

  it('validates arguments with a strict compiled AJV schema', () => {
    const definition = createTestRegistry().get('record_effect');

    expect(definition.validateArguments({ amount: 2 })).toBe(true);
    expect(definition.validateArguments({ amount: 0 })).toBe(false);
    expect(definition.validateArguments({ amount: 2, hidden: true })).toBe(false);
    expect(definition.validateArguments.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ keyword: 'additionalProperties' })
    ]));
  });

  it('rejects duplicate command and capability definitions', () => {
    const capability = {
      type: 'duplicate',
      risk: 'low',
      delivery: 'internal',
      terminalConversationCommand: false,
      configSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      }
    };

    expect(() => createCapabilityCatalog([capability, capability]))
      .toThrow(expect.objectContaining({ code: 'CAPABILITY_DUPLICATE' }));

    const catalog = createCapabilityCatalog([capability]);
    const command = {
      type: 'duplicate',
      capabilityType: 'duplicate',
      risk: 'low',
      delivery: 'internal',
      terminalConversationCommand: false,
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      },
      execute: async () => ({ ok: true })
    };

    expect(() => createCommandRegistry([command, command], { catalog }))
      .toThrow(expect.objectContaining({ code: 'COMMAND_DUPLICATE' }));
  });

  it('rejects loose schemas and catalog metadata mismatches', () => {
    const catalog = createCapabilityCatalog([
      {
        type: 'terminal_action',
        risk: 'high',
        delivery: 'internal',
        terminalConversationCommand: true,
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {}
        }
      }
    ]);
    const base = {
      type: 'terminal_action',
      capabilityType: 'terminal_action',
      risk: 'high',
      delivery: 'internal',
      terminalConversationCommand: true,
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      },
      execute: async () => ({ ok: true })
    };

    expect(() => createCommandRegistry([
      { ...base, parameters: { type: 'object', properties: {} } }
    ], { catalog })).toThrow(expect.objectContaining({ code: 'SCHEMA_NOT_STRICT' }));

    expect(() => createCommandRegistry([
      { ...base, risk: 'low' }
    ], { catalog })).toThrow(expect.objectContaining({ code: 'COMMAND_CAPABILITY_MISMATCH' }));
  });

  it('rejects loose nested object schemas', () => {
    expect(() => createCapabilityCatalog([
      {
        type: 'nested',
        risk: 'low',
        delivery: 'internal',
        terminalConversationCommand: false,
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            target: {
              type: 'object',
              properties: {
                id: { type: 'string' }
              }
            }
          }
        }
      }
    ])).toThrow(expect.objectContaining({ code: 'SCHEMA_NOT_STRICT' }));
  });

  it('rejects referenced loose object schemas', () => {
    expect(() => createCapabilityCatalog([
      {
        type: 'referenced',
        risk: 'low',
        delivery: 'internal',
        terminalConversationCommand: false,
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            target: { $ref: '#/$defs/Target' }
          },
          $defs: {
            Target: {
              type: 'object',
              properties: {
                id: { type: 'string' }
              }
            }
          }
        }
      }
    ])).toThrow(expect.objectContaining({ code: 'SCHEMA_NOT_STRICT' }));

    expect(() => createCapabilityCatalog([
      {
        type: 'legacy_ref',
        risk: 'low',
        delivery: 'internal',
        terminalConversationCommand: false,
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            target: { $ref: '#/definitions/Target' }
          },
          definitions: {
            Target: {
              type: 'object',
              properties: {}
            }
          }
        }
      }
    ])).toThrow(expect.objectContaining({ code: 'SCHEMA_NOT_STRICT' }));
  });

  it('rejects unsupported schema shapes that can hide object validation', () => {
    for (const [index, configSchema] of [
      {
        type: 'object',
        additionalProperties: false,
        properties: {},
        dependencies: {
          target: { $ref: '#/definitions/Target' }
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: {}
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: { type: ['object', 'null'] }
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: true
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: false
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: {
            not: { type: 'null' }
          }
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: {
            anyOf: [{ type: 'string' }]
          }
        }
      }
    ].entries()) {
      expect(() => createCapabilityCatalog([{
        type: `unsupported_${index}`,
        risk: 'low',
        delivery: 'internal',
        terminalConversationCommand: false,
        configSchema
      }])).toThrow(expect.objectContaining({ code: 'SCHEMA_NOT_STRICT' }));
    }
  });

  it('requires external commands to create an outbox intent', () => {
    const catalog = createCapabilityCatalog([
      {
        type: 'send_email',
        risk: 'external',
        delivery: 'outbox',
        terminalConversationCommand: false,
        integration: { required: true, types: ['smtp'] },
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {}
        }
      }
    ]);
    const command = {
      type: 'send_email',
      capabilityType: 'send_email',
      risk: 'external',
      delivery: 'outbox',
      terminalConversationCommand: false,
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      },
      execute: async () => ({ sent: true })
    };

    expect(() => createCommandRegistry([command], { catalog }))
      .toThrow(expect.objectContaining({ code: 'OUTBOX_INTENT_REQUIRED' }));
  });
});

describe('command argument canonicalization', () => {
  it('rejects prototype-polluting keys before schema validation or hashing', () => {
    const polluted = JSON.parse('{"__proto__":{"amount":7}}');
    const nested = JSON.parse('{"target":{"constructor":{"prototype":{"admin":true}}}}');

    expect(() => canonicalizeCommandArguments(polluted))
      .toThrow(expect.objectContaining({ code: 'INVALID_COMMAND_ARGUMENTS' }));
    expect(() => canonicalizeCommandArguments(nested))
      .toThrow(expect.objectContaining({ code: 'INVALID_COMMAND_ARGUMENTS' }));
  });

  it('does not hash prototype-polluted arguments as an empty command', () => {
    const context = {
      tenantId: 'tenant-1',
      runId: 'run-1',
      type: 'record_effect'
    };

    expect(() => createCommandIdempotencyKey({
      ...context,
      arguments: JSON.parse('{"__proto__":{"amount":7}}')
    })).toThrow(expect.objectContaining({ code: 'INVALID_COMMAND_ARGUMENTS' }));
    expect(createCommandIdempotencyKey({ ...context, arguments: {} }))
      .toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('command policy', () => {
  it('normalizes unsafe command-specific denial codes', async () => {
    const catalog = createCapabilityCatalog([
      {
        type: 'record_effect',
        risk: 'low',
        delivery: 'internal',
        terminalConversationCommand: false,
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {}
        }
      }
    ]);
    const decision = await evaluateCommandPolicy({
      state: {
        tenant: { id: 'tenant-1', status: 'active' },
        sourceAgent: {
          id: 'agent-1',
          tenantId: 'tenant-1',
          isActive: true,
          isPublished: true,
          configVersion: 1,
          deletedAt: null
        },
        sourceConfigVersion: 1,
        conversation: {
          id: 'conversation-1',
          tenantId: 'tenant-1',
          currentAgentId: 'agent-1',
          assignmentVersion: 0
        },
        capabilityRows: [{
          key: 'record_effect',
          isEnabled: true,
          config: {},
          integrationId: null,
          integration: null
        }]
      },
      definition: {
        capabilityType: 'record_effect',
        authorize: async () => ({ allowed: false, code: 'token=secret-value' })
      },
      catalog,
      args: {},
      executionMode: 'preview'
    });

    expect(decision).toMatchObject({
      allowed: false,
      code: COMMAND_ERROR_CODES.COMMAND_FAILED
    });
  });

  it('normalizes thrown command-specific policy errors', async () => {
    const catalog = createCapabilityCatalog([
      {
        type: 'record_effect',
        risk: 'low',
        delivery: 'internal',
        terminalConversationCommand: false,
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {}
        }
      }
    ]);
    const decision = await evaluateCommandPolicy({
      state: {
        tenant: { id: 'tenant-1', status: 'active' },
        sourceAgent: {
          id: 'agent-1',
          tenantId: 'tenant-1',
          isActive: true,
          isPublished: true,
          configVersion: 1,
          deletedAt: null
        },
        sourceConfigVersion: 1,
        conversation: {
          id: 'conversation-1',
          tenantId: 'tenant-1',
          currentAgentId: 'agent-1',
          assignmentVersion: 0
        },
        capabilityRows: [{
          key: 'record_effect',
          isEnabled: true,
          config: {},
          integrationId: null,
          integration: null
        }]
      },
      definition: {
        capabilityType: 'record_effect',
        authorize: async () => {
          throw new CommandError('TOKEN=secret-value', 'policy failed with token=secret-value');
        }
      },
      catalog,
      args: {},
      executionMode: 'preview'
    });

    expect(decision).toMatchObject({
      allowed: false,
      code: COMMAND_ERROR_CODES.COMMAND_FAILED,
      checks: { command: 'failed' }
    });
  });

  it('passes the current policy client only to the policy scope factory', async () => {
    const catalog = createCapabilityCatalog([
      {
        type: 'record_effect',
        risk: 'low',
        delivery: 'internal',
        terminalConversationCommand: false,
        configSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {}
        }
      }
    ]);
    const policyClient = Object.freeze({ marker: 'transaction-client' });
    let receivedPolicyClient;
    let receivedScope;
    await evaluateCommandPolicy({
      prisma: policyClient,
      state: {
        tenant: { id: 'tenant-1', status: 'active' },
        sourceAgent: {
          id: 'agent-1',
          tenantId: 'tenant-1',
          isActive: true,
          isPublished: true,
          configVersion: 1,
          deletedAt: null
        },
        sourceConfigVersion: 1,
        conversation: {
          id: 'conversation-1',
          tenantId: 'tenant-1',
          currentAgentId: 'agent-1',
          assignmentVersion: 0
        },
        capabilityRows: [{
          key: 'record_effect',
          isEnabled: true,
          config: {},
          integrationId: null,
          integration: null
        }]
      },
      definition: {
        capabilityType: 'record_effect',
        authorize: async (context, args, policyScope) => {
          receivedScope = policyScope;
          return { allowed: true };
        }
      },
      catalog,
      args: {},
      executionMode: 'preview',
      createPolicyScope: ({ prisma }) => {
        receivedPolicyClient = prisma;
        return Object.freeze({ canUseTarget: async () => true });
      }
    });

    expect(receivedPolicyClient).toBe(policyClient);
    expect(receivedScope).toEqual({ canUseTarget: expect.any(Function) });
    expect(receivedScope).not.toHaveProperty('prisma');
  });
});

describe('command result sanitizer', () => {
  it('bounds deep values and redacts secret-bearing fields', () => {
    const deep = { authorization: 'Bearer secret' };
    let cursor = deep;
    for (let index = 0; index < 5_000; index += 1) {
      cursor.next = {};
      cursor = cursor.next;
    }

    expect(() => sanitizeCommandValue(deep)).not.toThrow();
    expect(sanitizeCommandValue({
      token: 'secret',
      nested: { email: 'person@example.test' }
    })).toEqual({
      token: '[REDACTED]',
      nested: { email: '[REDACTED]' }
    });
  });

  it('bounds array traversal before redacting large values', () => {
    let reads = 0;
    const hugeArray = new Proxy(Array.from({ length: 5_000 }, () => ({ ok: true })), {
      get(target, property, receiver) {
        if (/^\d+$/.test(String(property))) {
          reads += 1;
          if (reads > 250) throw new Error('unbounded traversal');
        }
        return Reflect.get(target, property, receiver);
      }
    });

    expect(() => sanitizeCommandValue(hugeArray)).not.toThrow();
    expect(reads).toBeLessThanOrEqual(250);
  });

  it('normalizes unsafe command error codes', () => {
    expect(sanitizeCommandError(new CommandError(COMMAND_ERROR_CODES.CONFIG_STALE))).toEqual({
      code: COMMAND_ERROR_CODES.CONFIG_STALE,
      message: COMMAND_ERROR_CODES.CONFIG_STALE
    });
    expect(sanitizeCommandError({
      code: 'authorization=secret-value',
      message: 'failed with token=secret-value'
    })).toEqual({
      code: COMMAND_ERROR_CODES.COMMAND_FAILED,
      message: 'failed with token=[REDACTED]'
    });
  });

  it('exports the same command code normalizer for policy denials', () => {
    const { normalizeCommandErrorCode } = require('../../../src/agents/commands/commandSanitizer');

    expect(normalizeCommandErrorCode(COMMAND_ERROR_CODES.OWNERSHIP_STALE))
      .toBe(COMMAND_ERROR_CODES.OWNERSHIP_STALE);
    expect(normalizeCommandErrorCode('token=secret-value'))
      .toBe(COMMAND_ERROR_CODES.COMMAND_FAILED);
  });
});
