const router = require('express').Router();
const controller = require('../controllers/site-config.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');

router.get('/', controller.getSiteConfig);
router.put('/', requireAdmin, controller.updateSiteConfig);

module.exports = router;
