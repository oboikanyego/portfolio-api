const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');

router.post('/login', authController.login);
router.get('/me', requireAdmin, authController.me);
router.post('/logout', requireAdmin, authController.logout);

module.exports = router;
