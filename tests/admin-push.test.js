const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { hasClientConfig, hasServerConfig, publicConfig } = require('../src/services/admin-push.service');

async function withServer(run) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    return await run('http://127.0.0.1:' + server.address().port);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('FCM endpoints are private, including registration and sending a test', async () => {
  await withServer(async base => {
    for (const route of ['/api/admin/push/config', '/api/admin/push/devices', '/api/admin/push/history']) {
      assert.equal((await fetch(base + route)).status, 401, route);
    }
    assert.equal((await fetch(base + '/api/admin/push/devices', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fid: 'fake-device-id' })
    })).status, 401);
    assert.equal((await fetch(base + '/api/admin/push/test', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: '{}'
    })).status, 401);
  });
});

test('Firebase service configuration never exposes private credentials as client config', () => {
  const config = publicConfig();
  assert.equal(Object.hasOwn(config, 'privateKey'), false);
  assert.equal(Object.hasOwn(config, 'clientEmail'), false);
  assert.equal(typeof hasClientConfig(), 'boolean');
  assert.equal(typeof hasServerConfig(), 'boolean');
});
