/**
 * Development authentication stub middleware for Yug (Member 2).
 * Reads `x-dev-user-id` header to set `req.user`.
 * Strictly inactive / rejected when NODE_ENV === 'production'.
 */
function devAuthYug(req, res, next) {
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
