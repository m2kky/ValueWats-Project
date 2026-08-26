const crypto = require('crypto');

const PREFIX = 'store:v1:';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getEncryptionKey() {
  const encodedKey = process.env.ENCRYPTION_KEY;
  if (!encodedKey) throw new Error('ENCRYPTION_KEY must be a 32-byte base64 value');

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encodedKey) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte base64 value');
  }
  return key;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function isCanonicalBase64(value) {
  return typeof value === 'string' && value.length > 0 &&
    value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value) &&
    Buffer.from(value, 'base64').toString('base64') === value;
}

function assertStoreCredentialEncryptionConfigured() {
  getEncryptionKey();
}

function isEncryptedStoreCredentials(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptStoreCredentials(credentials) {
  if (!isPlainObject(credentials)) throw new TypeError('Store credentials must be a plain object');

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(credentials), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decryptStoreCredentials(value) {
  if (!isEncryptedStoreCredentials(value)) throw new Error('Store credentials are not encrypted');

  const parts = value.split(':');
  if (parts.length !== 5 || parts[1] !== 'v1' ||
      !isCanonicalBase64(parts[2]) || !isCanonicalBase64(parts[3]) || !isCanonicalBase64(parts[4])) {
    throw new Error('Invalid encrypted Store credentials');
  }

  const iv = Buffer.from(parts[2], 'base64');
  const tag = Buffer.from(parts[3], 'base64');
  const ciphertext = Buffer.from(parts[4], 'base64');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || !ciphertext.length) {
    throw new Error('Invalid encrypted Store credentials');
  }

  const key = getEncryptionKey();
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const parsed = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'));
    if (!isPlainObject(parsed)) throw new Error('Store credentials must be a plain object');
    return parsed;
  } catch (error) {
    if (error.message === 'Store credentials must be a plain object') throw error;
    throw new Error('Invalid encrypted Store credentials');
  }
}

module.exports = {
  encryptStoreCredentials,
  decryptStoreCredentials,
  isEncryptedStoreCredentials,
  assertStoreCredentialEncryptionConfigured
};
