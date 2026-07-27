const crypto = require('crypto');

const PREFIX = 'meta:v1:';
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

function assertMetaTokenEncryptionConfigured() {
  getEncryptionKey();
}

function isEncryptedMetaToken(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptMetaToken(token) {
  if (typeof token !== 'string' || !token) throw new TypeError('Meta token must be a non-empty string');

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decryptMetaToken(value) {
  if (!isEncryptedMetaToken(value)) throw new Error('Meta token is not encrypted');

  const parts = value.split(':');
  if (parts.length !== 5) throw new Error('Invalid encrypted Meta token');

  const [, version, encodedIv, encodedTag, encodedCiphertext] = parts;
  if (version !== 'v1') throw new Error('Invalid encrypted Meta token');

  const iv = Buffer.from(encodedIv, 'base64');
  const tag = Buffer.from(encodedTag, 'base64');
  const ciphertext = Buffer.from(encodedCiphertext, 'base64');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || !ciphertext.length) {
    throw new Error('Invalid encrypted Meta token');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = {
  assertMetaTokenEncryptionConfigured,
  decryptMetaToken,
  encryptMetaToken,
  isEncryptedMetaToken
};
