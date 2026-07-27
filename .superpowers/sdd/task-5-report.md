# Task 5 Report: Durable Comment Processing and Public Replies

## Summary

Implemented durable fixed-rule public comment replies for Facebook and Instagram.

- Verified Meta webhook bodies are normalized into bounded canonical events.
- Provider identity resolves the binding and tenant; webhook body tenant fields are ignored.
- Database uniqueness provides inbound deduplication.
- Database workers claim executions with expiring UUID lease tokens.
- Every processing write is fenced by `status = processing` and `leaseToken`.
- Eligibility checks cover self comments, stale events, missing text, disabled/unready bindings, disabled profiles, inactive Agents, and post overrides.
- Rule priority, stable ordering, platform-specific variant preference, and per-pool rotation use `commentReplyRules.js`.
- Rule cursor advancement, execution finalization, and one strict outbox intent share one transaction.
- Comment outbox payloads accept exactly:

```json
{
  "executionId": "<id>",
  "providerReference": {
    "provider": "facebook|instagram",
    "instanceId": "<id>"
  }
}
```

- The dispatcher reloads the tenant-scoped execution and Instance, while Meta token decryption remains inside `metaApi`.
- Facebook publishes to `/{comment-id}/comments`; Instagram publishes to `/{comment-id}/replies`.
- Delivery distinguishes pre-request, response-received, and ambiguous outcomes.
- Provider reply IDs are durable before outbox success; stale dispatches reconcile from the stored ID.
- Root `npm start` reaches `backend/src/server.js`, which now starts the reusable comment execution and comment outbox loop by default without Redis.
- The separate worker process reuses the same comment worker and dispatcher composition.
- No AI, Agent command, conversation, contact, or CRM runtime is invoked by this flow.

## Changed Files

### Runtime and delivery

- `backend/src/commentReplies/commentEventNormalizer.js`
- `backend/src/commentReplies/commentReplyRuntime.js`
- `backend/src/commentReplies/commentReplyWorker.js`
- `backend/src/commentReplies/commentReplyDispatcher.js`
- `backend/src/commentReplies/commentReplyBoot.js`
- `backend/src/events/outboxService.js`
- `backend/src/events/outboxWorker.js`
- `backend/src/services/metaApi.js`

### Webhook and process boot

- `backend/src/controllers/metaWebhookController.js`
- `backend/src/routes/webhooks.js`
- `backend/src/server.js`
- `backend/src/worker.js`

### Tests

- `backend/tests/unit/commentReplies/commentEventNormalizer.test.js`
- `backend/tests/unit/commentReplies/commentReplyBoot.test.js`
- `backend/tests/integration/commentReplies/commentReplyRuntime.test.js`
- `backend/tests/integration/commentReplies/commentReplyDelivery.test.js`
- `backend/tests/integration/meta/meta-webhook-route.test.js`

No dependency or Prisma schema change was required.

## Verification

- Focused comment normalizer, rules, runtime, delivery, boot, and verified webhook suites: passing.
- Existing Comment Reply configuration API and Meta webhook/security/logging suites: passing.
- Existing worker runtime test: passing.
- JavaScript syntax checks for all changed backend runtime files: passing.
- `npx prisma validate`: passing.
- `git diff --check`: passing.

The existing PostgreSQL-backed outbox integration cases could not run because the configured local test database at `localhost:5434` is unavailable. Task 5 runtime, dedupe, transaction, fencing, delivery, and reconciliation behavior is covered with focused Prisma transaction mocks as requested.

## Self-Review

- **Tenant isolation:** Binding identity is globally resolved first; execution, override, rule, Instance, and delivery queries all reapply the derived tenant.
- **Duplicate delivery:** The execution unique key is the durable inbound gate; the execution has one deterministic outbox idempotency key.
- **Stale leases:** Processing completion, skips, failures, requeues, cursor advancement, and ready transition are fenced. Exhausted received and stale processing work becomes failed.
- **Crash windows:** Pre-publish crashes recover through the execution lease. Post-finalization crashes leave a pending outbox event. Dispatch crashes reconcile to succeeded only when `providerReplyId` is durable; otherwise they become `outcome_unknown`.
- **Secret leakage:** Outbox validation rejects extra text/token fields. Public adapters do not log provider bodies, tokens, or reply text. Provider errors are converted to bounded generic errors.
- **Production boot:** Root and backend start scripts reach `node src/server.js`; the server starts both comment execution and matching comment outbox processing. Multiple processes remain safe through database claims and conditional state transitions.

## Residual Risks

- Live Meta contract behavior, permissions, and owned-account smoke tests require configured Facebook and Instagram accounts and are not executable locally.
- PostgreSQL-backed outbox regression tests should be rerun when the local test database is available.
- Network failures are treated as ambiguous unless the client explicitly proves no request transmission. This is intentionally conservative to prevent duplicate public replies.
