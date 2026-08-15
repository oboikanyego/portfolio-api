const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, trim: true, maxlength: 100 },
    sessionId: { type: String, required: true, trim: true, maxlength: 100, unique: true },
    path: { type: String, trim: true, default: '/', maxlength: 300 },
    referrer: { type: String, trim: true, default: '', maxlength: 500 }
  },
  { timestamps: true }
);

visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 2 });
visitSchema.index({ visitorId: 1, createdAt: -1 });

module.exports = mongoose.model('Visit', visitSchema);
