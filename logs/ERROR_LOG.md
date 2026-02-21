# Error Log — Known Issues & Fixes

This document tracks all production bugs encountered, their root causes, and the applied fixes. Use this as a reference to avoid repeating the same mistakes.

> **Environment**: Coolify on VPS `72.62.50.238` — all testing happens directly on production.

---

## ERR-001: Webhook 405 Method Not Allowed

| Field | Value |
|-------|-------|
| **Date** | 2026-02-17 |
| **Severity** | 🔴 Critical |
| **Error** | `POST /api/webhooks/receive/messages-upsert → 405` |
| **Impact** | All incoming WhatsApp messages silently dropped |

### Root Cause
Evolution API v2 appends the event name to the webhook URL. When `webhookByEvents: false` is set, it was expected to NOT append — but Evolution API v2 **always appends** the event slug regardless of the setting.

- **What the backend expected**: `POST /api/webhooks/receive`
- **What Evolution API sent**: `POST /api/webhooks/receive/messages-upsert`

### Fix
Added a parameterized route in `backend/src/routes/webhooks.js`:
```javascript
router.post('/receive/:event', webhookController.handleIncomingMessage);
```

### Lesson Learned
> Always test webhook endpoints by checking actual incoming requests in production logs, not just the API documentation. Evolution API v2 behavior differs from its docs.

---

## ERR-002: Nginx 413 Payload Too Large

| Field | Value |
|-------|-------|
| **Date** | 2026-02-17 |
| **Severity** | 🟡 High |
| **Error** | `client intended to send too large body: 12518558 bytes → 413` |
| **Impact** | Large media webhook payloads rejected by Nginx |

### Root Cause
Nginx default `client_max_body_size` is **1MB**. Webhook payloads with media attachments (images, videos) can be 12MB+. The `nginx.conf` in the frontend container had no explicit body size limit.

### Fix
Added to `frontend/nginx.conf` in the `server` block:
```nginx
client_max_body_size 50m;
```

Also already set in the backend Express config:
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### Lesson Learned
> When Nginx proxies to a backend, BOTH Nginx AND the backend must have matching body size limits. Nginx applies its limit first, before the request ever reaches Express.

---

## ERR-003: crypto.randomUUID is not a function

| Field | Value |
|-------|-------|
| **Date** | 2026-02-17 |
| **Severity** | 🟡 High |
| **Error** | `TypeError: crypto.randomUUID is not a function` in browser console |
| **Impact** | Frontend crashes on page load for some users |

### Root Cause
`window.crypto.randomUUID()` is only available in **Secure Contexts** (HTTPS). Since our production domain uses HTTP (via `sslip.io` without SSL), the API is unavailable.

The polyfill was in `main.jsx`, but vendor chunks (3rd-party libraries) call `crypto.randomUUID()` during **module initialization** — which happens before `main.jsx` executes.

**Execution order**: 
1. Browser loads `index.html`
2. Browser sees `<script type="module" src="/src/main.jsx">`
3. Browser resolves all imports (including vendor chunks)
4. **Vendor chunks initialize** ← `crypto.randomUUID()` called here ❌
5. `main.jsx` runs ← polyfill was here, too late

### Fix
Moved polyfill to a synchronous `<script>` tag in `index.html` **before** the module script:
```html
<script>
  if (!window.crypto) window.crypto = {};
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }
</script>
<script type="module" src="/src/main.jsx"></script>
```

### Lesson Learned
> Polyfills for browser APIs used by vendor/3rd-party code MUST be loaded synchronously before any module scripts. Putting them in the app entry file is too late because imports resolve first. The permanent fix is to use HTTPS.

---

## ERR-004: MinIO 403 Forbidden on Media Access

| Field | Value |
|-------|-------|
| **Date** | 2026-02-10 |
| **Severity** | 🟡 High |
| **Error** | `403 Forbidden` when Evolution API tries to access media from MinIO |
| **Impact** | Media messages (images, videos, documents) fail to send |

### Root Cause
MinIO bucket policy was not configured for public read access. The Evolution API needs to download media files via URL, but the bucket was private.

### Fix
Configured the MinIO bucket `valuewats-media` to allow public read access for the media files that need external access.

### Lesson Learned
> When a third-party service (Evolution API) needs to access stored files by URL, the storage bucket must have appropriate access policies. Internal-only access won't work for webhook-triggered media delivery.

---

## ERR-005: Evolution API DNS Resolution Failure

| Field | Value |
|-------|-------|
| **Date** | 2026-02-10 |
| **Severity** | 🔴 Critical |
| **Error** | Evolution API cannot resolve internal service hostname for webhooks |
| **Impact** | Webhook delivery fails completely |

### Root Cause
In Coolify's Docker network, the Evolution API service tried to send webhooks to the backend using the external `sslip.io` domain, but DNS resolution failed from within the Docker network.

### Fix
Used the public-facing URL for webhook configuration since the services are in different Coolify projects and can't use Docker internal networking directly.

### Lesson Learned
> Coolify services in different projects don't share a Docker network. Use public URLs for inter-service communication, or put related services in the same Coolify project.

---

## ERR-006: Campaign Creation 500 — Redis DNS Resolution Failure

| Field | Value |
|-------|-------|
| **Date** | 2026-02-17 |
| **Severity** | 🔴 Critical |
| **Error** | `getaddrinfo EAI_AGAIN b4sc440ckcwg8gscoskowcs4` |
| **Impact** | All campaign creation fails with 500 Internal Server Error |

### Root Cause
`REDIS_HOST` is set to `b4sc440ckcwg8gscoskowcs4` — this is an **internal Docker hostname** assigned by Coolify. The backend container (`grumpy-gentoo`) and the Redis service (`sgwcco4kw80sckwg4c08sgk4`) are in **different Coolify projects**, meaning they don't share a Docker network. Internal Docker DNS only resolves hostnames within the same network.

**Flow**: `createCampaign()` → `queueService.addToQueue()` → BullMQ tries to connect to Redis → DNS fails → throws → caught at line 335 → returns `500`.

Redis itself is healthy (logs show continuous background saves). The issue is purely DNS resolution from the backend container.

### Fix
Replace the internal Docker hostname with either:

**Option A (Recommended)**: Move Redis to the same Coolify project as the backend, so they share a Docker network. The internal hostname will then resolve.

**Option B (Quick fix)**: Use the Redis service's public sslip.io URL as `REDIS_HOST` in Coolify env vars:
```
REDIS_HOST=<redis-public-hostname>.72.62.50.238.sslip.io
```
Then restart the backend service.

### Lesson Learned
> Coolify services in different projects get different Docker networks. Internal hostnames (`b4sc440ckcwg8gscoskowcs4`) only resolve within the same network. Either put related services in the same project, or use public URLs.

---

## Template for New Errors

Copy this template when logging a new error:

```markdown
## ERR-XXX: [Short Title]

| Field | Value |
|-------|-------|
| **Date** | YYYY-MM-DD |
| **Severity** | 🔴 Critical / 🟡 High / 🟢 Low |
| **Error** | `exact error message` |
| **Impact** | What breaks for users |

### Root Cause
Why it happened.

### Fix
What was changed (with code snippets).

### Lesson Learned
> What to remember to avoid this in the future.
```

---

## ERR-007: Frontend Build Failed — Missing Dependency

| Field | Value |
|-------|-------|
| **Date** | 2026-02-17 |
| **Severity** | 🔴 Critical |
| **Error** | `[vite]: Rollup failed to resolve import "@headlessui/react"` |
| **Impact** | Frontend build failed, preventing deployment |

### Root Cause
The component `ActionCard.jsx` imported components from `@headlessui/react`, but this library was not listed in `package.json` dependencies. It worked locally (likely due to cached or global install?) but failed in the clean CI/CD build environment.

### Fix
Ran `npm install @headlessui/react` in the frontend directory to add it to `package.json` and `package-lock.json`.

### Lesson Learned
> Always check `package.json` when adding new imports from third-party libraries. Local environments can be forgiving, but CI/CD is strict.

---

## ERR-008: Backend Crash — Module Not Found

| Field | Value |
|-------|-------|
| **Date** | 2026-02-17 |
| **Severity** | 🔴 Critical |
| **Error** | `Error: Cannot find module './routes/knowledge.routes'` |
| **Impact** | Backend container crashed repeatedly on startup |

### Root Cause
`server.js` contained a leftover import `const knowledgeRoutes = require('./routes/knowledge.routes');` on line 15. The actual file is located at `src/agents/knowledge.routes.js` and was correctly mounted on line 83. The top-level import pointed to a non-existent path.

### Fix
Removed the invalid `require` line from `server.js`.

### Lesson Learned
> Clean up unused imports when refactoring or moving files. A single bad `require` at the top level of `server.js` will prevent the entire application from starting.

---

## ERR-009: Frontend Build Failed — Module Not Found

| Field | Value |
|-------|-------|
| **Date** | 2026-02-17 |
| **Severity** | 🔴 Critical |
| **Error** | `Could not resolve "../../services/api" from "src/components/chat/ContactSidebar.jsx"` |
| **Impact** | Frontend build failed during `vite build` |

### Root Cause
`ContactSidebar.jsx` was trying to import `api` from `../../services/api`, but the actual file location is `src/api/client.js`. The `src/services` directory does not exist in the frontend project.

### Fix
Updated import path in `src/components/chat/ContactSidebar.jsx`:
```javascript
- import api from '../../services/api';
+ import api from '../../api/client';
```

### Lesson Learned
> Verify relative import paths when moving components or using code snippets from other parts of the codebase.


---

## ERR-010: Frontend Build Failed — Invalid Icon Import

| Field | Value |
|-------|-------|
| **Date** | 2026-02-18 |
| **Severity** | 🔴 Critical |
| **Error** | `"CommandCommandLineIcon" is not exported by "@heroicons/react/24/outline"` |
| **Impact** | Frontend build failed during `vite build` |

### Root Cause
`ActionCard.jsx` was trying to import `CommandCommandLineIcon`. In Heroicons v2, the correct export name is `CommandLineIcon`.

### Fix
Updated import and usage in `src/components/ActionCard.jsx`:
```javascript
- import { CommandCommandLineIcon } from '@heroicons/react/24/outline';
+ import { CommandLineIcon } from '@heroicons/react/24/outline';
```

### Lesson Learned
> Double-check icon names when using Heroicons, as names differ between v1 and v2 or might be guessed incorrectly.

---

## ERR-011: Frontend Build Failed — Agents.jsx Syntax/Structure Errors

| Field | Value |
|-------|-------|
| **Date** | 2026-02-21 |
| **Severity** | 🔴 Critical |
| **Error** | `[vite:load-fallback] Could not load ... (syntax error: Expected ")" but found "}")` |
| **Impact** | Frontend build failed on Coolify, preventing deployment |

### Root Cause
1. **ActionCard Setters**: Several `setEnabled` and `setConfig` props in `Agents.jsx` had mismatched closing braces. They were also missing a level of object nesting (`...f` instead of `...f, actionConfig: { ... }`) which lead to state corruption and syntax errors.
2. **Structural Corruption**: Multiple redundant/extra `</div>` tags and missing `(` parens in conditional blocks (specifically in the Knowledge Base tab) rendered the JSX invalid.

### Fix
Standardized all 10 `ActionCard` setters to use the pattern:
```javascript
setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, KEY: { ...f.actionConfig.KEY, enabled: val } } } )) }
```
Cleaned up the `Agents.jsx` component structure, ensuring all `div` tags and conditional blocks are correctly closed.

### Lesson Learned
> When performing massive UI overhauls involving deeply nested state updates, always verify closing braces and object structures meticulously. Run `npm run build` locally before pushing to catch these errors early.

---

## ERR-012: Frontend Build Failed — @apply group Not Allowed

| Field | Value |
|-------|-------|
| **Date** | 2026-02-21 |
| **Severity** | 🔴 Critical |
| **Error** | `[vite:css] [postcss] @apply should not be used with the 'group' utility` |
| **Impact** | Frontend build failed during `vite build`, deployment blocked |

### Root Cause
`frontend/src/index.css` had `group` inside an `@apply` directive. Tailwind's `group` is a variant modifier, not a utility class, and cannot be used with `@apply`.

### Fix
Removed `group` from the `@apply` in `.nav-item`.

### Lesson Learned
> Tailwind variant modifiers (`group`, `peer`, `dark`) cannot be used inside `@apply`. They must be applied directly in HTML/JSX as class names.

---

## ERR-013: Production "Route not found" After Custom Domain Update

| Field | Value |
|-------|-------|
| **Date** | 2026-02-21 |
| **Severity** | 🔴 Critical |
| **Error** | `{"error": "Route not found"}` when accessing the custom domain |
| **Impact** | Users unable to access the application via the new domain |

### Root Cause
1. **Old Proxy Pass**: `nginx.conf` was hardcoded to proxy `/api` requests to an old `sslip.io` URL instead of `localhost:3000`.
2. **Backend Entry Point**: The custom domain was hitting the backend server (port 3000), which did not have static file serving enabled for the frontend.

### Fix
1. **Nginx**: Updated `proxy_pass` to `http://localhost:3000` in `frontend/nginx.conf`.
2. **Backend**: Added `express.static` and a catch-all route to `backend/src/server.js` to serve the React frontend as a fallback.
3. **Consolidation**: Removed redundant root `logs/` folder and unified all documentation in `valuewats/logs/`.

### Lesson Learned
> Use `localhost` for inter-container proxying to avoid DNS resolution issues. Always ensure the backend serves the frontend as a fallback in single-container deployments to handle direct terminal/proxy access gracefully.

---

## ERR-014: 405 Method Not Allowed on Auth Routes

| Field | Value |
|-------|-------|
| **Date** | 2026-02-21 |
| **Severity** | 🔴 Critical |
| **Error** | `POST /api/auth/login → 405 Method Not Allowed` |
| **Impact** | Users unable to register or log in after custom domain update |

### Root Cause
Nginx was configured to proxy `/api`, but was stripping the `/api` prefix when passing to the backend. The backend received `POST /auth/login`, which didn't match any explicitly mounted routes, so it fell through to the `express.static` middleware. Express returns 405 for POST requests to static assets.

### Fix
1. **Nginx**: Corrected the proxy location to preserve the `/api` prefix.
2. **Backend**: Dual-mounted the auth routes at both `/api/auth` and `/auth` in `server.js` for redundancy and better production resilience.
3. **API 404**: Restricted the API 404 handler to `/api` prefix to prevent collisions with the frontend catch-all.

### Lesson Learned
> Be extremely careful with trailing slashes in Nginx `proxy_pass`. Always implement fallback route mounting for critical endpoints (like Auth) in production to handle proxy inconsistencies.

---

## ERR-015: Express 5 PathError with Wildcard Route

| Field | Value |
|-------|-------|
| **Date** | 2026-02-21 |
| **Severity** | 🔴 Critical |
| **Error** | `PathError [TypeError]: Missing parameter name at index 1: *` |
| **Impact** | Backend container crashes on startup |

### Root Cause
Express 5 uses `path-to-regexp` v8, which no longer supports unnamed wildcard parameters like `app.get('*')`. It requires naming the parameter or using a regular expression. The wildcard `*` throws an initialization error.

### Fix
Replaced the string-based wildcard with a Regular Expression in `backend/src/server.js`:
```javascript
- app.get('*', (req, res) => {
+ app.get(/.*/, (req, res) => {
```

### Lesson Learned
> When upgrading to Express 5, string wildcards (`*`) must be converted to Regular Expressions (`/.*/`) or named parameters (`/*path`) because of strict parsing in `path-to-regexp` v8.
