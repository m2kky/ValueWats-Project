const { capabilityCatalog } = require('../config/capabilityCatalog');
const { commandRegistry } = require('./commandRegistry');
const { createAgentCommandRepository, TERMINAL_STATUSES } = require('../persistence/agentCommandRepository');
const { createOutboxService } = require('../../events/outboxService');
const { canonicalizeCommandArguments } = require('./commandIdempotency');
const {
  evaluateCommandPolicy,
  loadLiveCommandContext,
  loadPreviewCommandContext,
  NOT_EVALUATED
} = require('./commandPolicy');
const { CommandError, COMMAND_ERROR_CODES } = require('./commandErrors');
const { sanitizeCommandValue, sanitizeCommandError } = require('./commandSanitizer');

function validationErrors(validate) {
  return (validate.errors || []).map(({ instancePath, keyword, message }) => ({
    path: instancePath,
    keyword,
    message
  }));
}

function freezeArguments(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(freezeArguments);
  }
  return value;
}

function commandResponse(command, { replayed = false } = {}) {
  return {
    commandId: command.id,
    status: command.status,
    code: command.errorCode || undefined,
    error: command.errorMessage || undefined,
    result: command.result ?? undefined,
    replayed
  };
}

function createCommandExecutor({
  prisma,
  registry = commandRegistry,
  catalog = capabilityCatalog,
  createExecutionScope,
  createPolicyScope,
  metrics
}) {
  if (!prisma) throw new Error('Prisma client is required');
  const repository = createAgentCommandRepository(prisma);

  async function recordMetric(command) {
    try {
      await metrics?.recordCommand?.({
        tenantId: command.tenantId,
        type: command.type,
        status: command.status
      });
    } catch {
      // Metrics are deliberately outside the command transaction.
    }
  }

  async function createLedgerCommand(state, definition, args) {
    return repository.createOrGet({
      tenantId: state.tenant.id,
      runId: state.run.id,
      conversationId: state.conversation.id,
      sourceAgentId: state.sourceAgent?.id,
      type: definition.type,
      arguments: args
    });
  }

  async function persistDenial(state, definition, args, decision) {
    const command = await createLedgerCommand(state, definition, args);
    if (TERMINAL_STATUSES.has(command.status)) {
      return commandResponse(command, { replayed: true });
    }
    const error = new CommandError(decision.code, decision.code);
    const denied = await repository.transition({
      tenantId: state.tenant.id,
      commandId: command.id,
      to: 'denied',
      error
    });
    await recordMetric(denied.command);
    return commandResponse(denied.command, { replayed: !denied.changed });
  }

  async function execute(input) {
    const definition = registry.get(input?.type);
    if (!definition) {
      return {
        status: 'rejected',
        code: COMMAND_ERROR_CODES.COMMAND_UNKNOWN
      };
    }
    let args;
    try {
      args = freezeArguments(canonicalizeCommandArguments(input.arguments));
    } catch {
      return {
        status: 'rejected',
        code: COMMAND_ERROR_CODES.ARGUMENTS_INVALID
      };
    }
    if (!definition.validateArguments(args)) {
      return {
        status: 'rejected',
        code: COMMAND_ERROR_CODES.ARGUMENTS_INVALID,
        details: validationErrors(definition.validateArguments)
      };
    }

    const state = await loadLiveCommandContext({
      prisma,
      tenantId: input.tenantId,
      runId: input.runId,
      expectedAssignmentVersion: input.expectedAssignmentVersion,
      definition
    });
    if (state.errorCode) {
      return { status: 'rejected', code: state.errorCode };
    }

    const executionMode = state.runtimeMode === 'shadow' ? 'shadow' : 'live';
    const decision = await evaluateCommandPolicy({
      prisma,
      state,
      definition,
      catalog,
      args,
      executionMode,
      createPolicyScope
    });

    if (executionMode === 'shadow') {
      const command = await createLedgerCommand(state, definition, args);
      if (TERMINAL_STATUSES.has(command.status)) {
        return commandResponse(command, { replayed: true });
      }
      const result = sanitizeCommandValue({
        wouldExecute: decision.allowed,
        code: decision.code,
        checks: decision.checks
      });
      const shadowed = await repository.transition({
        tenantId: state.tenant.id,
        commandId: command.id,
        to: 'shadowed',
        result
      });
      await recordMetric(shadowed.command);
      return {
        ...commandResponse(shadowed.command, { replayed: !shadowed.changed }),
        wouldExecute: decision.allowed,
        code: decision.code
      };
    }

    if (!decision.allowed) {
      return persistDenial(state, definition, args, decision);
    }

    const command = await createLedgerCommand(state, definition, args);
    if (TERMINAL_STATUSES.has(command.status) || command.status === 'running') {
      return commandResponse(command, { replayed: true });
    }

    const authorized = await repository.transition({
      tenantId: state.tenant.id,
      commandId: command.id,
      to: 'authorized'
    });
    if (TERMINAL_STATUSES.has(authorized.command.status)) {
      return commandResponse(authorized.command, { replayed: true });
    }

    if (definition.terminalConversationCommand) {
      const conflictError = new CommandError(
        COMMAND_ERROR_CODES.TERMINAL_COMMAND_EXISTS,
        'Another terminal command already exists for this run'
      );
      const terminal = await repository.claimTerminalSlot({
        tenantId: state.tenant.id,
        commandId: command.id,
        conflictError
      });
      if (!terminal.claimed) {
        await recordMetric(terminal.command);
        return commandResponse(terminal.command);
      }
    }

    const running = await repository.transition({
      tenantId: state.tenant.id,
      commandId: command.id,
      to: 'running'
    });
    if (!running.changed) {
      return commandResponse(running.command, { replayed: true });
    }

    try {
      const completed = await prisma.$transaction(async (transaction) => {
        const currentState = await loadLiveCommandContext({
          prisma: transaction,
          tenantId: input.tenantId,
          runId: input.runId,
          expectedAssignmentVersion: input.expectedAssignmentVersion,
          definition
        });
        const currentDecision = currentState.errorCode
          ? { allowed: false, code: currentState.errorCode }
          : await evaluateCommandPolicy({
            prisma: transaction,
            state: currentState,
            definition,
            catalog,
            args,
            executionMode: 'live',
            createPolicyScope
          });
        if (!currentDecision.allowed) {
          throw Object.assign(
            new CommandError(currentDecision.code, currentDecision.code),
            { policyDenial: true }
          );
        }

        let rawResult;
        if (definition.delivery === 'outbox') {
          const intent = await definition.buildOutboxIntent(currentDecision.context, args);
          if (
            !intent
            || typeof intent.aggregateType !== 'string'
            || typeof intent.aggregateId !== 'string'
            || typeof intent.eventType !== 'string'
          ) {
            throw new CommandError(
              COMMAND_ERROR_CODES.COMMAND_FAILED,
              'Command produced an invalid outbox intent'
            );
          }
          const event = await createOutboxService(transaction).createOrGet({
            tenantId: currentState.tenant.id,
            commandId: command.id,
            runId: currentState.run.id,
            aggregateType: intent.aggregateType,
            aggregateId: intent.aggregateId,
            eventType: intent.eventType,
            idempotencyKey: `${command.id}:outbox`,
            payload: intent.payload
          });
          rawResult = {
            delivery: 'outbox',
            outboxEventId: event.id,
            outboxStatus: event.status
          };
        } else {
          if (typeof createExecutionScope !== 'function') {
            throw new CommandError(
              COMMAND_ERROR_CODES.COMMAND_FAILED,
              'No scoped command execution service is configured'
            );
          }
          const executionContext = Object.freeze({
            ...currentDecision.context,
            commandId: command.id
          });
          const scope = createExecutionScope({
            transaction,
            commandId: command.id,
            context: executionContext,
            capability: executionContext.capability,
            definition
          });
          rawResult = await definition.execute(scope, executionContext, args);
        }

        const result = sanitizeCommandValue(rawResult);
        const transactionRepository = createAgentCommandRepository(transaction);
        const transitioned = await transactionRepository.transition({
          tenantId: state.tenant.id,
          commandId: command.id,
          to: 'succeeded',
          expectedAttempt: running.command.attempts,
          result
        });
        if (!transitioned.changed) {
          throw new CommandError(
            COMMAND_ERROR_CODES.COMMAND_FAILED,
            'Command attempt lost its execution lease'
          );
        }
        return transitioned.command;
      }, { isolationLevel: 'Serializable' });
      await recordMetric(completed);
      return commandResponse(completed);
    } catch (error) {
      const sanitized = sanitizeCommandError(error);
      const failed = await repository.transition({
        tenantId: state.tenant.id,
        commandId: command.id,
        to: error.policyDenial ? 'denied' : 'failed',
        expectedAttempt: running.command.attempts,
        error: new CommandError(sanitized.code, sanitized.message)
      });
      await recordMetric(failed.command);
      return commandResponse(failed.command);
    }
  }

  async function preview(input) {
    const definition = registry.get(input?.type);
    if (!definition) {
      return {
        mode: 'preview',
        status: 'rejected',
        code: COMMAND_ERROR_CODES.COMMAND_UNKNOWN
      };
    }
    let args;
    try {
      args = freezeArguments(canonicalizeCommandArguments(input.arguments));
    } catch {
      return {
        mode: 'preview',
        status: 'rejected',
        code: COMMAND_ERROR_CODES.ARGUMENTS_INVALID
      };
    }
    if (!definition.validateArguments(args)) {
      return {
        mode: 'preview',
        status: 'rejected',
        code: COMMAND_ERROR_CODES.ARGUMENTS_INVALID,
        details: validationErrors(definition.validateArguments)
      };
    }

    const state = await loadPreviewCommandContext({
      prisma,
      tenantId: input.tenantId,
      sourceAgentId: input.sourceAgentId,
      sourceConfigVersion: input.sourceConfigVersion,
      definition,
      mockContact: input.mockContact
    });
    const decision = await evaluateCommandPolicy({
      prisma,
      state,
      definition,
      catalog,
      args,
      executionMode: 'preview',
      createPolicyScope
    });

    return {
      mode: 'preview',
      status: 'previewed',
      allowed: decision.allowed,
      code: decision.code,
      checks: {
        ...decision.checks,
        terminalSlot: NOT_EVALUATED,
        idempotency: NOT_EVALUATED,
        transactionWrites: NOT_EVALUATED,
        outboxDelivery: NOT_EVALUATED,
        providerOutcome: NOT_EVALUATED
      }
    };
  }

  return Object.freeze({ execute, preview });
}

module.exports = { createCommandExecutor };
