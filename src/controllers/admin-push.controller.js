const AdminPushDevice = require('../models/admin-push-device.model');
const AdminPushNotification = require('../models/admin-push-notification.model');
const { publicConfig, hasClientConfig, hasServerConfig, notifyOwner } = require('../services/admin-push.service');

const validFid = value => typeof value === 'string' && /^[A-Za-z0-9_\-:.]{10,180}$/.test(value);
const safeMessage = error => error?.message || 'Unable to update notifications.';

exports.config = (_req, res) => res.json({
  success: true,
  configured: hasClientConfig() && hasServerConfig(),
  firebase: hasClientConfig() ? publicConfig() : null
});

exports.devices = async (_req, res) => {
  try {
    const data = await AdminPushDevice.find().sort({ lastSeenAt: -1 }).select('fid label enabled preferences lastSeenAt createdAt').lean();
    res.json({ success: true, data });
  } catch (error) {
    console.error('push devices:', safeMessage(error));
    res.status(500).json({ success: false, message: 'Unable to load devices.' });
  }
};

exports.subscribe = async (req, res) => {
  const { fid, label, preferences } = req.body || {};
  if (!validFid(fid)) return res.status(400).json({ success: false, message: 'Invalid Firebase installation ID.' });
  if (!hasClientConfig() || !hasServerConfig()) return res.status(503).json({ success: false, message: 'Firebase push notifications are not configured.' });
  const settings = {};
  for (const type of ['enquiries', 'cvRequests', 'visits']) {
    if (typeof preferences?.[type] === 'boolean') settings['preferences.' + type] = preferences[type];
  }
  try {
    await AdminPushDevice.findOneAndUpdate(
      { fid },
      { $set: { label: typeof label === 'string' ? label.slice(0, 80) : 'My device', enabled: true, lastSeenAt: new Date(), ...settings },
        $setOnInsert: { fid } },
      { upsert: true, new: true, runValidators: true }
    );
    return res.json({ success: true, message: 'This device is subscribed to owner notifications.' });
  } catch (error) {
    console.error('subscribe push:', safeMessage(error));
    return res.status(500).json({ success: false, message: 'Unable to save device subscription.' });
  }
};

exports.unsubscribe = async (req, res) => {
  const fid = req.params.fid;
  if (!validFid(fid)) return res.status(400).json({ success: false, message: 'Invalid installation ID.' });
  try {
    await AdminPushDevice.deleteOne({ fid });
    res.json({ success: true });
  } catch (error) {
    console.error('unsubscribe push:', safeMessage(error));
    res.status(500).json({ success: false, message: 'Unable to remove device.' });
  }
};

exports.test = async (req, res) => {
  const fid = req.body?.fid;
  if (!validFid(fid)) return res.status(400).json({ success: false, message: 'Choose a subscribed device first.' });
  try {
    const device = await AdminPushDevice.findOne({ fid, enabled: true }).lean();
    if (!device) return res.status(404).json({ success: false, message: 'Device is not subscribed.' });
    const result = await notifyOwner({
      kind: 'test',
      title: 'Portfolio push test',
      body: 'Your private admin notifications are connected.',
      path: '/admin/notifications'
    }, fid);
    if (result.status !== 'sent') return res.status(503).json({ success: false, message: 'Firebase did not accept the test notification.' });
    res.json({ success: true, message: 'Firebase accepted the notification; check your device.' });
  } catch (error) {
    console.error('push test:', safeMessage(error));
    res.status(503).json({ success: false, message: 'Unable to send the test notification.' });
  }
};

exports.history = async (req, res) => {
  try {
    const data = await AdminPushNotification.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data });
  } catch (error) {
    console.error('push history:', safeMessage(error));
    res.status(500).json({ success: false, message: 'Unable to load push history.' });
  }
};

exports.read = async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
  try {
    await AdminPushNotification.updateOne({ _id: req.params.id }, { $set: { readAt: new Date() } });
    res.json({ success: true });
  } catch (error) {
    console.error('push read:', safeMessage(error));
    res.status(500).json({ success: false, message: 'Unable to mark notification as read.' });
  }
};
