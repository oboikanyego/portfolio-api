const router = require('express').Router();
const visitController = require('../controllers/visit.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const { visitLimiter } = require('../middleware/rate-limit.middleware');

router.post('/', visitLimiter, visitController.recordVisit);
router.post('/events', visitLimiter, visitController.recordInteraction);
router.get('/stats', requireAdmin, visitController.getVisitStats);
router.get('/', requireAdmin, visitController.getVisits);

module.exports = router;
