# portfolio-api

## API hardening

Public endpoints include `GET /api/health` and `GET /api/site-config`. Portfolio content is stored in MongoDB and cached in memory; the one-time versioned migration to content version 4 adds verified project URLs and screenshot paths without overwriting updated biography/contact details.

`npm test` runs Node tests including live-loopback Express HTTP integration checks (health, admin authorization, invalid submissions, CORS) without connecting to production MongoDB. GitHub Actions runs those tests and audits the full dependency tree at moderate severity.

Before treating production as verified, confirm that the Render service is deploying this repository's `main` and inspect `/api/site-config` for the content version migration results. `/api/health` alone does not prove the database migration or email integration succeeded.

## Portfolio CMS — MongoDB and Cloudinary

The admin editor at `/admin/content` now edits fields, projects and case studies using a visual interface. All published content lives in the MongoDB `siteconfigs` document (`key: primary`) rather than being edited in GitHub. The one-time v5 migration imports authored case studies and live screenshots from the previous portfolio code, maps the real screenshots and portrait to Cloudinary, and preserves existing admin-edited copy. Editing later never re-applies this migration.

`GET /api/site-config` exposes public content; `GET /api/site-config/admin` and `PUT /api/site-config` require the admin cookie. PUT includes `expectedUpdatedAt` to prevent stale-tab overwrites. Public config responses have a short CDN cache (15 s). A browser content refresh after saving shows the latest data.

### Server-side image uploads

`POST /api/media/images` is admin-authenticated and expects JSON with `{ "filename": "example.webp", "dataUrl": "data:image/webp;base64,..." }`. It accepts JPEG/PNG/WebP/AVIF, validates file signatures and limits images to 6 MB. The Node API signs the Cloudinary upload and returns the secure CDN URL. Never expose the Cloudinary API secret in Angular.

Render needs `CLOUDINARY_CLOUD_NAME=dv2hhefed`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Add the latter two as private environment variables. Until configured, **new uploads return HTTP 503**; previously migrated Cloudinary images still display. The Cloudinary Free plan applies usage limits.

Public images are intentionally not deleted from Cloudinary when removed in the editor; they may be referenced by other projects or previous versions. Prune unused assets separately.

### SEO notes

Build-time static HTML snapshots still provide a crawler fallback but are **not updated immediately** by browser-side CMS edits. The browser renders new MongoDB content after fetching the API. Regenerate/trigger a Netlify deployment when newly edited project routes need fresh non-JavaScript HTML and sitemap entries.
