const { createHash } = require('crypto');

const SECRET_KEY_PATTERN = /(authorization|bearer|cookie|session|password|secret|access.?token|refresh.?token|id.?token|api.?key|private.?key|credential)/i;

function commandArgumentError(code, message, path) {
  return Object.assign(new Error(message), { code, path });
}

function canonicalize(value, path) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((item, index) => canonicalize(item, `${path}[${index}]`));

  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
    throw commandArgumentError('INVALID_COMMAND_ARGUMENTS', `Unsupported command argument at ${path}`, path);
  }

  const normalized = {};
  for (const key of Object.keys(value).sort()) {
    const keyPath = `${path}.${key}`;
    if (SECRET_KEY_PATTERN.test(key.replace(/[^a-z0-9]/gi, ''))) {
      throw commandArgumentError('SECRET_ARGUMENT_KEY', `Secret-bearing command argument key at ${keyPath}`, keyPath);
    }
    if (value[key] === undefined) {
      throw commandArgumentError('INVALID_COMMAND_ARGUMENTS', `Undefined command argument at ${keyPath}`, keyPath);
    }
    normalized[key] = canonicalize(value[key], keyPath);
  }
  return normalized;
}

function canonicalizeCommandArguments(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw commandArgumentError('INVALID_COMMAND_ARGUMENTS', 'Command arguments must be an object', '$');
  }
  return canonicalize(value, '$');
}

function createCommandIdempotencyKey({ tenantId, runId, type, arguments: args }) {
  if (!tenantId || !runId || !type) {
    throw commandArgumentError('INVALID_COMMAND_IDENTITY', 'tenantId, runId, and type are required', '$');
  }

  const canonicalArguments = canonicalizeCommandArguments(args);
  return createHash('sha256')
    .update(JSON.stringify({ version: 1, tenantId, runId, type, arguments: canonicalArguments }))
    .digest('hex');
}

module.exports = { canonicalizeCommandArguments, createCommandIdempotencyKey };
