const jwt = require('jsonwebtoken');
const { assertJwtSecret } = require('../services/jwt');

function unauthorized(res) {
  return res.status(401).json({
    error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
  });
}

function requireAuth(prisma) {
  return async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return unauthorized(res);

    let payload;
    try {
      payload = jwt.verify(match[1], assertJwtSecret(), { algorithms: ['HS256'] });
    } catch {
      return unauthorized(res);
    }

    if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string' ||
        !['USER', 'ADMIN'].includes(payload.role)) {
      return unauthorized(res);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true },
      });
      if (!user) return unauthorized(res);
      req.user = { id: user.id, role: user.role };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
    });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Administrator access is required.' },
    });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
