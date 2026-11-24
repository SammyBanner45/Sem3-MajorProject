const jwt = require('jsonwebtoken');
const { assertJwtSecret } = require('../services/jwt');

function requireAuth(req, res, next) {
  // 1. Try real JWT Bearer token first (from Member 1 Auth)
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
      // Fall through to check dev user ID header
    }
  }

  // 2. Fallback to development x-dev-user-id header
  const devUserId = req.get('x-dev-user-id');
  if (devUserId) {
    req.user = { id: devUserId };
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

module.exports = requireAuth;
