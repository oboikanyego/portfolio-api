const test = require('node:test');
const assert = require('node:assert/strict');
const defaultConfig = require('../src/config/default-site-config');
const { summarizePublicConfig } = require('../src/utils/public-content-status');

test('content diagnostic proves the v4 persisted showcase metadata without exposing private fields', () => {
  const doc = {
    contentVersion: 4,
    config: {
      ...defaultConfig,
      profile: { email: 'private@example.com' },
      projects: defaultConfig.projects
    }
  };
  const result = summarizePublicConfig(doc);
  assert.equal(result.contentVersion, 4);
  assert.equal(result.hasVerifiedKasiDrop, true);
  assert.equal(result.hasVerifiedRentLite, true);
  assert.equal(result.hasVerifiedGenesis, true);
  assert.equal(result.projectCount, defaultConfig.projects.length);
  assert.equal(JSON.stringify(result).includes('private@example.com'), false);
});

test('content diagnostic reports missing images and outdated project URLs rather than claiming success', () => {
  const outdatedProjects = defaultConfig.projects.map(p =>
    p.name === 'KasiDrop' ? { ...p, liveUrl: '', image: '' } : p
  );
  const report = summarizePublicConfig({ contentVersion: 3, config: { projects: outdatedProjects } });
  assert.equal(report.contentVersion, 3);
  assert.equal(report.hasVerifiedKasiDrop, false);
  assert.equal(report.hasVerifiedRentLite, true);
  assert.equal(report.hasVerifiedGenesis, true);
});
