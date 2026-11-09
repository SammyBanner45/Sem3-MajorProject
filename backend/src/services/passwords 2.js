const { createHash, createHmac } = require('node:crypto');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 12;
const PASSWORD_HASH_PREFIX = 'bcrypt-hmac-sha384-v1:';
const MIN_PEPPER_BYTES = 32;

function assertPasswordPepper(pepper = process.env.PASSWORD_PEPPER) {
  if (typeof pepper !== 'string' || Buffer.byteLength(pepper, 'utf8') < MIN_PEPPER_BYTES) {
    throw new Error(`PASSWORD_PEPPER must contain at least ${MIN_PEPPER_BYTES} bytes`);
  }
  return pepper;
}

function legacyBcryptInput(password) {
  return createHash('sha256').update(password, 'utf8').digest('base64');
}

function currentBcryptInput(password, pepper) {
  return createHmac('sha384', pepper).update(password, 'utf8').digest('base64');
}

function isLegacyPasswordHash(passwordHash) {
  return typeof passwordHash === 'string' && /^\$2[aby]\$\d{2}\$/.test(passwordHash);
}

async function hashPassword(password) {
  const pepper = assertPasswordPepper();
  const hash = await bcrypt.hash(currentBcryptInput(password, pepper), BCRYPT_ROUNDS);
  return `${PASSWORD_HASH_PREFIX}${hash}`;
}

async function verifyPassword(password, passwordHash) {
  if (typeof password !== 'string' || typeof passwordHash !== 'string') return false;

  if (passwordHash.startsWith(PASSWORD_HASH_PREFIX)) {
    const pepper = assertPasswordPepper();
    return bcrypt.compare(currentBcryptInput(password, pepper), passwordHash.slice(PASSWORD_HASH_PREFIX.length));
  }

  // Compatibility path for the earlier bcrypt(SHA-256(password)) format.
  // Successful legacy logins are rehashed with the peppered format by authService.
  if (isLegacyPasswordHash(passwordHash)) {
    return bcrypt.compare(legacyBcryptInput(password), passwordHash);
  }

  return false;
}

module.exports = {
  assertPasswordPepper,
  hashPassword,
  isLegacyPasswordHash,
  verifyPassword,
};
