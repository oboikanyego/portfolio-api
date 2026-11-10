const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../src/config/default-site-config');
const { migratePortfolioCms } = require('../src/config/portfolio-cms-migration');
const { validateSiteConfig } = require('../src/utils/validate-site-config');

test('migrates profile and known screenshots to Cloudinary, including case studies', () => {
  const updated = migratePortfolioCms(defaults, defaults);
  assert.match(updated.profile.profileImage, /^https:\/\/res\.cloudinary\.com\//);
  const names = ['KasiDrop','Mzansi Rent Lite','Genesis Kiddies Corner','Royal Treats','MzansiRent'];
  for (const name of names) {
    const p = updated.projects.find(x=>x.name===name);
    assert.ok(p, name);
    assert.ok(p.slug, name);
    assert.match(p.image, /^https:\/\/res\.cloudinary\.com\//);
    assert.equal(p.published, true);
    assert.equal(typeof p.caseStudy, 'object');
  }
  assert.match(updated.projects.find(x=>x.name==='KasiDrop').mobileImage, /kasidrop-mobile/);
  assert.ok(updated.projects.find(x=>x.name==='KasiDrop').caseStudy.challenges.length > 0);
  assert.equal(validateSiteConfig(updated), null);
});
test('migration preserves edited biography and non-media project fields', () => {
  const input = JSON.parse(JSON.stringify(defaults));
  input.home.headline = 'Custom admin headline';
  input.projects.find(p=>p.name==='KasiDrop').description = 'My unique write-up';
  const result = migratePortfolioCms(input, defaults);
  assert.equal(result.home.headline, 'Custom admin headline');
  assert.equal(result.projects.find(p=>p.name==='KasiDrop').description, 'My unique write-up');
  assert.equal(migratePortfolioCms(result, defaults).projects.length, result.projects.length);
});
test('rejects unsafe URLs, duplicated slugs and non-Cloudinary images', () => {
  const config = migratePortfolioCms(defaults, defaults);
  config.projects.push({ ...config.projects[0], name: 'Another name' });
  assert.match(validateSiteConfig(config), /unique/);
  config.projects.pop();
  config.projects[0].liveUrl='javascript:alert(1)';
  assert.match(validateSiteConfig(config), /HTTPS/);
  config.projects[0].liveUrl='https://example.com';
  config.projects[0].image='https://untrusted.example/bad.png';
  assert.match(validateSiteConfig(config), /Cloudinary/);
});
