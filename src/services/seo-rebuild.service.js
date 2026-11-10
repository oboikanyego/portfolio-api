const { URL } = require('node:url');

// A Netlify build hook is a secret URL. It must not be sent to browsers or logs.
function validBuildHook(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'api.netlify.com'
      && /^\/build_hooks\/[a-zA-Z0-9]+$/.test(url.pathname)
      && !url.username && !url.password && !url.search;
  } catch { return false; }
}
async function triggerSeoRebuild(hook = process.env.NETLIFY_BUILD_HOOK_URL, send = fetch) {
  if (!hook) return { status: 'not_configured' };
  if (!validBuildHook(hook)) return { status: 'invalid_configuration' };
  try {
    const response = await send(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'portfolio-cms' }),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return { status: 'failed', code: response.status };
    return { status: 'triggered' }; // Build was queued, not yet deployed.
  } catch (error) {
    console.error('SEO rebuild request failed:', error.message);
    return { status: 'failed' };
  }
}
module.exports = { triggerSeoRebuild, validBuildHook };
