# Owner-only portfolio push notifications

This feature is deliberately private: public visitors cannot subscribe, see device IDs,
read notification history or trigger test messages. The existing Resend emails remain
untouched and contact/CV submissions succeed even if Firebase is unavailable.

## Firebase configuration

1. Create a Firebase project and register a Web app; enable Cloud Messaging.
2. From Project settings > Cloud Messaging generate a Web Push VAPID key pair.
3. Copy the Web app config and public VAPID key into the matching FIREBASE_* variables
   in Render (see .env.example and render.yaml).
4. Create a Google service account with the Firebase Cloud Messaging API enabled,
   grant only the permissions required to send messages, and place
   FIREBASE_CLIENT_EMAIL plus FIREBASE_PRIVATE_KEY in the backend environment.
   Store the multi-line private key with escaped newlines if needed.
5. Deploy both repositories and open /admin/notifications after signing in.
   On iPhone, use Safari > Share > Add to Home Screen and open the installed app.
   Allow notifications from the Subscribe button. Check the test push while the
   installed web app is in the background.

The backend uses OAuth2 service-account JWT + FCM HTTP v1 with Firebase Installation
IDs (FIDs). It does not require the Admin SDK dependency, and secrets never reach
the Angular frontend. Web Firebase SDK is loaded only in the private admin feature.
No visitor-facing permission prompt or subscriber notifications are added.

Events:
- New contact enquiry: immediate, opens /admin/inbox.
- New CV request: immediate, opens /admin/inbox.
- New visits: one summary every 30 minutes at most, opens /admin/analytics;
  repeated session IDs and obvious bots do not trigger notifications.
- Test push: only from an authenticated administrator to an already subscribed device.

Delivery history is retained up to 90 days, is not an email-delivery receipt,
and a successful FCM response means Firebase accepted the request, not that the
operating system displayed it. Devices can be unsubscribed from the admin page.
