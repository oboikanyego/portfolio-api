const router = require('express').Router();
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const push = require('../controllers/admin-push.controller');

router.use(requireAdmin);
router.get('/config', push.config);
router.get('/devices', push.devices);
router.post('/devices', push.subscribe);
router.delete('/devices/:fid', push.unsubscribe);
router.post('/test', push.test);
router.get('/history', push.history);
router.patch('/history/:id/read', push.read);

module.exports = router;
