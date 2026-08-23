const mongoose = require('mongoose');

const interactionEventSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, trim: true, maxlength: 100 },
    sessionId: { type: String, required: true, trim: true, maxlength: 100 },
    name: {
      type: String,
      required: true,
      enum: ['project_case_study', 'project_live', 'project_source', 'contact_submit', 'cv_request', 'social_link']
    },
    label: { type: String, trim: true, default: '', maxlength: 160 },
    path: { type: String, trim: true, default: '/', maxlength: 300 }
  },
  { timestamps: true }
);

interactionEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 2 });
interactionEventSchema.index({ name: 1, createdAt: -1 });

module.exports = mongoose.model('InteractionEvent', interactionEventSchema);
