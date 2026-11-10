const SiteConfig = require('../models/site-config.model');
const defaultConfig = require('../config/default-site-config');
const { summarizePublicConfig } = require('../utils/public-content-status');
const { migratePortfolioCms } = require('../config/portfolio-cms-migration');
const { validateSiteConfig } = require('../utils/validate-site-config');

const memoryCacheTtlMs = Number(process.env.SITE_CONFIG_CACHE_TTL_MS) || 5 * 60 * 1000;
let cachedDocument = null;
let cacheExpiresAt = 0;
let pendingLoad = null;
let contentStatusLogged = false;

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
        .select({ config: 1, contentVersion: 1, updatedAt: 1 })
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

      // One-time migration: retain existing editable text and career history, then
      // bring repository case studies and actual image captures into MongoDB.
      // Future CMS changes are never overwritten once contentVersion reaches 5.
      if ((document.contentVersion || 0) < 5) {
        const previousVersion = document.contentVersion || 0;
        const config = migratePortfolioCms(document.config || defaultConfig, defaultConfig);
        if (previousVersion < 3) {
          config.home = { ...config.home, headline: defaultConfig.home.headline, description: defaultConfig.home.description, supportingText: defaultConfig.home.supportingText };
          config.profile = { ...config.profile, role: defaultConfig.profile.role, tagline: defaultConfig.profile.tagline };
        }
        document = await SiteConfig.findOneAndUpdate(
          { key: 'primary', contentVersion: { $ne: 5 } },
          { $set: { config, contentVersion: 5 } },
          { new: true, runValidators: true }
        ).lean() || await SiteConfig.findOne({ key: 'primary' }).lean();
      }
      // Log public content metadata once per process, without contact details or secrets.
      // This makes the MongoDB migration verifiable through Render application logs.
      if (!contentStatusLogged) {
        console.info('[portfolio] public_config_state', JSON.stringify(summarizePublicConfig(document)));
        contentStatusLogged = true;
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
    res.set('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=60');
    res.set('Netlify-CDN-Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');

    const document = await loadSiteConfig();
    res.set('X-Portfolio-Content-Version', String(document.contentVersion || 0));
    return res.json({ success: true, config: document.config, contentVersion: document.contentVersion || 0, updatedAt: document.updatedAt });
  } catch (error) {
    console.error('getSiteConfig error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load site configuration.' });
  }
};

exports.getAdminSiteConfig = async (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const document = await loadSiteConfig();
    return res.json({
      success: true, config: document.config,
      contentVersion: document.contentVersion || 0, updatedAt: document.updatedAt
    });
  } catch (error) {
    console.error('getAdminSiteConfig error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load admin content.' });
  }
};

exports.updateSiteConfig = async (req, res) => {
  try {
    const config = req.body?.config;
    const validationError = validateSiteConfig(config);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    // Reject stale editor sessions instead of silently erasing another update.
    const expected = req.body?.expectedUpdatedAt;
    const filter = { key: 'primary' };
    if (expected) {
      const updatedAt = new Date(expected);
      if (Number.isNaN(updatedAt.getTime())) return res.status(400).json({ success: false, message: 'Invalid revision timestamp.' });
      filter.updatedAt = updatedAt;
    }
    const document = await SiteConfig.findOneAndUpdate(
      filter,
      { $set: { config } },
      { new: true, runValidators: true, upsert: false }
    ).lean();
    if (!document) {
      return res.status(409).json({ success: false, message: 'The portfolio changed since you opened it. Reload before saving.' });
    }
    cacheDocument(document);
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, config: document.config, updatedAt: document.updatedAt, contentVersion: document.contentVersion || 0 });
  } catch (error) {
    console.error('updateSiteConfig error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update site configuration.' });
  }
};

// Also used by the non-blocking server startup warm-up.
exports.warmPublicSiteConfig = loadSiteConfig;
