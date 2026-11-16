const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const mongoose = require('mongoose');

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

test('readiness returns 503 when disconnected while liveness stays healthy', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/health/ready');
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { status: 'unavailable' });
    assert.equal((await fetch(base + '/api/health')).status, 200);
  });
});

test('readiness pings MongoDB and hides connection errors', async t => {
  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
  const originalDb = mongoose.connection.db;
  t.after(() => {
    delete mongoose.connection.readyState;
    mongoose.connection.db = originalDb;
  });
  let available = true;
  mongoose.connection.db = {
    async command(query, options) {
      assert.deepEqual(query, { ping: 1 });
      assert.deepEqual(options, { timeoutMS: 2000 });
      if (!available) throw new Error('private MongoDB details');
      return { ok: 1 };
    }
  };

  await withServer(async base => {
    const ready = await fetch(base + '/health/ready');
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: 'ready' });
    available = false;
    const unavailable = await fetch(base + '/api/health/ready');
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { status: 'unavailable' });
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
