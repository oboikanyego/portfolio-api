const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'portfolio_admin_token';

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  };
}

exports.login = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const tokenSecret = process.env.AUTH_TOKEN_SECRET;

  if (!adminEmail || !passwordHash || !tokenSecret) {
    return res.status(503).json({ success: false, message: 'Admin authentication is not configured.' });
  }

  const passwordMatches = email === adminEmail && await bcrypt.compare(password, passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = jwt.sign({ sub: adminEmail, role: 'admin' }, tokenSecret, { expiresIn: '8h' });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return res.json({ success: true, user: { email: adminEmail, role: 'admin' } });
};

exports.me = (req, res) => {
  return res.json({ success: true, user: req.admin });
};

exports.logout = (_req, res) => {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
  return res.json({ success: true });
};

exports.COOKIE_NAME = COOKIE_NAME;
