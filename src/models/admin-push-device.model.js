const mongoose = require('mongoose');

const adminPushDeviceSchema = new mongoose.Schema({
  fid: { type: String, required: true, unique: true, maxlength: 180 },
  label: { type: String, trim: true, maxlength: 80, default: 'My device' },
  enabled: { type: Boolean, default: true },
  preferences: {
    enquiries: { type: Boolean, default: true },
    cvRequests: { type: Boolean, default: true },
    visits: { type: Boolean, default: true }
  },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

adminPushDeviceSchema.index({ enabled: 1, lastSeenAt: -1 });
module.exports = mongoose.model('AdminPushDevice', adminPushDeviceSchema);
