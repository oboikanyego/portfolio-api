const router = require('express').Router();
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const controller = require('../controllers/email-template.controller');
router.use(requireAdmin);
router.get('/', controller.listTemplates);
router.post('/:key/preview', controller.previewTemplate);
router.put('/:key', controller.updateTemplate);
module.exports = router;
