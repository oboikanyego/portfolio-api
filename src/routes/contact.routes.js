const router = require('express').Router();
const contactController = require('../controllers/contact.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');

router.post('/', contactController.createContact);
router.get('/', requireAdmin, contactController.getContacts);

module.exports = router;
