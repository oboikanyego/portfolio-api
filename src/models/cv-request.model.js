const mongoose = require('mongoose');

const cvRequestSchema = new mongoose.Schema(
  {

    workflowStatus: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread', index: true },
    readAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },
    notificationHistory: [{
      status: { type: String, enum: ['accepted', 'failed'], required: true },
      provider: { type: String, default: 'resend' },
      providerId: { type: String, default: '' },
      error: { type: String, default: '' },
      at: { type: Date, default: Date.now }
    }],
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    company: { type: String, trim: true, default: '', maxlength: 160 },
    reason: { type: String, trim: true, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'sent', 'declined'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

cvRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CvRequest', cvRequestSchema);
