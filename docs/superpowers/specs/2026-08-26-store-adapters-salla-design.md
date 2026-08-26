# Store Adapters and Salla Integration Design

**Date:** 2026-08-26  
**Status:** Code-reviewed, pending final written-spec approval

## Objective

Add a generic, read-only Store capability to agents. The first provider is Salla. Each agent can be connected to exactly one store integration and can use live product data while answering customers.

The implementation must let future providers such as Shopify, WooCommerce, and EasyOrders reuse the same agent tools and normalized product model without changing agent prompts or runtime behavior.

## Scope

This phase includes:

- A provider-neutral Store service and adapter contract.
- A Salla adapter using the Salla Admin API v2.
- A tenant-scoped Salla integration record with encrypted OAuth credentials.
- A local product catalog with live verification for searches and product details.
- A canonical `store_catalog_read` AgentAction linked to one integration.
- Two read-only tools exposed to the model: product search and product details.
- Salla OAuth endpoints, token refresh protection, catalog synchronization, and product webhooks.
- Settings and Agent Actions UI for connecting and assigning a Salla store.
- Tests for tenant isolation, capability authorization, adapter mapping, token refresh, fallback behavior, and UI configuration.

This phase does not include:

- Product, inventory, order, or customer writes.
- Checkout or order creation.
- Providers other than Salla.
- A general-purpose MCP runtime.
- Semantic/vector catalog search.
- Splitting agent replies into multiple outbound messages.

## Confirmed Product Decisions

- The platform labels the capability **Store**, not **Salla Store**.
- An agent can use at most one store integration.
- The agent selects when to query the store from the customer's message and its instructions. It never selects an integration ID.
- Catalog descriptions are searchable locally; current prices and availability are verified against Salla whenever possible.
- If live verification fails, the agent may use descriptive cached data but must not claim that cached price or availability is current.
- Out-of-stock products may be returned but must be clearly marked unavailable. The agent should prefer available alternatives when relevant.

## Existing Codebase Constraints

The implementation must account for these verified runtime details:

- `AgentService` loads canonical `AgentAction` rows, but currently builds tool definitions from legacy `actionConfig` only and does not pass `agentId` or canonical actions to tool execution.
- Agent setup is saved first and capabilities are saved in a second request. Store must join the existing capability save request rather than add a third versioned request.
- The Agent Test Lab currently bypasses production tool calling entirely.
- Express preserves a raw request body only for the Meta webhook route. Salla must be mounted as a raw-body route before global JSON parsing.
- Existing generic integration encryption uses legacy AES-CBC with a development fallback. Salla credentials must not use that helper.
- Bull and Redis are already initialized in backend boot and are the established distributed-job mechanism.
- The Prisma tenant extension does not know about the new StoreProduct model, so the model must be added to the tenant-isolated list and every store query must still contain explicit tenant and integration filters.
- The actual frontend route is `/settings/integrations`; existing OAuth redirects to `/integrations` must not be copied.

## Considered Approaches

### 1. Generic adapter with local catalog and live verification

This is the selected approach. It gives fast search, bounded Salla API usage, resilience during provider failures, and a stable contract for future providers.

### 2. Salla MCP as the agent runtime

Rejected for runtime use. Salla's official Partners MCP manages apps, scopes, events, and publishing in the Partners Portal. It does not replace merchant OAuth storage, refresh handling, webhook processing, or application runtime code. A third-party store MCP would still require merchant OAuth and would add another multi-tenant process and security boundary.

The existing external Salla MCP may be used later to create and configure the Salla App.

### 3. Existing generic HTTP actions

Rejected. Current HTTP actions are response-tag side effects: the agent does not wait for their result and cannot use returned product data to compose its response. They also do not provide a provider contract, normalized results, or store-specific authorization.

## Architecture

```text
Agent runtime
    -> Store tool definitions
    -> StoreToolService
    -> StoreService
    -> StoreAdapterRegistry
    -> SallaAdapter
    -> Salla Admin API v2

StoreService
    -> local StoreProduct catalog
    -> tenant-scoped Integration
    -> token refresh service
```

### StoreAdapter contract

Every provider adapter implements the same internal operations:

```js
{
  provider: 'salla',
  searchProducts(context, query),
  getProduct(context, externalProductId),
  listProductsPage(context, cursor),
  refreshCredentials(context),
  normalizeProduct(providerProduct)
}
```

The adapter returns normalized domain objects. Raw Salla responses and credentials never enter the model context.

### StoreAdapterRegistry

The registry maps an integration type to one adapter:

```text
store_salla -> SallaAdapter
```

Adding another provider later requires a new adapter and integration setup flow, not changes to agent tool names.

## Persistence

### Integration changes

The existing `Integration` model remains the credential owner. It gains provider-neutral, non-secret identity fields:

- `externalAccountId`: Salla merchant/store ID.
- `metadata`: non-secret provider metadata such as store name and domain.

`(type, externalAccountId)` is unique when an external account ID is present. This prevents the same Salla merchant from being attached to two tenants accidentally.

Salla integrations use `type = store_salla`. Credentials remain encrypted and contain only secrets and token state:

```json
{
  "accessToken": "encrypted-at-rest",
  "refreshToken": "encrypted-at-rest",
  "expiresAt": "ISO-8601 timestamp"
}
```

Salla credentials use a dedicated, versioned AES-256-GCM envelope backed by the existing strict 32-byte base64 `ENCRYPTION_KEY`. They do not use `utils/encryption.js`. The envelope is authenticated and fails closed if its version, IV, authentication tag, or key is invalid. Existing Google and Notion credential formats are not migrated in this phase.

Integration status values used by this feature are:

- `pending`: connection started but authorization is incomplete.
- `active`: usable connection.
- `error`: provider or synchronization error that may be retried.
- `reauthorization_required`: token chain cannot be refreshed.
- `revoked`: app uninstalled or access revoked.

### StoreProduct

A provider-neutral `StoreProduct` table stores:

- Tenant and integration IDs.
- External product ID and optional SKU.
- Name, description, image URL, and storefront URL.
- Price, sale price, and currency.
- Provider status, availability, quantity, and unlimited-quantity flag.
- Normalized variants as JSON for this read-only phase.
- `providerUpdatedAt`, `syncedAt`, and `lastVerifiedAt` timestamps.
- Soft-deletion timestamp.

The unique identity is `(integrationId, externalProductId)`. Every read includes both `tenantId` and the assigned integration ID.

The initial local search uses case-insensitive matching over name, SKU, and description. Vector search and a dedicated search engine are intentionally deferred until catalog size or search quality demonstrates a need.

## Agent Capability

The canonical capability is an `AgentAction` row:

```text
key/type: store_catalog_read
integrationId: exactly one active store integration
isEnabled: true/false
instructions: optional guidance about when to consult the store
config: { maxResults: 5 }
```

`store_catalog_read` is a read-only external capability. Its policy requires:

- The source agent exists and is active.
- Exactly one enabled capability row exists.
- The linked integration belongs to the same tenant.
- The integration is active and has an allowed store type.
- Tool arguments pass strict schemas.

The existing capability catalog receives a strict `store_catalog_read` definition with `risk = external_read`, in-process delivery, `terminalConversationCommand = false`, and required integration types limited to `store_salla`. There is no command-registry entry because this capability exposes read tools rather than a side-effecting command.

The canonical AgentAction is the source of truth. Runtime store authorization must not rely solely on legacy `actionConfig` JSON.

Store is added to the capability payload already saved by the editor. `terminalCapabilityService` is generalized to `agentCapabilityService`, while the existing `/terminal-capabilities` route remains as a compatibility alias. The preferred endpoint becomes `PUT /api/agents/:id/capabilities`, and all command, CRM, and Store capability rows are validated and written in one serializable transaction with one `configVersion` increment.

This preserves the current two-stage setup save without introducing a third request or a new partial-save boundary.

## Agent Tools

Only two tools are added.

### `search_store_products`

Input:

```json
{ "query": "customer search text" }
```

Behavior:

1. Resolve the agent's enabled `store_catalog_read` capability.
2. Search the assigned local catalog.
3. Make at most one Salla list/search request to refresh matching current fields.
4. Merge and normalize results.
5. Return at most five compact products with a `liveVerified` flag and verification timestamp.

### `get_store_product`

Input:

```json
{ "productId": "external product ID returned by search" }
```

Behavior:

1. Verify the ID belongs to the assigned integration's catalog.
2. Fetch current Salla product details and variants.
3. Upsert the normalized product into the local catalog.
4. Return current price, availability, description, variants, image, and product URL.

The model is instructed to call `get_store_product` before making a definitive current-price or current-availability statement when search results are not live verified.

Search results contain compact plain text only: no scripts, HTML, raw provider JSON, or full unbounded descriptions. Product content is treated as untrusted data, never as model instructions. Search descriptions are snippets; full detail text is sanitized and capped before entering model context.

## Runtime Flow

```text
Customer asks about a product
    -> Agent decides whether Store data is needed
    -> Model calls search_store_products
    -> Store policy resolves the single assigned integration
    -> Local search runs
    -> SallaAdapter performs one bounded live search
    -> Normalized results return to the model
    -> Model optionally calls get_store_product
    -> Model produces the customer response
```

A store lookup failure is returned to the model as structured, sanitized data. It must not crash the full agent run or expose provider error bodies.

The production model loop changes explicitly:

- `getToolDefinitions` receives canonical active actions in addition to legacy action configuration.
- Tool execution context includes `tenantId`, `conversationId`, `agentId`, and canonical actions.
- The Store handler re-reads the live `store_catalog_read` row and linked integration before every provider call so a disabled or reassigned capability fails closed during an in-flight run.
- Store capability instructions are appended to the Store tool description, not converted into legacy `[ACTION: ...]` response tags.
- The Test Lab uses the same shared tool loop as production, with outbound conversation commands disabled, so Store behavior can be tested from the product UI.

## Salla OAuth and Tokens

The initial connection flow uses Salla Custom Mode for development and private testing:

1. `POST /api/integrations/salla/auth-url` creates a tenant-owned pending integration.
2. The backend generates a signed, expiring OAuth state containing the integration ID.
3. The merchant authorizes the requested scopes.
4. `GET /api/oauth/salla/callback` verifies state and exchanges the code server-side.
5. The backend fetches merchant identity, encrypts token credentials, sets the integration active, and starts initial synchronization.

Required initial scope:

- `products.read`
- `offline_access`

Webhook management scopes are only added if subscriptions are registered through the API. If events are configured through the Partners Portal, the runtime integration remains product-read-only.

Salla access tokens expire after 14 days. Refresh tokens are single-use, rotate on every refresh, and expire after about one month. Refresh is therefore serialized per integration:

1. Acquire a PostgreSQL transaction advisory lock derived from the integration ID, with an explicit transaction timeout longer than the provider HTTP timeout.
2. Re-read the latest encrypted credentials after acquiring the lock.
3. Return the existing access token if another request already refreshed it.
4. Otherwise refresh once and atomically replace both tokens and expiry.
5. Mark the integration `reauthorization_required` on an unrecoverable refresh failure.

Production marketplace onboarding through Salla Easy Mode is a later activation step after the Salla App exists. It does not change the Store adapter or agent tool contract.

The backend configuration keys are `SALLA_CLIENT_ID`, `SALLA_CLIENT_SECRET`, `SALLA_WEBHOOK_SECRET`, and `BACKEND_URL`. Missing keys produce a configuration error; they never fall back to frontend environment variables.

OAuth callbacks always redirect to `/settings/integrations`. The signed state expires after ten minutes and is verified before any integration lookup or token exchange. Pending Salla integrations older than one hour are cleaned up by the reconciliation job.

The generic integration creation endpoint rejects reserved `store_*` types. A Store integration can only become active through its provider authorization flow; an authenticated tenant user cannot create a fake active Salla integration by posting arbitrary credentials.

## Catalog Synchronization

### Initial and periodic sync

- Initial full synchronization starts after successful authorization.
- A Bull `store-catalog-sync` queue performs synchronization using the project's existing Redis deployment.
- One repeatable reconciliation job runs every six hours and enumerates active integrations sequentially with jitter.
- Initial sync, manual sync, and webhook product refreshes enqueue jobs instead of running inside HTTP handlers.
- Stable repeat-job identity prevents every backend replica from creating an independent reconciliation loop.
- Pagination is sequential and respects Salla rate-limit headers.
- Products are upserted by `(integrationId, externalProductId)`.
- Products missing from a completed full reconciliation are soft deleted.

### Webhooks

The webhook endpoint:

1. Reads the raw request body.
2. Verifies `X-Salla-Signature` with HMAC-SHA256 over the raw body and a timing-safe comparison.
3. Rejects invalid signatures before using the payload.
4. Enqueues a bounded Store sync job.
5. Acknowledges the valid request quickly after successful enqueue.

`/api/webhooks/salla` is mounted with `express.raw({ type: 'application/json' })` before global `express.json()` in `app.js`, mirroring the existing Meta security boundary. Only the verified router parses the JSON body.

The initial subscribed product events are:

- `product.created`
- `product.deleted`
- `product.price.updated`
- `product.status.updated`
- `product.image.updated`
- `product.category.updated`
- `product.brand.updated`
- `product.tags.updated`
- `product.quantity.low`
- `app.uninstalled`

Product upserts and deletes are naturally idempotent. Bull retries transient failures, while periodic reconciliation repairs an event that is permanently lost or exhausted.

## Failure and Fallback Rules

- `401`: attempt one serialized token refresh, then retry the API request once.
- `429`: return cached data immediately in the customer path and enqueue a delayed refresh that honors `Retry-After`.
- Timeout or `5xx`: return cached descriptive data with `liveVerified = false`.
- Invalid/revoked credentials: set the integration status and tell the model live store data is unavailable.
- Initial-sync enqueue failure: retain encrypted authorization, set integration status to `error`, and allow `Sync now` to retry.
- Webhook enqueue failure: return a retriable `503` so Salla can redeliver the verified event.
- Missing product: mark the cached row deleted and return a not-found result.
- No assigned store capability: do not expose Store tools to the model.
- Cross-tenant or mismatched product ID: reject as unauthorized without revealing whether the record exists.

## Performance Budgets

- Local catalog search target: under 100 ms before provider I/O.
- Salla request timeout: 2.5 seconds for customer-facing search and details.
- Search performs at most one live Salla request.
- No inline retry for timeout, `429`, or `5xx`; these fall back to cache and use the queue.
- A `401` may perform one serialized token refresh and one request retry.
- Search returns at most five products and a bounded text payload to control model latency and token usage.

## User Interface

### Settings -> Integrations

- Add a Salla card under available integrations.
- The card starts the backend OAuth flow; secrets are never entered into the browser.
- Active cards show store name, provider, status, and last synchronization time.
- Provide `Sync now`, `Reconnect`, and `Delete` actions with clear error states.
- Before environment credentials exist, the backend returns a specific configuration error and the UI explains that the Salla App keys are not configured.
- Salla create, sync, reconnect, and delete endpoints require `integrations.manage`; generic integration routes are not used to activate Salla.

### Agent -> Actions

- Add a provider-neutral **Store** action card.
- Enabling it requires selecting one active `store_salla` integration.
- The selector does not allow more than one store.
- Optional instructions describe when the agent should query the catalog.
- Saving uses the existing optimistic `configVersion` protection and creates or updates the canonical AgentAction row.
- Store is included in the same capability payload and transaction as the existing assignment, close, contact, lifecycle, tag, and internal-comment capabilities.
- The editor derives Store selection from canonical `actions`, not from stale legacy `actionConfig` projection data.

## Security

- Store access is read-only and uses the minimum Salla scope.
- OAuth tokens are encrypted at rest and never returned by integration APIs.
- Salla tokens use authenticated AES-256-GCM encryption with no production fallback key.
- Integration lookup is tenant-scoped at every boundary.
- The model cannot provide or override an integration ID.
- Tool inputs use strict schemas and bounded result sizes.
- Provider errors are sanitized before logging or returning to the model.
- Webhook signatures are verified against the raw request body.
- OAuth state is signed and expires.
- Token refresh is serialized to prevent single-use refresh token reuse.
- Reserved Store integration types cannot be created through the generic credential endpoint.
- Store routes enforce `integrations.manage`; Store capability changes enforce `agents.manage`.
- Store services use the shared injected Prisma client and never instantiate an unscoped PrismaClient or call the existing unscoped `getIntegrationInternal(id)` helper.

## Observability

Structured logs include:

- Integration ID, provider, operation, duration, and outcome.
- Catalog sync counts for scanned, created, updated, deleted, and failed products.
- Tool name, agent ID, integration ID, cache/live source, and duration.
- Token refresh outcome without any token values.
- Webhook event name, merchant ID, signature result, and processing outcome.

Metrics are not introduced in this phase; structured logs provide the initial operational signal.

## Code Change Map

Existing backend files that must change:

- `backend/prisma/schema.prisma`: Integration identity fields, StoreProduct relations and model.
- `backend/src/config/database.js`: add StoreProduct to tenant-isolated models.
- `backend/src/app.js`: mount the Salla raw-body webhook before JSON parsing.
- `backend/src/server.js`: inject the Salla route/provider and initialize/close the Store queue.
- `backend/src/routes/integrations.js`: provider-specific Salla endpoints, permissions, and reserved-type protection.
- `backend/src/routes/oauth.js`: verified Salla callback and correct frontend redirect.
- `backend/src/agents/agent.service.js`: shared model/tool loop, canonical tool context, and Store instruction injection.
- `backend/src/services/toolService.js`: Store tool registration and dispatch.
- `backend/src/agents/config/capabilityCatalog.js`: Store read capability policy.
- `backend/src/agents/config/capabilitySchemas.js`: strict Store capability configuration schema.
- `backend/src/agents/config/terminalCapabilityService.js`: generalize capability persistence while retaining compatibility exports.
- `backend/src/agents/agent.routes.js`: preferred generic capability endpoint and Test Lab parity.

New backend modules are grouped under `backend/src/stores/` for credential crypto, adapter registry, Salla adapter, Store service, Store tool handlers, OAuth state, webhook security/router, and Bull sync queue. Provider behavior must not be added to the existing generic `integration.service.js` switch.

Existing frontend files that must change:

- `frontend/src/pages/Integrations.jsx`: Salla connection and sync states plus corrected Settings URL handling.
- `frontend/src/pages/Agents.jsx`: hydrate Store state from canonical actions.
- `frontend/src/pages/agents/AgentEditor.jsx`: provider-neutral Store action card.
- `frontend/src/hooks/useAgents.js`: include Store in the single capability-save payload.

Tests follow the existing `backend/tests/unit`, `backend/tests/integration`, and colocated frontend Vitest patterns.

## Testing

Backend tests cover:

- Adapter registry lookup and unsupported-provider errors.
- Salla response normalization for simple products and variants.
- Catalog upsert, soft deletion, and tenant isolation.
- Agent capability validation and one-store enforcement.
- Tool visibility only for enabled, valid capabilities.
- Runtime re-authorization after a capability is disabled or reassigned during an active run.
- Cross-tenant integration and product denial.
- Search merge behavior and bounded result count.
- Cached fallback without false live-price claims.
- Access-token refresh, concurrent refresh serialization, and rotated-token persistence.
- OAuth state validation.
- Webhook signature validation and idempotent product updates.
- Raw-body route ordering before JSON parsing.
- `401`, `429`, timeout, and provider `5xx` handling.
- Bull job deduplication, retry, and repeatable reconciliation behavior.

Frontend tests cover:

- Salla integration card states.
- Store action enablement and single-integration selection.
- Save payload and stale config-version handling.
- Canonical action hydration when reopening the editor.
- Test Lab Store tool parity with production runtime.

No live Salla test is required until the Salla App credentials and demo store exist. Adapter HTTP tests use fixtures that match the official API response shapes.

## Rollout

1. Deploy schema and code with Store capability disabled by default.
2. Confirm migrations, queue boot, and existing agent behavior are unchanged.
3. Create/configure the Salla App using the existing external Salla MCP or Partners Portal.
4. Add backend Salla environment secrets and callback URL.
5. Connect a Salla demo store and run initial sync.
6. Enable Store on one test agent.
7. Verify search, live price, availability, token refresh, and webhook updates.
8. Enable for production agents after the canary passes.

## Acceptance Criteria

- Existing agents without Store enabled behave exactly as before.
- A tenant can connect a Salla store without exposing credentials to the frontend or model.
- An agent can be assigned exactly one active store integration.
- The agent can search products and fetch current product details through provider-neutral tools.
- Live failures degrade to clearly marked cached descriptive data instead of fabricated current data.
- No agent can access another tenant's integration or product.
- Concurrent token refresh attempts result in one Salla refresh request and persist the latest rotated refresh token.
- Product webhooks update the local catalog, and periodic sync repairs missed events.
- Adding a future provider does not require changing the agent-facing tool names.
- Store can be exercised from the Agent Test Lab through the same model/tool loop used by production conversations.

## Official References

- [Salla Get Started](https://docs.salla.dev/get-started)
- [Salla Authorization](https://docs.salla.dev/authorization)
- [Salla List Products](https://docs.salla.dev/5394168e0)
- [Salla Product Details](https://docs.salla.dev/5394169e0)
- [Salla Product Variants](https://docs.salla.dev/841799f0)
- [Salla Product Quantities](https://docs.salla.dev/9612796e0)
- [Salla Webhooks](https://docs.salla.dev/421119m0)
- [Salla Product Webhook Models](https://docs.salla.dev/433805m0)
- [Salla Rate Limiting](https://docs.salla.dev/421125m0)
- [Salla MCP Tools](https://docs.salla.dev/doc-2228622)
