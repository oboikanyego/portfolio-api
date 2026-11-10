require('dotenv').config();
const dns = require('dns');
const app = require('./src/app');
const { connectDb } = require('./src/config/db');
const { warmPublicSiteConfig } = require('./src/controllers/site-config.controller');

const PORT = process.env.PORT || 3000;

if (process.env.DNS_SERVERS) {
  const servers = process.env.DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean);
  if (servers.length) {
    dns.setServers(servers);
  }
}

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Portfolio API running on port ${PORT}`);
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
