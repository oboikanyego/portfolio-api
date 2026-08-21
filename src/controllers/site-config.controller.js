const SiteConfig = require('../models/site-config.model');
const defaultConfig = require('../config/default-site-config');

const memoryCacheTtlMs = Number(process.env.SITE_CONFIG_CACHE_TTL_MS) || 5 * 60 * 1000;
let cachedDocument = null;
let cacheExpiresAt = 0;
let pendingLoad = null;

function cacheDocument(document) {
  cachedDocument = document;
  cacheExpiresAt = Date.now() + memoryCacheTtlMs;
  return document;
}

async function loadSiteConfig() {
  if (cachedDocument && Date.now() < cacheExpiresAt) {
    return cachedDocument;
  }

  // Reuse one database operation when several visitors arrive together after
  // startup or cache expiry.
  if (!pendingLoad) {
    pendingLoad = (async () => {
      let document = await SiteConfig.findOne({ key: 'primary' })
        .select({ config: 1, updatedAt: 1 })
        .lean();

      // Creating the default is exceptional. The normal public GET path stays
      // read-only instead of issuing an upsert on every request.
      if (!document) {
        document = await SiteConfig.findOneAndUpdate(
          { key: 'primary' },
          { $setOnInsert: { config: defaultConfig } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
      }

      return cacheDocument(document);
    })().finally(() => {
      pendingLoad = null;
    });
  }

  return pendingLoad;
}

exports.getSiteConfig = async (_req, res) => {
  try {
    // Browser caching removes repeat page-load calls. Shared/CDN caching plus
    // stale-while-revalidate lets Netlify serve the last public config while a
    // sleeping origin wakes up.
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    res.set('Netlify-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');

    const document = await loadSiteConfig();
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
    cacheDocument(document);
    return res.json({ success: true, config: document.config, updatedAt: document.updatedAt });
  } catch (error) {
    console.error('updateSiteConfig error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update site configuration.' });
  }
};
