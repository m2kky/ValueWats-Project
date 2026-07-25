const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'authorization', 'cookie', 'setcookie', 'token', 'accesstoken', 'refreshtoken',
  'idtoken', 'password', 'secret', 'apikey', 'privatekey', 'credential', 'credentials',
  'phone', 'phonenumber', 'contactnumber', 'recipientnumber', 'sendernumber', 'email',
  'prompt', 'systemprompt', 'instructions', 'toolarguments', 'rawwebhookpayload',
  'webhookpayload', 'rawpayload'
]);

const normalizeKey = (key) => String(key).replace(/[^a-z0-9]/gi, '').toLowerCase();
const isSensitiveKey = (key) => {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEYS.has(normalized)
    || /(authorization|bearer|cookie|session|token|password|secret|apikey|privatekey|credential|phone|email|prompt|tool.*arguments|raw.*webhook|webhook.*payload)/.test(normalized);
};

function redactString(value) {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')
    .replace(/(^|[^\w])(\+?\d[\d\s().-]{8,}\d)(?=$|[^\w])/g, '$1[REDACTED_PHONE]')
    .replace(
      /\b(authorization|cookie|(?:access[_-]?)?token|password|secret|api[_-]?key)\s*[:=]\s*(?:Bearer\s+)?[^\s,;]+/gi,
      '$1=[REDACTED]'
    );
}

function redactForLog(value, seen = new WeakSet()) {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return '[CIRCULAR]';

  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactForLog(item, seen));

  const redacted = {};
  for (const [key, item] of Object.entries(value)) {
    redacted[key] = isSensitiveKey(key)
      ? REDACTED
      : redactForLog(item, seen);
  }
  return redacted;
}

function sanitizeError(error) {
  const code = error?.code || error?.name || 'UNKNOWN_ERROR';
  const message = redactForLog(String(error?.message || 'Unknown error')).slice(0, 1000);
  return { code, message };
}

module.exports = { REDACTED, redactForLog, sanitizeError };
