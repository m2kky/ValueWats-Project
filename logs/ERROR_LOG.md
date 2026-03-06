# Critical Error Log & Technical Debt

Document all critical errors, their root causes, fixes, and lessons learned. When fixing an issue, **FIRST check this file** to see if it's already documented. After fixing an issue, **ADD it here**.

## ERR-033: Prisma Crash — Missing channel_type Column

| Field        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| **Date**     | 2026-03-07                                              |
| **Severity** | 🔴 Critical                                             |
| **Source**   | `backend/prisma/schema.prisma`                          |
| **Trigger**  | Accessing `/api/instances` (POST) or querying instances |

### Description

The application crashed with `Invalid prisma.instance.findFirst() invocation: The column instances.channel_type does not exist`.

### Root Cause

A previous update added the `channelType` field to the Prisma schema, but the corresponding SQL migration was never generated or applied to the production database. The Prisma Client was generated with the new field, creating a mismatch with the runtime database table structure.

### Fix

Created a manual SQL migration in `backend/prisma/migrations/20260306110000_add_channel_type/migration.sql` that adds `channel_type` to `instances`, `conversations`, and `chat_messages` tables, and updates the unique constraint on `conversations`.

### Lesson Learned

Schema changes MUST always be accompanied by a generated migration file. Pushing a changed `schema.prisma` without a matching migration folder will cause runtime failures in production when using `prisma migrate deploy`.

---

## ERR-032: Frontend Crash — ReferenceError: Learn is not defined

| Field        | Value                                                       |
| ------------ | ----------------------------------------------------------- |
| **Date**     | 2026-03-07                                                  |
| **Severity** | 🔴 Critical                                                 |
| **Source**   | `frontend/src/App.jsx`                                      |
| **Trigger**  | Loading the dashboard or navigating to routes using `Learn` |

### Description

The frontend application crashed with `Uncaught ReferenceError: Learn is not defined`. This happened because the `Learn` and `Tools` components were being used in the routing table (JSX) but were not properly imported or declared via `React.lazy`.

### Root Cause

A previous refactor of the Help Center and Resource paths added the components to the `Routes` but failed to include the corresponding `const Learn = React.lazy(...)` import statements at the top of `App.jsx`.

### Fix

Added the missing `React.lazy` imports for `Learn` and `Tools` in `App.jsx`.

### Lesson Learned

The minified production build will fail instantly if any component used in the JSX tree is undefined. Always verify that routing additions have matching lazy-load imports.

---

## ERR-031: Backend Crash — Missing Auth Middleware in Segments Route

| Field        | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| **Date**     | 2026-03-06                                                              |
| **Severity** | 🔴 Critical                                                             |
| **Error**    | `Error: Cannot find module '../middleware/auth'`                        |
| **Impact**   | Backend container crashes repeatedly on startup, preventing deployment. |

### Root Cause

`backend/src/routes/segments.js` was created with a `require('../middleware/auth')` statement, but that file does not exist in the project. The project uses `tenantContext.js` for both authentication and tenant scoping.

### Fix

Removed the non-existent `middleware/auth` import and used `tenantContext` middleware instead in `backend/src/routes/segments.js`.

### Lesson Learned

> Always verify that middleware files exist and follow the established project patterns. In this codebase, `tenantContext.js` is the standard for protected routes.

---

## ERR-030: Contact Fields Not Appearing in Inbox and Contact Details

| Field        | Value                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Date**     | 2026-03-05                                                                                                           |
| **Severity** | 🟡 Medium                                                                                                            |
| **Error**    | Contact fields added in "General Settings" do not show up for contacts in the Inbox sidebar or Contact Details page. |
| **Impact**   | Users cannot effectively view or use custom field definitions they've created; definitions appear missing.           |

### Root Cause

1. `ContactProfile.jsx` had an incorrect API call pointing to `/api/contact-fields` instead of `/api/contact-fields/definitions`.
2. `ContactSidebar.jsx` (Inbox) was only mapping existing filled field values and standard keys (`email`, `country`, `language`) instead of fetching the global field definitions and merging them with the specific contact's values.
3. Key mismatches when saving/loading in sidebar. Sidebar saved field names lowercased rather than using `key` which caused mismatches on the details page.

### Fix

- Added missing `fieldDefinitions` fetch (`/api/contact-fields/definitions`) in `ContactSidebar.jsx` `useEffect`.
- Integrated global definitions merging with local values while maintaining backwards compatibility for orphaned values not part of definitions.
- Adjusted sidebar saving logic to save dynamically using the `key` from the field definition rather than the lowercased display name.
- Added root route fallback `router.get('/', ...)` in `contactFields.routes.js` matching standard expectation.
- Updated `ContactProfile.jsx` to fetch definitions from `/api/contact-fields/definitions`.

### Lesson Learned

> When building field/schema configurations, ensure UI components that collect or visualize data always sync with the central metadata/definitions endpoint rather than inferring structure on the fly from partial instance data.

---

> **Environment**: Coolify on VPS `72.62.50.238` — all testing happens directly on production.

---

## ERR-029: Frontend Dependency Reference Error — Missing @react-oauth/google

| Field        | Value                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------- |
| **Date**     | 2026-03-05                                                                                         |
| **Severity** | 🔴 Critical                                                                                        |
| **Error**    | `[plugin:vite:import-analysis] Failed to resolve import "@react-oauth/google" from "src/main.jsx"` |
| **Impact**   | Frontend fails to start or build, blocking the entire UI.                                          |

### Root Cause

The `@react-oauth/google` package was listed in `package.json` but was not present in the `node_modules` directory. This can happen after a fresh clone, a partial installation, or if the package was added to `package.json` manually without running `npm install`.

### Fix

Ran `npm install` in the `frontend` directory to synchronize `node_modules` with `package.json`.

### Lesson Learned

> Always verify that `node_modules` is fully synchronized with `package.json` after updates, especially when new third-party providers are introduced in `main.jsx`.

---

## ERR-028: Onboarding API 500 Internal Server Error

| Field        | Value                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Date**     | 2026-03-04                                                                                                               |
| **Severity** | 🔴 Critical                                                                                                              |
| **Error**    | `Invalid prisma.user.update() invocation: Argument where of type UserWhereUniqueInput needs at least one of id or email` |
| **Impact**   | Users get a 500 when finishing the onboarding wizard, locking them out of the app.                                       |

### Root Cause

The `tenantContext` middleware attaches the user object to `req.user`. Specifically, it uses `req.user.id` and `req.user.tenantId`. The onboarding route was incorrectly accessing `req.user.userId`. Since this was `undefined`, Prisma threw a validation error during the update.

### Fix

Changed `where: { id: req.user.userId }` to `where: { id: req.user.id }` in `backend/src/routes/onboarding.js`.

### Lesson Learned

> Always verify the exact shape of the object attached by custom middleware. `tenantContext` provides `.id`, not `.userId`.

---

## ERR-027: Google OAuth Popup Frozen on gsi/transform

| Field        | Value                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Date**     | 2026-03-04                                                                                                        |
| **Severity** | 🔴 Critical                                                                                                       |
| **Error**    | Google Sign-in popup opens, redirects to `gsi/transform`, then gets stuck indefinitely with a blank white screen. |
| **Impact**   | Users cannot sign in or register using Google.                                                                    |

### Root Cause

The `helmet` middleware in the Express backend sets a strict `Cross-Origin-Opener-Policy` by default (`same-origin`). This security header prevents the popup window from communicating back to the main window to pass the parsed Google OAuth token.

### Fix

Explicitly allowed popups in the backend `server.js` helmet configuration:

```javascript
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
```

### Lesson Learned

> When utilizing third-party OAuth popup flows frontend-side, ensure the backend security headers (specifically COOP) allow cross-origin popup messaging.

---

## ERR-026: Prisma Shadow DB Migration Failure (P1014)

| Field        | Value                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **Date**     | 2026-03-04                                                                                              |
| **Severity** | 🔴 Critical                                                                                             |
| **Error**    | `P1014: The underlying table for model Tenant does not exist` and later `model contacts does not exist` |
| **Impact**   | Unable to apply new migrations or spin up local development, as the shadow DB fails to build.           |

### Root Cause

Two separate older migration files contained invalid SQL targeting tables that Prisma dynamically maps or hasn't created yet at that absolute point in history:

1. `20260215175500_add_multi_agent_system`: Referenced `"Tenant"` instead of the mapped table name `"tenants"`.
2. `20260304000000_add_plans_and_blacklist`: Tried to `ALTER TABLE contacts`, but the `contacts` table wasn't created until a later migration (`20260724000000_add_crm_system`).

This passes in production via `migrate deploy` if the tables already happen to exist from manual interference, but destroys the idempotent shadow database rebuild needed for `migrate dev`.

### Fix

1. Fixed case-sensitivity `Tenant` -> `tenants` in the first migration file.
2. Moved the `ALTER TABLE contacts` statements directly into the `CREATE TABLE` inside the CRM migration where the table is originally born.

### Lesson Learned

> Do not manually edit migration files to execute DDL on tables that don't yet exist in the strict chronological order of the `prisma/migrations` folder layout.

---

## ERR-025: Frontend Build Failure — Unexpected end of file

| Field        | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| **Date**     | 2026-03-03                                                               |
| **Severity** | 🔴 Critical                                                              |
| **Error**    | `Unexpected end of file before a closing "div" tag` in `NewCampaign.jsx` |
| **Impact**   | Frontend build failed in Coolify deployment pipeline.                    |

### Root Cause

A closing `</div>` tag was stripped accidentally during the UI redesign.

### Fix

Re-added the missing closing `</div>` tag in `NewCampaign.jsx` line 745.

### Lesson Learned

> Always verify React component closing tags run `npm run build` after major structural updates.

---

## ERR-024: Inbox Chat Click 500 — Missing user relation

| Field        | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| **Date**     | 2026-03-03                                                                            |
| **Severity** | 🔴 Critical                                                                           |
| **Error**    | `Prisma runtime error` 500 Internal Server error on `GET /api/chat/conversations/:id` |
| **Impact**   | Unable to select/open any conversation in the Inbox                                   |

### Root Cause

In Phase 6, `ContactNote` model had a `userId: String` mapping but failed to define the Prisma relation map `user: User`. `chat.service.js` attempts to `include: { user: ... }` when pulling notes. Because it wasn't defined in the Prisma client, fetching crashed.

### Fix

Added `user User @relation(fields: [userId], references: [id])` to `ContactNote` in `schema.prisma`.

### Lesson Learned

> A relationship ID key is not enough; the actual relation property MUST be mapped in Prisma to satisfy the TS client includes.

## ERR-001: Webhook 405 Method Not Allowed

| Field        | Value                                              |
| ------------ | -------------------------------------------------- |
| **Date**     | 2026-02-17                                         |
| **Severity** | 🔴 Critical                                        |
| **Error**    | `POST /api/webhooks/receive/messages-upsert → 405` |
| **Impact**   | All incoming WhatsApp messages silently dropped    |

### Root Cause

Evolution API v2 appends the event name to the webhook URL. When `webhookByEvents: false` is set, it was expected to NOT append — but Evolution API v2 **always appends** the event slug regardless of the setting.

- **What the backend expected**: `POST /api/webhooks/receive`
- **What Evolution API sent**: `POST /api/webhooks/receive/messages-upsert`

### Fix

Added a parameterized route in `backend/src/routes/webhooks.js`:

```javascript
router.post("/receive/:event", webhookController.handleIncomingMessage);
```

### Lesson Learned

> Always test webhook endpoints by checking actual incoming requests in production logs, not just the API documentation. Evolution API v2 behavior differs from its docs.

---

## ERR-002: Nginx 413 Payload Too Large

| Field        | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| **Date**     | 2026-02-17                                                     |
| **Severity** | 🟡 High                                                        |
| **Error**    | `client intended to send too large body: 12518558 bytes → 413` |
| **Impact**   | Large media webhook payloads rejected by Nginx                 |

### Root Cause

Nginx default `client_max_body_size` is **1MB**. Webhook payloads with media attachments (images, videos) can be 12MB+. The `nginx.conf` in the frontend container had no explicit body size limit.

### Fix

Added to `frontend/nginx.conf` in the `server` block:

```nginx
client_max_body_size 50m;
```

Also already set in the backend Express config:

```javascript
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
```

### Lesson Learned

> When Nginx proxies to a backend, BOTH Nginx AND the backend must have matching body size limits. Nginx applies its limit first, before the request ever reaches Express.

---

## ERR-003: crypto.randomUUID is not a function

| Field        | Value                                                               |
| ------------ | ------------------------------------------------------------------- |
| **Date**     | 2026-02-17                                                          |
| **Severity** | 🟡 High                                                             |
| **Error**    | `TypeError: crypto.randomUUID is not a function` in browser console |
| **Impact**   | Frontend crashes on page load for some users                        |

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
    window.crypto.randomUUID = function () {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          var r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );
    };
  }
</script>
<script type="module" src="/src/main.jsx"></script>
```

### Lesson Learned

> Polyfills for browser APIs used by vendor/3rd-party code MUST be loaded synchronously before any module scripts. Putting them in the app entry file is too late because imports resolve first. The permanent fix is to use HTTPS.

---

## ERR-004: MinIO 403 Forbidden on Media Access

| Field        | Value                                                               |
| ------------ | ------------------------------------------------------------------- |
| **Date**     | 2026-02-10                                                          |
| **Severity** | 🟡 High                                                             |
| **Error**    | `403 Forbidden` when Evolution API tries to access media from MinIO |
| **Impact**   | Media messages (images, videos, documents) fail to send             |

### Root Cause

MinIO bucket policy was not configured for public read access. The Evolution API needs to download media files via URL, but the bucket was private.

### Fix

Configured the MinIO bucket `valuewats-media` to allow public read access for the media files that need external access.

### Lesson Learned

> When a third-party service (Evolution API) needs to access stored files by URL, the storage bucket must have appropriate access policies. Internal-only access won't work for webhook-triggered media delivery.

---

## ERR-005: Evolution API DNS Resolution Failure

| Field        | Value                                                               |
| ------------ | ------------------------------------------------------------------- |
| **Date**     | 2026-02-10                                                          |
| **Severity** | 🔴 Critical                                                         |
| **Error**    | Evolution API cannot resolve internal service hostname for webhooks |
| **Impact**   | Webhook delivery fails completely                                   |

### Root Cause

In Coolify's Docker network, the Evolution API service tried to send webhooks to the backend using the external `sslip.io` domain, but DNS resolution failed from within the Docker network.

### Fix

Used the public-facing URL for webhook configuration since the services are in different Coolify projects and can't use Docker internal networking directly.

### Lesson Learned

> Coolify services in different projects don't share a Docker network. Use public URLs for inter-service communication, or put related services in the same Coolify project.

---

## ERR-006: Campaign Creation 500 — Redis DNS Resolution Failure

| Field        | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| **Date**     | 2026-02-17                                                 |
| **Severity** | 🔴 Critical                                                |
| **Error**    | `getaddrinfo EAI_AGAIN b4sc440ckcwg8gscoskowcs4`           |
| **Impact**   | All campaign creation fails with 500 Internal Server Error |

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

## ERR-019: Backend Startup Crash — pdf-parse Loads PDF.js at Require Time

| Field        | Value                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Date**     | 2026-02-25                                                                                                                     |
| **Severity** | 🔴 Critical                                                                                                                    |
| **Error**    | `Warning: Cannot access the 'require' function: TypeError: process.getBuiltinModule is not a function` then container restarts |
| **Impact**   | Backend container crashes on every startup, entire app down                                                                    |

### Root Cause

`pdf-parse` bundles PDF.js which runs browser environment detection code at `require()` time. On Node.js v22, `process.getBuiltinModule` doesn't exist, causing the polyfill code to throw. Since `knowledgeService.js` had `const pdfParse = require('pdf-parse')` at the top level, it crashed the server on startup even when no PDF was being processed.

### Fix

Moved `require('pdf-parse')` inside the `case 'pdf'` block in `knowledgeService.js`:

```javascript
case 'pdf': {
  const pdfParse = require('pdf-parse'); // lazy load
  const buffer = fs.readFileSync(file.path);
  const data = await pdfParse(buffer);
  return data.text;
}
```

### Lesson Learned

> Libraries that run environment detection code at import time (like `pdf-parse`) must be lazy-loaded inside the function that uses them, not at the module top level. This is especially important for Node.js v22+ compatibility.

---

## ERR-020: Instance Creation 500 — Wrong Evolution API Container Hostname

| Field        | Value                                                |
| ------------ | ---------------------------------------------------- |
| **Date**     | 2026-02-25                                           |
| **Severity** | 🔴 Critical                                          |
| **Error**    | `getaddrinfo EAI_AGAIN evo-sgwcco4kw80sckwg4c08sgk4` |
| **Impact**   | Cannot create any WhatsApp instances                 |

### Root Cause

`EVOLUTION_API_URL` was set to `http://evo-sgwcco4kw80sckwg4c08sgk4:8080` but the actual Docker container name (as shown by `docker ps`) is `api-sgwcco4kw80sckwg4c08sgk4`. The hostname mismatch caused DNS resolution failure.

### Fix

Updated `EVOLUTION_API_URL` in Coolify grumpy-gentoo environment variables:

```
EVOLUTION_API_URL=http://api-sgwcco4kw80sckwg4c08sgk4:8080
```

### Lesson Learned

> Always verify the actual Docker container name with `docker ps` before setting internal hostnames in env vars. Coolify may use a different prefix (`api-` vs `evo-`) than expected.

---

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

````

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
````

### Lesson Learned

> Verify relative import paths when moving components or using code snippets from other parts of the codebase.

---

## ERR-010: Frontend Build Failed — Invalid Icon Import

| Field        | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| **Date**     | 2026-02-18                                                                  |
| **Severity** | 🔴 Critical                                                                 |
| **Error**    | `"CommandCommandLineIcon" is not exported by "@heroicons/react/24/outline"` |
| **Impact**   | Frontend build failed during `vite build`                                   |

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

| Field        | Value                                                                                |
| ------------ | ------------------------------------------------------------------------------------ |
| **Date**     | 2026-02-21                                                                           |
| **Severity** | 🔴 Critical                                                                          |
| **Error**    | `[vite:load-fallback] Could not load ... (syntax error: Expected ")" but found "}")` |
| **Impact**   | Frontend build failed on Coolify, preventing deployment                              |

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

| Field        | Value                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| **Date**     | 2026-02-21                                                                |
| **Severity** | 🔴 Critical                                                               |
| **Error**    | `[vite:css] [postcss] @apply should not be used with the 'group' utility` |
| **Impact**   | Frontend build failed during `vite build`, deployment blocked             |

### Root Cause

`frontend/src/index.css` had `group` inside an `@apply` directive. Tailwind's `group` is a variant modifier, not a utility class, and cannot be used with `@apply`.

### Fix

Removed `group` from the `@apply` in `.nav-item`.

### Lesson Learned

> Tailwind variant modifiers (`group`, `peer`, `dark`) cannot be used inside `@apply`. They must be applied directly in HTML/JSX as class names.

---

## ERR-013: Production "Route not found" After Custom Domain Update

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| **Date**     | 2026-02-21                                                      |
| **Severity** | 🔴 Critical                                                     |
| **Error**    | `{"error": "Route not found"}` when accessing the custom domain |
| **Impact**   | Users unable to access the application via the new domain       |

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

| Field        | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| **Date**     | 2026-02-21                                                    |
| **Severity** | 🔴 Critical                                                   |
| **Error**    | `POST /api/auth/login → 405 Method Not Allowed`               |
| **Impact**   | Users unable to register or log in after custom domain update |

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

| Field        | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| **Date**     | 2026-02-21                                                    |
| **Severity** | 🔴 Critical                                                   |
| **Error**    | `PathError [TypeError]: Missing parameter name at index 1: *` |
| **Impact**   | Backend container crashes on startup                          |

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

---

## ERR-016: Campaign Creation Fails — Missing `variables` Column

| Field        | Value                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| **Date**     | 2026-02-21                                                                                           |
| **Severity** | 🔴 Critical                                                                                          |
| **Error**    | `PrismaClientKnownRequestError P2022: The column 'variables' does not exist in the current database` |
| **Impact**   | Cannot create any campaigns                                                                          |

### Root Cause

The `variables Json?` field was added to the `Message` model in `schema.prisma`, but no corresponding Prisma migration was ever created or applied to add the `variables` column to the production `messages` table. The `queueService.js` writes `variables: contact.variables || null` when creating a message row, which fails because the column doesn't exist.

### Fix

Created migration `20260221203300_add_variables_to_message`:

```sql
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "variables" JSONB;
```

This migration will auto-run on next deploy via `prisma migrate deploy`.

### Lesson Learned

> After adding a field to `schema.prisma`, ALWAYS create and test the migration. Use `npx prisma migrate dev --name <name>` locally, then verify with `prisma migrate deploy` in production.

---

## ERR-017: Campaign Creation Fails — Missing `channel_type` Column

| Field        | Value                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **Date**     | 2026-02-21                                                                                              |
| **Severity** | 🔴 Critical                                                                                             |
| **Error**    | `PrismaClientKnownRequestError P2022: The column 'channel_type' does not exist in the current database` |
| **Impact**   | Cannot create any campaigns, specifically those using new channel types.                                |

### Root Cause

The `channel_type String?` field was added to the `Campaign` and `Message` models in `schema.prisma` to support multi-channel campaigns, but no corresponding Prisma migration was ever created or applied to add the `channel_type` column to the production `campaigns` and `messages` tables. This caused database write operations involving these models to fail.

### Fix

Created manual migration `20260221203301_add_channel_type_to_campaign_and_message`:

```sql
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "channel_type" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "channel_type" TEXT;
```

This migration will auto-run on next deploy via `prisma migrate deploy`.

### Lesson Learned

> After adding a field to `schema.prisma`, ALWAYS create and test the migration. Use `npx prisma migrate dev --name <name>` locally, then verify with `prisma migrate deploy` in production. This was a repeat of ERR-016, indicating a need for stricter migration discipline.

---

## ERR-018: Nginx Proxy 405/Crash — Cross-Container Communication Failure (Resolved via Service Merger)

### [ERR-018] Nginx Proxy 405/Crash — Cross-Container Communication Failure

- **Error**: API requests `/api/*` returning `index.html` or 405 Method Not Allowed.
- **Root Cause**: Frontend (Nginx) and Backend (Express) in separate containers could not communicate via `localhost:3000`. Nginx fell back to `index.html` due to `try_files`.
- **Fix**: Merged frontend and backend into a single Coolify service. Backend handles static file serving and API.
- **Lesson**: For simple multi-container deployments in Coolify, serving the frontend from the backend simplifies networking and prevents proxy issues.

| Field        | Value      |
| ------------ | ---------- |
| **Date**     | 2026-02-21 |
| **Severity** | 🟡 Medium  |

## ERR-017: Dashboard TypeError — Cannot Read 'sent' of Undefined (Fixed)

| Field        | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| **Date**     | 2026-02-21                                                        |
| **Severity** | 🟡 Medium                                                         |
| **Error**    | `TypeError: Cannot read properties of undefined (reading 'sent')` |
| **Impact**   | Dashboard page crashes after navigating to it                     |

### Root Cause

In `Dashboard.jsx`, `setStats(response.data)` replaces the entire state with the API response. If the API response doesn't include a `messages` sub-object (e.g. it returns `{}` on error, or the shape changes), then `stats.messages` becomes `undefined`, and `stats.messages.sent.toLocaleString()` on line 98 throws a TypeError.

### Fix

Changed `setStats(response.data)` to a defensive merge that uses the previous state as fallback for any missing keys:

```javascript
setStats((prev) => ({
  instances: data.instances ?? prev.instances,
  messages: {
    sent: data.messages?.sent ?? prev.messages.sent,
    // ... same for delivered, read, failed, total
  },
  // ...
}));
```

### Lesson Learned

> Never blindly replace component state with API response data. Always merge with defaults to prevent crashes from unexpected response shapes.

---

## ERR-021: Campaign Message Timeout (30s)

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| **Date**     | 2026-02-25                                                                   |
| **Severity** | 🟡 High                                                                      |
| **Error**    | `Timeout after 30s calling http://api-sgwcco4kw...:8080`                     |
| **Impact**   | Campaign messages fail to send during peak or slow WhatsApp connection times |

### Root Cause

The default axios timeout for sending messages was set to 30 seconds. In some cases, the Evolution API (using Baileys) takes longer to establish a WhatsApp session or push the message to the phone, causing the request to hang and then be aborted by the backend.

### Fix

1. Increased timeout to **60 seconds** in `evolutionApi.js`.
2. Implemented a **retry loop** (2 attempts) with a 2-second delay between retries to recover from transient connection errors.

### Lesson Learned

> WhatsApp messaging can be high-latency. Use generous timeouts (60s+) and robust retry mechanisms in the message dispatch pipeline to ensure campaign reliability.

---

## ERR-022: Backend Startup Crash — Missing linkShortener module

| Field        | Value                                         |
| ------------ | --------------------------------------------- |
| **Date**     | 2026-02-27                                    |
| **Severity** | 🔴 Critical                                   |
| **Error**    | `Error: Cannot find module './linkShortener'` |
| **Impact**   | Backend container crashes on startup          |

### Root Cause

In the previous update, the CTR tracking feature was removed, including deleting the `linkShortener.js` file. However, `queueService.js` was still requiring it at the top level, causing the backend to crash on startup.

### Fix

Removed the leftover `require('./linkShortener')` from `backend/src/services/queueService.js`.

### Lesson Learned

> When deleting a file/module to remove a feature, always perform a project-wide search for its imports to ensure all usages are completely removed.

---

## ERR-023: AIAgent Update Failure — Field Name Mismatch

| Field        | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| **Date**     | 2026-02-27                                                              |
| **Severity** | 🔴 Critical                                                             |
| **Error**    | `PrismaClientValidationError: Unknown field 'model' on model 'AIAgent'` |
| **Impact**   | AI Agents cannot be updated or configured; settings are not saved.      |

### Root Cause

The frontend `Agents.jsx` was sending a `model` field in the update request, but the Prisma schema defines the field as `aiModel`. Since the backend `agent.routes.js` passed `req.body` directly to `prisma.aIAgent.updateMany`, Prisma threw a validation error.

### Fix

1.  **Backend Mapping**: Added a mapper in `agent.routes.js` to translate `model` to `aiModel` if present in the request body.
2.  **Frontend Sync**: Renamed `model` to `aiModel` in `Agents.jsx` (defaultForm and handleEdit).
3.  **Service Update**: Updated `agent.service.js` and `deepseek.service.js` to use the dynamic `aiModel` from the configuration.

### Lesson Learned

> Always synchronize frontend form fields with Prisma schema names exactly. When passing `req.body` directly to Prisma `update/create`, sanitize or map incoming fields to ensure they match the schema to avoid validation crashes.

---

## ERR-034: Production Crash — Missing campaigns.saved_segment_id

| Field        | Value                                            |
| ------------ | ------------------------------------------------ |
| **Date**     | 2026-03-06                                       |
| **Severity** | 🔴 Critical                                      |
| **Source**   | `backend/prisma/schema.prisma`                   |
| **Trigger**  | Campaign scheduler (`schedulerService.js`) query |

### Description

The production campaign scheduler crashed with `PrismaClientKnownRequestError: The column campaigns.saved_segment_id does not exist`. This prevented all scheduled campaigns from being processed.

### Root Cause

The `SavedSegment` model and the `saved_segment_id` relation field were added to the Prisma schema during Phase 4, but the corresponding SQL migration was never generated or applied to the production database.

### Fix

Created a manual SQL migration in `backend/prisma/migrations/20260306120000_add_saved_segments/migration.sql` that:

1. Creates the `saved_segments` table.
2. Adds the `saved_segment_id` column to the `campaigns` table.
3. Establishes the foreign key constraints.

### Lesson Learned

Never assume that a schema field exists in the database just because it is in `schema.prisma`. Always verify existing migrations and run `prisma migrate deploy` after any schema updates.

---

## ERR-035: Frontend Crash — ReferenceError: ChannelsList is not defined

| Field        | Value                          |
| ------------ | ------------------------------ |
| **Date**     | 2026-03-06                     |
| **Severity** | 🔴 Critical                    |
| **Source**   | `frontend/src/App.jsx`         |
| **Trigger**  | Navigating to `/help/channels` |

### Description

The frontend application crashed with `Uncaught ReferenceError: ChannelsList is not defined`. This happened because the `ChannelsList` component was used in the routing table but was not imported or declared via `React.lazy`.

### Root Cause

During the Help Center redesign, the `/help/channels` route was updated to use the `ChannelsList` component, but the corresponding `const ChannelsList = React.lazy(...)` import statement was omitted from `App.jsx`.

### Fix

Added the missing `React.lazy` import for `ChannelsList` in `App.jsx`.

### Lesson Learned

Always ensure that every component used in the routing configuration has a corresponding import (or lazy import). The production build will fail if a referenced identifier is not defined in the scope.
