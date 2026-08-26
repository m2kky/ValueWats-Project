const crypto = require('crypto');
const { verifySallaSignature } = require('../../../src/stores/providers/salla/sallaWebhookSecurity');

describe('Salla webhook security', () => {
  const secret = 'salla-webhook-secret';
  const rawBody = Buffer.from('{"event":"product.created","merchant":12}');

  it('accepts an HMAC-SHA256 signature over the exact raw bytes', () => {
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    expect(verifySallaSignature({ rawBody, signature, secret })).toBe(true);
  });

  it.each([
    {},
    { rawBody: 'not-bytes', signature: 'a'.repeat(64), secret },
    { rawBody, signature: 'invalid', secret },
    { rawBody, signature: 'a'.repeat(62), secret },
    { rawBody, signature: 'a'.repeat(64), secret: '' }
  ])('safely rejects missing or malformed signature input: %j', (input) => {
    expect(verifySallaSignature(input)).toBe(false);
  });

  it('rejects a signature generated for different bytes', () => {
    const signature = crypto.createHmac('sha256', secret).update(Buffer.from('{}')).digest('hex');

    expect(verifySallaSignature({ rawBody, signature, secret })).toBe(false);
  });
});
