const mongoose = require('mongoose');
const emailTemplateSchema = new mongoose.Schema({
  key: { type: String, enum: ['contact','cv-request'], required: true, unique: true, immutable: true },
  name: { type: String, required: true, maxlength: 120 },
  subjectTemplate: { type: String, required: true, maxlength: 3000 },
  htmlTemplate: { type: String, required: true, maxlength: 60000 },
  allowedVariables: { type: [String], default: [] }
}, { timestamps: true, versionKey: false });
module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
