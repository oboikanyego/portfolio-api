const router = require('express').Router();
const visitController = require('../controllers/visit.controller');
const { requireAdmin } = require('../middleware/admin-auth.middleware');

router.post('/', visitController.recordVisit);
router.get('/stats', requireAdmin, visitController.getVisitStats);
router.get('/', requireAdmin, visitController.getVisits);

module.exports = router;
