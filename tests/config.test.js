const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config/default-site-config');

test('new portfolio identifies product engineering beyond job title', () => {
  assert.equal(config.profile.role, 'Full-Stack Software Engineer');
  assert.match(config.home.description, /SQL/);
});
test('showcase includes new projects without inventing live deployment links', () => {
  const names = new Set(config.projects.map(project => project.name));
  ['MzansiRent', 'KasiDrop', 'Mzansi Rent Lite', 'Real-Time Portfolio Risk Dashboard'].forEach(name => assert.ok(names.has(name)));
  const kasi = config.projects.find(project => project.name === 'KasiDrop');
  assert.equal(kasi.liveUrl, 'https://kasi-drop.netlify.app/');
  assert.equal(kasi.image, 'assets/images/projects/kasidrop-live.webp');
});
test('project entries are uniquely named and carry case study metadata', () => {
  const names = config.projects.map(p => p.name);
  assert.equal(new Set(names).size, names.length);
  for (const project of config.projects) {
    assert.ok(project.description && project.stack);
  }
});
