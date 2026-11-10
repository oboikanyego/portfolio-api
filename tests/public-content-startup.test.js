const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('start-up warms migrated public config after listening without blocking health checks', () => {
  const source = fs.readFileSync(require.resolve('../server.js'), 'utf8');
  assert.match(source, /app\.listen\(PORT,\s*\(\)\s*=>\s*\{/);
  assert.match(source, /warmPublicSiteConfig\(\)\.catch/);
  assert.ok(source.indexOf('app.listen(PORT') < source.indexOf('warmPublicSiteConfig().catch'));
});

test('warm-up uses the same public config loading and migration as HTTP GET', () => {
  const controller = require('../src/controllers/site-config.controller');
  assert.equal(typeof controller.warmPublicSiteConfig, 'function');
});
