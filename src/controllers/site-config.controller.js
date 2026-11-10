const SiteConfig = require('../models/site-config.model');
const defaultConfig = require('../config/default-site-config');
const { summarizePublicConfig } = require('../utils/public-content-status');

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

      // Promote the new showcase projects once for an existing legacy database record.
      // Preserve edited contact, social and biography data.
      if ((document.contentVersion || 0) < 4) {
        const previousVersion = document.contentVersion || 0;
        const config = { ...document.config };
        const previous = Array.isArray(config.projects) ? config.projects : [];
        const featuredNames = new Set(['MzansiRent', 'KasiDrop', 'Mzansi Rent Lite', 'Genesis Kiddies Corner']);
        const fromDefaults = defaultConfig.projects;
        const projects = previous.map((project) => {
          const baseline = fromDefaults.find((candidate) => candidate.name === project.name);
          return {
            ...project,
            ...(baseline ? {
              featured: featuredNames.has(project.name),
              ...(baseline.liveUrl ? { liveUrl: baseline.liveUrl } : {}),
              ...(baseline.image ? { image: baseline.image } : {})
            } : {})
          };
        });
        for (const project of fromDefaults) {
          if (!projects.some((item) => item.name === project.name)) projects.push(project);
        }
        config.projects = projects;
        if (previousVersion < 3) {
          config.home = { ...config.home, headline: defaultConfig.home.headline, description: defaultConfig.home.description, supportingText: defaultConfig.home.supportingText };
          config.profile = { ...config.profile, role: defaultConfig.profile.role, tagline: defaultConfig.profile.tagline };
        }
        document = await SiteConfig.findOneAndUpdate(
          { key: 'primary', contentVersion: { $ne: 4 } },
          { $set: { config, contentVersion: 4 } },
          { new: true }
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
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    res.set('Netlify-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');

    const document = await loadSiteConfig();
    res.set('X-Portfolio-Content-Version', String(document.contentVersion || 0));
    return res.json({ success: true, config: document.config, contentVersion: document.contentVersion || 0, updatedAt: document.updatedAt });
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
