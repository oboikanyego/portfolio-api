const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

async function withServer(run) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    return await run('http://127.0.0.1:' + server.address().port);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('health endpoint responds without database access and has security headers', async () => {
  await withServer(async base => {
    const r = await fetch(base + '/api/health');
    assert.equal(r.status, 200);
    assert.equal((await r.json()).status, 'ok');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });
});

test('administrative endpoints reject unauthenticated access', async () => {
  await withServer(async base => {
    for (const path of ['/api/auth/me', '/api/visits/stats', '/api/contact', '/api/cv-requests']) {
      // POST/GET uses the exact configured routes, not a public database operation.
      const res = await fetch(base + path + (path === '/api/visits/stats' ? '?days=7' : ''));
      assert.equal(res.status, 401, path);
    }
    const put = await fetch(base + '/api/site-config', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ config: { projects: [] } })
    });
    assert.equal(put.status, 401);
  });
});

test('invalid CV requests are rejected before persistence', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/cv-requests', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: '', email: 'not-an-email' })
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).success, false);
  });
});

test('CORS sends allowed origin only for approved portfolio hosts', async () => {
  await withServer(async base => {
    const permitted = await fetch(base + '/api/health', { headers: { origin: 'https://oboikanyego-portfolio.netlify.app' } });
    assert.equal(permitted.headers.get('access-control-allow-origin'), 'https://oboikanyego-portfolio.netlify.app');
    const denied = await fetch(base + '/api/health', { headers: { origin: 'https://untrusted.example' } });
    assert.notEqual(denied.headers.get('access-control-allow-origin'), 'https://untrusted.example');
  });
});

test('malformed contact submissions are rejected without database access', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/contact', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Example', email: 'bad', subject: 'hello', message: 'Hello there' })
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
  });
});

test('logout clears the cookie even when the session is missing or expired', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/auth/logout', {
      method: 'POST',
      headers: { cookie: 'portfolio_admin_token=expired-token' }
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
    const cookie = response.headers.get('set-cookie') || '';
    assert.match(cookie, /portfolio_admin_token=;/);
    assert.match(cookie, /Path=\//i);
    const me = await fetch(base + '/api/auth/me');
    assert.equal(me.status, 401);
  });
});

test('admin logout cookie is SameSite=Lax to reduce cross-site request risk', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/auth/logout', { method:'POST' });
    assert.equal(response.status,200);
    assert.match(response.headers.get('set-cookie')||'',/SameSite=Lax/i);
  });
});

test('media uploads, inbox and CMS configuration reject guests', async()=>{
  await withServer(async base=>{
    const paths=['/api/admin/inbox','/api/media/status','/api/site-config/admin','/api/site-config/seo-status'];
    for(const path of paths){
      const result=await fetch(base+path);
      assert.equal(result.status,401,path);
    }
    const upload=await fetch(base+'/api/media/images',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({filename:'test.png',data:'invalid'})
    });
    assert.equal(upload.status,401);
  });
});
