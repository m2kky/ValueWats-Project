const {
  decryptMetaToken,
  encryptMetaToken,
  isEncryptedMetaToken
} = require('../../../src/meta/metaTokenCrypto');

describe('Meta token crypto', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  it('round-trips a versioned encrypted Meta token', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const ciphertext = encryptMetaToken('secret-token');

    expect(ciphertext.startsWith('meta:v1:')).toBe(true);
    expect(ciphertext).not.toContain('secret-token');
    expect(decryptMetaToken(ciphertext)).toBe('secret-token');
  });

  it('identifies only supported encrypted token values', () => {
    expect(isEncryptedMetaToken('meta:v1:iv:tag:ciphertext')).toBe(true);
    expect(isEncryptedMetaToken('secret-token')).toBe(false);
  });
});
