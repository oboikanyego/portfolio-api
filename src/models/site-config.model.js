const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'primary' },
  contentVersion: { type: Number, default: 1 },
  config: { type: mongoose.Schema.Types.Mixed, required: true },
  seoBuild: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
