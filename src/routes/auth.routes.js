const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const { loginLimiter } = require('../middleware/rate-limit.middleware');

router.post('/login', loginLimiter, authController.login);
router.get('/me', requireAdmin, authController.me);
// Clearing a cookie must work even when its JWT has already expired.
router.post('/logout', authController.logout);

module.exports = router;
