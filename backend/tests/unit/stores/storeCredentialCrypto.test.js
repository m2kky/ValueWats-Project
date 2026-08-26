const {
  decryptStoreCredentials,
  encryptStoreCredentials,
  isEncryptedStoreCredentials,
  assertStoreCredentialEncryptionConfigured
} = require('../../../src/stores/storeCredentialCrypto');

describe('Store credential crypto', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  it('round-trips authenticated Store credentials and rejects tampering', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const encrypted = encryptStoreCredentials({ accessToken: 'a', refreshToken: 'r', expiresAt: '2026-09-01T00:00:00.000Z' });

    expect(encrypted).toMatch(/^store:v1:/);
    expect(decryptStoreCredentials(encrypted)).toMatchObject({ accessToken: 'a', refreshToken: 'r' });
    expect(() => decryptStoreCredentials(`${encrypted}x`)).toThrow();
  });

  it('rejects invalid keys, malformed envelopes, and non-plain credentials', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    expect(() => encryptStoreCredentials(null)).toThrow(TypeError);
    expect(() => encryptStoreCredentials([])).toThrow(TypeError);
    expect(() => encryptStoreCredentials(Object.create({ inherited: true }))).toThrow(TypeError);
    expect(() => decryptStoreCredentials('store:v1:not-base64:tag:ciphertext')).toThrow();

    process.env.ENCRYPTION_KEY = Buffer.alloc(31, 7).toString('base64');
    expect(() => assertStoreCredentialEncryptionConfigured()).toThrow('32-byte base64');
  });

  it('identifies only Store encrypted credential envelopes', () => {
    expect(isEncryptedStoreCredentials('store:v1:iv:tag:ciphertext')).toBe(true);
    expect(isEncryptedStoreCredentials('meta:v1:iv:tag:ciphertext')).toBe(false);
    expect(isEncryptedStoreCredentials({})).toBe(false);
  });
});
