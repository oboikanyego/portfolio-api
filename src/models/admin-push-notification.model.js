const mongoose = require('mongoose');

const adminPushNotificationSchema = new mongoose.Schema({
  kind: { type: String, enum: ['enquiries', 'cvRequests', 'visits', 'test'], required: true },
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, required: true, maxlength: 240 },
  path: { type: String, required: true, maxlength: 150 },
  status: { type: String, enum: ['pending', 'sent', 'failed', 'no_devices', 'not_configured'], default: 'pending' },
  deliveredTo: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  readAt: { type: Date, default: null }
}, { timestamps: true });
adminPushNotificationSchema.index({ createdAt: -1 });
adminPushNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('AdminPushNotification', adminPushNotificationSchema);
