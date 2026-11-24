/**
 * =========================================================================
 * TODO: SWAP WITH SHUBHAM'S OFFICIAL REQUIREADMIN MIDDLEWARE ONCE INTEGRATED.
 * =========================================================================
 * Local development stub for admin role checking.
 * Active only when NODE_ENV !== 'production'.
 *
 * Reads:
 * - 'x-dev-role' header (or req.user?.role) -> must be 'admin'
 * - 'x-dev-user-id' header (or req.user?.id) -> user ID of reviewer
 */
function requireAdmin(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev admin middleware is disabled in production' });
  }

  const role = req.get('x-dev-role') || req.user?.role;
  const userId = req.get('x-dev-user-id') || req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.user = req.user || {};
  req.user.id = userId;
  req.user.role = 'admin';

  return next();
}

module.exports = requireAdmin;
