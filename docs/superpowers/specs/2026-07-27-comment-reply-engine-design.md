# Comment Reply Engine Design

**Status:** Design approved in conversation; awaiting final written-spec review
**Date:** 2026-07-27
**Owner:** Agents Architecture
**Prototype:** `D:\projects\valuewatsv1\comment-replies-ui-prototype.html`

## 1. Summary

Value Chat will add an agent-owned Comment Reply Engine for automatic public replies to Facebook Page and Instagram Professional account comments.

The engine will:

- Reply to eligible public comments immediately.
- Evaluate deterministic keyword and phrase rules first.
- Use the selected AI Agent and its knowledge base only when no rule matches.
- Support one default Agent per connected Facebook Page or Instagram account.
- Support optional per-post Agent and behavior overrides.
- Prevent duplicate replies across duplicate webhook deliveries, process restarts, and multiple backend instances.
- Keep an operational execution ledger for metrics and failures without creating a Social Inbox.

This is an independent runtime owned by the Agents layer. It will not reuse the conversation command runtime because public comment replies must not execute conversation ownership, CRM, workflow, or other Agent commands.

## 2. Current System Findings

The repository currently has partial comment support, but not the requested product.

### 2.1 Existing Facebook private replies

`backend/src/controllers/metaWebhookController.js` processes Facebook Page `feed` webhook changes and can send a fixed private message through `metaApi.sendMessengerPrivateReply`.

Current limitations:

- It sends a private DM, not a public comment reply.
- The response is one fixed string stored in channel configuration.
- It has no Agent, rules, AI fallback, post override, or Test Lab integration.
- Deduplication uses an in-memory `Map`, so it is lost on restart and is not shared between backend replicas.
- It executes inside webhook processing instead of creating a durable reply intent.

### 2.2 Existing channel configuration

`backend/src/services/channelConfig.service.js` stores private-reply configuration in encrypted channel JSON.

This is suitable for the existing small private-DM feature but not for ordered rules, variants, channel bindings, post overrides, execution records, or reporting. The new engine will use relational models instead of extending this JSON object.

### 2.3 Existing Agents runtime

`backend/src/agents/agent.service.js` combines response generation with conversation context and Agent commands. It can influence ownership, contacts, tags, lifecycle stages, workflows, internal comments, and other side effects.

The Comment Reply Engine must not call this runtime directly. It will share or extract only the read-only prompt, model, and knowledge retrieval capabilities needed to generate a public reply.

### 2.4 Existing durable outbox

`backend/src/events/outboxService.js` and `backend/src/events/outboxWorker.js` provide durable intents, leasing, retries, and `outcome_unknown` handling.

The Comment Reply Engine will reuse this infrastructure for Meta publishing rather than introducing a second queue or publishing directly from the webhook controller.

### 2.5 Existing frontend structure

`frontend/src/pages/Agents.jsx` currently manages list, template, and editor states under `/agents`. `frontend/src/pages/ChannelManage.jsx` owns channel-specific configuration.

The standalone prototype visually matches the current olive Value Chat application shell, but it duplicates the global header and represents the Rule Editor as a top-level tab. Production integration will reuse the existing shell and expose the Rule Editor as a child of Reply Rules.

### 2.6 Existing Meta connection permissions

The current Meta OAuth configuration is focused on messaging:

- Messenger currently requests Page metadata and messaging permissions.
- Instagram currently requests basic and messaging permissions.
- Facebook Page subscriptions include `feed`.
- Instagram subscriptions currently do not include comment webhook fields.

Public comment replies require updated Meta permissions and subscriptions. Connected accounts must expose a clear reconnect-required state until the required permissions are present.

### 2.7 Existing Meta security and identity gaps

The current Meta POST webhook route does not verify `X-Hub-Signature-256`. It is mounted after the global JSON parser, which also removes the exact raw bytes required for reliable HMAC verification.

The current Meta Instance model does not enforce a globally unique provider account identity. Webhook resolution uses unscoped `findFirst` fallbacks on `phoneNumberId`, so the same external account represented more than once can resolve nondeterministically.

Meta access tokens are currently stored directly in `Instance.accessToken`, and Instance APIs can serialize the token with the rest of the record.

These are blocking prerequisites for public automatic replies:

- Verify Meta POST signatures from raw request bytes before parsing or persistence.
- Add one canonical, globally unique provider account identity for webhook routing.
- Encrypt existing and new Meta tokens and remove token fields from every API DTO.

## 3. Goals

### 3.1 Product goals

- Automatic public replies for Facebook and Instagram comments.
- Rules-first routing to reduce AI cost and make common replies predictable.
- AI fallback using the selected Agent's instructions and active knowledge.
- A clear Agent-owned setup experience based on the approved prototype.
- Shared rules across Facebook and Instagram by default.
- Optional platform-specific reply variants.
- Per-post customization without requiring a separate Agent for every campaign.
- Safe production behavior under duplicate delivery, network failure, token expiry, and concurrent workers.

### 3.2 Architecture goals

- Keep Comment Reply Engine responsibilities isolated from conversations.
- Make all tenant and Agent boundaries explicit.
- Make one incoming comment produce no more than one reply intent.
- Keep rule matching deterministic and independently testable.
- Keep provider-specific webhook and publishing behavior behind adapters.
- Reuse the existing model gateway, knowledge retrieval, and durable outbox where safe.
- Keep the initial implementation small enough to ship without creating a general Social Inbox.

## 4. Non-Goals

The first version will not:

- Provide a comment moderation inbox.
- Hide, delete, like, or manually approve comments.
- Perform sentiment moderation or spam classification.
- Import complete historical comment threads.
- Reply privately as part of the new public-reply flow.
- Execute Agent commands such as Assign Conversation, Close Conversation, Trigger Workflow, update contact data, modify tags, or add internal comments.
- Create CRM Contacts or Conversations from commenters.
- Support TikTok, YouTube, LinkedIn, or other social platforms.
- Schedule delayed replies.
- Generate multiple replies to one incoming comment.
- Add human approval before publishing.

The existing Facebook private-reply feature remains a separate capability. Its UI should be labeled clearly as a private DM feature so it is not confused with public Comment Replies.

## 5. Accepted Product Decisions

- Supported platforms: Facebook Pages and Instagram Professional accounts.
- Publishing mode: automatic public reply with no approval step.
- Coverage: all eligible user comments by default.
- Skip conditions: own Page/account comments, empty or unsupported events, and duplicate webhook deliveries.
- Ownership: one default Agent per connected account.
- Overrides: an optional Agent profile or behavior override per post.
- Selecting another Agent for a post selects that Agent's complete Comment Reply profile, including its rules and AI fallback configuration.
- Routing: fixed rules first, AI Agent fallback second.
- Rule structure: one rule can contain multiple keywords or phrases.
- Conflict handling: highest-priority matching rule wins.
- Output count: exactly one selected reply.
- Variants: each rule can have multiple response variants.
- Rotation: deterministic round-robin.
- Rules are shared between Facebook and Instagram by default.
- A response variant may optionally be specific to Facebook or Instagram.
- Supported safe variables:
  - `{{customer_name}}`
  - `{{page_name}}`
  - `{{post_name}}`
  - `{{platform}}`
- The Test Lab must use production matching and rendering logic but must not publish or create production execution records.
- This is a lightweight Comment Reply Engine, not a Social Inbox.

## 6. Product Placement and Navigation

### 6.1 Agent-owned workspace

The engine is configured from the Agents area because the Agent owns the instructions, knowledge, model, and fallback behavior.

Add a `Comment Replies` action to each saved Agent card. It navigates to:

```text
/agents/:agentId/comment-replies
```

Using a route instead of another local `Agents.jsx` view state provides:

- Refresh-safe URLs.
- Deep links from Channel Manage and failure notifications.
- Browser navigation support.
- A cleaner boundary around a substantial workspace.

An unsaved Agent cannot open the engine. A deleted Agent cannot own an active profile.

### 6.2 Production workspace tabs

The production workspace has four top-level tabs:

1. Overview
2. Reply Rules
3. Post Overrides
4. Test Lab

The prototype's `Rule Editor` top-level tab becomes a focused child route opened from Reply Rules. It renders inside the Comment Reply workspace and preserves these stable URLs:

```text
/agents/:agentId/comment-replies/rules/new
/agents/:agentId/comment-replies/rules/:ruleId
```

### 6.3 Channel Manage integration

Facebook and Instagram Channel Manage pages show a read-only Comment Replies card containing:

- Bound Agent name.
- Engine status.
- Permission status.
- Active rule count.
- `Manage in Agent` link.

Channel Manage does not change the binding in the first version. It remains a read-only status and navigation surface; binding, rules, and post overrides stay in the Agent workspace.

The existing `Private Replies` tab remains separate and is renamed or described as `Private DM Replies`.

## 7. Frontend Design

### 7.1 Prototype elements retained

- Olive background and warm text palette, already aligned with the current application shell.
- Lime accent for the Comment Reply Engine workspace.
- Overview metrics cards.
- Rules-first to AI-fallback pipeline visualization.
- Connected accounts card.
- Recent failed deliveries table.
- Searchable rule cards.
- Rule priority and enable toggles.
- Multiple keywords and multiple reply variants.
- Post override grid.
- Test Lab simulation output.
- Responsive, horizontally scrollable tabs.

### 7.2 Prototype elements changed

- Remove the duplicated Value Chat logo and global header.
- Remove the static `v1.0 Pro` badge.
- Remove hard-coded metrics and account data.
- Move Rule Editor out of top-level navigation.
- Replace inline JavaScript state with React state and server-backed data.
- Replace Tailwind CDN usage with the project's existing Tailwind build.
- Use the existing toast and loading patterns where available.
- Do not show the engine as active when Agent, channel, or permission prerequisites fail.
- Do not expose a blind retry action for an `outcome_unknown` publish.

### 7.3 Proposed component boundary

```text
frontend/src/pages/agents/comment-replies/
  CommentReplyWorkspace.jsx
  CommentReplyHeader.jsx
  CommentReplyOverview.jsx
  CommentReplyRules.jsx
  CommentReplyRuleEditor.jsx
  CommentPostOverrides.jsx
  CommentReplyTestLab.jsx
  CommentReplyStatus.jsx
  components/
    ChannelBindingCard.jsx
    RuleCard.jsx
    KeywordEditor.jsx
    VariantEditor.jsx
    PostOverrideCard.jsx
    ExecutionFailureTable.jsx
  useCommentReplyEngine.js
```

These names describe boundaries, not mandatory one-file-per-small-element implementation. Components that remain small and single-use may stay local to their parent to avoid unnecessary fragmentation.

### 7.4 Workspace states

The UI must render explicit states for:

- Loading.
- Agent not found.
- Agent draft.
- Agent inactive.
- No connected eligible channels.
- Channel reconnect required.
- Engine paused.
- Engine active.
- Partially active because one binding is unhealthy.
- No rules, with AI fallback available.
- No rules and AI fallback unavailable.
- Metrics unavailable.

The master switch cannot conceal a broken configuration. The UI distinguishes:

- `Enabled`: user intent.
- `Ready`: prerequisites are valid.
- `Active`: enabled and ready.

### 7.5 Overview metrics

The first version reports:

- Replies today.
- Matched by rules today.
- Generated by AI today.
- Failed replies today.
- Connected eligible accounts.
- Recent failed or outcome-unknown deliveries.

Metrics are derived from `CommentReplyExecution`, not from Meta on every page load.

## 8. Domain Model

All new records are tenant-scoped. Relations must enforce tenant ownership in service-level authorization even when Prisma relations already constrain IDs.

### 8.1 CommentReplyProfile

One profile belongs to one Agent.

Proposed fields:

| Field | Purpose |
|---|---|
| `id` | UUID |
| `tenantId` | Tenant boundary |
| `agentId` | Owning Agent; unique |
| `isEnabled` | User's master switch |
| `aiFallbackEnabled` | Allow AI when no rule matches |
| `defaultMatchMode` | Default for new rules |
| `configVersion` | Optimistic configuration version |
| `deletedAt` | Soft-delete timestamp |
| `createdAt`, `updatedAt` | Audit timestamps |

Constraints:

- Unique `(tenantId, agentId)`.
- Profile activation does not override Agent lifecycle. The Agent must remain active, published, and not deleted.
- The profile is the configuration aggregate. Every binding, rule, variant, and post-override mutation requires `expectedConfigVersion` and increments `configVersion` in the same transaction.
- Operational counters such as round-robin cursors do not increment `configVersion`.

### 8.2 CommentChannelBinding

Connects one eligible `Instance` to one profile and default Agent.

Proposed fields:

| Field | Purpose |
|---|---|
| `id` | UUID |
| `tenantId` | Tenant boundary |
| `profileId` | Owning profile |
| `instanceId` | Facebook or Instagram Instance |
| `provider` | Normalized provider name |
| `externalAccountId` | Canonical Page or Instagram account ID |
| `isEnabled` | Per-channel enable switch |
| `permissionState` | `ready`, `reconnect_required`, `unsupported`, or `unknown` |
| `lastPermissionCheckAt` | Permission health timestamp |
| `createdAt`, `updatedAt` | Audit timestamps |

Constraints:

- Unique `(tenantId, instanceId)` so one account has exactly one default Comment Reply profile.
- Globally unique `(provider, externalAccountId)` so a provider account cannot route to two tenants or profiles.
- `Instance.channelType` must be `messenger` or `instagram`.
- Instance, profile, and Agent must belong to the same tenant.
- Connection or binding creation returns a conflict when the provider account already belongs to another tenant. It never transfers ownership silently.

### 8.3 CommentReplyRule

Stores deterministic matching behavior.

Proposed fields:

| Field | Purpose |
|---|---|
| `id` | UUID |
| `tenantId` | Tenant boundary |
| `profileId` | Owning profile |
| `name` | Human-readable name |
| `isEnabled` | Rule switch |
| `priority` | Rank where `1` is highest |
| `matchMode` | `contains_any`, `contains_all`, or `exact` |
| `keywords` | PostgreSQL `String[]` |
| `sharedRotationCursor` | Atomic cursor for shared variants |
| `facebookRotationCursor` | Atomic cursor for Facebook variants |
| `instagramRotationCursor` | Atomic cursor for Instagram variants |
| `deletedAt` | Soft-delete timestamp |
| `createdAt`, `updatedAt` | Audit timestamps |

Constraints and ordering:

- Keywords are trimmed, normalized, deduplicated, and cannot be empty.
- At least one keyword and one usable variant are required to enable a rule.
- Priority must be a positive integer.
- Evaluation order is `priority ASC`, then `createdAt ASC`, then `id ASC`.
- Stable tie-breaking prevents different workers from selecting different matching rules.

### 8.4 CommentReplyVariant

Stores rule responses.

Proposed fields:

| Field | Purpose |
|---|---|
| `id` | UUID |
| `tenantId` | Tenant boundary |
| `ruleId` | Parent rule |
| `platform` | Nullable; `facebook`, `instagram`, or shared |
| `body` | Reply template |
| `orderIndex` | Stable round-robin order |
| `isEnabled` | Variant switch |
| `deletedAt` | Soft-delete timestamp |
| `createdAt`, `updatedAt` | Audit timestamps |

Variant selection:

- Prefer enabled variants matching the incoming platform.
- If none exist for that platform, use enabled shared variants.
- Use the cursor belonging to the effective pool: Facebook, Instagram, or shared.
- Atomically increment that pool's cursor and select `cursor mod variantCount`.
- Sort variants by `orderIndex ASC`, then `id ASC`.

This provides platform-specific reply text without duplicating keyword configuration and prevents mixed Facebook and Instagram traffic from skipping or repeating entries in another pool.

### 8.5 CommentPostOverride

Overrides inherited behavior for one external post.

Proposed fields:

| Field | Purpose |
|---|---|
| `id` | UUID |
| `tenantId` | Tenant boundary |
| `bindingId` | Default connected-account binding |
| `externalPostId` | Meta post or media ID |
| `mode` | `inherit`, `disabled`, `rules_then_ai`, `rules_only`, or `ai_only` |
| `overrideProfileId` | Optional Comment Reply profile override |
| `postName` | Cached display label or caption excerpt |
| `thumbnailUrl` | Cached display thumbnail |
| `postPublishedAt` | Cached provider timestamp |
| `createdAt`, `updatedAt` | Audit timestamps |

Constraints:

- Unique `(tenantId, bindingId, externalPostId)`.
- Override profile, its Agent, and the binding must belong to the same tenant.
- The override profile's Agent must be active, published, and not deleted at runtime.
- `disabled` always wins.
- `inherit` behaves as if the override did not exist except for cached display metadata.

When `overrideProfileId` is present, both deterministic rules and AI fallback come from that profile. The first version does not support selecting an arbitrary subset of rules per post. A genuinely different per-post ruleset belongs to a separate Agent profile.

### 8.6 CommentReplyExecution

This is an operational ledger, not a Social Inbox.

Proposed fields:

| Field | Purpose |
|---|---|
| `id` | UUID |
| `tenantId` | Tenant boundary |
| `instanceId` | Nullable source Instance relation |
| `bindingId` | Nullable resolved binding relation |
| `profileId` | Nullable resolved profile relation |
| `agentId` | Nullable resolved Agent relation |
| `agentNameSnapshot` | Immutable bounded Agent display name |
| `platform` | `facebook` or `instagram` |
| `providerAccountId` | Immutable external account snapshot |
| `externalCommentId` | Incoming provider comment ID |
| `externalPostId` | Provider post or media ID |
| `parentCommentId` | Optional parent when available |
| `commentText` | Bounded incoming text for diagnostics |
| `commenterExternalId` | Optional bounded provider-scoped commenter ID |
| `commenterName` | Optional bounded display value |
| `postName` | Bounded post display value used by rendering |
| `eventCreatedAt` | Provider event timestamp |
| `isSelf` | Persisted own-account decision |
| `skipReason` | Stable reason when skipped |
| `routeSource` | `rule` or `ai` |
| `ruleId` | Optional matched rule |
| `ruleNameSnapshot` | Optional immutable bounded rule name |
| `variantId` | Optional selected variant |
| `profileConfigVersion` | Claimed profile aggregate version |
| `agentConfigVersion` | Claimed Agent version |
| `renderedReply` | Final bounded public reply |
| `status` | Pre-publish processing status |
| `providerReplyId` | Meta reply ID after success |
| `errorCode`, `errorMessage` | Sanitized failure |
| `attempts` | Processing attempt count |
| `availableAt` | Earliest processing time |
| `leaseExpiresAt` | Database worker lease |
| `leaseToken` | Fencing token for the active worker |
| `outboxEventId` | Optional reference to the one publish event |
| `receivedAt`, `completedAt` | Operational timestamps |
| `createdAt`, `updatedAt` | Audit timestamps |

Execution processing statuses:

- `received`
- `skipped`
- `processing`
- `ready`
- `failed`

Delivery status is not duplicated on the execution. Once the execution is `ready`, the related `OutboxEvent.status` is the authoritative delivery state: `pending`, `dispatching`, `succeeded`, `failed`, `outcome_unknown`, or `cancelled`. APIs map both records into one reader-facing status.

Constraints:

- Unique `(platform, providerAccountId, externalCommentId)` so deduplication survives later Instance deletion without cross-platform ID collisions.
- The unique claim is created before matching or AI generation.
- `commentText`, names, replies, and errors have explicit size limits.
- No access tokens or raw provider payloads are stored.
- All bounded input needed after webhook acknowledgement is persisted so a restarted worker does not need the original webhook body.

Required operational indexes:

- Execution claim: unique `(platform, providerAccountId, externalCommentId)`.
- Inbound worker: `(status, availableAt)`.
- Lease recovery: `(status, leaseExpiresAt)`.
- Profile metrics: `(tenantId, profileId, receivedAt DESC)`.
- Profile execution pagination: `(tenantId, profileId, createdAt DESC, id)`.
- Active rule evaluation: `(profileId, deletedAt, isEnabled, priority)`.
- Post override lookup: unique `(tenantId, bindingId, externalPostId)`.
- Outbox delivery listing: `(eventType, status, updatedAt DESC)`.

Execution and failure APIs use cursor pagination, not offset pagination.

## 9. Backend Module Boundary

The new module lives outside `backend/src/agents` because it is a distinct execution system:

```text
backend/src/commentReplies/
  commentReply.routes.js
  commentReply.service.js
  commentReplyRuntime.js
  commentReplyWorker.js
  commentRuleMatcher.js
  commentTemplateRenderer.js
  commentEventNormalizer.js
  commentAiGenerator.js
  commentReplyDispatcher.js
  commentReplyMetrics.js
```

Responsibilities:

| Unit | Responsibility |
|---|---|
| Routes | Authenticated tenant-scoped CRUD and Test Lab APIs |
| Service | Profiles, bindings, rules, variants, overrides, validation |
| Runtime | Resolve configuration and orchestrate one comment |
| Worker | Claim and recover durable inbound comment executions |
| Matcher | Pure normalization, ordering, and match decisions |
| Renderer | Safe variable interpolation and output validation |
| Event normalizer | Convert provider payloads into one canonical event |
| AI generator | Read-only Agent response generation |
| Dispatcher | Publish through provider adapters |
| Metrics | Aggregate execution ledger data |

`metaWebhookController` remains responsible for verification and provider-level event routing. It delegates eligible comment events to the normalizer/runtime instead of containing product logic.

## 10. Canonical Comment Event

Both platforms map to:

```text
CommentReceived {
  bindingId
  platform
  providerAccountId
  externalCommentId
  externalPostId
  parentCommentId?
  text
  commenterId?
  commenterName?
  postName?
  createdAt
  isSelf
}
```

The provider account resolver runs before this canonical event is constructed:

1. Read the provider account ID from the verified Meta payload.
2. Resolve exactly one `CommentChannelBinding` through globally unique `(provider, externalAccountId)`.
3. Derive `tenantId`, `instanceId`, and profile ownership from that trusted binding.
4. Reject zero or ambiguous matches.

`tenantId` is never accepted from the webhook body or caller-supplied canonical input. The worker accepts only an execution ID and reloads tenant context from the persisted execution and binding.

The runtime only accepts this canonical event after trusted account resolution. Provider payload shapes must not leak into the matcher, AI generator, or service layer.

Normalization must:

- Reject malformed or unsupported payloads missing account, comment ID, post ID, or text before creating a ledger row.
- Bound every string before persistence or logging.
- Determine `isSelf` from provider IDs, not display names.
- Resolve the globally unique binding before tenant-specific processing.
- Preserve enough external IDs to publish a reply.

Malformed or unsupported payloads increment bounded operational counters only. A valid canonical comment that fails product eligibility creates an execution and becomes `skipped` with a stable reason code.

## 11. Runtime Flow

### 11.1 Ingestion

1. A webhook-specific raw-body route receives at most 1 MB and verifies `X-Hub-Signature-256` with the configured Meta App Secret.
2. Missing signatures, invalid signatures, missing production secrets, altered bodies, and oversized bodies are rejected before JSON parsing, account lookup, persistence, or acknowledgement.
3. Only a verified raw body is parsed as JSON.
4. The controller identifies Facebook Page feed or Instagram comment events.
5. The provider resolver maps the external account to exactly one binding.
6. The provider adapter maps each valid event to `CommentReceived`.
7. The system creates or finds `CommentReplyExecution` using the unique external comment identity.
8. Duplicate claims stop without generating or publishing another reply.
9. A new execution is committed with status `received`.
10. The webhook is acknowledged immediately after durable acceptance.
11. A database-backed Comment Reply worker claims the execution and runs matching or AI generation outside the webhook request.

The Meta raw-body route is mounted before the application's global `express.json()` middleware. Verification uses the exact received bytes. The Comment Reply worker is started during process boot, not during Express application construction. It uses conditional database updates and expiring leases in the same style as the existing command and outbox workers. This avoids adding another Redis queue while preserving work across process restarts.

Every claim creates a random `leaseToken` fencing token and snapshots both profile and Agent configuration versions. Every processing write, failure, retry, rule cursor update, and ready transition requires the same token. A long AI call renews its lease periodically. A stale worker whose fenced update affects zero rows must discard its result.

Stale `processing` executions can return to `received` while under the maximum attempt count because no provider publish is allowed in that state. Recovery clears the old token before another worker claims the row. A repeated AI request may consume extra model credits after a crash, but the execution can still create only one durable publish intent. Once an execution is `ready`, the outbox exclusively owns provider publishing.

### 11.2 Eligibility and configuration resolution

The runtime skips when:

- The event is from the Page or account itself.
- Text is empty after normalization.
- The account is not bound.
- The binding is disabled.
- Permissions are not ready.
- The profile is disabled.
- The default Agent is inactive, unpublished, or deleted.
- The post override mode is `disabled`.
- The event type is unsupported.

Resolution order:

1. Channel binding.
2. Default profile and Agent.
3. Post override.
4. Override profile and its Agent, if configured and valid.
5. Effective mode.
6. Profile and Agent configuration versions.

An invalid override profile or Agent does not silently fall back to the default profile. The event fails closed with a configuration error so operators can see and fix the override.

### 11.3 Text normalization and matching

Arabic and English normalization includes:

- Unicode normalization.
- Lowercasing where applicable.
- Trimming.
- Collapsing repeated whitespace.
- Removing Arabic tatweel.
- Removing Arabic diacritics for comparison.
- Treating punctuation as separators for comparison.

The original comment text remains available to the AI generator and diagnostics.

Match behavior:

- `contains_any`: at least one normalized keyword or phrase is present.
- `contains_all`: every normalized keyword or phrase is present.
- `exact`: normalized comment equals one normalized keyword or phrase.

Phrase matching must respect normalized token boundaries where possible so a short keyword does not match inside an unrelated longer word.

The first matching rule in the stable priority order wins. No second rule runs.

### 11.4 Rule variant selection

Rule response finalization and cursor advancement occur atomically in the same fenced database transaction that creates the publish intent:

1. Resolve the effective platform-specific or shared variant set.
2. Select one stable ordered variant from the effective pool cursor.
3. Render and validate safe variables.
4. Recheck the feature flag, profile, binding, Agent lifecycle, profile config version, Agent config version, override, matched rule, and selected variant.
5. Atomically advance the effective pool cursor.
6. Save `ruleId`, `variantId`, and the rendered reply on the fenced execution.
7. Transition the execution to `ready` and create its single outbox event.

Concurrent comments must not all choose the same variant because they read the same cursor.

Rules do not call the model gateway and therefore consume no AI credits.

### 11.5 Template rendering

Allowed variables:

- `{{customer_name}}`
- `{{page_name}}`
- `{{post_name}}`
- `{{platform}}`

Unknown variables are rejected when saving a rule. Missing known values render safely:

- Optional name-dependent greeting fragments should not leave raw placeholders.
- A standalone missing value becomes an empty string.
- Whitespace and punctuation are cleaned after interpolation.

Rendered replies are validated for:

- Non-empty content.
- Provider-compatible length.
- No unresolved `{{...}}` placeholders.
- No internal Agent action markers.

### 11.6 AI fallback

AI fallback runs only when:

- Effective mode allows AI.
- No enabled rule matched.
- The resolved Agent is active, published, and not deleted.
- The Agent has a valid configured model.

The AI generator receives:

- Agent system instructions.
- Agent tone and response style.
- Active Agent knowledge retrieved through the existing RAG path.
- Platform.
- Page/account name.
- Post caption or cached name when available.
- The single incoming comment.
- A system boundary requiring one concise public reply.

It does not receive:

- Conversation history.
- Contact records.
- Conversation command capabilities.
- CRM mutation tools.
- Ownership tools.
- Workflow tools.
- Internal comment tools.

The AI generator must reject or strip Agent action markers and must return plain public reply text only.

If AI generation fails, the execution is marked failed. The system does not invent a default generic response unless a future explicit fallback response is configured.

After AI output validation, the fenced finalization transaction repeats the same lifecycle and configuration-version checks before creating `ready + outbox`. If relevant configuration changed during generation, the output is discarded and the execution returns to `received` for a bounded retry against current configuration.

### 11.7 Publishing

After a reply is rendered:

1. Persist the final reply, mark the execution `ready`, and create the outbox event in one fenced database transaction.
2. The outbox uses a deterministic idempotency key derived from the execution.
3. The outbox worker claims the event.
4. The comment dispatcher resolves the Instance and decrypts its token at dispatch time.
5. The platform adapter publishes the public reply.
6. The dispatcher stores the returned provider reply ID on the execution.
7. The outbox event becomes `succeeded`; the execution remains `ready` because OutboxEvent is the authoritative delivery state.

Provider adapters:

- Facebook adapter publishes a reply to the source Facebook comment through the Graph API.
- Instagram adapter publishes through the Instagram comment replies endpoint appropriate to the configured login flow.

The outbox payload stores IDs only. It must not contain access tokens or a full Instance record.

## 12. Idempotency, Retries, and Race Conditions

### 12.1 Incoming deduplication

The database unique constraint on `(platform, providerAccountId, externalCommentId)` is the sole deduplication source of truth. The old in-memory comment dedupe is not used by the new runtime.

### 12.2 One reply intent per comment

The execution record owns one reply intent. Rule and AI paths update the same record, so they cannot both publish.

State transitions use conditional updates. A worker may only advance from the expected current status.

The inbound worker claims `received` rows with `availableAt <= now`, changes the status to `processing`, increments `attempts`, and sets `leaseExpiresAt` plus a new fencing token. Lease recovery may retry pre-publish work. Exhausted executions become `failed` with a stable processing error.

### 12.3 Provider ambiguity

Meta public comment publishing does not provide a Value Chat-controlled idempotency key. A timeout after dispatch may mean the reply was created even when the response was not received.

Provider adapters return or throw a classified dispatch outcome:

- `before_request`: no request bytes were transmitted; retry is safe when the error is transient.
- `response_received`: Meta explicitly accepted or rejected the request; success, retry, or failure follows the HTTP response.
- `outcome_ambiguous`: transmission began but no trustworthy provider outcome was received.

Rules:

- Connection failures proven to occur before transmission may retry.
- Explicit provider rate limits may retry because the provider rejected the request.
- Explicit non-retryable provider rejections fail.
- Timeouts after transmission, malformed success responses, and worker lease loss after dispatch begins become `outcome_unknown`.
- Any unclassified exception after the adapter begins transmission defaults to `outcome_ambiguous`.
- `outcome_unknown` is not automatically retried.
- The UI must not present a normal Retry button for an ambiguous result.

This reuses the existing outbox worker's distinction between retryable failures and ambiguous dispatches.

### 12.4 Self-reply loops

Meta may emit a webhook for the Page or account reply created by Value Chat. Provider account IDs are checked before creating a new reply intent. The returned `providerReplyId` also provides an additional diagnostic reference.

### 12.5 Configuration changes during execution

An execution snapshots the resolved Agent, profile and Agent versions, rule, variant, and rendered reply before dispatch. Later edits do not mutate an already-ready reply.

Every configuration mutation increments the owning profile aggregate version. Before `ready + outbox`, the fenced transaction rechecks the feature flag, profile, binding, Agent lifecycle and version, override, rule, and variant. A mismatch returns the execution to `received` for bounded reprocessing.

### 12.6 Pause and emergency stop

Normal profile or binding pause:

- Prevents `received` or `processing` executions from becoming `ready`.
- Does not rewrite a reply that was already finalized.
- Grandfathers an outbox event already committed as `pending` or `dispatching`.

Global emergency stop:

- Stops new claims and new `ready + outbox` transactions.
- Is rechecked by the dispatcher immediately before the network boundary.
- Changes undispatched pending comment-reply outbox events to `cancelled`.
- Cannot recall an HTTP request that already crossed the network boundary.
- Leaves `dispatching` events to resolve as success, explicit failure, or `outcome_unknown`.

### 12.7 Public and private reply coexistence

Public automatic replies and the existing Facebook private-DM reply are mutually exclusive per Messenger Instance in the first version.

- Activating a public Comment Reply binding fails with a clear conflict while private DM replies are enabled.
- The UI offers an explicit `Disable Private DM and activate Public Replies` action.
- Enabling private DM replies later fails while the public binding is active.
- There is no hidden dual-response mode.

## 13. Outbox Integration

Introduce an event type such as:

```text
comment_reply.publish_requested
```

The outbox aggregate is the execution:

```text
aggregateType: comment_reply_execution
aggregateId: <execution-id>
idempotencyKey: comment-reply:<execution-id>:publish
```

The existing outbox sanitization currently has special handling for `channel_message`. Comment reply payload validation must be added explicitly rather than passing unrestricted objects.

Allowed payload shape:

```text
{
  executionId,
  providerReference: {
    provider,
    instanceId
  }
}
```

The dispatcher loads the rendered reply and provider IDs from the database. This avoids placing customer text or secrets in the outbox payload.

The execution processing state and Outbox delivery state have these responsibilities:

| Phase | Execution | Outbox |
|---|---|---|
| Durable inbound | `received` | None |
| Rule or AI work | `processing` | None |
| Pre-publish failure | `failed` | None |
| Product skip | `skipped` | None |
| Finalized reply | `ready` | Created as `pending` in the same transaction |
| Provider request | `ready` | `dispatching` |
| Provider success | `ready` plus `providerReplyId` | `succeeded` |
| Explicit delivery failure | `ready` | `failed` |
| Ambiguous delivery | `ready` | `outcome_unknown` |
| Emergency cancellation | `ready` | `cancelled` |

The existing `OutboxStatus` enum is extended with `cancelled`.

The comment dispatcher integrates with outbox lifecycle hooks:

- `ready + outbox pending` is always one transaction.
- A successful provider response stores `providerReplyId` before the worker marks the outbox succeeded.
- Stale-dispatch recovery calls a comment-reply reconciliation hook.
- If `providerReplyId` is already stored, reconciliation marks the outbox succeeded.
- If dispatch began and no provider result was durably stored, reconciliation marks the outbox `outcome_unknown`.
- Explicit failure or cancellation updates only the authoritative outbox delivery state.

The dispatcher declares that provider publishing does not support safe application-level idempotency. Ambiguous failures therefore follow `outcome_unknown` handling.

## 14. API Design

All endpoints are authenticated and tenant-scoped.

Authorization matrix:

| Operation | Required permission |
|---|---|
| Read Comment Reply workspace, rules, overrides, metrics, or executions | `agents.manage` |
| Change profile, rules, variants, overrides, or run Test Lab | `agents.manage` |
| Create, move, enable, disable, or delete a channel binding | Both `agents.manage` and `channels.manage` |
| Read the binding card inside Channel Manage | `channels.manage` |
| Meta webhook ingestion | Valid Meta signature; no user session |

Owner and admin roles currently satisfy both management permissions. Every endpoint has role-matrix tests; authentication plus tenant scope alone is not sufficient authorization.

Every configuration mutation includes `expectedConfigVersion`. A stale version returns `409 CONFIG_VERSION_CONFLICT` with the current version; the server never applies a last-write-wins update.

### 14.1 Workspace and profile

```text
GET  /api/agents/:agentId/comment-replies
PUT  /api/agents/:agentId/comment-replies
```

The GET response returns profile state, readiness, eligible bindings, rule counts, and recent summary metrics needed for the workspace shell.

The PUT endpoint changes profile-level settings with validation and a configuration version to prevent lost updates.

### 14.2 Bindings

```text
GET  /api/agents/:agentId/comment-replies/bindings
PUT  /api/agents/:agentId/comment-replies/bindings/:instanceId
DELETE /api/agents/:agentId/comment-replies/bindings/:instanceId
GET  /api/instances/:instanceId/comment-reply-binding
```

Binding an Instance that already belongs to another profile returns `409 BINDING_CONFLICT`. The first version requires the operator to unbind it explicitly before rebinding; it never moves an account silently.

The Instance-scoped GET returns only the read-only Channel Manage card payload and requires `channels.manage`.

### 14.3 Rules

```text
GET    /api/agents/:agentId/comment-replies/rules
POST   /api/agents/:agentId/comment-replies/rules
GET    /api/agents/:agentId/comment-replies/rules/:ruleId
PUT    /api/agents/:agentId/comment-replies/rules/:ruleId
DELETE /api/agents/:agentId/comment-replies/rules/:ruleId
PATCH  /api/agents/:agentId/comment-replies/rules/:ruleId/status
```

Priority changes use the normal rule update endpoint in the first version. The first version does not include drag-and-drop ordering.

### 14.4 Post overrides

```text
GET    /api/agents/:agentId/comment-replies/posts
GET    /api/agents/:agentId/comment-replies/post-overrides
PUT    /api/agents/:agentId/comment-replies/post-overrides/:instanceId/:externalPostId
DELETE /api/agents/:agentId/comment-replies/post-overrides/:instanceId/:externalPostId
```

Post Overrides fetches recent posts from Meta on initial load and explicit refresh, then merges them with saved overrides. Only saved override rows retain bounded post display metadata. Failure to refresh Meta posts must not delete or hide existing overrides.

### 14.5 Test Lab

```text
POST /api/agents/:agentId/comment-replies/test
```

Input:

- Platform.
- Sample comment.
- Optional channel.
- Optional post.
- Optional customer name.

Output:

- Eligibility result.
- Normalized text.
- Matched rule and keyword details.
- Selected preview variant.
- Rendered response.
- Route source.
- AI usage indicator.
- Validation warnings.

Preview does not advance the production round-robin cursor. It uses a deterministic preview selection and clearly labels it as a preview.

Preview creates no execution, outbox event, or provider request.

### 14.6 Metrics and failures

```text
GET /api/agents/:agentId/comment-replies/metrics
GET /api/agents/:agentId/comment-replies/executions
POST /api/agents/:agentId/comment-replies/executions/:executionId/retry
```

Execution listing is operational and bounded:

- Recent failures and `outcome_unknown` by default.
- Pagination required.
- No general social conversation browsing.

Manual retry is allowed only when the stored classified provider outcome proves the original request was rejected before creating a reply. The endpoint rejects `outcome_unknown`, successful, pending, dispatching, unclassified, and already retried executions. Authentication errors produce a Reconnect action instead of Retry.

## 15. Meta Integration

### 15.1 OAuth and permissions

The Meta connection flow must request the permissions required for:

- Facebook Page comment reading and replies, including `pages_read_engagement` and `pages_manage_engagement`.
- Instagram Professional comment replies through Facebook Login, including `instagram_basic`, `instagram_manage_comments`, and `pages_read_engagement`.
- Existing messaging behavior.
- Page webhook subscriptions.

The exact permission set must be pinned to the Meta Graph API version used by the application and verified against Meta's current Facebook Login and Instagram Professional account documentation during implementation.

Existing messaging permissions such as `pages_messaging` and `instagram_manage_messages` remain in their respective connection flows. Existing accounts will require reconnecting to grant the new comment scopes.

### 15.2 Webhook subscriptions

- Facebook Page comment events continue through the Page `feed` subscription.
- Instagram must subscribe to the supported comment webhook fields for the selected Facebook Login integration.
- App Dashboard webhook configuration and per-account subscriptions must both be validated.

### 15.3 Readiness checks

An account is not ready merely because its Instance status says connected.

Readiness checks include:

- Access token present and decryptable.
- Required scopes granted.
- Correct Page or Instagram account ID present.
- Required webhook subscription present when queryable.
- Instagram account is Professional and linked correctly for the chosen login flow.

Token and permission errors update binding health and appear in Overview.

### 15.4 Token protection prerequisite

Public Comment Replies cannot enter live mode until Meta token storage and serialization are corrected across the existing Instance APIs.

Required behavior:

- Production boot requires an explicit strong `ENCRYPTION_KEY`; the development fallback key is forbidden in production.
- A versioned token-vault service encrypts every new Meta token before persistence.
- A controlled migration encrypts existing plaintext Meta tokens.
- Internal provider adapters request decrypted credentials through the narrow token-vault boundary.
- Prisma queries serving Instance APIs use explicit safe selections.
- API responses never contain `accessToken`, encrypted token ciphertext, or token-derived secrets.
- Logging and error serialization redact authorization headers and token query parameters.

Migration verification must scan existing Meta Instances, report rows that cannot be migrated, and keep Comment Reply bindings unready until their token is protected and usable.

## 16. Agent Lifecycle and Safety

The Comment Reply Engine is subordinate to the Agent lifecycle.

New comments do not publish when:

- Agent is inactive.
- Agent is not published.
- Agent is deleted.
- Profile is disabled.
- Binding is disabled or unhealthy.

Rules do not remain active independently after their owning Agent is disabled. This avoids an operator believing the Agent is stopped while fixed replies continue publicly.

Post Agent overrides must be validated at save time and revalidated at runtime.

No Comment Reply code may import or call the Agent command executor. A test should enforce that the AI fallback response cannot cause terminal command side effects.

## 17. Error Handling

### 17.1 Configuration errors

Examples:

- No bound account.
- Agent draft or inactive.
- Invalid post override profile or Agent.
- No usable rule variants.
- AI fallback enabled without a usable model.

Behavior:

- Fail closed.
- Show actionable status in the workspace.
- Do not publish a guessed fallback.

### 17.2 Provider errors

Errors are categorized as:

- Authentication or expired token.
- Missing permission.
- Deleted post or comment.
- Rate limited.
- Content rejected.
- Network failure before dispatch.
- Ambiguous network failure after dispatch.
- Unsupported provider event.

Stored messages are sanitized and bounded. Access tokens and raw provider responses are not exposed in UI or logs.

### 17.3 AI errors

Examples:

- Model gateway unavailable.
- Knowledge retrieval unavailable.
- Empty output.
- Unsafe action markers.
- Output too long.

Behavior:

- Mark the execution failed with a stable code.
- Do not publish partial output.
- Do not fall back to a fabricated rule.

### 17.4 Test Lab errors

Preview errors are returned synchronously with detailed but sanitized explanations. They never affect production metrics.

## 18. Security and Tenant Isolation

- Every CRUD query includes `tenantId`.
- Agent, profile, Instance, rule, override, and execution relationships are checked against the authenticated tenant.
- Provider tokens remain encrypted and are decrypted only inside the provider dispatch boundary.
- Outbox payloads contain references, not tokens.
- Incoming webhook data is bounded before persistence and logging.
- Error details are sanitized through the existing redaction utilities.
- Rule templates accept only the approved variable allowlist.
- AI output is treated as untrusted text and validated before publishing.
- Meta webhook signature verification must remain mandatory.
- Public-reply APIs cannot be called through user-authenticated CRUD routes without a valid tenant context.

### 18.1 Retention and privacy

The execution ledger is intentionally short-lived:

- Successful and skipped executions retain bounded comment, commenter, post, and reply text for 7 days.
- Pre-publish failures, delivery failures, and `outcome_unknown` executions retain bounded diagnostic text for 30 days.
- A cleanup job then nulls comment text, commenter display data, post text, rendered reply, and error detail while preserving status, timestamps, route source, and stable error codes.
- Redacted execution metadata is retained for 90 days for operational metrics and deduplication, then deleted.
- Events older than the supported 7-day ingestion window are rejected before creating a reply execution.
- Tenant deletion removes all Comment Reply configuration and execution records.

Only users with `agents.manage` can access execution diagnostics. The product does not expose successful executions as browsable social conversations.

### 18.2 Deletion and relation policy

- Profiles, rules, and variants use soft deletion so historical execution references remain explainable.
- Post overrides are hard-deleted when removed or when their binding is deleted.
- Execution relations to Instance, binding, profile, Agent, rule, and variant use `onDelete: SetNull`; immutable bounded snapshots preserve operational meaning.
- The execution relation to Tenant uses `onDelete: Cascade`.
- Configuration lists exclude soft-deleted rows.

Instance deletion performs a Comment Reply preflight:

1. Disable the binding and fence active pre-publish workers.
2. Mark `received` or `processing` executions skipped with `channel_deleted`.
3. Cancel related pending outbox events.
4. Return `409 COMMENT_DELIVERY_IN_FLIGHT` while a related event is `dispatching` or `outcome_unknown`.
5. Delete the binding and Instance only after in-flight ambiguity is resolved or explicitly acknowledged through a future administrative recovery path.

Soft-deleting an Agent disables its profile and applies the same pre-publish fencing. It does not delete historical execution rows.

## 19. Observability

Structured logs include:

- `executionId`
- `tenantId`
- `instanceId`
- `agentId`
- `platform`
- `routeSource`
- `ruleId` when applicable
- status transition
- sanitized error code

Logs do not include:

- Access tokens.
- Full webhook payloads.
- Unbounded comment or reply text.
- Hidden Agent instructions or knowledge content.

Operational counters:

- Received comments.
- Skipped comments by reason.
- Rule matches.
- AI fallbacks.
- Successful publishes.
- Failed publishes by category.
- Outcome-unknown publishes.
- Rule match latency.
- AI generation latency.
- Provider publish latency.

The UI metrics initially query PostgreSQL aggregates. A dedicated analytics pipeline is unnecessary for the first version.

## 20. Testing Strategy

### 20.1 Unit tests

Rule matcher:

- Arabic diacritics and tatweel normalization.
- English case normalization.
- Whitespace and punctuation handling.
- Exact, contains-any, and contains-all modes.
- Phrase boundaries.
- Priority and stable tie-breaks.
- Disabled rules.

Variant selector:

- Shared variants.
- Facebook-specific variants.
- Instagram-specific variants.
- Shared fallback when no platform variants exist.
- Atomic round-robin under concurrency.
- Mixed Facebook and Instagram traffic advances only the effective pool cursor.

Template renderer:

- All approved variables.
- Missing values.
- Unknown variable rejection.
- Unresolved placeholder rejection.
- Output length and empty output.

Event normalizers:

- Representative Facebook Page comment payloads.
- Representative Instagram comment payloads.
- Own-account events.
- Empty and unsupported changes.
- Trusted binding-derived tenant context.

### 20.2 Service and integration tests

- Tenant cannot read or mutate another tenant's profile, binding, rule, or override.
- Missing, invalid, altered-body, missing-secret, and oversized Meta webhook signature cases are rejected before parsing or persistence.
- One provider account identity cannot be connected to two tenants.
- Ambiguous provider account lookup is rejected.
- One Instance cannot be bound to two profiles.
- Draft, inactive, or deleted Agents fail closed.
- Invalid override profile or Agent fails closed.
- Duplicate webhook delivery produces one execution.
- Concurrent duplicate delivery produces one execution.
- Webhook acknowledgement does not wait for AI generation or Meta publishing.
- A committed `received` execution survives a process restart.
- A stale pre-publish processing lease can recover without creating two publish intents.
- A stale worker cannot save output, advance a cursor, or create outbox work after losing its fencing token.
- Configuration changes during generation prevent stale output from becoming ready.
- A rule match never calls the model gateway.
- AI fallback receives knowledge but no Agent command tools.
- Rule and AI paths cannot both create an outbox event.
- Test Lab creates no execution or outbox event.
- Outbox payload contains no token or full customer text.
- Instance APIs and logs never serialize plaintext or encrypted Meta tokens.
- Provider success stores provider reply ID.
- Stale outbox recovery treats an already stored provider reply ID as succeeded.
- Ambiguous provider failure becomes `outcome_unknown`.
- Adapter errors default to ambiguous after request transmission.
- Own reply webhook does not create a loop.
- Public and private automatic replies cannot be active on the same Messenger Instance.
- Normal pause and global emergency stop follow their defined queued-work semantics.
- Instance deletion fences pre-publish work and blocks unresolved delivery ambiguity.
- Retention cleanup redacts and deletes execution data on schedule.

### 20.3 Frontend tests

- Agent card links to the correct workspace.
- Route refresh loads the Agent workspace.
- Four production tabs are present.
- Rule Editor is not a top-level tab.
- Readiness states disable activation appropriately.
- Rules validate keywords and variants.
- Platform-specific variants fall back to shared variants.
- Test Lab clearly indicates rule versus AI routing.
- Channel Manage links to the bound Agent.
- Failed delivery actions respect retry safety.
- Role-matrix authorization hides and blocks Agent configuration for unauthorized roles.
- Mobile tab and editor layouts remain usable.

### 20.4 Provider contract tests

Provider adapters use mocked Meta responses for:

- Success.
- Expired token.
- Missing permission.
- Deleted comment.
- Rate limit.
- Request timeout before a response.
- Request timeout after transmission.
- Connection failure proven before transmission.
- Malformed provider response.

Production validation uses owned test Facebook and Instagram accounts before enabling external customer accounts.

## 21. Rollout and Migration

### 21.1 Schema migration

Add the six relational models, `OutboxStatus.cancelled`, and required relations/indexes. No existing private-reply configuration is automatically migrated because it represents a private DM behavior, not a public reply rule.

Before any binding is enabled:

1. Introduce verified raw-body Meta webhook handling.
2. Add and backfill canonical provider account identity.
3. Audit duplicate provider identities and resolve them manually instead of picking a tenant.
4. Introduce production-safe token encryption and safe Instance DTOs.
5. Migrate existing Meta tokens and verify decryption.
6. Keep unresolved or unmigrated accounts in `reconnect_required`.

### 21.2 Feature availability

The initial production rollout is protected by a server-side feature flag. The flag disables both UI entry points and runtime processing.

### 21.3 Existing account reconnect

After deployment:

1. Show `Reconnect required` on Facebook and Instagram bindings missing scopes.
2. User completes Meta OAuth again.
3. Backend subscribes required webhook fields.
4. Readiness check passes.
5. User enables the engine.

The engine must not claim to be active before reconnect and readiness validation.

### 21.4 Controlled production enablement

Recommended sequence:

1. Deploy webhook signature, provider identity, and token-protection prerequisites with live public replies disabled.
2. Test Lab only.
3. One owned Facebook Page with fixed rules only.
4. One owned Instagram Professional account with fixed rules only.
5. Enable AI fallback.
6. Validate duplicate delivery, lease fencing, pause, and ambiguous failure behavior.
7. Enable selected customer tenants.
8. Remove the feature flag after stable observation.

## 22. Acceptance Criteria

The feature is complete when:

- Meta comment POST webhooks are verified from raw bytes before parsing.
- Provider account identity resolves exactly one tenant and binding.
- Meta tokens are encrypted at rest and absent from every API response and log.
- A saved Agent exposes the Comment Replies workspace.
- Facebook and Instagram accounts can be bound to one default Agent.
- The UI accurately reports permission and readiness state.
- Multiple keywords can route to one rule.
- Highest-priority match wins deterministically.
- One rule rotates through multiple reply variants atomically within separate shared, Facebook, and Instagram pools.
- Platform-specific variants override shared variants.
- Safe variables render without leaking placeholders.
- A rule match publishes without calling AI.
- No match invokes the Agent's read-only AI and active knowledge.
- AI fallback cannot execute any Agent command or CRM side effect.
- A post can disable replies or select another valid Agent.
- Duplicate webhook deliveries produce at most one reply intent.
- Stale workers are fenced from creating or changing a reply intent.
- Stale configuration cannot become a ready reply.
- Own-account replies do not create loops.
- Meta publishing is durable through the existing outbox.
- Ambiguous publish outcomes are not automatically retried.
- Public replies and private automatic DMs cannot both run for one Messenger Instance.
- Normal pause and emergency stop have tested queued-work behavior.
- Overview metrics and recent failures come from execution records.
- Test Lab uses production routing logic and never publishes.
- Existing private DM replies continue as a separate feature.
- Execution text is redacted and deleted according to the retention policy.
- Tenant isolation, core runtime paths, and provider error behavior have automated tests.

## 23. Rejected Alternatives

### 23.1 Extend privateReplies channel JSON

Rejected because ordered rules, variants, Agent ownership, post overrides, concurrency, and reporting would become an untyped nested configuration with fragile updates.

### 23.2 Reuse AgentService.processMessage

Rejected because it is conversation-oriented and can trigger commands and CRM side effects. A public comment reply requires a smaller read-only capability boundary.

### 23.3 Build a full Social Inbox

Rejected because the approved scope is automatic replies only. A Social Inbox adds comment storage, thread views, assignment, moderation, and human workflows that are not required now.

### 23.4 Publish directly in webhook processing

Rejected because AI latency and provider calls would delay webhook acknowledgement, while transient failures and restarts could lose or duplicate replies.

### 23.5 Keep in-memory deduplication

Rejected because it is not correct across restarts or multiple backend instances.

## 24. Implementation Boundary

This document defines the accepted architecture and behavior. It does not authorize implementation yet.

After the written spec is reviewed and approved, the next artifact will be a detailed implementation plan covering migrations, backend module construction, Meta integration, frontend conversion, tests, rollout, and commit boundaries.
