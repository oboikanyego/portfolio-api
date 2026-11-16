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
  if (dbName && !/^[A-Za-z0-9_-]{1,63}$/.test(dbName)) {
    throw new Error('MONGODB_DB_NAME must be 1–63 alphanumeric characters, underscore or hyphen.');
  }
  return { uri, options: dbName ? { dbName } : {}, explicitDbName: Boolean(dbName) };
}

async function connectDb() {
  const { uri, options, explicitDbName } = resolveMongoConfig();
  await mongoose.connect(uri, options);
  // Database name is not a secret; never log the URI or credentials.
  console.info('[portfolio] mongo_database_selection', JSON.stringify({
    name: mongoose.connection.name,
    explicitDbName
  }));
  if (!explicitDbName) {
    console.warn('[portfolio] Please set MONGODB_DB_NAME on Render to match the existing database before strict enforcement.');
  }
  console.log('MongoDB connected');
}

module.exports = { connectDb, resolveMongoConfig };
