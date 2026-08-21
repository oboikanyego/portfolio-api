const router = require('express').Router();
const contactController = require('../controllers/contact.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const { contactLimiter } = require('../middleware/rate-limit.middleware');

router.post('/', contactLimiter, contactController.createContact);
router.get('/', requireAdmin, contactController.getContacts);

module.exports = router;
