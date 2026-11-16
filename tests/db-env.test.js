const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMongoConfig } = require('../src/config/db');

test('MongoDB uses MONGODB_URI + explicit MONGODB_DB_NAME and overrides URI database', () => {
  const {uri,options,explicitDbName}=resolveMongoConfig({
    MONGODB_URI:'mongodb+srv://example.test/old_database',
    MONGODB_DB_NAME:'portfolio'
  });
  assert.equal(uri,'mongodb+srv://example.test/old_database');
  assert.deepEqual(options,{dbName:'portfolio'});
  assert.equal(explicitDbName,true);
});
test('MongoDB trims separate database name',()=>{
 const config=resolveMongoConfig({MONGODB_URI:'mongodb://localhost:27017',MONGODB_DB_NAME:'  portfolio  '});
 assert.equal(config.options.dbName,'portfolio');
});
test('MongoDB refuses malformed names and missing URI without logging secrets',()=>{
 assert.throws(()=>resolveMongoConfig({MONGODB_URI:'mongodb://example.invalid',MONGODB_DB_NAME:'invalid/name'}),/MONGODB_DB_NAME/);
 assert.throws(()=>resolveMongoConfig({MONGODB_DB_NAME:'portfolio'}),/MONGODB_URI is required/);
});
test('legacy connection remains available only during environment migration',()=>{
 const config=resolveMongoConfig({MONGO_URI:'mongodb://localhost:27017/existingdb'});
 assert.deepEqual(config.options,{});
 assert.equal(config.explicitDbName,false);
});
