const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
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
