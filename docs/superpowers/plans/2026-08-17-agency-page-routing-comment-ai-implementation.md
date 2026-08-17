# Agency Page Routing and Comment AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Make each connected Facebook/Instagram account route inbox messages and comments through its explicitly assigned Primary Agent, then add safe instruction-driven comment AI with durable DM-first/public-second delivery.

**Architecture:** `Instance.primaryAgentId` becomes the canonical account owner. Messenger/Instagram conversations gain `instanceId` identity. An atomic routing service synchronizes the account owner with its Comment Reply Profile binding. Comment classification uses a read-only AI decision service and writes child `CommentReplyDelivery` records; provider calls remain in the durable outbox.

**Tech Stack:** Node.js, Express, Prisma/PostgreSQL, Vitest, React, Vite, Meta Graph API adapters.

## Global Constraints

- Work only on `feature/agency-page-comment-ai` in the isolated worktree.
- Preserve tenant isolation on every query and mutation.
- Never expose `Instance.accessToken` in an API response.
- Preserve explicit conversation owners during account reassignment.
- No comment AI tools, CRM commands, workflows, ownership commands, or arbitrary HTTP.
- Never enqueue the public “DM sent” reply before confirmed private-delivery success.
- Add every behavior test-first and observe RED before production changes.
- Commit after each coherent green slice.

---

## Task 1: Add account ownership and conversation identity schema

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260817000000_add_page_agent_routing/migration.sql`
- Modify: `backend/tests/integration/commentReplies/commentReplySchema.test.js`
- Create: `backend/tests/unit/agents/pageAgentRoutingService.test.js`

**Steps:**

1. Add failing schema assertions for `Instance.primaryAgentId`, `Conversation.instanceId`, account-scoped uniqueness, and relations.
2. Run the schema test and confirm it fails on the missing fields.
3. Add nullable schema relations and the additive migration.
4. In migration SQL, backfill only conversations whose related messages resolve to exactly one Instance; leave ambiguous rows null and replace the old unique constraint with a nullable account-scoped unique index.
5. Run `npx prisma validate`, `npx prisma generate`, schema tests, and backend unit tests.
6. Commit: `feat: add account-scoped agent routing schema`.

## Task 2: Implement atomic Primary Agent assignment

**Files:**

- Create: `backend/src/agents/pageAgentRoutingService.js`
- Modify: `backend/src/routes/instances.js`
- Modify: `backend/src/meta/metaInstanceDto.js`
- Modify: `backend/tests/unit/agents/pageAgentRoutingService.test.js`
- Create: `backend/tests/integration/meta/instance-agent-routing.test.js`

**Interfaces:**

```js
createPageAgentRoutingService({ prisma }).assignPrimaryAgent({
  tenantId,
  instanceId,
  primaryAgentId // string | null
})
```

```http
PUT /api/instances/:id/primary-agent
{ "primaryAgentId": "uuid-or-null" }
```

**Steps:**

1. Write failing unit tests for same-tenant validation, active/published Agent validation, unassign, profile creation, binding move, version increment, and transaction atomicity.
2. Implement the minimal service with one Prisma transaction.
3. Write failing API tests for permissions, tenant scoping, safe response, assign, and unassign.
4. Add the route and return a safe Instance DTO with selected Agent metadata.
5. Include Primary Agent summary in instance list/detail queries without access tokens.
6. Run targeted tests and all backend units.
7. Commit: `feat: assign primary agent per connected account`.

## Task 3: Route new conversations by Instance

**Files:**

- Modify: `backend/src/services/chat.service.js`
- Modify: `backend/src/controllers/metaWebhookController.js`
- Modify: `backend/src/agents/agent.service.js`
- Modify: `backend/tests/integration/meta/meta-webhook-route.test.js`
- Create: `backend/tests/unit/agents/instanceAgentResolution.test.js`

**Interfaces:**

```js
chatService.upsertConversation(tenantId, contactNumber, {
  instanceId,
  channelType,
  ...messageData
})
```

**Steps:**

1. Write failing tests showing the same external user on two Instances creates two conversations.
2. Update conversation upsert identity to include `instanceId`; require it for Messenger/Instagram ingestion and retain a guarded legacy path for other channels.
3. Pass `instance.id` from the verified Meta webhook before message creation.
4. Write failing AgentService tests showing an unowned conversation selects only `conversation.instance.primaryAgent`, an invalid/unassigned account returns no Agent, and an explicit existing owner is preserved.
5. Replace tenant-wide default selection with Instance-scoped resolution through the ownership gateway.
6. Include Instance metadata directly in conversation reads instead of inferring only from the last message.
7. Run targeted webhook/Agent tests and all backend units.
8. Commit: `feat: isolate conversations by connected account`.

## Task 4: Add Channels routing UI

**Files:**

- Modify: `frontend/src/pages/ChannelManage.jsx`
- Create: `frontend/src/pages/__tests__/ChannelManage.primaryAgent.test.jsx`

**Steps:**

1. Write a failing UI test for loading active published Agents, showing the current owner, assigning, unassigning, and displaying automation-blocked state.
2. Add a `Primary AI Agent` card for Messenger/Instagram channel management.
3. Call the atomic Primary Agent endpoint; never unbind/rebind through multiple browser requests.
4. Show comment-permission readiness and link to the selected Agent’s Comment Replies workspace.
5. Run the targeted UI test, full frontend tests, and frontend build.
6. Commit: `feat: manage page agent routing in channels`.

## Task 5: Add Comment AI and delivery schema

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260817010000_add_comment_ai_deliveries/migration.sql`
- Modify: `backend/tests/integration/commentReplies/commentReplySchema.test.js`

**Steps:**

1. Add failing schema assertions for profile AI fields and `CommentReplyDelivery`.
2. Add `aiMode`, separate public/private instructions, private enable flag, and DM dependency flag; retain `aiFallbackEnabled` as compatibility projection.
3. Add delivery kind/status enums and a child delivery model with unique execution/kind and durable provider/outbox state.
4. Migrate `aiFallbackEnabled` values into `aiMode`.
5. Validate/generate Prisma and run schema tests.
6. Commit: `feat: add comment AI delivery state`.

## Task 6: Build a read-only structured Comment AI decision service

**Files:**

- Create: `backend/src/commentReplies/commentAiDecisionService.js`
- Create: `backend/tests/unit/commentReplies/commentAiDecisionService.test.js`
- Modify: `backend/src/commentReplies/commentReplyService.js`
- Modify: `backend/src/commentReplies/commentReply.routes.js`
- Modify: `backend/tests/integration/commentReplies/commentReplyApi.test.js`

**Interfaces:**

```js
createCommentAiDecisionService({ modelGateway, knowledgeService, clock }).decide({
  execution,
  agent,
  profile,
  binding,
  post
})
// { action, publicReply, privateReply, reasonCode }
```

**Steps:**

1. Write failing tests for all four actions, strict schema validation, platform limits, unsafe markers, missing required texts, and invalid model output failing closed to `human_review`.
2. Implement one model call with no tools and Agent-scoped knowledge retrieval.
3. Add a side-effect-free preview endpoint used by Test Lab.
4. Verify preview creates no executions, deliveries, outbox events, or ownership changes.
5. Run targeted and all unit tests.
6. Commit: `feat: classify comments with read-only AI`.

## Task 7: Integrate AI modes into the comment runtime

**Files:**

- Modify: `backend/src/commentReplies/commentReplyRuntime.js`
- Modify: `backend/src/commentReplies/commentReplyWorker.js`
- Modify: `backend/tests/integration/commentReplies/commentReplyRuntime.test.js`

**Steps:**

1. Add failing tests for `rules_only`, `rules_then_ai`, `ai_only`, `skip`, `human_review`, `reply_only`, and `reply_and_dm`.
2. Fail closed when `Instance.primaryAgentId`, binding profile Agent, and snapshotted Agent disagree.
3. Snapshot Agent/profile/config versions and both rendered texts before any provider delivery.
4. Create one public delivery for `reply_only`; one private delivery for `reply_and_dm`; create no delivery for skip/review.
5. Record human-review Activity Log without publishing.
6. Run targeted runtime tests and all units.
7. Commit: `feat: execute comment AI decisions safely`.

## Task 8: Deliver private first and public second

**Files:**

- Modify: `backend/src/commentReplies/commentReplyDispatcher.js`
- Modify: `backend/src/commentReplies/commentReplyBoot.js`
- Modify: `backend/src/events/outboxService.js`
- Modify: `backend/src/services/metaApi.js`
- Modify: `backend/tests/integration/commentReplies/commentReplyDelivery.test.js`
- Modify: `backend/tests/integration/events/outbox.test.js`

**Steps:**

1. Add failing tests for private-only dispatch, public-only dispatch, dependent public creation after private success, public retry without duplicate private call, permanent private failure, and outcome unknown.
2. Add provider adapters/capability checks for Facebook and Instagram private replies using source comment IDs.
3. Dispatch by child delivery kind, not the legacy execution-wide fields.
4. In the same transaction that persists private success, create-or-get public delivery/outbox when required.
5. Keep separate idempotency keys for private and public side effects.
6. Run delivery/outbox tests and all backend units.
7. Commit: `feat: deliver comment dm before public reply`.

## Task 9: Add Comment AI controls, Test Lab, and activity states

**Files:**

- Modify: `frontend/src/pages/agents/comment-replies/CommentReplyWorkspace.jsx`
- Modify: `frontend/src/pages/agents/comment-replies/__tests__/CommentReplyWorkspace.test.jsx`
- Modify: `backend/src/commentReplies/commentReplyService.js`
- Modify: `backend/src/commentReplies/commentReply.routes.js`
- Modify: `backend/tests/integration/commentReplies/commentReplyApi.test.js`

**Steps:**

1. Write failing UI/API tests for AI mode, instructions, private enable, DM dependency, preview result, and delivery state list.
2. Add Comment AI controls and persist them through the existing optimistic config version.
3. Replace local fixed-rule-only Test Lab logic with the side-effect-free server preview.
4. Display skip/review/private/public/retry states with clear permission blockers.
5. Run targeted/full frontend tests and build.
6. Commit: `feat: configure and preview comment AI`.

## Task 10: Full verification and handoff

**Files:**

- Modify only if verification exposes defects, always test-first.

**Steps:**

1. Run Prisma validation and generation.
2. Start `backend/docker-compose.test.yml` if Docker is available, apply migrations, and run backend integration tests.
3. Run all backend units, frontend tests with one worker, and frontend production build.
4. Inspect `git diff --check`, migration SQL, tenant filters, token redaction, and outbox idempotency.
5. Confirm main worktree’s user-owned `logs/CHANGELOG.md` and untracked historical plan remain untouched.
6. Use `verification-before-completion`, then `finishing-a-development-branch` and present merge options.

