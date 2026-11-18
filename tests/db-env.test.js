const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMongoConfig } = require('../src/config/db');

test('MongoDB uses MONGODB_URI + explicit MONGODB_DB_NAME and overrides URI database', () => {
  const {uri,options,uriEnvKey}=resolveMongoConfig({
    MONGODB_URI:'mongodb+srv://example.test/old_database',
    MONGODB_DB_NAME:'portfolio'
  });
  assert.equal(uri,'mongodb+srv://example.test/old_database');
  assert.deepEqual(options,{dbName:'portfolio'});
  assert.equal(uriEnvKey,'MONGODB_URI');
});
test('MongoDB trims separate database name',()=>{
 const config=resolveMongoConfig({MONGODB_URI:'mongodb://localhost:27017',MONGODB_DB_NAME:'  portfolio  '});
 assert.equal(config.options.dbName,'portfolio');
});
test('MongoDB refuses malformed names and missing URI without logging secrets',()=>{
 assert.throws(()=>resolveMongoConfig({MONGODB_URI:'mongodb://example.invalid',MONGODB_DB_NAME:'invalid/name'}),/MONGODB_DB_NAME/);
 assert.throws(()=>resolveMongoConfig({MONGODB_DB_NAME:'portfolio'}),/MONGODB_URI is required/);
});
test('legacy URI is only a migration fallback and still needs explicit database name',()=>{
 const config=resolveMongoConfig({MONGO_URI:'mongodb://localhost:27017/old',MONGODB_DB_NAME:'job_platform'});
 assert.deepEqual(config.options,{dbName:'job_platform'});
 assert.equal(config.uriEnvKey,'MONGO_URI');
});
test('missing database name fails fast rather than selecting a different database',()=>{
 assert.throws(()=>resolveMongoConfig({MONGODB_URI:'mongodb://localhost:27017/old'}),/MONGODB_DB_NAME is required/);
});
test('canonical MONGODB_URI wins if both connection variables exist',()=>{
 const config=resolveMongoConfig({MONGODB_URI:'mongodb://primary.test/old',MONGO_URI:'mongodb://legacy.test/old',MONGODB_DB_NAME:'job_platform'});
 assert.equal(config.uri,'mongodb://primary.test/old');
 assert.equal(config.uriEnvKey,'MONGODB_URI');
 assert.deepEqual(config.options,{dbName:'job_platform'});
});
