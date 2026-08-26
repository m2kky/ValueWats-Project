const crypto = require('crypto');

const STATE_TTL_SECONDS = 600;

function getSecret() {
  if (!process.env.SALLA_CLIENT_SECRET) throw new Error('SALLA_CLIENT_SECRET is required');
  return process.env.SALLA_CLIENT_SECRET;
}

function toBase64Url(value) {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  if (typeof value !== 'string' || !value || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid OAuth state');
  const decoded = Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4), 'base64');
  if (toBase64Url(decoded) !== value) throw new Error('Invalid OAuth state');
  return decoded;
}

function assertDate(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new TypeError('now must be a valid Date');
}

function assertIntegrationId(integrationId) {
  if (typeof integrationId !== 'string' || !integrationId) throw new TypeError('integrationId must be a non-empty string');
}

function assertTenantId(tenantId) {
  if (typeof tenantId !== 'string' || !tenantId) throw new TypeError('tenantId must be a non-empty string');
}

function assertFlow(flow) {
  if (!['connect', 'reconnect'].includes(flow)) throw new TypeError('flow must be connect or reconnect');
}

function sign(payload) {
  return toBase64Url(crypto.createHmac('sha256', getSecret()).update(payload).digest());
}

function createStoreOAuthState({ integrationId, tenantId, flow, now }) {
  assertIntegrationId(integrationId);
  assertTenantId(tenantId);
  assertFlow(flow);
  assertDate(now);
  const iat = Math.floor(now.getTime() / 1000);
  const payload = toBase64Url(Buffer.from(JSON.stringify({
    integrationId,
    tenantId,
    flow,
    nonce: toBase64Url(crypto.randomBytes(16)),
    iat,
    exp: iat + STATE_TTL_SECONDS
  }), 'utf8'));
  return `${payload}.${sign(payload)}`;
}

function verifyStoreOAuthState(state, { now }) {
  try {
    assertDate(now);
    const parts = typeof state === 'string' ? state.split('.') : [];
    if (parts.length !== 2) throw new Error('Invalid OAuth state');
    const [payloadPart, signaturePart] = parts;
    const expectedSignature = fromBase64Url(sign(payloadPart));
    const actualSignature = fromBase64Url(signaturePart);
    if (actualSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(actualSignature, expectedSignature)) {
      throw new Error('Invalid OAuth state');
    }

    const payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8'));
    if (!payload || typeof payload !== 'object' || Object.getPrototypeOf(payload) !== Object.prototype ||
        Object.keys(payload).length !== 6 || typeof payload.integrationId !== 'string' || !payload.integrationId ||
        typeof payload.tenantId !== 'string' || !payload.tenantId || !['connect', 'reconnect'].includes(payload.flow) ||
        typeof payload.nonce !== 'string' || !/^[A-Za-z0-9_-]+$/.test(payload.nonce) ||
        fromBase64Url(payload.nonce).length !== 16 || !Number.isInteger(payload.iat) ||
        !Number.isInteger(payload.exp) || payload.exp - payload.iat !== STATE_TTL_SECONDS) {
      throw new Error('Invalid OAuth state');
    }
    if (Math.floor(now.getTime() / 1000) >= payload.exp) throw new Error('OAuth state expired');
    return { integrationId: payload.integrationId, tenantId: payload.tenantId, flow: payload.flow };
  } catch (error) {
    if (error.message === 'OAuth state expired') throw error;
    throw new Error('Invalid OAuth state');
  }
}

function createStoreOAuthVerifier(state) {
  if (typeof state !== 'string' || !state) throw new TypeError('state must be a non-empty string');
  return crypto.createHash('sha256').update(state).digest('hex');
}

function verifyStoreOAuthVerifier(state, verifier) {
  if (typeof verifier !== 'string' || !/^[a-f0-9]{64}$/.test(verifier)) return false;
  try {
    const expected = Buffer.from(createStoreOAuthVerifier(state), 'hex');
    const actual = Buffer.from(verifier, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (_) {
    return false;
  }
}

module.exports = {
  createStoreOAuthState,
  verifyStoreOAuthState,
  createStoreOAuthVerifier,
  verifyStoreOAuthVerifier
};
