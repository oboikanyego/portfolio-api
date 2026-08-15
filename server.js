require('dotenv').config();
const dns = require('dns');
const app = require('./src/app');
const { connectDb } = require('./src/config/db');

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
  });
}).catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
