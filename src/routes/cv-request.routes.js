const router = require('express').Router();
const cvRequestController = require('../controllers/cv-request.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const { cvRequestLimiter } = require('../middleware/rate-limit.middleware');

router.post('/', cvRequestLimiter, cvRequestController.createCvRequest);
router.get('/', requireAdmin, cvRequestController.getCvRequests);

module.exports = router;
