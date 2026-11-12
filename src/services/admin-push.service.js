const { sign } = require('node:crypto');
const AdminPushDevice = require('../models/admin-push-device.model');
const AdminPushNotification = require('../models/admin-push-notification.model');
const AdminPushThrottle = require('../models/admin-push-throttle.model');
const Visit = require('../models/visit.model');

const PUSH_TYPES = ['enquiries', 'cvRequests', 'visits', 'test'];
let accessToken = '';
let tokenExpiresAt = 0;

function publicConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    vapidKey: process.env.FIREBASE_VAPID_PUBLIC_KEY || ''
  };
}
function hasClientConfig() {
  const config = publicConfig();
  return !!(config.apiKey && config.projectId && config.appId && config.messagingSenderId && config.vapidKey);
}
function hasServerConfig() {
  return !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
function base64url(value) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }

async function getAccessToken() {
  if (accessToken && tokenExpiresAt > Date.now() + 60000) return accessToken;
  if (!hasServerConfig()) throw new Error('Firebase server credentials are missing.');
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'RS256', typ: 'JWT' });
  const claims = base64url({
    iss: process.env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  const unsigned = header + '.' + claims;
  const key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const signature = sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: unsigned + '.' + signature
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Firebase OAuth authorization failed (' + response.status + ').');
  const json = await response.json();
  if (!json.access_token) throw new Error('Firebase OAuth did not provide an access token.');
  accessToken = json.access_token;
  tokenExpiresAt = Date.now() + Math.min(Number(json.expires_in) || 3600, 3600) * 1000;
  return accessToken;
}

async function sendToDevice(fid, notification) {
  const token = await getAccessToken();
  const response = await fetch(
    'https://fcm.googleapis.com/v1/projects/' + encodeURIComponent(process.env.FIREBASE_PROJECT_ID) + '/messages:send',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({
        message: {
          fid,
          // The service worker owns display, preventing duplicate browser notifications.
          data: {
            title: notification.title,
            body: notification.body,
            path: notification.path,
            kind: notification.kind,
            notificationId: String(notification._id)
          },
          webpush: { headers: { Urgency: 'high' } }
        }
      }),
      signal: AbortSignal.timeout(10000)
    }
  );
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const error = new Error('FCM rejected message (' + response.status + ').');
    error.notRegistered = response.status === 404 || (response.status === 400 && /UNREGISTERED|NOT_FOUND|INSTALLATION_ID_NOT_REGISTERED/i.test(body));
    throw error;
  }
}

async function notifyOwner({ kind, title, body, path }, onlyFid = null) {
  if (!PUSH_TYPES.includes(kind)) throw new Error('Unknown notification type.');
  if (!/^\/admin\/(inbox|analytics|notifications)(\?.*)?$/.test(path)) throw new Error('Invalid admin notification link.');
  const event = await AdminPushNotification.create({
    kind,
    title: String(title).slice(0, 120),
    body: String(body).slice(0, 240),
    path
  });
  if (!hasServerConfig()) {
    await AdminPushNotification.updateOne({ _id: event._id }, { status: 'not_configured' });
    return { status: 'not_configured', deliveredTo: 0 };
  }
  const filter = { enabled: true };
  if (onlyFid) filter.fid = onlyFid;
  if (kind !== 'test') filter['preferences.' + kind] = { $ne: false };
  const devices = await AdminPushDevice.find(filter).lean();
  if (!devices.length) {
    await AdminPushNotification.updateOne({ _id: event._id }, { status: 'no_devices' });
    return { status: 'no_devices', deliveredTo: 0 };
  }
  const results = await Promise.allSettled(devices.map(device => sendToDevice(device.fid, event)));
  let deliveredTo = 0, failedCount = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') deliveredTo++;
    else {
      failedCount++;
      if (result.reason?.notRegistered) {
        await AdminPushDevice.deleteOne({ fid: devices[i].fid }).catch(() => {});
      }
      console.error('[portfolio] FCM delivery failed:', result.reason?.message || 'unknown error');
    }
  }
  const status = deliveredTo ? 'sent' : 'failed';
  await AdminPushNotification.updateOne({ _id: event._id }, { status, deliveredTo, failedCount });
  return { status, deliveredTo, failedCount };
}

// A visit alert is sent at most once per 30 minutes, including when a public
// caller invents many session IDs. Subsequent visits are summarised.
async function notifyVisitIfDue() {
  const now = new Date();
  try {
    await AdminPushThrottle.findOneAndUpdate(
      { key: 'visits', nextAllowedAt: { $lte: now } },
      { $set: { nextAllowedAt: new Date(now.getTime() + 30 * 60 * 1000) } },
      { upsert: true, new: true }
    );
  } catch (error) {
    if (error?.code === 11000) return;
    throw error;
  }
  const visits = await Visit.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 30 * 60 * 1000) } });
  await notifyOwner({
    kind: 'visits',
    title: 'Portfolio visitor activity',
    body: visits + ' new visit' + (visits === 1 ? '' : 's') + ' in the last 30 minutes.',
    path: '/admin/analytics'
  });
}

module.exports = { publicConfig, hasClientConfig, hasServerConfig, notifyOwner, notifyVisitIfDue };
