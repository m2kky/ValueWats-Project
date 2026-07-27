const crypto = require('crypto');

function verifyMetaSignature({ rawBody, signature, appSecret }) {
  if (!Buffer.isBuffer(rawBody) || !signature?.startsWith('sha256=') || !appSecret) return false;

  const expected = Buffer.from(
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex'),
    'hex'
  );
  const actual = Buffer.from(signature.slice(7), 'hex');

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function parseVerifiedMetaBody(req) {
  if (!Buffer.isBuffer(req.body)) throw new TypeError('Expected verified Meta webhook bytes');
  return JSON.parse(req.body.toString('utf8'));
}

module.exports = { parseVerifiedMetaBody, verifyMetaSignature };
