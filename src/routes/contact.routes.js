const router = require('express').Router();
const contactController = require('../controllers/contact.controller');

router.post('/', contactController.createContact);

module.exports = router;
