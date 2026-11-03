function requireAuth(req, res, next) {
  const userId = req.get('x-dev-user-id');

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = { id: userId };
  return next();
}

module.exports = requireAuth;
