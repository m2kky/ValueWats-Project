const crypto = require('crypto');

function verifySallaSignature({ rawBody, signature, secret } = {}) {
  if (!Buffer.isBuffer(rawBody) || !/^[a-f\d]{64}$/i.test(signature || '') || !secret) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const actual = Buffer.from(signature, 'hex');
  return crypto.timingSafeEqual(expected, actual);
}

module.exports = { verifySallaSignature };
