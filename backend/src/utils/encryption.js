const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
const IV_LENGTH = 16;
const KEY = process.env.ENCRYPTION_KEY || 'valuewats_secret_key_must_be_32_bytes_long!!'; // Fallback for dev only

// Ensure key is 32 bytes
const getKey = () => {
  return crypto.scryptSync(KEY, 'salt', 32);
};

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(JSON.stringify(text));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString(ENCODING) + ':' + encrypted.toString(ENCODING);
};

const decrypt = (text) => {
  if (!text) return null;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), ENCODING);
  const encryptedText = Buffer.from(textParts.join(':'), ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
};

module.exports = { encrypt, decrypt };
