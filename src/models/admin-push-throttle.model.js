const mongoose = require('mongoose');

const adminPushThrottleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  nextAllowedAt: { type: Date, default: () => new Date(0) }
}, { timestamps: true });

module.exports = mongoose.model('AdminPushThrottle', adminPushThrottleSchema);
