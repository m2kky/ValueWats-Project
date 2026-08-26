# Store Adapters and Salla Integration Design

**Date:** 2026-08-26  
**Status:** Approved direction, pending written-spec review

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

The canonical AgentAction is the source of truth. Runtime store authorization must not rely solely on legacy `actionConfig` JSON.

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

1. Acquire a PostgreSQL advisory lock derived from the integration ID.
2. Re-read the latest encrypted credentials after acquiring the lock.
3. Return the existing access token if another request already refreshed it.
4. Otherwise refresh once and atomically replace both tokens and expiry.
5. Mark the integration `reauthorization_required` on an unrecoverable refresh failure.

Production marketplace onboarding through Salla Easy Mode is a later activation step after the Salla App exists. It does not change the Store adapter or agent tool contract.

The backend configuration keys are `SALLA_CLIENT_ID`, `SALLA_CLIENT_SECRET`, `SALLA_WEBHOOK_SECRET`, and `BACKEND_URL`. Missing keys produce a configuration error; they never fall back to frontend environment variables.

## Catalog Synchronization

### Initial and periodic sync

- Initial full synchronization starts after successful authorization.
- A lightweight scheduler reconciles each active Salla integration every six hours with per-integration jitter, one integration at a time per process.
- Pagination is sequential and respects Salla rate-limit headers.
- Products are upserted by `(integrationId, externalProductId)`.
- Products missing from a completed full reconciliation are soft deleted.

### Webhooks

The webhook endpoint:

1. Reads the raw request body.
2. Verifies `X-Salla-Signature` with HMAC-SHA256 over the raw body and a timing-safe comparison.
3. Rejects invalid signatures before using the payload.
4. Acknowledges valid requests quickly.
5. Refreshes the affected product asynchronously.

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

Product upserts and deletes are naturally idempotent. A lost in-process webhook task is repaired by the periodic reconciliation, avoiding a new durable queue subsystem in this phase.

## Failure and Fallback Rules

- `401`: attempt one serialized token refresh, then retry the API request once.
- `429`: honor `Retry-After`; do not loop inside the customer request beyond one bounded retry.
- Timeout or `5xx`: return cached descriptive data with `liveVerified = false`.
- Invalid/revoked credentials: set the integration status and tell the model live store data is unavailable.
- Missing product: mark the cached row deleted and return a not-found result.
- No assigned store capability: do not expose Store tools to the model.
- Cross-tenant or mismatched product ID: reject as unauthorized without revealing whether the record exists.

## User Interface

### Settings -> Integrations

- Add a Salla card under available integrations.
- The card starts the backend OAuth flow; secrets are never entered into the browser.
- Active cards show store name, provider, status, and last synchronization time.
- Provide `Sync now`, `Reconnect`, and `Delete` actions with clear error states.
- Before environment credentials exist, the backend returns a specific configuration error and the UI explains that the Salla App keys are not configured.

### Agent -> Actions

- Add a provider-neutral **Store** action card.
- Enabling it requires selecting one active `store_salla` integration.
- The selector does not allow more than one store.
- Optional instructions describe when the agent should query the catalog.
- Saving uses the existing optimistic `configVersion` protection and creates or updates the canonical AgentAction row.
- `PUT /api/agents/:id/store-capability` is the dedicated, tenant-scoped capability update endpoint.

## Security

- Store access is read-only and uses the minimum Salla scope.
- OAuth tokens are encrypted at rest and never returned by integration APIs.
- Integration lookup is tenant-scoped at every boundary.
- The model cannot provide or override an integration ID.
- Tool inputs use strict schemas and bounded result sizes.
- Provider errors are sanitized before logging or returning to the model.
- Webhook signatures are verified against the raw request body.
- OAuth state is signed and expires.
- Token refresh is serialized to prevent single-use refresh token reuse.

## Observability

Structured logs include:

- Integration ID, provider, operation, duration, and outcome.
- Catalog sync counts for scanned, created, updated, deleted, and failed products.
- Tool name, agent ID, integration ID, cache/live source, and duration.
- Token refresh outcome without any token values.
- Webhook event name, merchant ID, signature result, and processing outcome.

Metrics are not introduced in this phase; structured logs provide the initial operational signal.

## Testing

Backend tests cover:

- Adapter registry lookup and unsupported-provider errors.
- Salla response normalization for simple products and variants.
- Catalog upsert, soft deletion, and tenant isolation.
- Agent capability validation and one-store enforcement.
- Tool visibility only for enabled, valid capabilities.
- Cross-tenant integration and product denial.
- Search merge behavior and bounded result count.
- Cached fallback without false live-price claims.
- Access-token refresh, concurrent refresh serialization, and rotated-token persistence.
- OAuth state validation.
- Webhook signature validation and idempotent product updates.
- `401`, `429`, timeout, and provider `5xx` handling.

Frontend tests cover:

- Salla integration card states.
- Store action enablement and single-integration selection.
- Save payload and stale config-version handling.

No live Salla test is required until the Salla App credentials and demo store exist. Adapter HTTP tests use fixtures that match the official API response shapes.

## Rollout

1. Deploy schema and code with Store capability disabled by default.
2. Confirm migrations and existing agent behavior are unchanged.
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
