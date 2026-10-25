const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required (legacy MONGO_URI supported)');
  }
  await mongoose.connect(uri, process.env.MONGODB_DB_NAME?.trim() ? { dbName: process.env.MONGODB_DB_NAME.trim() } : {});
  console.log('MongoDB connected');
}

module.exports = { connectDb };
