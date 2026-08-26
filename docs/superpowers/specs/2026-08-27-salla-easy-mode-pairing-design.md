# Salla Easy Mode Pairing Design

## Goal

Connect the private paid Salla app `Greens Products` (`946600964`) to a ValueChat workspace through Salla Easy Mode, while keeping the implementation safe for multiple tenants and future public distribution.

## Scope

This phase covers Salla installation, secure workspace pairing, token lifecycle, initial catalog sync, reconnect, and uninstall behavior. The app remains private for the Greens rollout, but no tenant or merchant is hardcoded.

This phase does not add order management, customer writes, checkout changes, or an embedded Salla dashboard page.

## Chosen Approach

ValueChat generates a single-use connection code before the merchant installs the Salla app. The merchant pastes that code into a private Salla App Setting named `valuechat_connection_code`. Salla sends signed `app.store.authorize` and `app.settings.updated` webhooks; ValueChat combines those events to bind the Salla merchant to the correct tenant.

The connection code is random, expires after 30 minutes, is returned to the browser once, and is stored only as a SHA-256 hash. It is never logged. Tokens received before pairing are encrypted and retained for at most 24 hours.

## Configuration

The backend uses these variables:

- `SALLA_APP_ID=946600964`
- `SALLA_AUTH_MODE=custom|easy`
- Existing `SALLA_CLIENT_ID`
- Existing `SALLA_CLIENT_SECRET`
- Existing `SALLA_WEBHOOK_SECRET`
- Existing `ENCRYPTION_KEY`

`custom` preserves the current demo OAuth flow. `easy` changes the ValueChat connect and reconnect actions to the installation flow. Production switches to `easy` only after the Easy Mode backend is deployed.

The Salla Partner configuration uses:

- OAuth mode: Easy Mode
- Webhook URL: `https://valuechat.app/api/webhooks/salla`
- Webhook security: Signature
- Private App Setting ID: `valuechat_connection_code`
- App events: `app.store.authorize`, `app.settings.updated`, `app.uninstalled`
- Product events already supported by the catalog integration
- Required scopes: `products.read` or `products.read_write`, `offline_access`, and the basic/settings access required by the app configuration

The connection-code setting must not be exposed as a public storefront setting.

## Data Model

Existing `Integration` rows remain tenant-owned. Starting an Easy Mode connection creates a `store_salla` Integration with status `pending`, encrypted placeholder credentials, and metadata containing:

- `pairingCodeHash`
- `pairingExpiresAt`
- `installationMode: "easy"`
- `pendingMerchantId` only when the settings event arrives before authorization

A new tenantless staging model stores authorization events that arrive before workspace pairing:

### SallaPendingAuthorization

- `merchantId`: unique Salla merchant identifier
- `credentials`: encrypted access token, rotating refresh token, and absolute expiry
- `scope`: granted scope string
- `expiresAt`: staging retention deadline, not the access-token expiry
- `createdAt`
- `updatedAt`

The table never stores plaintext connection codes. It is deleted after successful pairing, uninstall, or expiry.

## API And UI Flow

### Start Connection

`POST /api/integrations/salla/auth-url` keeps its current route for compatibility.

In `custom` mode it returns the existing `{ authUrl }` response.

In `easy` mode it:

1. Creates a pending tenant-scoped Integration.
2. Generates a cryptographically random connection code.
3. Stores only its hash and 30-minute expiry in Integration metadata.
4. Returns:

```json
{
  "mode": "easy",
  "integrationId": "uuid",
  "pairingCode": "single-use-random-code",
  "installUrl": "https://s.salla.sa/apps/install/946600964"
}
```

The Integrations page displays a modal with the connection code, Copy button, expiry note, and Open Salla button. It does not redirect before the user can copy the code.

### Authorization Event

On signed `app.store.authorize`:

1. Validate merchant ID, access token, refresh token, Unix `expires`, and product-read scope.
2. If an active Integration already owns that merchant ID, rotate its encrypted credentials idempotently and enqueue a full sync.
3. If one unexpired pending Integration already records that merchant in `pendingMerchantId`, finalize that Integration under an integration-scoped lock and enqueue its initial sync after commit.
4. Otherwise, upsert an encrypted `SallaPendingAuthorization` for that merchant for 24 hours.
5. Return `202` without logging tokens, scope contents, or payload fields.

### Settings Pairing Event

On signed `app.settings.updated`:

1. Read `data.settings.valuechat_connection_code` without logging it.
2. Hash the code and find one unexpired pending `store_salla` Integration with that hash.
3. Reject pairing if another Integration already owns the signed webhook's merchant ID.
4. Under an integration-scoped lock, load the staged authorization for that merchant.
5. If authorization is present, activate the Integration, assign `externalAccountId`, store encrypted credentials, remove pairing metadata, and delete the staged authorization in one transaction.
6. If authorization has not arrived yet, retain the pairing hash and record `pendingMerchantId` on the pending Integration. The later authorization event completes the same transaction flow.
7. Enqueue the initial full catalog sync only after the first successful activation commits.
8. Return `202` for duplicate completed events without duplicating the Integration or sync ownership.

An invalid, expired, or already-used code does not reveal whether a tenant, merchant, or Integration exists.

The two installation events are deliberately order-independent. Neither event relies on webhook delivery order or an in-memory retry.

### Reconnect

In Easy Mode, reconnect creates a new single-use pairing code for the existing tenant-owned Integration and returns the same install URL. A completed `app.store.authorize` for an already-paired merchant rotates credentials directly, so ordinary token rotation does not require another code.

### Uninstall

On signed `app.uninstalled`, ValueChat marks the matching Integration `revoked`, removes staged authorization for the merchant, and prevents future Agent store calls. Reinstallation requires a new connection code.

## Token Lifecycle

Easy Mode `expires` is interpreted as an absolute Unix timestamp. Stored credentials retain the existing encrypted shape:

```json
{
  "accessToken": "encrypted-at-rest",
  "refreshToken": "encrypted-at-rest",
  "expiresAt": "ISO-8601"
}
```

The existing advisory-lock refresh service remains responsible for rotating single-use refresh tokens. Missing product scope is not treated as token expiry and does not trigger refresh.

## Error Handling

Stable codes are used at trust boundaries:

- `SALLA_EASY_MODE_NOT_CONFIGURED`
- `SALLA_INVALID_AUTHORIZATION_EVENT`
- `SALLA_REQUIRED_SCOPE_MISSING`
- `SALLA_PAIRING_CODE_INVALID`
- `SALLA_PAIRING_CODE_EXPIRED`
- `SALLA_PENDING_AUTHORIZATION_NOT_FOUND`
- Existing `STORE_INTEGRATION_NOT_FOUND`
- Existing `SALLA_WEBHOOK_PROCESSING_FAILED`

Provider payloads, connection codes, credentials, signatures, and raw settings are never included in logs or client errors.

## Cleanup

The existing reconciliation job deletes:

- Pending Integrations whose pairing expiry has passed.
- `SallaPendingAuthorization` rows older than 24 hours.

Cleanup is tenant-safe and does not affect active Integrations.

## Testing

Automated coverage includes:

- Custom Mode remains unchanged when selected.
- Easy Mode requires `SALLA_APP_ID` and returns the exact installation URL.
- Connection codes are random, hashed at rest, expire, and are never logged.
- Invalid webhook signatures are rejected before parsing.
- `app.store.authorize` validates absolute expiry and required scopes.
- Authorization tokens are encrypted in staging.
- `app.settings.updated` pairs only the matching pending Integration and merchant.
- Authorization-first and settings-first delivery both complete the same Integration.
- Cross-tenant, guessed, expired, duplicate, and replayed pairing attempts fail closed.
- Successful pairing enqueues one initial sync.
- Reauthorization rotates credentials without creating another Integration.
- Uninstall revokes only the matching merchant Integration.
- Cleanup removes only expired pending state.
- Frontend modal displays, copies, and opens the install URL without exposing credentials.

## Rollout

1. Deploy database, backend, and frontend support while production remains `SALLA_AUTH_MODE=custom`.
2. Configure the private Salla setting and required app events.
3. Set `SALLA_APP_ID=946600964` and `SALLA_AUTH_MODE=easy` in Coolify.
4. Switch the Salla app to Easy Mode and redeploy ValueChat.
5. Test the full flow on the demo store.
6. Submit the private paid app for review.
7. Install and pair the approved app on the Greens production store.

## Success Criteria

- A signed Salla installation can be paired only to the workspace that owns the unexpired connection code.
- The Integration becomes active and completes its initial catalog sync.
- Agents can read current products, prices, descriptions, and availability through the existing Store capability.
- Replayed events and rotating tokens do not create duplicate Integrations or consume stale refresh tokens.
- No code path hardcodes the Greens tenant or merchant.
