const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
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
    source: { type: String, trim: true, maxlength: 64, default: 'contact_page', index: true },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    company: {
      type: String,
      trim: true,
      default: ''
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    budget: {
      type: String,
      trim: true,
      default: ''
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
