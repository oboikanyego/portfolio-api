const SiteConfig = require('../models/site-config.model');
const defaultConfig = require('../config/default-site-config');

exports.getSiteConfig = async (_req, res) => {
  try {
    const document = await SiteConfig.findOneAndUpdate(
      { key: 'primary' },
      { $setOnInsert: { config: defaultConfig } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json({ success: true, config: document.config, updatedAt: document.updatedAt });
  } catch (error) {
    console.error('getSiteConfig error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load site configuration.' });
  }
};

exports.updateSiteConfig = async (req, res) => {
  try {
    const config = req.body?.config;
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return res.status(400).json({ success: false, message: 'A valid configuration object is required.' });
    }
    const required = ['profile', 'social', 'home', 'about', 'contact', 'footer', 'careerSteps', 'projects', 'technologies'];
    if (required.some((key) => config[key] === undefined)) {
      return res.status(400).json({ success: false, message: 'The configuration is missing required sections.' });
    }
    const document = await SiteConfig.findOneAndUpdate(
      { key: 'primary' },
      { $set: { config } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, config: document.config, updatedAt: document.updatedAt });
  } catch (error) {
    console.error('updateSiteConfig error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update site configuration.' });
  }
};
