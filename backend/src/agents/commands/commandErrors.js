const COMMAND_ERROR_CODES = Object.freeze({
  COMMAND_UNKNOWN: 'COMMAND_UNKNOWN',
  ARGUMENTS_INVALID: 'ARGUMENTS_INVALID',
  CAPABILITY_DISABLED: 'CAPABILITY_DISABLED',
  CONFIG_STALE: 'CONFIG_STALE',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  OWNERSHIP_STALE: 'OWNERSHIP_STALE',
  TERMINAL_COMMAND_EXISTS: 'TERMINAL_COMMAND_EXISTS',
  MUTATIONS_DISABLED: 'MUTATIONS_DISABLED',
  COMMAND_FAILED: 'COMMAND_FAILED'
});

class CommandError extends Error {
  constructor(code, message = code, details) {
    super(message);
    this.name = 'CommandError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const ALLOWED_COMMAND_ERROR_CODES = new Set(Object.values(COMMAND_ERROR_CODES));

function normalizeCommandErrorCode(code) {
  return ALLOWED_COMMAND_ERROR_CODES.has(code)
    ? code
    : COMMAND_ERROR_CODES.COMMAND_FAILED;
}

module.exports = { COMMAND_ERROR_CODES, CommandError, normalizeCommandErrorCode };
