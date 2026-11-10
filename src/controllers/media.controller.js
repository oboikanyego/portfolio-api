const crypto = require('node:crypto');

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg','image/png','image/webp','image/avif']);
function validateImage(dataUrl) {
  if (typeof dataUrl !== 'string' || dataUrl.length > 8_500_000) return null;
  const match = /^data:(image\/(?:jpeg|png|webp|avif));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, raw] = match;
  if (raw.length % 4 !== 0) return null;
  const buffer = Buffer.from(raw, 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES || buffer.toString('base64') !== raw) return null;
  const jpeg = mime === 'image/jpeg' && buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = mime === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a','hex'));
  const webp = mime === 'image/webp' && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP';
  const avif = mime === 'image/avif' && buffer.toString('ascii',4,8) === 'ftyp' && ['avif','avis'].includes(buffer.toString('ascii',8,12));
  return jpeg || png || webp || avif ? { mime, buffer } : null;
}
function cloudinarySignature(folder, timestamp, secret) {
  return crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');
}
async function sendToCloudinary(data, filename, env, fetcher = fetch) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const secret = env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) {
    const e = new Error('Cloudinary credentials are not configured on the API service.');
    e.status = 503;
    throw e;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new Error('Invalid Cloudinary account configuration.');
  const folder = 'bk-portfolio/uploads';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const form = new FormData();
  form.append('file', new Blob([data.buffer], { type: data.mime }), filename || 'portfolio-image');
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('folder', folder);
  form.append('signature', cloudinarySignature(folder, timestamp, secret));
  const response = await fetcher(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST', body: form, signal: AbortSignal.timeout(30_000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url || !result.public_id) {
    const err = new Error('Cloudinary could not save the image.');
    err.status = 502;
    throw err;
  }
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height
  };
}
async function uploadImage(req, res) {
  try {
    const data = validateImage(req.body?.dataUrl);
    if (!data) return res.status(400).json({ success: false, message: 'Use a valid JPEG, PNG, WebP or AVIF image under 6 MB.' });
    const filename = typeof req.body?.filename === 'string'
      ? req.body.filename.replace(/[^a-z0-9._-]/gi, '-').slice(0, 100) : 'portfolio-image';
    const image = await sendToCloudinary(data, filename, process.env);
    res.set('Cache-Control', 'no-store');
    return res.status(201).json({ success: true, ...image });
  } catch (error) {
    if (error?.status !== 503) console.error('media upload failed:', error.message);
    return res.status(error?.status || 500).json({
      success: false, message: error?.status === 503 ? 'Cloudinary needs to be configured by the administrator.' : 'Image upload failed. Please try again.'
    });
  }
}
module.exports = { validateImage, cloudinarySignature, sendToCloudinary, uploadImage };
