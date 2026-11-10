const test = require('node:test');
const assert = require('node:assert/strict');
const { validBuildHook, triggerSeoRebuild } = require('../src/services/seo-rebuild.service');

test('only the official Netlify build hook URL format is accepted', () => {
  assert.ok(validBuildHook('https://api.netlify.com/build_hooks/507f1f77bcf86cd799439011'));
  for (const candidate of ['http://api.netlify.com/build_hooks/1',
    'https://example.com/build_hooks/1',
    'https://api.netlify.com.evil.example/build_hooks/1',
    'https://api.netlify.com/build_hooks/1?exfiltrate=yes',
    'file:///etc/passwd', '']) assert.equal(validBuildHook(candidate),false);
});

test('publishing triggers exactly one Netlify rebuild without leaking hook', async () => {
  let called = 0;
  const hook = 'https://api.netlify.com/build_hooks/507f1f77bcf86cd799439011';
  const result = await triggerSeoRebuild(hook, async (url, request) => {
    called++;
    assert.equal(url,hook);
    assert.equal(request.method,'POST');
    assert.equal(JSON.parse(request.body).source,'portfolio-cms');
    return { ok: true, status: 201 };
  });
  assert.deepEqual(result, {status:'triggered'});
  assert.equal(called,1);
  assert.deepEqual(await triggerSeoRebuild('',()=>{throw Error('should not call')}),{status:'not_configured'});
  assert.deepEqual(await triggerSeoRebuild('https://evil.com',()=>{throw Error('should not call')}),{status:'invalid_configuration'});
});

test('Netlify failure reports a failed build, not a completed deployment', async () => {
  const result=await triggerSeoRebuild('https://api.netlify.com/build_hooks/123abc',
    async()=>({ok:false,status:429}));
  assert.deepEqual(result,{status:'failed',code:429});
});
