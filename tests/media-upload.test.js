const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { validateImage, cloudinarySignature, sendToCloudinary } = require('../src/controllers/media.controller');

async function serverRun(fn) {
  const listener = app.listen(0,'127.0.0.1');
  try {
    await new Promise(resolve => listener.once('listening', resolve));
    return await fn('http://127.0.0.1:' + listener.address().port);
  } finally {
    await new Promise(resolve=> listener.close(resolve));
  }
}
test('only authenticated administrators may upload images', async () => {
  await serverRun(async base=>{
    const res=await fetch(base+'/api/media/images',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({dataUrl:'x'})});
    assert.equal(res.status,401);
  });
});
test('rejects nonimages and fake signatures', () => {
  assert.equal(validateImage('data:image/png;base64,'+Buffer.from('not an image').toString('base64')),null);
  assert.equal(validateImage('data:text/html;base64,PGI+'),null);
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==';
  assert.equal(validateImage('data:image/png;base64,'+png).mime,'image/png');
});
test('upload rejects malformed image for authenticated admin', async () => {
  const old=process.env.AUTH_TOKEN_SECRET;
  process.env.AUTH_TOKEN_SECRET='cms-test-only-jwt-secret';
  try {
    const token=jwt.sign({sub:'tester@example.com',role:'admin'},process.env.AUTH_TOKEN_SECRET);
    await serverRun(async base=>{
      const response=await fetch(base+'/api/media/images',{
        method:'POST',headers:{'content-type':'application/json',cookie:'portfolio_admin_token='+token},
        body:JSON.stringify({dataUrl:'data:image/png;base64,YWJj'})
      });
      assert.equal(response.status,400);
    });
  } finally {
    if (old===undefined) delete process.env.AUTH_TOKEN_SECRET; else process.env.AUTH_TOKEN_SECRET=old;
  }
});
test('server-side signatures never require secret in the browser', async () => {
  assert.match(cloudinarySignature('bk-portfolio/uploads','123','private-test-secret'),/^[0-9a-f]{40}$/);
  await assert.rejects(sendToCloudinary({mime:'image/png',buffer:Buffer.from('data')},'image.png',{}),e=>e.status===503);
});
