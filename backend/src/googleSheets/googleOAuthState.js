const crypto = require('crypto');

function secret() {
  const value = process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error('Google OAuth state secret is not configured');
  return value;
}

function sign(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function createGoogleOAuthState({ integrationId, tenantId, type, now = Date.now }) {
  return sign({
    integrationId,
    tenantId,
    type,
    expiresAt: now() + (10 * 60 * 1000),
    nonce: crypto.randomBytes(16).toString('hex')
  });
}

function verifyGoogleOAuthState(value, now = Date.now) {
  const [encoded, signature, extra] = String(value || '').split('.');
  if (!encoded || !signature || extra) throw new Error('Invalid Google OAuth state');
  const expected = crypto.createHmac('sha256', secret()).update(encoded).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error('Invalid Google OAuth state');
  }
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  if (
    !payload.integrationId
    || !payload.tenantId
    || !payload.type
    || !Number.isFinite(payload.expiresAt)
    || payload.expiresAt < now()
  ) throw new Error('Expired Google OAuth state');
  return payload;
}

module.exports = { createGoogleOAuthState, verifyGoogleOAuthState };
