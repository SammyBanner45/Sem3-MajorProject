const jwt = require('jsonwebtoken');

function assertJwtSecret(secret = process.env.JWT_SECRET) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }
  return secret;
}

function createAccessToken(user) {
  const secret = assertJwtSecret();
  return jwt.sign({ role: user.role }, secret, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: '7d',
  });
}

module.exports = { assertJwtSecret, createAccessToken };
