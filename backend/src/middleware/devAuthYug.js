const jwt = require('jsonwebtoken');
const { assertJwtSecret } = require('../services/jwt');

/**
 * Authentication middleware for submissions (Member 2).
 * Supports Bearer JWT tokens from Member 1 Auth and falls back to
 * `x-dev-user-id` header in development.
 */
function devAuthYug(req, res, next) {
  // 1. Bearer JWT
  const authorization = req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (match) {
    try {
      const payload = jwt.verify(match[1], assertJwtSecret(), { algorithms: ['HS256'] });
      if (payload && typeof payload === 'object' && typeof payload.sub === 'string') {
        req.user = { id: payload.sub, role: payload.role };
        return next();
      }
    } catch {
      // Continue to dev header
    }
  }

  // 2. Dev header
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev authentication is disabled in production' });
  }

  const userId = req.get('x-dev-user-id');
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = { id: userId };
  return next();
}

module.exports = devAuthYug;
