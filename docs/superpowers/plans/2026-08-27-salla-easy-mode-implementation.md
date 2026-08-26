# Salla Easy Mode Pairing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect a Salla Easy Mode installation to the correct ValueChat tenant with a short-lived connection code, encrypted staged credentials, and an automatic initial catalog sync.

**Architecture:** Keep the current Custom OAuth implementation unchanged behind `SALLA_AUTH_MODE=custom`. Add a focused Easy Mode service that stores each half of the installation handshake, then uses an atomic `pending -> active` update so authorization-first, settings-first, duplicate, and concurrent webhook delivery converge on one Integration and one sync job.

**Tech Stack:** Node.js, Express, Prisma 5/PostgreSQL, Bull, React 19, Vitest, Testing Library.

## Global Constraints

- Work directly on `main`; do not create a branch or worktree.
- Default `SALLA_AUTH_MODE` to `custom` so deployment cannot switch production accidentally.
- Use `SALLA_APP_ID=946600964` only through environment configuration; do not hardcode a tenant or merchant.
- Easy Mode install URL is exactly `https://s.salla.sa/apps/install/946600964`.
- Salla App Setting key is exactly `valuechat_connection_code`; it remains private and required.
- Pairing codes expire after 30 minutes, are returned once, and are stored only as SHA-256 hashes.
- Staged authorization expires after 24 hours and stores encrypted credentials only.
- Accept `products.read` or `products.read_write`; require `offline_access`.
- Never log raw webhook payloads, signatures, connection codes, tokens, refresh tokens, scope contents, or settings.
- Preserve the existing Custom OAuth callback and demo-store behavior.
- Enqueue the initial full sync only after the first successful atomic activation.

---

## File Map

- `backend/prisma/schema.prisma`: define tenantless encrypted Salla authorization staging.
- `backend/prisma/migrations/20260827010000_add_salla_pending_authorizations/migration.sql`: create and index the staging table.
- `backend/src/stores/providers/salla/sallaEasyModeService.js`: own pairing-code generation, event staging, atomic finalization, reconnect, uninstall, and cleanup.
- `backend/src/stores/providers/salla/sallaIntegration.routes.js`: choose Custom or Easy connection responses without setting an OAuth verifier cookie for Easy Mode.
- `backend/src/stores/providers/salla/sallaWebhook.routes.js`: dispatch signed Easy Mode app events before catalog events.
- `backend/src/stores/storeSyncQueue.js`: invoke both Custom pending cleanup and Easy staging cleanup during reconciliation.
- `frontend/src/pages/Integrations.jsx`: show the one-time pairing code modal and open the Salla installation page.
- `backend/tests/unit/stores/sallaEasyModeService.test.js`: characterize handshake ordering, security, idempotency, and cleanup.
- `backend/tests/integration/stores/salla-integration-api.test.js`: verify mode-dependent API responses and cookie behavior.
- `backend/tests/integration/stores/salla-webhook-route.test.js`: verify signed app-event routing and safe status codes.
- `backend/tests/unit/stores/storeSyncQueue.test.js`: verify Easy cleanup is run by reconciliation.
- `backend/tests/integration/stores/store-schema.test.js`: verify staging schema constraints.
- `frontend/src/pages/__tests__/Integrations.salla.test.jsx`: verify code display, copy, install navigation, reconnect, and Custom redirect.

### Task 1: Persist Encrypted Pending Authorizations

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260827010000_add_salla_pending_authorizations/migration.sql`
- Modify: `backend/tests/integration/stores/store-schema.test.js`

**Interfaces:**
- Produces: Prisma delegate `prisma.sallaPendingAuthorization` with `upsert`, `findUnique`, `deleteMany`, and `delete`.
- Produces: one row per Salla `merchantId`, encrypted `credentials`, granted `scope`, and cleanup `expiresAt`.

- [ ] **Step 1: Write the failing schema test**

Add a test that creates one staging row, rejects a duplicate merchant ID, and confirms the returned credential string is not plaintext:

```js
const crypto = require('node:crypto');
const { encryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');

it('stores one encrypted pending Salla authorization per merchant', async () => {
  const merchantId = `merchant-${crypto.randomUUID()}`;
  const credentials = encryptStoreCredentials({
    accessToken: 'pending-access',
    refreshToken: 'pending-refresh',
    expiresAt: '2026-08-28T00:00:00.000Z'
  });
  const row = await prisma.sallaPendingAuthorization.create({
    data: {
      merchantId,
      credentials,
      scope: 'products.read offline_access',
      expiresAt: new Date('2026-08-28T12:00:00.000Z')
    }
  });

  expect(row.credentials).not.toContain('pending-access');
  await expect(prisma.sallaPendingAuthorization.create({
    data: { merchantId, credentials, scope: row.scope, expiresAt: row.expiresAt }
  })).rejects.toMatchObject({ code: 'P2002' });
});
```

- [ ] **Step 2: Run the schema test and verify it fails**

Run: `cd backend && npm test -- tests/integration/stores/store-schema.test.js`

Expected: FAIL because `sallaPendingAuthorization` is absent from the Prisma client/schema.

- [ ] **Step 3: Add the Prisma model and SQL migration**

Add this model:

```prisma
model SallaPendingAuthorization {
  merchantId  String   @id @map("merchant_id")
  credentials String   @db.Text
  scope       String   @db.Text
  expiresAt   DateTime @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([expiresAt])
  @@map("salla_pending_authorizations")
}
```

Create the migration with exact constraints:

```sql
CREATE TABLE "salla_pending_authorizations" (
  "merchant_id" TEXT NOT NULL,
  "credentials" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salla_pending_authorizations_pkey" PRIMARY KEY ("merchant_id")
);

CREATE INDEX "salla_pending_authorizations_expires_at_idx"
  ON "salla_pending_authorizations"("expires_at");
```

- [ ] **Step 4: Generate Prisma and rerun the schema test**

Run: `cd backend && npx prisma generate && npm test -- tests/integration/stores/store-schema.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the schema slice**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260827010000_add_salla_pending_authorizations/migration.sql backend/tests/integration/stores/store-schema.test.js
git commit -m "feat(store): stage Salla Easy Mode authorization"
```

### Task 2: Implement the Order-Independent Easy Mode Handshake

**Files:**
- Create: `backend/src/stores/providers/salla/sallaEasyModeService.js`
- Create: `backend/tests/unit/stores/sallaEasyModeService.test.js`

**Interfaces:**
- Produces: `createSallaEasyModeService({ prisma, queue, clock, randomBytes, appId })`.
- Produces: `createConnection({ tenantId }) -> { mode, integrationId, pairingCode, installUrl }`.
- Produces: `reconnect({ tenantId, integrationId }) -> { mode, integrationId, pairingCode, installUrl }`.
- Produces: `handleAuthorization({ merchantId, data }) -> { outcome, activated, integrationId? }`.
- Produces: `handleSettingsUpdated({ merchantId, settings }) -> { outcome, activated, integrationId? }`.
- Produces: `handleUninstalled({ merchantId }) -> { outcome }`.
- Produces: `reconcilePending() -> { integrations, authorizations }`.

- [ ] **Step 1: Write failing tests for connection-code creation**

Use fixed `clock` and `randomBytes` dependencies. Assert the browser gets the plaintext code, Prisma receives only its hash, credentials are an encrypted pending placeholder, and missing `appId` fails before database access:

```js
const randomBytes = vi.fn(() => Buffer.alloc(24, 7));
const service = createSallaEasyModeService({
  prisma, queue, clock: () => new Date('2026-08-27T10:00:00.000Z'), randomBytes,
  appId: '946600964'
});
const result = await service.createConnection({ tenantId: 'tenant-1' });

expect(result).toEqual({
  mode: 'easy',
  integrationId: 'integration-1',
  pairingCode: Buffer.alloc(24, 7).toString('base64url'),
  installUrl: 'https://s.salla.sa/apps/install/946600964'
});
expect(prisma.integration.create).toHaveBeenCalledWith({
  data: expect.objectContaining({
    tenantId: 'tenant-1', type: 'store_salla', status: 'pending',
    metadata: {
      installationMode: 'easy',
      pairingCodeHash: crypto.createHash('sha256').update(result.pairingCode).digest('hex'),
      pairingExpiresAt: '2026-08-27T10:30:00.000Z'
    }
  })
});
expect(JSON.stringify(prisma.integration.create.mock.calls)).not.toContain(result.pairingCode);
```

- [ ] **Step 2: Write failing tests for both event orders and concurrency**

Cover these concrete sequences:

```js
await service.handleAuthorization({ merchantId: '42', data: authorizationData });
await service.handleSettingsUpdated({
  merchantId: '42', settings: { valuechat_connection_code: pairingCode }
});
expect(integration).toMatchObject({ status: 'active', externalAccountId: '42' });
expect(queue.enqueueFullSync).toHaveBeenCalledOnce();

await service.handleSettingsUpdated({
  merchantId: '43', settings: { valuechat_connection_code: secondCode }
});
await service.handleAuthorization({ merchantId: '43', data: authorizationData });
expect(secondIntegration).toMatchObject({ status: 'active', externalAccountId: '43' });
expect(queue.enqueueFullSync).toHaveBeenCalledTimes(2);
```

Also use `Promise.all` for duplicate authorization/settings delivery and make the fake `integration.updateMany` return `{ count: 1 }` only for the first `status: 'pending'` activation. Assert exactly one enqueue.

- [ ] **Step 3: Write failing security and lifecycle tests**

Test all stable failures and non-leaks:

```js
await expect(service.handleAuthorization({
  merchantId: '42',
  data: { ...authorizationData, scope: 'settings.read offline_access' }
})).rejects.toMatchObject({ code: 'SALLA_REQUIRED_SCOPE_MISSING' });

await expect(service.handleAuthorization({
  merchantId: '42',
  data: { ...authorizationData, scope: 'products.read' }
})).rejects.toMatchObject({ code: 'SALLA_REQUIRED_SCOPE_MISSING' });

const ignored = await service.handleSettingsUpdated({
  merchantId: '42', settings: { valuechat_connection_code: 'wrong-code' }
});
expect(ignored).toEqual({ outcome: 'ignored', activated: false });
expect(queue.enqueueFullSync).not.toHaveBeenCalled();
```

Add tests for expired code, absolute Unix `expires`, encrypted staging, active-merchant credential rotation, cross-tenant merchant ownership, uninstall revocation, and log output excluding all secret values.

- [ ] **Step 4: Run the unit test and verify it fails**

Run: `cd backend && npm test -- tests/unit/stores/sallaEasyModeService.test.js`

Expected: FAIL because `sallaEasyModeService.js` does not exist.

- [ ] **Step 5: Implement the minimal Easy Mode service**

Use these exact core helpers and constants:

```js
const crypto = require('node:crypto');
const {
  encryptStoreCredentials,
  assertStoreCredentialEncryptionConfigured
} = require('../../storeCredentialCrypto');

const PAIRING_TTL_MS = 30 * 60 * 1000;
const AUTHORIZATION_TTL_MS = 24 * 60 * 60 * 1000;

function codedError(code) {
  return Object.assign(new Error(code), { code });
}

function hashCode(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function scopes(value) {
  return new Set(typeof value === 'string' ? value.split(/[\s,]+/).filter(Boolean) : []);
}

function authorizationCredentials(data, now) {
  const granted = scopes(data?.scope);
  if (!granted.has('offline_access') ||
      (!granted.has('products.read') && !granted.has('products.read_write'))) {
    throw codedError('SALLA_REQUIRED_SCOPE_MISSING');
  }
  const expires = Number(data?.expires);
  if (!data?.access_token || !data?.refresh_token || !Number.isFinite(expires) || expires * 1000 <= now.getTime()) {
    throw codedError('SALLA_INVALID_AUTHORIZATION_EVENT');
  }
  return {
    encrypted: encryptStoreCredentials({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(expires * 1000).toISOString()
    }),
    scope: data.scope
  };
}
```

Call `assertStoreCredentialEncryptionConfigured()` before creating or staging any record. Implement a private `tryFinalize(merchantId)` that reads the staged row and the unexpired Integration whose metadata has `pendingMerchantId`. Use the transaction client for the atomic activation and staged-row deletion:

```js
const result = await prisma.$transaction(async (tx) => {
  const activated = await tx.integration.updateMany({
    where: {
      id: integration.id,
      tenantId: integration.tenantId,
      type: 'store_salla',
      status: 'pending'
    },
    data: {
      status: 'active',
      externalAccountId: merchantId,
      credentials: pending.credentials,
      metadata: { installationMode: 'easy' }
    }
  });
  if (activated.count !== 1) return { activated: false };
  await tx.sallaPendingAuthorization.deleteMany({ where: { merchantId } });
  return { activated: true };
});
if (!result.activated) return { outcome: 'duplicate', activated: false };
await queue.enqueueFullSync({ tenantId: integration.tenantId, integrationId: integration.id });
return { outcome: 'activated', activated: true, integrationId: integration.id };
```

Both event handlers must persist their half first and then call `tryFinalize`. The conditional `status: 'pending'` update is the idempotency gate; only its winner can enqueue.

- [ ] **Step 6: Run the Easy Mode unit tests**

Run: `cd backend && npm test -- tests/unit/stores/sallaEasyModeService.test.js`

Expected: PASS with no unhandled promise rejection and one sync enqueue per Integration.

- [ ] **Step 7: Commit the handshake service**

```bash
git add backend/src/stores/providers/salla/sallaEasyModeService.js backend/tests/unit/stores/sallaEasyModeService.test.js
git commit -m "feat(store): pair Salla Easy Mode installations"
```

### Task 3: Switch the Connection API by Environment Mode

**Files:**
- Modify: `backend/src/stores/providers/salla/sallaIntegration.routes.js`
- Modify: `backend/tests/integration/stores/salla-integration-api.test.js`

**Interfaces:**
- Consumes: `createSallaEasyModeService` from Task 2.
- Preserves: Custom response `{ authUrl }` and `salla_oauth_verifier` cookie.
- Produces: Easy response `{ mode, integrationId, pairingCode, installUrl }` with no verifier cookie.

- [ ] **Step 1: Add failing API tests for Custom and Easy modes**

Add explicit dependency-injected services:

```js
const sallaEasyModeService = {
  createConnection: vi.fn(async () => ({
    mode: 'easy', integrationId: 'integration-1', pairingCode: 'pair-code',
    installUrl: 'https://s.salla.sa/apps/install/946600964'
  })),
  reconnect: vi.fn(async () => ({
    mode: 'easy', integrationId: 'integration-1', pairingCode: 'new-pair-code',
    installUrl: 'https://s.salla.sa/apps/install/946600964'
  }))
};
```

Assert `SALLA_AUTH_MODE=easy` calls only this service and sends no `Set-Cookie`. Assert absent/`custom` mode calls the current OAuth service and still sets its verifier cookie.

- [ ] **Step 2: Run the focused API tests and verify failure**

Run: `cd backend && npm test -- tests/integration/stores/salla-integration-api.test.js`

Expected: FAIL because the route always calls the Custom OAuth service.

- [ ] **Step 3: Add mode-aware route context**

Use one small selector:

```js
const easyMode = () => process.env.SALLA_AUTH_MODE?.trim().toLowerCase() === 'easy';

function setVerifierCookie(res, result) {
  if (!result.authUrl) return;
  const state = new URL(result.authUrl).searchParams.get('state');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `salla_oauth_verifier=${createStoreOAuthVerifier(state)}; Max-Age=600; Path=/api/oauth/salla/callback; HttpOnly; SameSite=Lax${secure}`);
}
```

In `context(req)`, construct/inject `sallaEasyModeService`. In `/auth-url` call `createConnection` only in Easy Mode; in `/:id/reconnect` call its `reconnect`. Map missing `SALLA_APP_ID` to HTTP 503 with `SALLA_EASY_MODE_NOT_CONFIGURED`.

- [ ] **Step 4: Rerun API tests**

Run: `cd backend && npm test -- tests/integration/stores/salla-integration-api.test.js`

Expected: PASS for authorization, tenant scoping, Custom cookie, Easy no-cookie, reconnect, sync, and delete cases.

- [ ] **Step 5: Commit the API mode switch**

```bash
git add backend/src/stores/providers/salla/sallaIntegration.routes.js backend/tests/integration/stores/salla-integration-api.test.js
git commit -m "feat(store): expose Salla Easy Mode connection flow"
```

### Task 4: Route Signed Salla App Events

**Files:**
- Modify: `backend/src/stores/providers/salla/sallaWebhook.routes.js`
- Modify: `backend/tests/integration/stores/salla-webhook-route.test.js`

**Interfaces:**
- Consumes: `handleAuthorization`, `handleSettingsUpdated`, and `handleUninstalled` from Task 2.
- Preserves: all existing product refresh/delete event behavior.

- [ ] **Step 1: Add failing signed webhook tests**

Inject `sallaEasyModeService` into the route harness and send exact signed JSON strings:

```js
const authorization = JSON.stringify({
  event: 'app.store.authorize', merchant: 12,
  data: {
    access_token: 'access-secret', refresh_token: 'refresh-secret',
    expires: 1787875200, scope: 'products.read offline_access'
  }
});
await signedRequest(app, authorization).expect(202);
expect(sallaEasyModeService.handleAuthorization).toHaveBeenCalledWith({
  merchantId: '12', data: expect.objectContaining({ scope: 'products.read offline_access' })
});

const settings = JSON.stringify({
  event: 'app.settings.updated', merchant: 12,
  data: { settings: { valuechat_connection_code: 'pair-code' } }
});
await signedRequest(app, settings).expect(202);
expect(sallaEasyModeService.handleSettingsUpdated).toHaveBeenCalledWith({
  merchantId: '12', settings: { valuechat_connection_code: 'pair-code' }
});
```

Assert invalid signatures invoke no Easy service; malformed authorization returns 400; invalid/expired pairing is acknowledged with 202; service/database failure returns 503; logs exclude every secret.

- [ ] **Step 2: Run the webhook test and verify failure**

Run: `cd backend && npm test -- tests/integration/stores/salla-webhook-route.test.js`

Expected: FAIL because the app events are ignored or handled by the old uninstall branch.

- [ ] **Step 3: Dispatch app events after signature/body validation**

Extend the known set:

```js
const APP_EVENTS = new Set(['app.store.authorize', 'app.settings.updated', 'app.uninstalled']);
const KNOWN_EVENTS = new Set([...REFRESH_EVENTS, 'product.deleted', ...APP_EVENTS]);
```

Before integration lookup for product events, dispatch:

```js
if (event === 'app.store.authorize') {
  await easyModeService.handleAuthorization({ merchantId, data: body.data });
  log('accepted');
  return res.sendStatus(202);
}
if (event === 'app.settings.updated') {
  await easyModeService.handleSettingsUpdated({ merchantId, settings: body.data?.settings });
  log('accepted');
  return res.sendStatus(202);
}
if (event === 'app.uninstalled') {
  await easyModeService.handleUninstalled({ merchantId });
  log('accepted');
  return res.sendStatus(202);
}
```

Keep product event lookup and queue calls unchanged. Convert known validation errors to safe 400/202 behavior and unexpected errors to the existing 503 code.

- [ ] **Step 4: Rerun webhook tests**

Run: `cd backend && npm test -- tests/integration/stores/salla-webhook-route.test.js`

Expected: PASS for signature ordering, app events, product events, uninstall, safe errors, and redacted logs.

- [ ] **Step 5: Commit webhook support**

```bash
git add backend/src/stores/providers/salla/sallaWebhook.routes.js backend/tests/integration/stores/salla-webhook-route.test.js
git commit -m "feat(store): consume Salla Easy Mode app events"
```

### Task 5: Clean Up Expired Easy Mode State

**Files:**
- Modify: `backend/src/stores/storeSyncQueue.js`
- Modify: `backend/tests/unit/stores/storeSyncQueue.test.js`
- Modify: `backend/tests/unit/stores/sallaEasyModeService.test.js`

**Interfaces:**
- Consumes: `reconcilePending()` from Task 2.
- Preserves: six-hour catalog reconciliation and Custom OAuth pending cleanup.

- [ ] **Step 1: Add failing cleanup tests**

In the Easy service test, provide one expired and one live pending Integration. Assert the service selects only Easy pending rows, filters their exact `pairingExpiresAt`, and deletes only the expired ID:

```js
await service.reconcilePending();
expect(prisma.integration.findMany).toHaveBeenCalledWith({
  where: {
    type: 'store_salla', status: 'pending',
    metadata: { path: ['installationMode'], equals: 'easy' }
  },
  select: { id: true, metadata: true }
});
expect(prisma.integration.deleteMany).toHaveBeenCalledWith({
  where: { id: { in: ['expired-integration'] }, type: 'store_salla', status: 'pending' }
});
expect(prisma.sallaPendingAuthorization.deleteMany).toHaveBeenCalledWith({
  where: { expiresAt: { lt: new Date('2026-08-27T10:00:00.000Z') } }
});
```

In the queue test, inject `sallaEasyModeService: { reconcilePending: vi.fn() }` and assert it is called once by `reconcile_all` before active integrations are enumerated.

- [ ] **Step 2: Run cleanup tests and verify failure**

Run: `cd backend && npm test -- tests/unit/stores/sallaEasyModeService.test.js tests/unit/stores/storeSyncQueue.test.js`

Expected: FAIL because reconciliation only invokes Custom OAuth cleanup.

- [ ] **Step 3: Inject and invoke Easy cleanup**

Extend `createStoreSyncQueue` options with `sallaEasyModeService`. Construct it only when not injected, then run:

```js
await createSallaOAuthService({ prisma, clock }).reconcilePending();
await sallaEasyModeService.reconcilePending();
```

Keep the existing active-integration enumeration and jitter unchanged.

- [ ] **Step 4: Rerun cleanup tests**

Run: `cd backend && npm test -- tests/unit/stores/sallaEasyModeService.test.js tests/unit/stores/storeSyncQueue.test.js`

Expected: PASS, including existing queue deduplication and catalog reconciliation assertions.

- [ ] **Step 5: Commit cleanup integration**

```bash
git add backend/src/stores/storeSyncQueue.js backend/tests/unit/stores/storeSyncQueue.test.js backend/tests/unit/stores/sallaEasyModeService.test.js
git commit -m "feat(store): expire abandoned Salla pairings"
```

### Task 6: Display the One-Time Connection Code

**Files:**
- Modify: `frontend/src/pages/Integrations.jsx`
- Modify: `frontend/src/pages/__tests__/Integrations.salla.test.jsx`

**Interfaces:**
- Consumes: Easy API response `{ mode: 'easy', integrationId, pairingCode, installUrl }`.
- Preserves: Custom response redirect when `{ authUrl }` is returned.
- Produces: accessible modal with Copy, Open Salla, Close, expiry guidance, and no automatic redirect.

- [ ] **Step 1: Add failing frontend tests**

Mock the Easy response and browser APIs:

```jsx
api.post.mockResolvedValueOnce({
  data: {
    mode: 'easy', integrationId: 's1', pairingCode: 'PAIR-CODE-123',
    installUrl: 'https://s.salla.sa/apps/install/946600964'
  }
});
const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });
const open = vi.spyOn(window, 'open').mockImplementation(() => null);

render(<Integrations />);
await userEvent.setup().click(await screen.findByRole('button', { name: /Salla/i }));
expect(await screen.findByRole('dialog', { name: /Connect Salla/i })).toBeInTheDocument();
expect(screen.getByText('PAIR-CODE-123')).toBeInTheDocument();
await userEvent.setup().click(screen.getByRole('button', { name: /Copy code/i }));
expect(writeText).toHaveBeenCalledWith('PAIR-CODE-123');
await userEvent.setup().click(screen.getByRole('button', { name: /Open Salla/i }));
expect(open).toHaveBeenCalledWith(
  'https://s.salla.sa/apps/install/946600964', '_blank', 'noopener,noreferrer'
);
```

Also assert reconnect displays the replacement code, Close clears it, the code is absent after closing, and `{ authUrl }` still redirects in Custom Mode.

- [ ] **Step 2: Run the frontend test and verify failure**

Run: `cd frontend && npm test -- src/pages/__tests__/Integrations.salla.test.jsx`

Expected: FAIL because the page ignores Easy responses and has no dialog.

- [ ] **Step 3: Add the minimal pairing modal**

Add state and one response handler:

```jsx
const [sallaSetup, setSallaSetup] = useState(null);

const consumeSallaConnection = (data) => {
  if (data?.authUrl) {
    window.location.href = data.authUrl;
    return true;
  }
  if (data?.mode === 'easy' && data.pairingCode && data.installUrl) {
    setSallaSetup(data);
    return true;
  }
  return false;
};
```

Use it in both `startSallaAuth` and reconnect. Render a `role="dialog" aria-label="Connect Salla"` modal that shows the code in a read-only block, states that it expires in 30 minutes, tells the merchant to paste it into `ValueChat Connection Code`, copies with `navigator.clipboard.writeText`, opens Salla with `window.open(..., 'noopener,noreferrer')`, and clears state on Close.

- [ ] **Step 4: Rerun focused frontend tests and build**

Run: `cd frontend && npm test -- src/pages/__tests__/Integrations.salla.test.jsx && npm run build`

Expected: tests PASS and Vite build exits 0.

- [ ] **Step 5: Commit the UI**

```bash
git add frontend/src/pages/Integrations.jsx frontend/src/pages/__tests__/Integrations.salla.test.jsx
git commit -m "feat(store): guide Salla Easy Mode pairing"
```

### Task 7: Full Verification and Controlled Rollout

**Files:**
- Modify only if verification exposes a defect: files already listed in Tasks 1-6.

**Interfaces:**
- Produces: a deployable `main` commit set while production remains in Custom Mode.

- [ ] **Step 1: Run the complete Store backend suite**

Run: `cd backend && npm test -- tests/unit/stores tests/integration/stores tests/integration/agents/store-capability.test.js tests/integration/agents/store-tool-runtime.test.js`

Expected: all Store and Agent Store capability tests PASS.

- [ ] **Step 2: Run the complete frontend Salla test and production build**

Run: `cd frontend && npm test -- src/pages/__tests__/Integrations.salla.test.jsx && npm run build`

Expected: tests PASS and build exits 0.

- [ ] **Step 3: Validate Prisma and the final diff**

Run: `cd backend && npx prisma validate`

Expected: `The schema at prisma/schema.prisma is valid`.

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only pre-existing unrelated user files may remain uncommitted.

- [ ] **Step 4: Deploy without activating Easy Mode**

Keep `SALLA_AUTH_MODE=custom`, deploy `main`, and verify startup reports the new migration with no pending migration errors. Confirm current demo-store Custom OAuth and catalog sync still work.

- [ ] **Step 5: Configure Salla events and activate Easy Mode**

In Salla Partner Portal, retain the private required `valuechat_connection_code` setting, set webhook signature security, and enable `app.store.authorize`, `app.settings.updated`, `app.uninstalled`, plus the existing product events. Then set:

```env
SALLA_AUTH_MODE=easy
SALLA_APP_ID=946600964
```

Redeploy ValueChat once.

- [ ] **Step 6: Run the demo-store canary**

From ValueChat Integrations: click Salla, copy the generated code, open the demo store installation, paste the code into `ValueChat Connection Code`, save, and verify:

```text
Integration status: active
Last sync: a current timestamp
Webhook outcomes: accepted
Initial store.sync.complete outcome: success
```

Confirm an Agent Store lookup returns the demo product's current price and availability.

- [ ] **Step 7: Submit and connect Greens production**

Submit the private paid app for Salla review. After approval, install it on the Greens production store using a newly generated ValueChat code. Do not reuse the demo code. Verify active status, successful initial sync, and one product lookup before enabling the Store capability on the production Agent.
