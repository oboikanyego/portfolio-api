require('dotenv').config();
const dns = require('dns');
const app = require('./src/app');
const { connectDb } = require('./src/config/db');
const { ensureEmailTemplates } = require('./src/services/email-template.service');
const { warmPublicSiteConfig } = require('./src/controllers/site-config.controller');
const { validBuildHook } = require('./src/services/seo-rebuild.service');

const PORT = process.env.PORT || 3000;

if (process.env.DNS_SERVERS) {
  const servers = process.env.DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean);
  if (servers.length) {
    dns.setServers(servers);
  }
}

connectDb().then(async () => {
  const count = await ensureEmailTemplates();
  console.info('[portfolio] email_templates_ready', count);
  app.listen(PORT, () => {
    console.log(`Portfolio API running on port ${PORT}`);
    console.info('[portfolio] cloudinary_upload_ready', Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    ));
    console.info('[portfolio] seo_auto_rebuild_ready', validBuildHook(process.env.NETLIFY_BUILD_HOOK_URL));
    // Non-blocking startup verification: the site still serves health checks while
    // public content loads and any version migration is applied.
    warmPublicSiteConfig().catch((error) => {
      console.error('Portfolio public config warm-up failed:', error.message);
    });
  });
}).catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
