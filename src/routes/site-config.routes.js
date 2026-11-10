const router = require('express').Router();
const controller = require('../controllers/site-config.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');

router.get('/', controller.getSiteConfig);
router.get('/admin', requireAdmin, controller.getAdminSiteConfig);
router.get('/seo-status', requireAdmin, controller.getSeoBuildStatus);
router.put('/', requireAdmin, controller.updateSiteConfig);

module.exports = router;
