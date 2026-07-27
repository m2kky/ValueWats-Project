const crypto = require('crypto');
const { verifyMetaSignature } = require('../../../src/meta/metaWebhookSecurity');

describe('verifyMetaSignature', () => {
  const secret = 'meta-secret';
  const body = Buffer.from('{"object":"page"}');
  const valid = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

  it('accepts the exact signed bytes', () => {
    expect(verifyMetaSignature({ rawBody: body, signature: valid, appSecret: secret })).toBe(true);
  });

  it.each([undefined, 'sha256=bad'])('rejects missing or invalid signatures', (signature) => {
    expect(verifyMetaSignature({ rawBody: body, signature, appSecret: secret })).toBe(false);
  });

  it('rejects an altered body', () => {
    expect(verifyMetaSignature({ rawBody: Buffer.from('{"object":"instagram"}'), signature: valid, appSecret: secret })).toBe(false);
  });
});
