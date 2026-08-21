const { rateLimit } = require('express-rate-limit');

function createLimiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { success: false, message }
  });
}

const globalApiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Too many requests from this connection. Please try again in a few minutes.'
});

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please try again in 15 minutes.'
});

const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many contact messages. Please try again in an hour.'
});

const cvRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many CV requests. Please try again in an hour.'
});

const visitLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many visit events. Please try again later.'
});

module.exports = {
  globalApiLimiter,
  loginLimiter,
  contactLimiter,
  cvRequestLimiter,
  visitLimiter
};
