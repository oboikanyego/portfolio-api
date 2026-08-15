const jwt = require('jsonwebtoken');
const { COOKIE_NAME } = require('../controllers/auth.controller');

function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (!token || !secret) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') {
      throw new Error('Invalid role');
    }
    req.admin = { email: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Your admin session has expired.' });
  }
}

module.exports = { requireAdmin };
