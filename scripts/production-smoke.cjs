/* One-time public production smoke test; does not authenticate or access secrets.
   The two clearly labelled QA submissions are intentional persisted records. */
'use strict';
const assert = require('node:assert/strict');
const base = process.env.PORTFOLIO_API_URL || 'https://portfolio-api-d2en.onrender.com';
const timeout = ms => AbortSignal.timeout(ms);
async function check(path, options = {}, attempts = 3) {
  let error;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(base + path, { ...options, signal: timeout(30000) });
      if (response.status >= 500 && i + 1 < attempts) throw new Error('Service restarting: HTTP ' + response.status);
      return response;
    } catch (cause) {
      error = cause;
      if (i + 1 < attempts) await new Promise(resolve => setTimeout(resolve, (i + 1) * 3500));
    }
  }
  throw new Error(path + ' unreachable: ' + error.message);
}
async function main() {
  const health = await check('/api/health', {}, 5);
  assert.equal(health.status, 200, 'Render health');
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  console.log('PASS Render health + content type hardening');
  const config = await check('/api/site-config');
  assert.equal(config.status, 200);
  const publicSite = await config.json();
  assert.ok(publicSite.config.projects.length >= 11, 'Published project list');
  console.log('PASS public MongoDB site config');

  const paths = ['/api/auth/me', '/api/admin/inbox', '/api/visits/stats?days=7',
    '/api/site-config/admin', '/api/site-config/seo-status',
    '/api/contact', '/api/cv-requests', '/api/media/status'];
  for (const path of paths) {
    const response = await check(path);
    assert.equal(response.status, 401, path + ' must be protected');
  }
  const media = await check('/api/media/images', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: 'invalid' })
  });
  assert.equal(media.status, 401);
  const session = await check('/api/auth/me', { headers: { cookie: 'portfolio_admin_token=expired' } });
  assert.equal(session.status, 401);
  console.log('PASS all admin endpoints + upload reject unauthenticated/expired sessions');

  const disallowed = await check('/api/health', { headers: { origin: 'https://untrusted.example' } });
  assert.notEqual(disallowed.headers.get('access-control-allow-origin'), 'https://untrusted.example');
  console.log('PASS hostile CORS origin not approved');

  const json = { 'content-type': 'application/json' };
  const malformed = await check('/api/contact', {
    method: 'POST', headers: json, body: JSON.stringify({ fullName: 'QA', email: 'bad', subject: 'QA', message: 'bad' })
  });
  assert.equal(malformed.status, 400);
  console.log('PASS invalid contact form rejected before storage');

  if (process.env.QA_WRITE_TESTS === 'true') {
    // Purposefully send only once when explicitly enabled; messages remain in MongoDB/admin inbox.
    const unique = 'portfolio-qa-' + Date.now().toString(36);
    const contact = await check('/api/contact', {
      method: 'POST', headers: json,
      body: JSON.stringify({
        fullName: 'Automated Portfolio QA', email: 'portfolio-qa@example.com',
        subject: '[QA TEST] Production contact ' + unique, budget: 'Exploring',
        source: 'other',
        message: 'This is an authorised production contact form QA check. No client response required.'
      })
    }, 1); // Do not retry POST and create duplicate business notifications.
    assert.equal(contact.status, 201, 'Persist contact request');
    console.log('PASS production contact request stored and notification queued');
    const cv = await check('/api/cv-requests', {
      method: 'POST', headers: json,
      body: JSON.stringify({
        fullName: 'Automated Portfolio QA', email: 'portfolio-qa@example.com',
        company: '[QA TEST] Portfolio smoke test ' + unique,
        reason: 'Authorised CV request production QA test. No response required.',
        source: 'other'
      })
    }, 1);
    assert.equal(cv.status, 201, 'Persist CV request');
    console.log('PASS production CV request stored and notification queued');
    console.log('NOTE Resend acceptance and final delivery must be checked independently; HTTP 201 verifies persistence, not delivery.');
  }
}
main().catch(error => { console.error('Production smoke FAILED:',error.message); process.exitCode = 1; });
