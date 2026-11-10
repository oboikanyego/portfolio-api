const test = require('node:test');
const assert = require('node:assert/strict');
const { parseInboxQuery, buildInboxPipeline } = require('../src/controllers/admin-inbox.controller');
const app = require('../src/app');

test('inbox filters normalise query input and cap resource use', () => {
  assert.deepEqual(parseInboxQuery({ type: 'cv', status: 'unread', page: '3', limit: '500' }),
    { type: 'cv', status: 'unread', search: '', page: 3, limit: 50 });
  assert.equal(parseInboxQuery({ type: 'unknown', status: 'nope' }).type, 'all');
  const p = buildInboxPipeline(parseInboxQuery({ search: '.*(admin)' }));
  assert.ok(p.some(x => x.$unionWith));
  const match = p.find(x => x.$match);
  assert.equal(match.$or[0].fullName.$regex, '\\.\\*\\(admin\\)');
  assert.ok(p.at(-1).$facet.data.some(x=>x.$limit === 15));
});

test('inbox endpoints reject unauthenticated reads and state changes', async () => {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const url = 'http://127.0.0.1:' + server.address().port;
    const read = await fetch(url + '/api/admin/inbox');
    assert.equal(read.status, 401);
    const update = await fetch(url + '/api/admin/inbox/contact/507f1f77bcf86cd799439011/status', {
      method:'PATCH', headers:{'content-type':'application/json'}, body:JSON.stringify({status:'replied'})
    });
    assert.equal(update.status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
