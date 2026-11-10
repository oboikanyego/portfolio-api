const router = require('express').Router();
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const inbox = require('../controllers/admin-inbox.controller');
router.get('/', requireAdmin, inbox.listInbox);
router.patch('/:type/:id/status', requireAdmin, inbox.updateInboxStatus);
module.exports = router;
