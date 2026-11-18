const mongoose = require('mongoose');

/**
 * Always favour the explicit MongoDB database environment variable.
 * During migration from a URI-embedded database, keep existing production
 * data accessible until MONGODB_DB_NAME is confirmed on Render.
 */
function resolveMongoConfig(env = process.env) {
  const uri = String(env.MONGODB_URI || env.MONGO_URI || '').trim();
  const dbName = String(env.MONGODB_DB_NAME || '').trim();
  if (!uri) throw new Error('MONGODB_URI is required (legacy MONGO_URI temporarily supported)');
  if (!dbName) throw new Error('MONGODB_DB_NAME is required; set it to your existing Atlas database name before starting.');
  if (!/^[A-Za-z0-9_-]{1,63}$/.test(dbName)) {
    throw new Error('MONGODB_DB_NAME must be 1–63 alphanumeric characters, underscore or hyphen.');
  }
  return { uri, options: { dbName }, uriEnvKey: env.MONGODB_URI?.trim() ? 'MONGODB_URI' : 'MONGO_URI' };
}

async function connectDb() {
  const { uri, options, uriEnvKey } = resolveMongoConfig();
  await mongoose.connect(uri, options);
  // Database name is not a secret; never log the URI or credentials.
  console.info('[portfolio] mongo_database_selection', JSON.stringify({
    name: mongoose.connection.name,
    explicitDbName: true,
    uriEnvKey
  }));
  if (uriEnvKey === 'MONGO_URI') {
    console.warn('[portfolio] Using legacy MONGO_URI. Set MONGODB_URI on Render to enable canonical configuration.');
  }
  console.log('MongoDB connected');
}

module.exports = { connectDb, resolveMongoConfig };
