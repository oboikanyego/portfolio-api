const mongoose = require('mongoose');

const cvRequestSchema = new mongoose.Schema(
  {
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
