# Comment Reply Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship safe automatic public comment replies for Facebook and Instagram with fixed rules first, read-only Agent AI fallback, per-post profile overrides, and the approved Agent workspace.

**Architecture:** Verified Meta webhooks create durable `CommentReplyExecution` records. A fenced database worker resolves one profile, matches fixed rules or calls a read-only Agent generator, then atomically creates one existing-outbox publish intent. The React workspace configures relational profiles, bindings, rules, variants, and overrides.

**Tech Stack:** Node.js 22, Express 5, Prisma 5/PostgreSQL, Node `crypto`, Vitest/Supertest, React 19, React Router 7, Tailwind 3, existing OpenRouter model gateway and RAG service.

## Global Constraints

- Work directly on `main`; do not create a branch or worktree.
- Do not modify unrelated `logs/CHANGELOG.md` or pre-existing untracked files.
- Add no npm dependencies.
- Public and private automatic replies are mutually exclusive per Messenger Instance.
- Rule matches never call OpenRouter.
- AI fallback never imports or invokes the Agent command executor.
- One verified comment creates at most one durable publish intent.
- Use database uniqueness and fencing for correctness; do not use in-memory deduplication.
- Meta tokens and raw webhook bodies must never appear in logs or API DTOs.
- Do not enable live publishing until webhook signature, provider identity, and token-protection prerequisites pass.

---

## File Map

### Backend trust boundary

- Create `backend/src/meta/metaWebhookSecurity.js`: raw-body signature verification.
- Create `backend/src/meta/metaTokenCrypto.js`: versioned AES-256-GCM Meta token encryption.
- Create `backend/src/meta/metaInstanceDto.js`: safe Instance response projection.
- Create `backend/scripts/migrate-meta-tokens.js`: controlled plaintext token migration.
- Modify `backend/src/app.js`: mount Meta raw-body handling before global JSON parsing.
- Modify `backend/src/routes/webhooks.js`: verify and parse Meta payload.
- Modify `backend/src/routes/instances.js`: encrypt writes and return safe DTOs.
- Modify `backend/src/services/metaApi.js`: decrypt only at the provider boundary.

### Backend domain and runtime

- Modify `backend/prisma/schema.prisma`: six Comment Reply models, enums, indexes, and outbox cancellation.
- Create one Prisma migration under `backend/prisma/migrations/`.
- Create `backend/src/commentReplies/commentReplyRules.js`: pure normalization, matching, variant-pool selection, rendering.
- Create `backend/src/commentReplies/commentReplyService.js`: tenant-scoped configuration CRUD.
- Create `backend/src/commentReplies/commentReply.routes.js`: authenticated workspace APIs.
- Create `backend/src/commentReplies/commentReplyRuntime.js`: one claimed execution to one ready intent.
- Create `backend/src/commentReplies/commentReplyWorker.js`: fenced claim, renewal, and recovery.
- Create `backend/src/commentReplies/commentAiGenerator.js`: read-only Agent prompt and RAG.
- Create `backend/src/commentReplies/commentReplyDispatcher.js`: Meta public publish dispatcher.
- Create `backend/src/commentReplies/commentEventNormalizer.js`: Facebook/Instagram payload mapping.
- Create `backend/src/commentReplies/commentReplyMetrics.js`: overview and failure queries.
- Modify `backend/src/controllers/metaWebhookController.js`: delegate verified comment events.
- Modify `backend/src/events/outboxService.js`: strict comment payload sanitation.
- Modify `backend/src/events/outboxWorker.js`: cancellation and reconciliation hook.
- Modify `backend/src/worker.js`: run inbound Comment Reply worker and dispatcher.
- Modify `backend/src/server.js` and `backend/src/app.js`: inject and mount routes.

### Frontend

- Modify `frontend/src/App.jsx`: stable workspace routes.
- Modify `frontend/src/pages/agents/AgentList.jsx`: `Comment Replies` entry action.
- Create `frontend/src/pages/agents/comment-replies/CommentReplyWorkspace.jsx`: shell and tabs.
- Create `frontend/src/pages/agents/comment-replies/CommentReplyOverview.jsx`.
- Create `frontend/src/pages/agents/comment-replies/CommentReplyRules.jsx`.
- Create `frontend/src/pages/agents/comment-replies/CommentReplyRuleEditor.jsx`.
- Create `frontend/src/pages/agents/comment-replies/CommentPostOverrides.jsx`.
- Create `frontend/src/pages/agents/comment-replies/CommentReplyTestLab.jsx`.
- Create `frontend/src/pages/agents/comment-replies/useCommentReplyEngine.js`.
- Modify `frontend/src/pages/ChannelManage.jsx`: read-only binding card and private/public conflict.
- Modify `frontend/src/pages/ConnectChannel.jsx`: required Meta comment scopes.

---

### Task 1: Secure the Meta Trust Boundary

**Files:**
- Create: `backend/src/meta/metaWebhookSecurity.js`
- Create: `backend/src/meta/metaTokenCrypto.js`
- Create: `backend/src/meta/metaInstanceDto.js`
- Create: `backend/scripts/migrate-meta-tokens.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/routes/webhooks.js`
- Modify: `backend/src/routes/instances.js`
- Modify: `backend/src/services/metaApi.js`
- Test: `backend/tests/unit/meta/metaWebhookSecurity.test.js`
- Test: `backend/tests/unit/meta/metaTokenCrypto.test.js`
- Test: `backend/tests/integration/meta/instance-token-security.test.js`

**Interfaces:**
- Produces: `verifyMetaSignature({ rawBody, signature, appSecret }): boolean`
- Produces: `parseVerifiedMetaBody(req): object`
- Produces: `encryptMetaToken(token): string`
- Produces: `decryptMetaToken(value): string`
- Produces: `isEncryptedMetaToken(value): boolean`
- Produces: `toSafeInstanceDto(instance): object`
- Consumes: Node `crypto`, `META_APP_SECRET`, `ENCRYPTION_KEY`

- [ ] **Step 1: Write failing signature tests**

```js
const crypto = require('crypto');
const { describe, expect, it } = require('vitest');
const { verifyMetaSignature } = require('../../../src/meta/metaWebhookSecurity');

describe('verifyMetaSignature', () => {
  const secret = 'meta-secret';
  const body = Buffer.from('{"object":"page"}');
  const valid = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

  it('accepts the exact signed bytes', () => {
    expect(verifyMetaSignature({ rawBody: body, signature: valid, appSecret: secret })).toBe(true);
  });

  it.each([undefined, 'sha256=bad'])('rejects missing or invalid signatures', (signature) => {
    expect(verifyMetaSignature({ rawBody: body, signature, appSecret: secret })).toBe(false);
  });

  it('rejects an altered body', () => {
    expect(verifyMetaSignature({ rawBody: Buffer.from('{"object":"instagram"}'), signature: valid, appSecret: secret })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the signature test and verify failure**

Run: `cd backend && npx vitest run tests/unit/meta/metaWebhookSecurity.test.js`

Expected: FAIL because `metaWebhookSecurity` does not exist.

- [ ] **Step 3: Implement raw signature verification and pre-JSON route ordering**

```js
const crypto = require('crypto');

function verifyMetaSignature({ rawBody, signature, appSecret }) {
  if (!Buffer.isBuffer(rawBody) || !signature?.startsWith('sha256=') || !appSecret) return false;
  const expected = Buffer.from(crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex'), 'hex');
  const actual = Buffer.from(signature.slice(7), 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { verifyMetaSignature };
```

Mount `/api/webhooks/meta` with `express.raw({ type: 'application/json', limit: '1mb' })` before `express.json()`. The POST route verifies `x-hub-signature-256`, parses `req.body` only after success, and returns `401 INVALID_META_SIGNATURE` otherwise. Keep GET challenge verification available.

- [ ] **Step 4: Write and run token/DTO failing tests**

```js
it('round-trips a versioned encrypted Meta token', () => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  const ciphertext = encryptMetaToken('secret-token');
  expect(ciphertext.startsWith('meta:v1:')).toBe(true);
  expect(ciphertext).not.toContain('secret-token');
  expect(decryptMetaToken(ciphertext)).toBe('secret-token');
});

it('never serializes accessToken', () => {
  expect(toSafeInstanceDto({ id: 'i1', instanceName: 'Page', accessToken: 'secret' }))
    .toEqual({ id: 'i1', instanceName: 'Page' });
});
```

Run: `cd backend && npx vitest run tests/unit/meta tests/integration/meta/instance-token-security.test.js`

Expected: FAIL before implementation.

- [ ] **Step 5: Implement AES-256-GCM token storage and safe Instance DTOs**

Use a 32-byte base64 `ENCRYPTION_KEY`, random 12-byte IV, 16-byte auth tag, and `meta:v1:<iv>:<tag>:<ciphertext>`. Throw at production boot if the key is absent or invalid. Update every Meta Instance write to encrypt first, every Meta provider call to decrypt inside `metaApi`, and every Instance response to pass through `toSafeInstanceDto`.

- [ ] **Step 6: Add controlled migration script**

The script selects only `messenger`, `instagram`, and `whatsapp_cloud` Instances, skips `meta:v1:` values, encrypts plaintext values transactionally, prints counts only, and exits non-zero on any failed row. It never prints a token.

Run: `cd backend && node scripts/migrate-meta-tokens.js --dry-run`

Expected: prints `scanned`, `alreadyEncrypted`, and `wouldEncrypt` counts without changing data.

- [ ] **Step 7: Run trust-boundary tests**

Run: `cd backend && npx vitest run tests/unit/meta tests/integration/meta/instance-token-security.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/meta backend/scripts/migrate-meta-tokens.js backend/src/app.js backend/src/routes/webhooks.js backend/src/routes/instances.js backend/src/services/metaApi.js backend/tests/unit/meta backend/tests/integration/meta
git commit -m "fix(meta): secure webhook and token boundaries"
```

---

### Task 2: Add the Comment Reply Data Model

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260727190000_add_comment_reply_engine/migration.sql`
- Test: `backend/tests/integration/commentReplies/commentReplySchema.test.js`

**Interfaces:**
- Produces Prisma models: `CommentReplyProfile`, `CommentChannelBinding`, `CommentReplyRule`, `CommentReplyVariant`, `CommentPostOverride`, `CommentReplyExecution`
- Produces enums: `CommentReplyExecutionStatus`, `CommentReplyPlatform`
- Extends: `OutboxStatus.cancelled`

- [ ] **Step 1: Write a failing schema integration test**

```js
it('deduplicates one provider comment globally', async () => {
  const data = {
    tenantId, platform: 'facebook', providerAccountId: 'page-1',
    externalCommentId: 'comment-1', externalPostId: 'post-1',
    status: 'received', receivedAt: new Date(), availableAt: new Date()
  };
  await prisma.commentReplyExecution.create({ data });
  await expect(prisma.commentReplyExecution.create({ data })).rejects.toMatchObject({ code: 'P2002' });
});
```

- [ ] **Step 2: Add the six models with exact constraints**

Implement the fields and relation policies from the design spec. Required constraints:

```prisma
@@unique([tenantId, agentId])
@@unique([tenantId, instanceId])
@@unique([provider, externalAccountId])
@@unique([tenantId, bindingId, externalPostId])
@@unique([platform, providerAccountId, externalCommentId])
@@index([status, availableAt])
@@index([status, leaseExpiresAt])
@@index([tenantId, profileId, receivedAt(sort: Desc)])
```

Use three integer cursors on `CommentReplyRule`: shared, Facebook, and Instagram. Add nullable execution relations with `onDelete: SetNull`, immutable snapshot fields, `leaseToken`, and nullable unique `outboxEventId`.

- [ ] **Step 3: Generate and inspect migration**

Run: `cd backend && npx prisma format && npx prisma migrate dev --name add_comment_reply_engine`

Expected: migration creates six tables, indexes, foreign keys, and adds `cancelled` to `OutboxStatus`.

- [ ] **Step 4: Run schema tests**

Run: `cd backend && npx vitest run tests/integration/commentReplies/commentReplySchema.test.js`

Expected: PASS, including duplicate provider identity and duplicate comment rejection.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma backend/tests/integration/commentReplies/commentReplySchema.test.js
git commit -m "feat(comments): add reply engine data model"
```

---

### Task 3: Implement the Fixed Rules Engine

**Files:**
- Create: `backend/src/commentReplies/commentReplyRules.js`
- Test: `backend/tests/unit/commentReplies/commentReplyRules.test.js`

**Interfaces:**
- Produces: `normalizeCommentText(text): string`
- Produces: `matchCommentRule({ text, rules }): rule|null`
- Produces: `getVariantPool({ variants, platform }): { pool, cursorField }`
- Produces: `renderCommentTemplate(template, variables): string`

- [ ] **Step 1: Write failing matcher and renderer tests**

```js
it('matches Arabic regardless of diacritics and tatweel', () => {
  const rules = [{ id: 'r1', priority: 1, matchMode: 'contains_any', keywords: ['السعر'], isEnabled: true }];
  expect(matchCommentRule({ text: 'ما هو السِّــعر؟', rules })?.id).toBe('r1');
});

it('uses priority 1 before priority 2', () => {
  const rules = [
    { id: 'r2', priority: 2, matchMode: 'contains_any', keywords: ['سعر'], isEnabled: true },
    { id: 'r1', priority: 1, matchMode: 'contains_any', keywords: ['سعر'], isEnabled: true }
  ];
  expect(matchCommentRule({ text: 'سعر المنتج', rules })?.id).toBe('r1');
});

it('rejects unknown variables', () => {
  expect(() => renderCommentTemplate('Hi {{email}}', {})).toThrow(/UNKNOWN_TEMPLATE_VARIABLE/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd backend && npx vitest run tests/unit/commentReplies/commentReplyRules.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pure rules with no dependencies**

Normalize using JavaScript Unicode normalization and regular expressions. Implement `contains_any`, `contains_all`, and `exact`. Sort a copy by `priority ASC`, `createdAt ASC`, and `id ASC`. Allow only `customer_name`, `page_name`, `post_name`, and `platform`. Select platform variants first, otherwise shared variants, returning the exact cursor field.

- [ ] **Step 4: Run rules tests**

Run: `cd backend && npx vitest run tests/unit/commentReplies/commentReplyRules.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/commentReplies/commentReplyRules.js backend/tests/unit/commentReplies/commentReplyRules.test.js
git commit -m "feat(comments): add deterministic reply rules"
```

---

### Task 4: Add Tenant-Scoped Configuration APIs

**Files:**
- Create: `backend/src/commentReplies/commentReplyService.js`
- Create: `backend/src/commentReplies/commentReply.routes.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/server.js`
- Test: `backend/tests/integration/commentReplies/commentReplyApi.test.js`

**Interfaces:**
- Produces: `createCommentReplyService(prisma)`
- Produces service methods: `getWorkspace`, `updateProfile`, `bindInstance`, `unbindInstance`, `listRules`, `saveRule`, `deleteRule`, `listOverrides`, `saveOverride`, `deleteOverride`
- Consumes: `expectedConfigVersion` on every mutation

- [ ] **Step 1: Write failing API authorization/version tests**

```js
it('requires agents.manage for rule mutations', async () => {
  await request(app).post(`/api/agents/${agentId}/comment-replies/rules`)
    .set('Authorization', agentToken)
    .send({ expectedConfigVersion: 1, name: 'Price', keywords: ['price'], variants: ['Ask our store'] })
    .expect(403);
});

it('rejects stale config versions', async () => {
  const response = await ownerRequest.put(`/api/agents/${agentId}/comment-replies`)
    .send({ expectedConfigVersion: 0, isEnabled: true })
    .expect(409);
  expect(response.body.code).toBe('CONFIG_VERSION_CONFLICT');
});
```

- [ ] **Step 2: Implement the minimal service transaction boundary**

Every query includes tenant ownership. Every mutation:

```js
await prisma.$transaction(async (tx) => {
  const profile = await tx.commentReplyProfile.findFirst({
    where: { id: profileId, tenantId, deletedAt: null }
  });
  if (!profile || profile.configVersion !== expectedConfigVersion) throw configConflict(profile);
  await mutate(tx, profile);
  await tx.commentReplyProfile.update({
    where: { id: profile.id },
    data: { configVersion: { increment: 1 } }
  });
});
```

Binding requires both `agents.manage` and `channels.manage`, validates Messenger/Instagram, enforces global provider identity, and rejects active private DM replies.

- [ ] **Step 3: Implement routes and mount through dependency injection**

Use the existing `/api/agents` tenant middleware path. Add the read-only Instance binding endpoint under `/api/instances/:instanceId/comment-reply-binding`.

- [ ] **Step 4: Run API tests**

Run: `cd backend && npx vitest run tests/integration/commentReplies/commentReplyApi.test.js`

Expected: PASS for tenant isolation, role matrix, version conflicts, binding conflicts, rule validation, variants, and overrides.

- [ ] **Step 5: Commit**

```bash
git add backend/src/commentReplies/commentReplyService.js backend/src/commentReplies/commentReply.routes.js backend/src/app.js backend/src/server.js backend/tests/integration/commentReplies/commentReplyApi.test.js
git commit -m "feat(comments): add reply configuration api"
```

---

### Task 5: Add Durable Inbound Processing and Meta Publishing

**Files:**
- Create: `backend/src/commentReplies/commentEventNormalizer.js`
- Create: `backend/src/commentReplies/commentReplyRuntime.js`
- Create: `backend/src/commentReplies/commentReplyWorker.js`
- Create: `backend/src/commentReplies/commentReplyDispatcher.js`
- Modify: `backend/src/controllers/metaWebhookController.js`
- Modify: `backend/src/services/metaApi.js`
- Modify: `backend/src/events/outboxService.js`
- Modify: `backend/src/events/outboxWorker.js`
- Modify: `backend/src/worker.js`
- Test: `backend/tests/unit/commentReplies/commentEventNormalizer.test.js`
- Test: `backend/tests/integration/commentReplies/commentReplyRuntime.test.js`
- Test: `backend/tests/integration/commentReplies/commentReplyDelivery.test.js`

**Interfaces:**
- Produces: `normalizeFacebookComment(entry): ProviderCommentEvent[]`
- Produces: `normalizeInstagramComment(entry): ProviderCommentEvent[]`
- Produces: `createCommentReplyRuntime({ prisma, outboxService, clock })`
- Produces: `createCommentReplyWorker({ prisma, runtime, clock })`
- Produces: dispatcher event `comment_reply.publish_requested`
- Produces Meta methods: `replyToFacebookComment(instance, commentId, message)` and `replyToInstagramComment(instance, commentId, message)`

```js
// ProviderCommentEvent
{
  provider: 'facebook' | 'instagram',
  externalAccountId: string,
  externalCommentId: string,
  externalPostId: string,
  parentCommentId: string | null,
  text: string,
  commenterId: string | null,
  commenterName: string | null,
  postName: string | null,
  createdAt: Date,
  isSelf: boolean
}
```

- [ ] **Step 1: Write failing webhook normalization and dedupe tests**

Verify Facebook feed and Instagram comment payloads map to provider account, comment, post, commenter, timestamp, and `isSelf`. Verify duplicate webhook calls create one execution by `(platform, providerAccountId, externalCommentId)`.

- [ ] **Step 2: Implement verified event ingestion**

The controller accepts only the parsed body produced by Task 1. Resolve exactly one active binding by `(provider, externalAccountId)`, persist bounded execution input as `received`, and return without waiting for matching, AI, or Meta publishing.

- [ ] **Step 3: Write failing fencing and atomic-intent tests**

```js
it('rejects a stale worker completion', async () => {
  const first = await worker.claimNext();
  await expireAndRecover(first.id);
  const second = await worker.claimNext();
  await expect(runtime.complete(first.id, first.leaseToken)).rejects.toMatchObject({ code: 'STALE_LEASE' });
  expect(await outboxCount(first.id)).toBe(0);
  await runtime.complete(second.id, second.leaseToken);
  expect(await outboxCount(second.id)).toBe(1);
});
```

- [ ] **Step 4: Implement fenced worker and rules finalization**

Claim with a random UUID `leaseToken`; every write includes `{ id, status: 'processing', leaseToken }`. Renew during long work. Rule finalization rechecks profile/Agent versions, advances only the selected pool cursor, writes the rendered reply, sets `ready`, and creates one outbox event in one Prisma transaction.

- [ ] **Step 5: Implement strict outbox payload and dispatcher contract**

Allowed payload:

```js
{
  executionId,
  providerReference: { provider: 'facebook' | 'instagram', instanceId }
}
```

Classify adapter outcomes as `before_request`, `response_received`, or `outcome_ambiguous`. Default exceptions after transmission to ambiguous. Add `cancelled` support and stale reconciliation using stored `providerReplyId`.

- [ ] **Step 6: Implement public Meta reply adapters**

Facebook publishes to the source comment's comments edge with `message`. Instagram publishes to the source comment replies edge with `message`. Decrypt the token only inside `metaApi`, store the returned reply ID, and never log body/token data.

- [ ] **Step 7: Run runtime and delivery tests**

Run: `cd backend && npx vitest run tests/unit/commentReplies tests/integration/commentReplies/commentReplyRuntime.test.js tests/integration/commentReplies/commentReplyDelivery.test.js`

Expected: PASS for dedupe, self-skip, priority, mixed-platform rotation, fencing, one outbox intent, provider success, explicit rejection, pre-request retry, and ambiguous outcome.

- [ ] **Step 8: Commit**

```bash
git add backend/src/commentReplies backend/src/controllers/metaWebhookController.js backend/src/services/metaApi.js backend/src/events backend/src/worker.js backend/tests/unit/commentReplies backend/tests/integration/commentReplies
git commit -m "feat(comments): process and publish public replies"
```

---

### Task 6: Add Read-Only Agent AI Fallback

**Files:**
- Create: `backend/src/commentReplies/commentAiGenerator.js`
- Modify: `backend/src/commentReplies/commentReplyRuntime.js`
- Test: `backend/tests/unit/commentReplies/commentAiGenerator.test.js`
- Test: `backend/tests/integration/commentReplies/commentAiFallback.test.js`

**Interfaces:**
- Produces: `createCommentAiGenerator({ modelGateway, knowledgeService })`
- Produces: `generate({ agent, platform, pageName, postName, commentText }): Promise<string>`
- Consumes: existing `modelGateway.chat` and `knowledgeService.searchKnowledge`

- [ ] **Step 1: Write failing side-effect and RAG tests**

```js
it('uses knowledge but exposes no tools', async () => {
  await generator.generate({ agent, platform: 'instagram', pageName: 'Greens', postName: 'Citroxy', commentText: 'كم السعر؟' });
  expect(knowledgeService.searchKnowledge).toHaveBeenCalledWith('كم السعر؟', agent.id, 5);
  expect(modelGateway.chat.mock.calls[0][0].tools).toBeUndefined();
});

it('rejects command markers', async () => {
  modelGateway.chat.mockResolvedValue({ content: '[ACTION: CLOSE_CONVERSATION]' });
  await expect(generator.generate(input)).rejects.toMatchObject({ code: 'INVALID_PUBLIC_REPLY' });
});
```

- [ ] **Step 2: Implement the smallest read-only generator**

Load active knowledge, construct one system prompt from Agent instructions/tone/response style plus public-comment boundaries, and call the existing model gateway with no tools. Accept plain non-empty text only; reject action markers, unresolved variables, and provider-length violations.

- [ ] **Step 3: Wire fallback after no rule match**

Respect `rules_then_ai`, `rules_only`, and `ai_only`. Recheck profile and Agent config versions in the final fenced transaction. Configuration changes discard the output and requeue within the bounded attempt count.

- [ ] **Step 4: Run AI fallback tests**

Run: `cd backend && npx vitest run tests/unit/commentReplies/commentAiGenerator.test.js tests/integration/commentReplies/commentAiFallback.test.js`

Expected: PASS and rule-match tests prove zero model calls.

- [ ] **Step 5: Commit**

```bash
git add backend/src/commentReplies/commentAiGenerator.js backend/src/commentReplies/commentReplyRuntime.js backend/tests/unit/commentReplies/commentAiGenerator.test.js backend/tests/integration/commentReplies/commentAiFallback.test.js
git commit -m "feat(comments): add read-only agent fallback"
```

---

### Task 7: Convert the Prototype into the Agent Workspace

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/agents/AgentList.jsx`
- Create: `frontend/src/pages/agents/comment-replies/CommentReplyWorkspace.jsx`
- Create: `frontend/src/pages/agents/comment-replies/CommentReplyOverview.jsx`
- Create: `frontend/src/pages/agents/comment-replies/CommentReplyRules.jsx`
- Create: `frontend/src/pages/agents/comment-replies/CommentReplyRuleEditor.jsx`
- Create: `frontend/src/pages/agents/comment-replies/CommentPostOverrides.jsx`
- Create: `frontend/src/pages/agents/comment-replies/CommentReplyTestLab.jsx`
- Create: `frontend/src/pages/agents/comment-replies/useCommentReplyEngine.js`
- Test: `frontend/src/pages/agents/comment-replies/__tests__/CommentReplyWorkspace.test.jsx`
- Test: `frontend/src/pages/agents/comment-replies/__tests__/CommentReplyRuleEditor.test.jsx`

**Interfaces:**
- Route: `/agents/:agentId/comment-replies`
- Child routes: `rules/new`, `rules/:ruleId`
- Hook methods: `loadWorkspace`, `saveProfile`, `saveBinding`, `saveRule`, `deleteRule`, `saveOverride`, `runTest`

- [ ] **Step 1: Write failing route and workspace tests**

Verify the Agent card exposes `Comment Replies`, the route renders four tabs, Rule Editor is not a top-level tab, and draft/inactive/permission states do not claim the engine is active.

- [ ] **Step 2: Build the workspace shell from the prototype**

Reuse the current `Layout`; do not copy the prototype's logo/header or Tailwind CDN. Keep the olive/lime visual language, metrics cards, routing diagram, connected accounts, and failed-delivery table. Load real API data and use existing toast/loading patterns.

- [ ] **Step 3: Build Rules and child editor**

Support name, positive priority, match mode, multiple keywords, shared variants, Facebook variants, Instagram variants, enable state, and safe variable insertion. Submit `expectedConfigVersion` and handle `409` by reloading with a clear conflict toast.

- [ ] **Step 4: Build Post Overrides and Test Lab**

Post cards support disabled/inherit/rules+AI/rules-only/AI-only plus another active published Agent profile. Test Lab shows normalized input, selected route, matched rule, preview variant, rendered response, AI usage, and warnings without publishing.

- [ ] **Step 5: Run frontend tests and build**

Run: `cd frontend && npm test -- --run src/pages/agents/comment-replies`

Expected: PASS.

Run: `cd frontend && npm run build`

Expected: successful Vite production build.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/pages/agents/AgentList.jsx frontend/src/pages/agents/comment-replies
git commit -m "feat(comments): add agent reply workspace"
```

---

### Task 8: Channel Integration, Retention, and Production Verification

**Files:**
- Modify: `frontend/src/pages/ChannelManage.jsx`
- Modify: `frontend/src/pages/ConnectChannel.jsx`
- Modify: `backend/src/routes/instances.js`
- Create: `backend/src/commentReplies/commentReplyCleanup.js`
- Modify: `backend/src/server.js`
- Test: `backend/tests/integration/commentReplies/commentReplyLifecycle.test.js`
- Test: `frontend/src/pages/__tests__/ChannelManage.commentReplies.test.jsx`

**Interfaces:**
- Adds Meta scopes: Facebook `pages_read_engagement`, `pages_manage_engagement`; Instagram `instagram_basic`, `instagram_manage_comments`, `pages_read_engagement`
- Produces: `runCommentReplyCleanup({ prisma, now }): Promise<{ redacted, deleted }>`

- [ ] **Step 1: Add reconnect readiness and Channel Manage card**

Show bound Agent, engine state, permission state, active rules, and `Manage in Agent`. Keep Private DM Replies separate. Enabling either mode while the other is active returns and displays the explicit conflict.

- [ ] **Step 2: Add scopes and subscriptions**

Preserve existing message permissions. Add comment permissions to the correct Facebook/Instagram connect flow and subscribe Instagram comment webhook fields. Mark existing bindings `reconnect_required` until scope checks pass.

- [ ] **Step 3: Implement retention and deletion preflight**

Cleanup rules:

```js
const SUCCESS_TEXT_DAYS = 7;
const FAILURE_TEXT_DAYS = 30;
const EXECUTION_RETENTION_DAYS = 90;
```

Redact text/name/reply/error detail at the correct cutoff and delete metadata after 90 days. Instance deletion disables binding, fences pre-publish work, cancels pending outbox work, and returns `409 COMMENT_DELIVERY_IN_FLIGHT` for dispatching or ambiguous work.

- [ ] **Step 4: Run lifecycle and UI tests**

Run: `cd backend && npx vitest run tests/integration/commentReplies`

Expected: PASS.

Run: `cd frontend && npm test -- --run src/pages/__tests__/ChannelManage.commentReplies.test.jsx`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run: `cd backend && npm test`

Expected: all backend tests pass.

Run: `cd frontend && npm test && npm run build`

Expected: all frontend tests pass and build succeeds.

- [ ] **Step 6: Production smoke sequence**

1. Deploy with live flag off.
2. Run `node scripts/migrate-meta-tokens.js --dry-run`.
3. Run the token migration without `--dry-run`.
4. Reconnect one owned Facebook Page and one owned Instagram Professional account.
5. Test fixed rule reply on each platform.
6. Test unmatched comment AI fallback.
7. Deliver the same webhook fixture twice and verify one reply execution/outbox event.
8. Pause the profile and verify new comments do not become ready.
9. Restore the flag only after failures and `outcome_unknown` are zero for the owned accounts.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ChannelManage.jsx frontend/src/pages/ConnectChannel.jsx frontend/src/pages/__tests__ backend/src/routes/instances.js backend/src/commentReplies/commentReplyCleanup.js backend/src/server.js backend/tests/integration/commentReplies/commentReplyLifecycle.test.js
git commit -m "feat(comments): finish channel rollout controls"
```

---

## Final Review Gate

- [ ] Confirm `git diff --check` is clean.
- [ ] Confirm only intended files are staged or committed.
- [ ] Confirm `logs/CHANGELOG.md` and pre-existing untracked files were not modified.
- [ ] Confirm backend full test suite passes.
- [ ] Confirm frontend full test suite and production build pass.
- [ ] Confirm no API response contains `accessToken`.
- [ ] Confirm invalid Meta signatures create no database records.
- [ ] Confirm one duplicated comment produces one publish intent.
- [ ] Confirm a fixed rule produces zero OpenRouter calls.
- [ ] Confirm AI output cannot execute Agent commands.
- [ ] Confirm public/private automatic reply conflict is enforced.
- [ ] Confirm live feature flag remains off until owned-account smoke tests pass.
