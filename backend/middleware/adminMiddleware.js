const adminOnly = (req, res, next) => {
  if (!req.user || req.user.rang !== 'admin') {
    return res.status(403).json({ message: 'Not authorized, admin only' });
  }

  return next();
};

module.exports = { adminOnly };