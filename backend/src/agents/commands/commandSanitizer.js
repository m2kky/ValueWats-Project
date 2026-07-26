const {
  REDACTED,
  isSensitiveKey,
  redactString,
  sanitizeError
} = require('../../logging/redaction');
const { normalizeCommandErrorCode } = require('./commandErrors');

const MAX_RESULT_LENGTH = 20_000;
const MAX_DEPTH = 20;
const MAX_NODES = 1_000;
const MAX_STRING_LENGTH = 4_000;
const MAX_COLLECTION_ITEMS = 200;

function boundedRedact(value, state, depth = 0) {
  if (typeof value === 'string') return redactString(value).slice(0, MAX_STRING_LENGTH);
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (state.seen.has(value)) return '[CIRCULAR]';
  if (depth >= MAX_DEPTH) return '[TRUNCATED_DEPTH]';
  if (state.nodes >= MAX_NODES) return '[TRUNCATED_NODES]';

  state.nodes += 1;
  state.seen.add(value);
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, MAX_COLLECTION_ITEMS);
    const redacted = [];
    for (let index = 0; index < limit; index += 1) {
      redacted.push(boundedRedact(value[index], state, depth + 1));
    }
    if (value.length > limit) redacted.push('[TRUNCATED_ITEMS]');
    return redacted;
  }

  const redacted = {};
  const entries = Object.entries(value);
  for (const [key, item] of entries.slice(0, MAX_COLLECTION_ITEMS)) {
    redacted[key] = isSensitiveKey(key)
      ? REDACTED
      : boundedRedact(item, state, depth + 1);
  }
  if (entries.length > MAX_COLLECTION_ITEMS) redacted.__truncatedItems = true;
  return redacted;
}

function sanitizeCommandValue(value) {
  const redacted = boundedRedact(value, { seen: new WeakSet(), nodes: 0 });
  if (redacted === undefined) return null;

  try {
    const serialized = JSON.stringify(redacted);
    if (serialized.length > MAX_RESULT_LENGTH) {
      return { truncated: true, size: serialized.length };
    }
    return JSON.parse(serialized);
  } catch {
    return { serializationFailed: true };
  }
}

function sanitizeCommandError(error) {
  const sanitized = sanitizeError(error);
  return {
    ...sanitized,
    code: normalizeCommandErrorCode(sanitized.code)
  };
}

module.exports = { normalizeCommandErrorCode, sanitizeCommandValue, sanitizeCommandError };
