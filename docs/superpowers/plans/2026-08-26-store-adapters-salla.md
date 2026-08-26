# Store Adapters and Salla Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tenant-safe, provider-neutral Store capability that lets one agent read products from one Salla store through a cached catalog with bounded live verification.

**Architecture:** Canonical `AgentAction` rows authorize two read-only Store tools. `StoreService` operates on normalized catalog data and delegates provider calls through `StoreAdapterRegistry`; `SallaAdapter` is the first adapter. OAuth credentials are encrypted with a versioned AES-GCM envelope, refresh is serialized, and Bull handles initial, manual, webhook, and reconciliation sync jobs.

**Tech Stack:** Node.js 20+, Express 5, Prisma 5/PostgreSQL, Bull 4/Redis, Axios, AJV, React 19, Vitest, Testing Library.

## Global Constraints

- Work directly on `main`; do not create a branch or worktree.
- Preserve unrelated changes in `logs/CHANGELOG.md` and `docs/superpowers/plans/2026-07-25-agents-command-platform.md`.
- Store is the user-facing capability name; Salla is only the provider.
- An agent can be linked to at most one Store integration.
- Store access is read-only: no products, inventory, orders, or customer writes.
- The model never receives credentials, raw Salla payloads, tenant IDs, or integration IDs.
- Use only `products.read` and `offline_access` for the initial OAuth flow.
- Salla customer-facing HTTP timeout is 2.5 seconds; only `401` gets one inline refresh-and-retry.
- Search returns at most five compact products and performs at most one live Salla search request.
- Existing agents without Store enabled must retain current behavior.
- Live Salla credentials are not required until the final production canary.
- Run backend commands from `backend/` and frontend commands from `frontend/`; Git commands run from the repository root.
- Structured Store logs include IDs, provider, operation/tool/event, duration, source, counts, outcome, and stable error code only. Never log tokens, credentials, raw provider bodies, prompts, phone numbers, or product descriptions.

## File Structure

### New backend modules

- `backend/src/stores/storeCredentialCrypto.js`: versioned authenticated encryption for Store credentials.
- `backend/src/stores/storeOAuthState.js`: signed ten-minute OAuth state.
- `backend/src/stores/storeAdapterRegistry.js`: integration-type to adapter lookup.
- `backend/src/stores/storeService.js`: tenant-scoped cache/search/detail orchestration.
- `backend/src/stores/storeToolService.js`: agent-facing Store tool definitions and handlers.
- `backend/src/stores/storeSyncQueue.js`: Bull jobs and six-hour reconciliation.
- `backend/src/stores/providers/salla/sallaTokenService.js`: serialized rotating-token lifecycle.
- `backend/src/stores/providers/salla/sallaClient.js`: bounded authenticated Admin API requests.
- `backend/src/stores/providers/salla/sallaAdapter.js`: Salla-to-domain normalization and product operations.
- `backend/src/stores/providers/salla/sallaOAuthService.js`: pending integration, code exchange, and merchant identity.
- `backend/src/stores/providers/salla/sallaIntegration.routes.js`: tenant-authenticated connect/sync/reconnect endpoints.
- `backend/src/stores/providers/salla/sallaWebhookSecurity.js`: raw-body signature verification.
- `backend/src/stores/providers/salla/sallaWebhook.routes.js`: public verified webhook ingestion.

### Existing backend integration points

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260826010000_add_store_catalog/migration.sql`
- `backend/src/config/database.js`
- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/routes/integrations.js`
- `backend/src/routes/oauth.js`
- `backend/src/services/toolService.js`
- `backend/src/agents/agent.service.js`
- `backend/src/agents/agent.routes.js`
- `backend/src/agents/config/capabilityCatalog.js`
- `backend/src/agents/config/capabilitySchemas.js`
- `backend/src/agents/config/agentCapabilityService.js`
- `backend/src/agents/config/terminalCapabilityService.js`
- `backend/src/agents/config/legacyActionConfigProjection.js`

### Existing frontend integration points

- `frontend/src/pages/Integrations.jsx`
- `frontend/src/pages/Agents.jsx`
- `frontend/src/pages/agents/AgentEditor.jsx`
- `frontend/src/hooks/useAgents.js`

---

### Task 1: Store Persistence and Tenant Isolation

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260826010000_add_store_catalog/migration.sql`
- Modify: `backend/src/config/database.js`
- Create: `backend/tests/integration/stores/store-schema.test.js`

**Interfaces:**
- Produces: `Integration.externalAccountId`, `Integration.metadata`, and Prisma model `StoreProduct`.
- Produces unique identity: `(integrationId, externalId)`.
- Consumed by: every later Store task.

- [ ] **Step 1: Write the failing persistence test**

```js
it('isolates products by tenant and integration and cascades integration deletion', async () => {
  const tenant = await prisma.tenant.create({ data: { name: 'Store A', email: 'store-a@example.test' } });
  const integration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: 'store_salla',
      name: 'Main Store',
      credentials: 'store:v1:test',
      externalAccountId: 'merchant-1'
    }
  });
  await prisma.storeProduct.create({
    data: {
      tenantId: tenant.id,
      integrationId: integration.id,
      externalId: 'product-1',
      name: 'Greens',
      status: 'sale',
      isAvailable: true,
      syncedAt: new Date()
    }
  });

  await expect(prisma.storeProduct.create({
    data: {
      tenantId: tenant.id,
      integrationId: integration.id,
      externalId: 'product-1',
      name: 'Duplicate',
      status: 'sale',
      syncedAt: new Date()
    }
  })).rejects.toMatchObject({ code: 'P2002' });

  await prisma.integration.delete({ where: { id: integration.id } });
  expect(await prisma.storeProduct.count()).toBe(0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `backend`:

```bash
npx vitest run tests/integration/stores/store-schema.test.js
```

Expected: FAIL because `storeProduct` and Integration identity fields do not exist.

- [ ] **Step 3: Add the Prisma model and migration**

Add nullable `externalAccountId String? @map("external_account_id")`, `metadata Json?`, `storeProducts StoreProduct[]`, and `@@unique([type, externalAccountId])` to `Integration`. Add `storeProducts StoreProduct[]` to `Tenant`.

```prisma
model StoreProduct {
  id            String      @id @default(uuid())
  tenantId      String      @map("tenant_id")
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  integrationId String      @map("integration_id")
  integration   Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  externalId    String      @map("external_id")
  sku           String?
  name          String
  description   String?     @db.Text
  imageUrl      String?     @map("image_url")
  productUrl    String?     @map("product_url")
  price         Decimal?    @db.Decimal(18, 2)
  salePrice     Decimal?    @map("sale_price") @db.Decimal(18, 2)
  currency      String?
  status        String
  isAvailable   Boolean     @default(false) @map("is_available")
  quantity      Int?
  unlimitedQuantity Boolean @default(false) @map("unlimited_quantity")
  variants      Json?
  providerUpdatedAt DateTime? @map("provider_updated_at")
  syncedAt      DateTime    @map("synced_at")
  lastVerifiedAt DateTime?  @map("last_verified_at")
  deletedAt     DateTime?   @map("deleted_at")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  @@unique([integrationId, externalId])
  @@index([tenantId, integrationId, deletedAt])
  @@index([integrationId, sku])
  @@map("store_products")
}
```

Add `'StoreProduct'` to the tenant-isolated model list in `database.js`. The SQL migration must create the columns, composite unique indexes, foreign keys, and `store_products` table without altering existing credential data.

- [ ] **Step 4: Validate and run the focused test**

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npx vitest run tests/integration/stores/store-schema.test.js
```

Expected: Prisma validation succeeds and the focused test passes.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260826010000_add_store_catalog/migration.sql backend/src/config/database.js backend/tests/integration/stores/store-schema.test.js
git commit -m "feat(store): add tenant-scoped catalog persistence"
```

### Task 2: Credential Encryption and OAuth State

**Files:**
- Create: `backend/src/stores/storeCredentialCrypto.js`
- Create: `backend/src/stores/storeOAuthState.js`
- Create: `backend/tests/unit/stores/storeCredentialCrypto.test.js`
- Create: `backend/tests/unit/stores/storeOAuthState.test.js`

**Interfaces:**
- Produces: `encryptStoreCredentials(object): string`.
- Produces: `decryptStoreCredentials(envelope): object`.
- Produces: `createStoreOAuthState({ integrationId, now }): string`.
- Produces: `verifyStoreOAuthState(state, { now }): { integrationId: string }`.

- [ ] **Step 1: Write failing crypto and state tests**

```js
it('round-trips authenticated Store credentials and rejects tampering', () => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  const encrypted = encryptStoreCredentials({ accessToken: 'a', refreshToken: 'r', expiresAt: '2026-09-01T00:00:00.000Z' });
  expect(encrypted).toMatch(/^store:v1:/);
  expect(decryptStoreCredentials(encrypted)).toMatchObject({ accessToken: 'a', refreshToken: 'r' });
  expect(() => decryptStoreCredentials(`${encrypted}x`)).toThrow();
});

it('rejects expired and modified OAuth state', () => {
  process.env.SALLA_CLIENT_SECRET = 'state-secret';
  const now = new Date('2026-08-26T10:00:00Z');
  const state = createStoreOAuthState({ integrationId: 'integration-1', now });
  expect(verifyStoreOAuthState(state, { now })).toEqual({ integrationId: 'integration-1' });
  expect(() => verifyStoreOAuthState(`${state}x`, { now })).toThrow('Invalid OAuth state');
  expect(() => verifyStoreOAuthState(state, { now: new Date('2026-08-26T10:11:00Z') })).toThrow('OAuth state expired');
});
```

- [ ] **Step 2: Run tests and verify missing-module failures**

```bash
npx vitest run tests/unit/stores/storeCredentialCrypto.test.js tests/unit/stores/storeOAuthState.test.js
```

Expected: FAIL because the Store security modules do not exist.

- [ ] **Step 3: Implement versioned AES-GCM and signed state**

Use the same strict base64 key contract as `metaTokenCrypto`, with prefix `store:v1:`, 12-byte IV, and 16-byte GCM tag. Encrypt `JSON.stringify(credentials)` and reject non-plain objects.

OAuth state payload is base64url JSON with `integrationId`, random nonce, `iat`, and `exp = iat + 600`; append an HMAC-SHA256 signature using `SALLA_CLIENT_SECRET` and compare signatures with `crypto.timingSafeEqual`.

```js
module.exports = {
  encryptStoreCredentials,
  decryptStoreCredentials,
  isEncryptedStoreCredentials,
  assertStoreCredentialEncryptionConfigured
};
```

- [ ] **Step 4: Run focused tests**

```bash
npx vitest run tests/unit/stores/storeCredentialCrypto.test.js tests/unit/stores/storeOAuthState.test.js
```

Expected: PASS, including tamper, malformed-key, modified-state, and expired-state cases.

- [ ] **Step 5: Commit**

```bash
git add backend/src/stores/storeCredentialCrypto.js backend/src/stores/storeOAuthState.js backend/tests/unit/stores/storeCredentialCrypto.test.js backend/tests/unit/stores/storeOAuthState.test.js
git commit -m "feat(store): secure provider credentials and oauth state"
```

### Task 3: Salla Adapter, Registry, and Token Lifecycle

**Files:**
- Create: `backend/src/stores/storeAdapterRegistry.js`
- Create: `backend/src/stores/providers/salla/sallaAdapter.js`
- Create: `backend/src/stores/providers/salla/sallaClient.js`
- Create: `backend/src/stores/providers/salla/sallaTokenService.js`
- Create: `backend/tests/unit/stores/storeAdapterRegistry.test.js`
- Create: `backend/tests/unit/stores/sallaAdapter.test.js`
- Create: `backend/tests/unit/stores/sallaTokenService.test.js`
- Create: `backend/tests/integration/stores/salla-token-refresh.test.js`

**Interfaces:**
- Produces: `createStoreAdapterRegistry({ store_salla: adapter }).get('store_salla')`.
- Produces normalized product shape consumed by StoreService.
- Produces: `createSallaTokenService({ prisma, http, clock }).getAccessToken({ tenantId, integrationId, forceRefresh })`.
- Produces: `createSallaClient({ http, tokenService, timeoutMs }).searchProducts/getProduct/getVariants/listProductsPage`.

- [ ] **Step 1: Write failing adapter and refresh tests**

```js
it('normalizes Salla money, availability, links, and variants without raw payloads', () => {
  const product = normalizeSallaProduct({
    id: 44,
    name: 'Vitamin C',
    sku: 'VC-1',
    description: '<p>Daily support</p><script>ignore()</script>',
    price: { amount: 120, currency: 'SAR' },
    sale_price: { amount: 99, currency: 'SAR' },
    status: 'sale',
    quantity: 3,
    url: 'https://store.test/p/44'
  });
  expect(product).toMatchObject({
    externalId: '44', sku: 'VC-1', name: 'Vitamin C', description: 'Daily support',
    price: '120.00', salePrice: '99.00', currency: 'SAR', isAvailable: true, quantity: 3
  });
  expect(product).not.toHaveProperty('raw');
});

it('collapses concurrent refreshes into one rotating-token exchange', async () => {
  http.post.mockResolvedValue({ data: { access_token: 'new-a', refresh_token: 'new-r', expires_in: 1209600 } });
  const service = createSallaTokenService({ prisma, http, clock });
  const [first, second] = await Promise.all([
    service.getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true }),
    service.getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true })
  ]);
  expect(first).toBe('new-a');
  expect(second).toBe('new-a');
  expect(http.post).toHaveBeenCalledOnce();
  expect(prisma.integration.updateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla' }
  }));
});
```

Add a PostgreSQL-backed integration test that starts two token-service instances against the same expired integration and fires both refresh calls concurrently. Assert that the provider receives one refresh request, both callers receive the newly persisted access token, and the final encrypted credential envelope contains the single rotated refresh token. This test validates the advisory transaction lock rather than only an in-process promise.

- [ ] **Step 2: Run focused tests and verify failures**

```bash
npx vitest run tests/unit/stores/storeAdapterRegistry.test.js tests/unit/stores/sallaAdapter.test.js tests/unit/stores/sallaTokenService.test.js tests/integration/stores/salla-token-refresh.test.js
```

Expected: FAIL because adapter, registry, client, and token service are absent.

- [ ] **Step 3: Implement the registry and normalized Salla adapter**

The registry throws `STORE_PROVIDER_UNSUPPORTED` for unknown types. Strip HTML/scripts, decode basic entities, cap detailed descriptions at 4,000 characters, and cap search snippets at 300 characters. Convert IDs to strings and money to fixed decimal strings.

Salla endpoints use `https://api.salla.dev/admin/v2`:

```text
GET /products?keyword=<query>&format=light&per_page=5
GET /products/{product}
GET /products/{product}/variants
GET /products?page=<page>&per_page=100
```

- [ ] **Step 4: Implement serialized token refresh and bounded client retries**

Inside a Prisma interactive transaction, execute `SELECT pg_advisory_xact_lock(hashtext($1))` with key `salla:<integrationId>`, re-read the latest tenant-scoped integration, and skip refresh if another caller already stored a valid token. Use `{ maxWait: 5000, timeout: 10000 }`; use a 2.5-second Axios timeout. Persist both rotated tokens in one `updateMany` and mark `reauthorization_required` on unrecoverable OAuth responses.

`SallaClient` retries exactly once only after `401` and forced refresh. It returns typed errors for `429`, timeout, `5xx`, and not-found without logging provider bodies. Emit structured request and token-refresh completion logs with integration ID, operation, duration, outcome, and stable error code; tests must assert serialized credentials and provider bodies are absent.

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/unit/stores/storeAdapterRegistry.test.js tests/unit/stores/sallaAdapter.test.js tests/unit/stores/sallaTokenService.test.js tests/integration/stores/salla-token-refresh.test.js
```

Expected: PASS with one refresh call under concurrency and persisted rotated refresh token.

- [ ] **Step 6: Commit**

```bash
git add backend/src/stores/storeAdapterRegistry.js backend/src/stores/providers/salla backend/tests/unit/stores/storeAdapterRegistry.test.js backend/tests/unit/stores/sallaAdapter.test.js backend/tests/unit/stores/sallaTokenService.test.js backend/tests/integration/stores/salla-token-refresh.test.js
git commit -m "feat(store): add Salla adapter and durable token refresh"
```

### Task 4: Catalog Search, Live Merge, and Cached Fallback

**Files:**
- Create: `backend/src/stores/storeService.js`
- Create: `backend/tests/unit/stores/storeService.test.js`
- Create: `backend/tests/integration/stores/store-catalog.test.js`

**Interfaces:**
- Produces: `createStoreService({ prisma, registry, clock, enqueueRefresh })`.
- Produces: `searchProducts({ tenantId, integrationId, query, maxResults }): StoreSearchResult`.
- Produces: `getProduct({ tenantId, integrationId, productId }): StoreProductResult`.
- Produces: `syncCatalogPage`, `completeFullSync`, and `deleteCachedProduct` for queue workers.

- [ ] **Step 1: Write failing service tests**

```js
it('merges one live search into tenant-scoped cached results', async () => {
  adapter.searchProducts.mockResolvedValue([{ externalId: '2', name: 'Live C', price: '90.00', currency: 'SAR', isAvailable: true }]);
  prisma.storeProduct.findMany.mockResolvedValue([{ externalId: '1', name: 'Cached C', description: 'Support', price: '80.00' }]);
  const result = await service.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1', query: 'vitamin c', maxResults: 5 });
  expect(adapter.searchProducts).toHaveBeenCalledOnce();
  expect(result.products).toHaveLength(2);
  expect(result.products.find((p) => p.externalId === '2').liveVerified).toBe(true);
  expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ tenantId: 'tenant-1', integrationId: 'integration-1', deletedAt: null })
  }));
});

it('returns descriptive cache without claiming current price after a timeout', async () => {
  adapter.searchProducts.mockRejectedValue(Object.assign(new Error('timeout'), { code: 'STORE_TIMEOUT' }));
  const result = await service.searchProducts({ tenantId: 'tenant-1', integrationId: 'integration-1', query: 'greens', maxResults: 5 });
  expect(result.source).toBe('cache');
  expect(result.products[0]).toMatchObject({ liveVerified: false, currentPriceVerified: false });
});
```

- [ ] **Step 2: Run tests and verify failures**

```bash
npx vitest run tests/unit/stores/storeService.test.js tests/integration/stores/store-catalog.test.js
```

Expected: FAIL because StoreService does not exist.

- [ ] **Step 3: Implement tenant-scoped cache and live merge**

Local search uses Prisma `contains` with `mode: 'insensitive'` over `name`, `sku`, and `description`; always filter `tenantId`, `integrationId`, and `deletedAt: null`. Resolve the integration with the same tenant and active `store_salla` status before adapter lookup.

Search makes one adapter call, upserts returned products, deduplicates by `externalId`, prefers live fields, and returns five compact objects. `getProduct` first proves the product exists in the assigned catalog, then fetches details/variants and upserts them.

On timeout, `429`, or `5xx`, return cache with `liveVerified: false` and enqueue a delayed refresh. Never expose the provider error response. Emit one structured Store lookup completion log with integration ID, operation, cache/live source, duration, result count, and outcome.

- [ ] **Step 4: Run focused tests**

```bash
npx vitest run tests/unit/stores/storeService.test.js tests/integration/stores/store-catalog.test.js
```

Expected: PASS for live merge, fallback, missing product, soft delete, and cross-tenant denial.

- [ ] **Step 5: Commit**

```bash
git add backend/src/stores/storeService.js backend/tests/unit/stores/storeService.test.js backend/tests/integration/stores/store-catalog.test.js
git commit -m "feat(store): add cached catalog with live verification"
```

### Task 5: Canonical Store Capability Setup

**Files:**
- Modify: `backend/src/agents/config/capabilitySchemas.js`
- Modify: `backend/src/agents/config/capabilityCatalog.js`
- Create: `backend/src/agents/config/agentCapabilityService.js`
- Modify: `backend/src/agents/config/terminalCapabilityService.js`
- Modify: `backend/src/agents/config/legacyActionConfigProjection.js`
- Modify: `backend/src/agents/agent.routes.js`
- Modify: `backend/tests/integration/agents/terminal-capabilities.test.js`
- Create: `backend/tests/integration/agents/store-capability.test.js`

**Interfaces:**
- Produces strict config schema `{ maxResults: integer 1..5 }`.
- Produces capability key/type `store_catalog_read` linked to one `store_salla` Integration.
- Produces preferred endpoint `PUT /api/agents/:id/capabilities` and compatible alias `PUT /api/agents/:id/terminal-capabilities`.

- [ ] **Step 1: Write failing capability tests**

```js
it('stores one tenant-owned Salla connection as a canonical Store capability', async () => {
  const updated = await service.update({
    tenantId: tenant.id,
    agentId: agent.id,
    expectedConfigVersion: 1,
    capabilities: {
      store: {
        enabled: true,
        integrationId: integration.id,
        instructions: 'Check the store for product questions.',
        maxResults: 5
      }
    }
  });
  expect(updated.configVersion).toBe(2);
  expect(updated.actions.find((row) => row.key === 'store_catalog_read')).toMatchObject({
    integrationId: integration.id,
    isEnabled: true,
    config: { maxResults: 5 }
  });
});

it('rejects foreign, inactive, non-store, or missing integrations', async () => {
  await expect(service.update({
    tenantId: tenant.id,
    agentId: agent.id,
    expectedConfigVersion: 1,
    capabilities: { store: { enabled: true, integrationId: foreignIntegration.id, maxResults: 5 } }
  })).rejects.toMatchObject({ code: 'CAPABILITY_INTEGRATION_INVALID' });
});
```

- [ ] **Step 2: Run focused tests and verify failures**

```bash
npx vitest run tests/integration/agents/terminal-capabilities.test.js tests/integration/agents/store-capability.test.js
```

Expected: FAIL because Store capability normalization and persistence do not exist.

- [ ] **Step 3: Generalize the capability service**

Move current behavior into `agentCapabilityService.js`, add `store` normalization, include `store_catalog_read` in canonical keys, and validate the linked integration inside the same serializable transaction before writing the row. Disabled Store config persists `integrationId: null`, empty instructions, and `{ maxResults: 5 }`.

Add this strict schema and catalog policy:

```js
const storeCapabilityConfigSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['maxResults'],
  properties: { maxResults: { type: 'integer', minimum: 1, maximum: 5 } }
});

{
  type: 'store_catalog_read',
  risk: 'external_read',
  delivery: 'internal',
  terminalConversationCommand: false,
  integration: { required: true, types: ['store_salla'] },
  configSchema: storeCapabilityConfigSchema
}
```

Keep `terminalCapabilityService.js` as a compatibility re-export. Map Store into legacy projection only as enabled/instructions/config; runtime authorization must use the canonical row.

- [ ] **Step 4: Add preferred route and run tests**

Both capability endpoints call the same service and require `agents.manage`. Verify one `configVersion` increment and no duplicate rows.

```bash
npx vitest run tests/integration/agents/terminal-capabilities.test.js tests/integration/agents/store-capability.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/agents/config backend/src/agents/agent.routes.js backend/tests/integration/agents/terminal-capabilities.test.js backend/tests/integration/agents/store-capability.test.js
git commit -m "feat(agents): add canonical Store capability"
```

### Task 6: Store Tools and Shared Agent Tool Loop

**Files:**
- Create: `backend/src/stores/storeToolService.js`
- Modify: `backend/src/services/toolService.js`
- Modify: `backend/src/agents/agent.service.js`
- Modify: `backend/src/agents/agent.routes.js`
- Modify: `backend/tests/integration/agents/current-runtime.characterization.test.js`
- Create: `backend/tests/unit/stores/storeToolService.test.js`
- Create: `backend/tests/integration/agents/store-tool-runtime.test.js`

**Interfaces:**
- Adds tool names `search_store_products` and `get_store_product`.
- Produces shared `AgentService.runModelToolLoop({ agent, messages, tenantId, conversationId, allowCommands })`.
- Consumes canonical `agent.actions` and re-authorizes Store on each execution.

- [ ] **Step 1: Write failing tool visibility and runtime tests**

```js
it('exposes Store tools only for one enabled canonical Store capability', () => {
  const tools = toolService.getToolDefinitions({
    actionConfig: {},
    actions: [{ key: 'store_catalog_read', isEnabled: true, integrationId: 'store-1', instructions: 'Use for product facts.', config: { maxResults: 5 } }]
  });
  expect(tools.map((tool) => tool.function.name)).toEqual(['search_store_products', 'get_store_product']);
});

it('re-reads capability authorization before executing a Store call', async () => {
  prisma.agentAction.findFirst.mockResolvedValue(null);
  const result = await storeToolService.execute('search_store_products', { query: 'greens' }, {
    tenantId: 'tenant-1', agentId: 'agent-1', conversationId: 'conversation-1'
  });
  expect(result).toEqual({ success: false, code: 'STORE_CAPABILITY_DISABLED', message: 'Live store data is unavailable.' });
  expect(storeService.searchProducts).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests and verify failures**

```bash
npx vitest run tests/unit/stores/storeToolService.test.js tests/integration/agents/store-tool-runtime.test.js
```

Expected: FAIL because Store tools and shared loop do not exist.

- [ ] **Step 3: Implement compact Store tool definitions and execution**

Tool schemas accept only `query` or `productId`, reject additional properties, and never accept an integration ID. Dynamic descriptions append sanitized capability instructions. The handler queries `AgentAction` with `agentId`, linked Integration tenant/status/type checks, then calls StoreService.

Return compact results:

```js
{
  success: true,
  source: 'live',
  products: [{ id, name, sku, descriptionSnippet, price, salePrice, currency, available, url, liveVerified, verifiedAt }]
}
```

Emit one structured completion log per Store tool call with tool name, agent ID, integration ID, cache/live source, duration, result count, outcome, and stable error code. Do not log tool arguments containing customer text or returned product content.

- [ ] **Step 4: Extract and reuse the model/tool loop**

Move the existing maximum-five-loop logic into `runModelToolLoop`. Pass `{ actionConfig: agent.actionConfig, actions: agent.actions }` to definitions and `{ tenantId, conversationId, agentId: agent.id, actions: agent.actions }` to execution. Preserve current command-tag processing after the loop.

Update the Test Lab query to include active actions and call the same loop with `allowCommands: false`; it must never execute assignment/close actions in preview.

- [ ] **Step 5: Run runtime and characterization tests**

```bash
npx vitest run tests/unit/stores/storeToolService.test.js tests/integration/agents/store-tool-runtime.test.js tests/integration/agents/current-runtime.characterization.test.js
```

Expected: PASS; existing non-Store agent responses remain unchanged and Test Lab can perform Store tool calls.

- [ ] **Step 6: Commit**

```bash
git add backend/src/stores/storeToolService.js backend/src/services/toolService.js backend/src/agents/agent.service.js backend/src/agents/agent.routes.js backend/tests/unit/stores/storeToolService.test.js backend/tests/integration/agents/store-tool-runtime.test.js backend/tests/integration/agents/current-runtime.characterization.test.js
git commit -m "feat(agents): execute tenant-safe Store tools"
```

### Task 7: Bull Catalog Sync and Salla Webhooks

**Files:**
- Create: `backend/src/stores/storeSyncQueue.js`
- Create: `backend/src/stores/providers/salla/sallaWebhookSecurity.js`
- Create: `backend/src/stores/providers/salla/sallaWebhook.routes.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/server.js`
- Create: `backend/tests/unit/stores/storeSyncQueue.test.js`
- Create: `backend/tests/unit/stores/sallaWebhookSecurity.test.js`
- Create: `backend/tests/integration/stores/salla-webhook-route.test.js`

**Interfaces:**
- Produces queue methods `enqueueFullSync`, `enqueueProductRefresh`, `enqueueDelete`, `enqueueReconciliation`, and `close`.
- Produces public route `POST /api/webhooks/salla` requiring valid raw-body signature.

- [ ] **Step 1: Write failing signature, route-ordering, and queue tests**

```js
it('rejects invalid Salla signatures before enqueueing', async () => {
  await request(app)
    .post('/api/webhooks/salla')
    .set('Content-Type', 'application/json')
    .set('X-Salla-Signature', 'invalid')
    .send('{"event":"product.price.updated","merchant":12}')
    .expect(401, { error: 'INVALID_SALLA_SIGNATURE' });
  expect(queue.enqueueProductRefresh).not.toHaveBeenCalled();
});

it('passes the exact raw bytes to HMAC verification and enqueues once', async () => {
  const body = '{"event":"product.price.updated","merchant":12,"data":{"id":44}}';
  const signature = crypto.createHmac('sha256', process.env.SALLA_WEBHOOK_SECRET).update(body).digest('hex');
  await request(app).post('/api/webhooks/salla').set('Content-Type', 'application/json').set('X-Salla-Signature', signature).send(body).expect(202);
  expect(queue.enqueueProductRefresh).toHaveBeenCalledWith(expect.objectContaining({ merchantId: '12', productId: '44' }));
});
```

- [ ] **Step 2: Run tests and verify failures**

```bash
npx vitest run tests/unit/stores/storeSyncQueue.test.js tests/unit/stores/sallaWebhookSecurity.test.js tests/integration/stores/salla-webhook-route.test.js
```

Expected: FAIL because queue, security, and raw route do not exist.

- [ ] **Step 3: Implement queue jobs**

Create Bull queue `store-catalog-sync` using existing Redis env settings. Job types are `full_sync`, `product_refresh`, `product_delete`, and `reconcile_all`. Defaults: three attempts, exponential 2-second backoff, bounded retained failures, and removed successful webhook jobs.

Register one repeatable `reconcile_all` job with six-hour cadence and stable job ID `store-reconcile-v1`. The worker enumerates active `store_salla` integrations sequentially and adds jitter between full-sync jobs. Manual/initial full sync uses job ID `store-full:<integrationId>` to deduplicate concurrent requests.

Every full-sync attempt merges safe status fields into `Integration.metadata` without overwriting merchant identity: `lastSyncStatus`, `lastSyncedAt`, and `lastSyncError`. Clear `lastSyncError` on success and store only a stable internal error code on failure, never the provider response body.

- [ ] **Step 4: Implement raw-body Salla route before JSON parsing**

In `app.js`, mount `routes.sallaWebhooks` with `express.raw({ type: 'application/json', limit: '1mb' })` before `express.json()`. Keep the existing Meta raw webhook behavior unchanged. Verify HMAC-SHA256 with timing-safe equality, parse JSON only after verification, resolve the integration by `type = store_salla` plus `externalAccountId = merchant`, and return `503` if enqueue fails so Salla retries.

Map these initial events explicitly: `product.created`, `product.price.updated`, `product.status.updated`, `product.image.updated`, `product.category.updated`, `product.brand.updated`, `product.tags.updated`, and `product.quantity.low` enqueue `product_refresh`; `product.deleted` enqueues `product_delete`; `app.uninstalled` marks the matching integration `revoked` and disables live Store use. Unknown valid events return `202` without enqueueing. Emit signature and processing logs using event, merchant ID, outcome, duration, and stable error code only.

Create the Salla router and pass it through the existing `createApp({ routes })` dependency map as `routes.sallaWebhooks` in `server.js`; close the Store queue in the server close handler.

- [ ] **Step 5: Run focused tests**

```bash
npx vitest run tests/unit/stores/storeSyncQueue.test.js tests/unit/stores/sallaWebhookSecurity.test.js tests/integration/stores/salla-webhook-route.test.js
```

Expected: PASS for invalid signature, malformed body, every supported event mapping, uninstall revocation, unknown events, cross-merchant isolation, enqueue failure, redacted structured logs, deduplication, sync counts, and repeat-job identity.

- [ ] **Step 6: Commit**

```bash
git add backend/src/stores/storeSyncQueue.js backend/src/stores/providers/salla/sallaWebhookSecurity.js backend/src/stores/providers/salla/sallaWebhook.routes.js backend/src/app.js backend/src/server.js backend/tests/unit/stores/storeSyncQueue.test.js backend/tests/unit/stores/sallaWebhookSecurity.test.js backend/tests/integration/stores/salla-webhook-route.test.js
git commit -m "feat(store): sync Salla catalog from verified webhooks"
```

### Task 8: Salla OAuth and Integration APIs

**Files:**
- Create: `backend/src/stores/providers/salla/sallaOAuthService.js`
- Create: `backend/src/stores/providers/salla/sallaIntegration.routes.js`
- Modify: `backend/src/routes/integrations.js`
- Modify: `backend/src/routes/oauth.js`
- Create: `backend/tests/unit/stores/sallaOAuthService.test.js`
- Create: `backend/tests/integration/stores/salla-integration-api.test.js`

**Interfaces:**
- Adds `POST /api/integrations/salla/auth-url`.
- Adds `POST /api/integrations/salla/:id/sync`.
- Adds `POST /api/integrations/salla/:id/reconnect`.
- Adds `DELETE /api/integrations/salla/:id`.
- Adds `GET /api/oauth/salla/callback`.
- Generic `POST /api/integrations` rejects `store_*` types.

- [ ] **Step 1: Write failing OAuth/API tests**

```js
it('creates a tenant-owned pending integration and returns a signed Salla URL', async () => {
  const response = await request(app).post('/api/integrations/salla/auth-url').set(adminAuth).expect(200);
  expect(response.body.authUrl).toContain('https://accounts.salla.sa/oauth2/auth');
  expect(response.body.authUrl).toContain('offline_access');
  expect(await prisma.integration.findFirst({ where: { tenantId, type: 'store_salla', status: 'pending' } })).not.toBeNull();
});

it('blocks reserved Store types on generic integration creation', async () => {
  await request(app).post('/api/integrations').set(adminAuth).send({ type: 'store_salla', name: 'Fake', credentials: '{}' }).expect(400, {
    error: 'Store integrations must use provider authorization', code: 'RESERVED_INTEGRATION_TYPE'
  });
});
```

- [ ] **Step 2: Run tests and verify failures**

```bash
npx vitest run tests/unit/stores/sallaOAuthService.test.js tests/integration/stores/salla-integration-api.test.js
```

Expected: FAIL because the Salla OAuth/API modules do not exist.

- [ ] **Step 3: Implement pending connection and callback**

Fail with `SALLA_NOT_CONFIGURED` when any required env key is missing. Create a pending integration with encrypted provider marker, issue ten-minute signed state, and request `products.read offline_access`.

Callback verifies state before lookup, exchanges code at `https://accounts.salla.sa/oauth2/token`, fetches `https://accounts.salla.sa/oauth2/user/info`, stores encrypted rotating tokens plus external merchant ID and safe metadata, marks active, and enqueues initial full sync. Redirect success/error to `/settings/integrations`. Log OAuth outcomes with integration ID, operation, duration, outcome, and stable error code, never authorization codes or token values.

If enqueue fails, keep credentials, set `status = error`, and expose Sync now. Clean pending rows older than one hour during reconciliation.

- [ ] **Step 4: Add permissioned provider routes and reserved-type protection**

Connect/sync/reconnect/delete require `integrations.manage`; all ID mutations use `id + tenantId + type = store_salla`. Do not use `getIntegrationInternal(id)` or create a new PrismaClient. Generic POST returns 400 for any type matching `/^store_/`.

- [ ] **Step 5: Run focused tests**

```bash
npx vitest run tests/unit/stores/sallaOAuthService.test.js tests/integration/stores/salla-integration-api.test.js
```

Expected: PASS for missing config, signed state, callback success, callback tampering, cross-tenant denial, permissions, reserved type, enqueue failure, redacted logs, and correct redirect.

- [ ] **Step 6: Commit**

```bash
git add backend/src/stores/providers/salla/sallaOAuthService.js backend/src/stores/providers/salla/sallaIntegration.routes.js backend/src/routes/integrations.js backend/src/routes/oauth.js backend/tests/unit/stores/sallaOAuthService.test.js backend/tests/integration/stores/salla-integration-api.test.js
git commit -m "feat(store): connect Salla stores with secure OAuth"
```

### Task 9: Integrations Center UI

**Files:**
- Modify: `frontend/src/pages/Integrations.jsx`
- Create: `frontend/src/pages/__tests__/Integrations.salla.test.jsx`

**Interfaces:**
- Consumes Salla integration list metadata and provider endpoints from Task 8.
- Produces Connect, Sync now, Reconnect, and Delete interactions.

- [ ] **Step 1: Write failing UI tests**

```jsx
it('starts Salla OAuth without asking for client secrets', async () => {
  api.get.mockResolvedValueOnce({ data: { integrations: [] } });
  api.post.mockResolvedValueOnce({ data: { authUrl: 'https://accounts.salla.sa/oauth2/auth?state=signed' } });
  render(<Integrations />);
  await user.click(await screen.findByRole('heading', { name: 'Salla' }));
  expect(api.post).toHaveBeenCalledWith('/integrations/salla/auth-url');
  expect(screen.queryByLabelText(/Client Secret/i)).not.toBeInTheDocument();
});

it('renders Salla sync status and sends Sync now', async () => {
  api.get.mockResolvedValueOnce({ data: { integrations: [{ id: 's1', type: 'store_salla', name: 'Greens', status: 'active', metadata: { lastSyncedAt: '2026-08-26T10:00:00Z' } }] } });
  render(<Integrations />);
  await user.click(await screen.findByRole('button', { name: /Sync now/i }));
  expect(api.post).toHaveBeenCalledWith('/integrations/salla/s1/sync');
});
```

- [ ] **Step 2: Run tests and verify failures**

```bash
npm test -- src/pages/__tests__/Integrations.salla.test.jsx
```

Expected: FAIL because Salla UI does not exist.

- [ ] **Step 3: Implement Salla card and active state**

Add a Salla available-tool card. Clicking it calls the backend and redirects to returned `authUrl`; never render Client ID or Secret fields. Active cards render store name, status, last sync, Sync now, Reconnect, and Delete. Display `SALLA_NOT_CONFIGURED` as a setup-required message.

Replace all OAuth query cleanup paths with `/settings/integrations` and use non-blocking inline success/error notices instead of `alert` for Salla actions.

- [ ] **Step 4: Run focused tests and frontend build**

```bash
npm test -- src/pages/__tests__/Integrations.salla.test.jsx
npm run build
```

Expected: tests pass and Vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Integrations.jsx frontend/src/pages/__tests__/Integrations.salla.test.jsx
git commit -m "feat(store): add Salla integration controls"
```

### Task 10: Agent Store Action UI and Save Hydration

**Files:**
- Modify: `frontend/src/components/ActionCard.jsx`
- Modify: `frontend/src/hooks/useAgents.js`
- Modify: `frontend/src/hooks/__tests__/useAgents.setupPayload.test.jsx`
- Modify: `frontend/src/pages/Agents.jsx`
- Modify: `frontend/src/pages/agents/AgentEditor.jsx`
- Modify: `frontend/src/pages/agents/__tests__/AgentEditor.smoke.test.jsx`
- Create: `frontend/src/pages/agents/__tests__/AgentEditor.store.test.jsx`

**Interfaces:**
- Extends `buildAgentCapabilities(data)` with `store`.
- Hydrates `form.actionConfig.store` from canonical `actions`.
- Uses preferred `PUT /agents/:id/capabilities` endpoint once per save.

- [ ] **Step 1: Write failing payload and editor tests**

```jsx
it('builds one Store capability from the editor state', () => {
  expect(buildAgentCapabilities({
    actionConfig: { store: { enabled: true, integrationId: 'salla-1', instructions: 'Use for products.' } }
  }).store).toEqual({ enabled: true, integrationId: 'salla-1', instructions: 'Use for products.', maxResults: 5 });
});

it('requires exactly one active Store connection when enabled', async () => {
  render(<AgentEditor {...baseProps} availableIntegrations={[{ id: 's1', type: 'store_salla', name: 'Greens', status: 'active' }]} />);
  await user.click(screen.getByRole('button', { name: /Enable Store/i }));
  await user.selectOptions(screen.getByLabelText(/Linked Store/i), 's1');
  expect(screen.getByDisplayValue('Greens')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests and verify failures**

```bash
npm test -- src/hooks/__tests__/useAgents.setupPayload.test.jsx src/pages/agents/__tests__/AgentEditor.store.test.jsx
```

Expected: FAIL because Store is absent from the form and capability payload.

- [ ] **Step 3: Add Store payload, canonical hydration, and action card**

Rename frontend builder to `buildAgentCapabilities` while exporting `buildTerminalCapabilities` as a compatibility alias for existing tests/imports. Save all capabilities through `/agents/:id/capabilities` after setup save.

When editing, locate `full.actions.find(action => action.key === 'store_catalog_read')` and hydrate:

```js
store: {
  enabled: Boolean(storeAction?.isEnabled),
  integrationId: storeAction?.integrationId || '',
  instructions: storeAction?.instructions || ''
}
```

Add an accessible toggle name to `ActionCard`, derived from its title: `${enabled ? 'Disable' : 'Enable'} ${title}`. Then add the provider-neutral ActionCard title `Store`, filter integrations by `type === 'store_salla' && status === 'active'`, and disable Save/Publish with a clear inline error when Store is enabled without a selected connection.

- [ ] **Step 4: Run frontend tests and build**

```bash
npm test -- src/hooks/__tests__/useAgents.setupPayload.test.jsx src/pages/agents/__tests__/AgentEditor.smoke.test.jsx src/pages/agents/__tests__/AgentEditor.store.test.jsx
npm run build
```

Expected: PASS and one capability request per save.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ActionCard.jsx frontend/src/hooks/useAgents.js frontend/src/hooks/__tests__/useAgents.setupPayload.test.jsx frontend/src/pages/Agents.jsx frontend/src/pages/agents/AgentEditor.jsx frontend/src/pages/agents/__tests__/AgentEditor.smoke.test.jsx frontend/src/pages/agents/__tests__/AgentEditor.store.test.jsx
git commit -m "feat(agents): configure one Store per agent"
```

### Task 11: Full Verification and Production-Ready Disabled State

**Files:**
- Modify: `backend/src/app.js`
- Modify: `backend/src/server.js`
- Modify: `backend/tests/integration/agents/current-runtime.characterization.test.js`
- Modify: `docs/superpowers/plans/2026-08-26-store-adapters-salla.md`

**Interfaces:**
- Verifies all prior tasks together.
- Produces deployment behavior that is safe when Salla env keys are absent.

- [ ] **Step 1: Add boot characterization for missing Salla configuration**

```js
it('boots with Store disabled when Salla app keys are absent', () => {
  delete process.env.SALLA_CLIENT_ID;
  delete process.env.SALLA_CLIENT_SECRET;
  delete process.env.SALLA_WEBHOOK_SECRET;
  const app = createApp({ routes: {} });
  expect(app).toBeTypeOf('function');
});
```

The server may boot without Salla keys; only connect and webhook operations return `SALLA_NOT_CONFIGURED`. Production must still fail fast for an invalid `ENCRYPTION_KEY` through the existing Meta encryption assertion.

- [ ] **Step 2: Run the complete backend suite**

```bash
npx prisma validate
npx prisma generate
npm test
```

Expected: all backend tests pass. If the dedicated PostgreSQL test database is unavailable, run all unit tests, record integration tests as unexecuted, and do not claim full verification.

- [ ] **Step 3: Run the complete frontend suite and build**

```bash
npm test
npm run build
```

Expected: all frontend tests pass and production bundle builds.

- [ ] **Step 4: Inspect final diff and migration safety**

```bash
git diff --check
git status --short
git log --oneline --decorate -12
```

Expected: no whitespace errors; only intended Store work plus the user's pre-existing unrelated files remain dirty. Confirm migration adds nullable Integration fields and a new table only.

- [ ] **Step 5: Record verification in this plan**

Mark completed checkboxes and append exact test counts and any unavailable live checks. State explicitly: `Live Salla OAuth and demo-store canary pending Salla App creation`.

- [ ] **Step 6: Commit verification-only changes if any**

```bash
git add backend/src/app.js backend/src/server.js backend/tests/integration/agents/current-runtime.characterization.test.js docs/superpowers/plans/2026-08-26-store-adapters-salla.md
git commit -m "test(store): verify disabled and integrated runtime"
```

Do not create an empty commit if Step 1 was already covered by an earlier task and no files changed.

## Post-Implementation Live Canary

This section is intentionally not executable until a Salla App and demo store exist. It does not block code completion.

1. Create the Salla App through the existing external Salla MCP or Partners Portal.
2. Configure Custom Mode callback as `https://valuechat.app/api/oauth/salla/callback`.
3. Configure webhook URL as `https://valuechat.app/api/webhooks/salla` with the generated secret.
4. Add `products.read` and `offline_access`.
5. Set `SALLA_CLIENT_ID`, `SALLA_CLIENT_SECRET`, and `SALLA_WEBHOOK_SECRET` in backend production environment.
6. Connect a demo store from Settings, verify initial sync, then enable Store on one test agent.
7. Test search, current price, out-of-stock behavior, variants, `401` refresh, and product price/status webhook updates.
8. Verify logs contain IDs/durations/outcomes but no tokens, raw payloads, prompts, phone numbers, or provider error bodies.
