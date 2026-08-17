# Agency Page Agent Routing and Comment AI Design

**Status:** Design approved; engineering review complete; ready for implementation planning
**Date:** 2026-08-17  
**Owner:** Agents Architecture

## 1. Summary

ValueChat will support an agency operating multiple client brands inside one tenant. Each connected Facebook Page or Instagram Professional account will have one Primary Agent and an optional allowlist of Specialist Agents. Incoming private messages and public comments must always resolve through the connected account before an Agent is selected, so one client's instructions or knowledge can never be used for another client's audience.

The existing Comment Reply Engine will gain read-only AI decisions and a reliable two-stage delivery flow:

1. Generate a private message and public reply from the page Agent's approved instructions and knowledge.
2. Send the private reply first.
3. Publish the public reply only after the private reply is confirmed by Meta.
4. Retry each delivery independently without sending the private message twice.

This design extends and, where the decisions conflict, supersedes `2026-07-27-comment-reply-engine-design.md`. In particular, private replies are now in scope.

## 2. Current-System Findings

### 2.1 Comment routing is already account-scoped

`CommentChannelBinding` already maps one connected `Instance` to one `CommentReplyProfile`, and that profile belongs to one Agent. The unique `(tenantId, instanceId)` constraint correctly prevents two Agents from replying to the same connected account.

However, adding `Instance.primaryAgentId` without reconciling this existing profile link would create two competing ownership sources: inbox messages could use one Agent while comments use another. `Instance.primaryAgentId` must become the canonical page-level owner, while the binding retains provider readiness and points to the Primary Agent's comment profile as a synchronized operational projection.

### 2.2 Inbox Agent routing is tenant-wide

`AgentService.assignDefaultAgent` currently selects the highest-priority active and published Agent across the tenant. It does not select by Facebook Page or Instagram account.

That behavior is unsafe for an agency tenant because a message to Greens can be assigned to the NASA or Meylor Agent.

### 2.3 Conversation identity is not account-scoped

`Conversation` does not contain `instanceId`. Its current unique identity is `(tenantId, contactNumber, channelType)`. The same external user contacting two Facebook Pages or two Instagram accounts inside one agency tenant can therefore collide into one conversation.

`ChatMessage` already has `instanceId`, so the provider account is available at ingestion time and can be promoted to the conversation identity.

### 2.4 AI fallback is stored but not executed

`CommentReplyProfile.aiFallbackEnabled` exists and the profile API can update it, but the frontend exposes no AI controls and `commentReplyRuntime` returns `no_rule_match` when deterministic rules do not match. A read-only comment AI generator is not implemented.

### 2.5 One execution cannot represent two deliveries safely

`CommentReplyExecution` currently stores one rendered reply, one provider reply ID, and one outbox event. The approved flow has two independently retryable side effects: private DM and public comment. Reusing the single delivery state would allow duplicate DMs or incorrectly mark a partially completed execution as complete.

## 3. Product Decisions

- One agency tenant may contain many client brands and connected accounts.
- Every connected Facebook or Instagram `Instance` has at most one Primary Agent. An Instance may remain unassigned during setup, but inbox AI and Comment AI cannot be enabled until it has one valid Primary Agent.
- `Instance.primaryAgentId` is the canonical page-level Agent for both inbox and comment routing.
- Page reassignment updates the Instance and its Comment Reply binding atomically; the two routes cannot drift.
- Facebook and Instagram accounts for the same brand may share the same Primary Agent.
- Reusing one Agent across multiple Instances is always an explicit agency-admin action. The platform never infers that two Pages belong to the same brand and never shares knowledge implicitly.
- A Primary Agent may hand off only to explicitly allowed Specialist Agents using the existing assignment allowlist.
- The Agent attached to the connected account owns comment rules, comment AI instructions, and knowledge retrieval.
- Comment behavior is instruction-driven. The user may instruct the AI to reply, send a DM, request human review, or skip particular categories of comments.
- Platform safety rules override user-authored instructions.
- The default delivery order is private message first, then public reply after confirmed success.
- A public reply must never claim that a private message was sent unless the corresponding private delivery succeeded.
- A reply to the private message enters the normal inbox conversation and is owned by the account's Primary Agent.
- Comment AI is read-only: it cannot execute Agent commands, change CRM data, change ownership, trigger workflows, or call arbitrary tools.

## 4. Goals

### 4.1 Agency routing

- Deterministically route each private conversation by the connected Page/account.
- Prevent cross-client knowledge, prompt, and ownership leakage.
- Allow one Primary Agent and multiple approved Specialists per connected account.
- Preserve existing conversation ownership after a conversation has been explicitly handed off.

### 4.2 Comment AI

- Add `Rules only`, `Rules then AI`, and `AI only` modes.
- Add dedicated public-comment and private-message instructions.
- Use the selected Agent's base identity, safety rules, model, and active knowledge.
- Produce one validated structured decision per eligible comment.
- Support `skip`, `reply_only`, `reply_and_dm`, and `human_review` decisions.

### 4.3 Reliable delivery

- Make duplicate Meta webhooks idempotent.
- Send at most one private reply and at most one public reply per source comment.
- Retry a failed public reply without repeating a successful private reply.
- Do not enqueue a public reply when its required private reply failed permanently.
- Keep an operational audit trail for decisions, attempts, provider IDs, and errors.

## 5. Non-Goals

The first release will not:

- Build a general social-media moderation inbox.
- Support TikTok, YouTube, LinkedIn, or Snapchat comments.
- Let public-comment AI execute Agent commands or external tools.
- Round-robin private conversations across multiple Agents.
- Automatically change ad campaigns or budgets.
- Send follow-up private messages before the commenter responds.
- Backfill or automatically reply to historical comments.
- Share knowledge sources between Agents implicitly.

## 6. Architecture

### 6.1 Connected-account ownership

Add nullable `primaryAgentId` to `Instance` as the source of truth for new private-conversation ownership. The selected Agent must belong to the same tenant and be active, published, and not deleted before automatic processing is enabled. An unassigned Instance remains connected and visible but cannot run inbox or comment AI.

The same Primary Agent also owns the Instance's default Comment Reply Profile. `CommentChannelBinding.profileId` remains for the current runtime and relational graph, but assignment and reassignment services must synchronize it to the profile belonging to `Instance.primaryAgentId` in the same transaction. The runtime treats a mismatch as a configuration error and publishes nothing. A future explicit comment-Agent override is outside this release; per-post profile overrides remain supported.

Expose one atomic page-assignment operation rather than requiring the UI to unbind one Agent and bind another. The operation validates the tenant and Agent state, updates `Instance.primaryAgentId`, creates or resolves the Agent's Comment Reply Profile, moves the binding, and increments the affected configuration versions together.

The existing `AgentAction` assignment configuration remains the source of truth for approved Specialist handoffs. No second Specialist mapping table is required.

### 6.2 Conversation identity

Add nullable `instanceId` to `Conversation`, backfill it from the earliest or most authoritative related `ChatMessage.instanceId`, then make it required for Messenger and Instagram conversations created after deployment.

Replace the existing uniqueness constraint with account-scoped identity:

```text
(tenantId, instanceId, contactNumber, channelType)
```

Legacy WhatsApp and incomplete historical rows require an explicit migration path. The application must not guess an Instance when multiple candidates exist. Ambiguous historical conversations remain read-only legacy containers for their existing messages and are excluded from automatic Agent routing. A new Messenger or Instagram message with a resolved Instance creates or loads the new account-scoped conversation instead of appending to an ambiguous legacy row.

### 6.3 Inbox Agent resolution

For a new inbound message:

1. Resolve the canonical `Instance` from the webhook provider account ID.
2. Create or load the `Conversation` using the account-scoped identity.
3. If the conversation already has a valid explicit owner, preserve it.
4. Otherwise resolve `Instance.primaryAgentId`.
5. Verify tenant, active, published, and deletion constraints.
6. Assign through `conversationOwnershipService`; do not update ownership directly.
7. If no usable Primary Agent exists, keep the message visible, disable automatic AI for that turn, and expose a clear routing error.

### 6.4 Comment configuration

Extend `CommentReplyProfile` with explicit fields rather than an opaque JSON blob:

- `aiMode`: `rules_only | rules_then_ai | ai_only`
- `commentAiInstructions`: nullable text
- `privateReplyEnabled`: boolean
- `privateReplyInstructions`: nullable text
- `publicAfterPrivateSuccess`: boolean, default `true`

Migrate `aiFallbackEnabled=true` to `aiMode=rules_then_ai` and `false` to `rules_only`. Retain the old column for one compatibility release as a write-through projection only; the runtime must read `aiMode` exclusively. Remove the deprecated column in the next schema cleanup after all deployed application versions understand `aiMode`.

### 6.5 Comment AI generator

Create a read-only generator that receives:

- Platform and connected-account identity.
- Comment text and safe post metadata.
- Agent identity, base instructions, and active knowledge retrieval.
- Comment-specific instructions.
- Private-message instructions when enabled.
- Current date and platform limits.

It returns schema-validated data:

```json
{
  "action": "skip | reply_only | reply_and_dm | human_review",
  "publicReply": "string or null",
  "privateReply": "string or null",
  "reasonCode": "short_machine_readable_code"
}
```

The generator has no command executor, workflow tools, CRM tools, ownership tools, or arbitrary HTTP access. Invalid or unsafe output fails closed to `human_review` or `skip`; it is never published as raw model text.

`human_review` is a terminal no-publish decision in this release. It appears in Activity Log with the proposed context and reason so an operator can respond manually in the normal Meta inbox. Building an approval queue that can resume the same execution is a separate feature.

### 6.6 Delivery state machine

Add `CommentReplyDelivery` as a child of `CommentReplyExecution`. Each delivery contains:

- `kind`: `private | public`
- `status`: durable delivery status
- `renderedText`
- `providerMessageId`
- `idempotencyKey`
- `outboxEventId`
- `attempts`, lease, available time, completion time, and error fields

Required idempotency identities:

```text
private: tenant + platform + providerAccount + externalComment + private
public:  tenant + platform + providerAccount + externalComment + public
```

State transitions:

```text
received
  -> classified
  -> skipped | human_review
  -> private_pending -> private_succeeded -> public_pending -> completed
  -> public_pending -> completed                    (reply_only)
  -> private_failed                                (no public enqueue)
  -> public_failed                                 (retry public only)
```

The durable outbox remains responsible for provider calls, leases, retries, and unknown outcomes.

When a private delivery succeeds, the worker must mark it completed and create-or-get the dependent public delivery and outbox event in one database transaction. This closes the crash gap where Meta accepted the DM but the process stopped before the public job was created. Public delivery retries read the persisted private success and never call the private adapter again.

The AI decision, selected Agent/profile IDs, configuration versions, and both rendered texts are snapshotted before delivery. Reassigning a Page after classification affects new comments only; an already classified execution finishes with its snapshot and cannot switch brand identity mid-flight.

Legacy single-delivery fields on `CommentReplyExecution` remain readable during one compatibility release. New two-stage executions write `CommentReplyDelivery` records exclusively; the runtime must not write both representations for the same side effect.

### 6.7 Provider adapters

Provider-specific behavior stays behind Meta adapters:

- Instagram private replies use the source comment ID and follow Meta's one-private-reply and time-window constraints.
- Facebook private replies use the supported Page private-reply endpoint and are enabled only when permissions and the post/comment type are eligible.
- Organic, ad-post, Live, nested-reply, and other provider surfaces are checked through an explicit capability matrix. Ad comments that require additional scopes such as ads access fail closed or downgrade only when the configured instructions explicitly allow a public-only response.
- Public replies use the existing comment publishing adapter.
- An unsupported or expired private-reply window produces a typed non-retryable error.

## 7. Safety and Isolation

The runtime enforces these rules regardless of custom instructions:

- Skip comments created by the connected Page/account itself.
- Deduplicate repeated webhook deliveries.
- Never query knowledge belonging to a different Agent or tenant.
- Never expose internal instructions, retrieved source text, credentials, or customer records.
- Never execute commands from public comments.
- Do not publish a public "sent you a DM" message until the private delivery succeeds.
- Respect provider opt-out, blocked-user, deleted-comment, hidden-comment, and eligibility responses.
- Apply platform text limits before enqueueing.
- For regulated or health-related brands, tenant instructions may be stricter, but cannot weaken platform-level medical, privacy, or deceptive-claim safeguards.

## 8. User Experience

### 8.1 Channels and Routing

Add a section inside each Agent that shows eligible Facebook and Instagram Instances with:

- Client/page name and platform.
- Current Primary Agent.
- Assign/unassign control.
- Automation-blocked state while unassigned.
- Permission and reconnect state.
- Approved Specialist Agents inherited from assignment capabilities.

Reassignment affects new unowned conversations. It must not silently steal open conversations from their current Agent or human owner.

The page-assignment screen calls the atomic assignment operation. It must never implement reassignment as separate unbind and bind requests, which would create a routing gap or leave inbox and comment ownership inconsistent.

### 8.2 Comment AI

Add a `Comment AI` section to the existing Comment Replies workspace:

- Enable/disable control.
- Mode selector.
- Public comment instructions.
- Private message enable/disable control.
- Private message instructions.
- `Publish public reply only after DM succeeds`, enabled by default.
- Clear permission readiness and reconnect-required warnings.

### 8.3 Test Lab

The Test Lab accepts platform, sample post context, and sample comment text. It displays:

- Selected Agent and connected account.
- Rule match or AI route.
- Decision action and reason.
- Proposed private and public text.
- Safety or permission blockers.

Test Lab never publishes, creates delivery outbox events, or mutates conversation ownership.

### 8.4 Activity Log

Display the aggregate execution and both delivery states separately. Operators must be able to distinguish:

- AI skipped.
- Human review required.
- A provider permalink or equivalent navigation context for manual handling.
- Private reply pending/sent/failed.
- Public reply pending/sent/failed.
- Retry scheduled.
- Permission or eligibility failure.

## 9. Failure Handling

- Duplicate webhook: return the existing execution and delivery records.
- AI timeout or invalid schema: retry within a bounded policy, then `human_review` without publishing.
- Private reply transient failure: retry the private delivery; do not create public delivery yet.
- Private reply permanent failure: mark execution failed or review-required; do not publish the dependent public reply.
- Public reply transient failure after private success: retry public only.
- Provider outcome unknown: use existing outbox reconciliation behavior and never issue a blind duplicate.
- Token expired or missing permissions: mark binding reconnect-required and stop automated publishing for that binding.
- Primary Agent invalid: preserve inbound data and surface an operational routing error; do not fall back to another client's Agent.
- Reassignment race: use optimistic ownership/version checks through the ownership service.
- Page reassignment during a pending comment execution: finish the existing snapshotted execution; route only newly ingested comments to the new Primary Agent.
- Instance/profile ownership mismatch: fail closed, expose a configuration error, and require the atomic assignment operation to repair it.

## 10. Performance and Cost

- Deterministic rules run before AI in `rules_then_ai` mode.
- Hard safety skips happen before AI: self comments, duplicates, empty text, unsupported events, disabled bindings, and missing permissions.
- One AI call produces both private and public text.
- Knowledge retrieval is scoped by Agent ID and limited to the smallest useful result set.
- Comment jobs are queued and concurrency-limited per provider account to reduce rate-limit spikes.
- Retry policies use provider-aware backoff and do not block webhook acknowledgement.

## 11. Migration and Rollout

1. Add nullable routing and delivery schema without changing current behavior.
2. Backfill `Conversation.instanceId` from related messages where the mapping is unambiguous.
3. Report ambiguous or missing mappings; do not auto-select a page.
4. Add Primary Agent configuration, atomic Instance/profile assignment, and new account-scoped conversation lookup behind a feature flag.
5. Deploy read-only routing diagnostics and compare selected Agents without sending AI replies.
6. Enable page routing per tenant after mappings are reviewed.
7. Add Comment AI in dry-run/Test Lab mode.
8. Enable live AI per Comment Reply Profile only after Meta permissions are ready.
9. Enable DM-before-public per profile; no historical comments are backfilled.
10. Remove the legacy tenant-wide fallback for agency tenants after all active Instances have a Primary Agent.

Rollback disables the feature flags and returns to deterministic comment rules. New schema remains additive; delivery records are retained for audit.

## 12. Test Strategy

### 12.1 Agency isolation

- The same external user contacting two Facebook Pages creates two conversations.
- The same external user contacting Facebook and Instagram resolves through the correct Instances.
- Greens messages never select NASA or Meylor Agents or knowledge.
- An explicit Specialist handoff survives subsequent messages.
- Reassigning a Page does not steal already owned open conversations.
- Reassigning a Page changes both inbox and comment routing atomically.
- A deliberately corrupted Instance/profile mismatch is detected and publishes nothing.
- An invalid Primary Agent fails closed without choosing a tenant-wide fallback.

### 12.2 Comment decisions

- Each AI mode follows its configured precedence.
- Custom instructions can produce each allowed action.
- Invalid structured output cannot be published.
- Comment AI cannot import or invoke command execution.
- Test Lab and live runtime share decision logic but Test Lab has no side effects.

### 12.3 Delivery reliability

- Duplicate webhooks create one execution and at most one delivery of each kind.
- Private success followed by public failure retries public only.
- A crash immediately after private provider success still creates or recovers the dependent public delivery without repeating private delivery.
- Private permanent failure never creates the dependent public delivery.
- `reply_only` creates no private delivery.
- Provider outcome-unknown does not trigger a blind duplicate.
- Expired private-reply windows and missing permissions are typed, non-retryable failures.

### 12.4 Migration

- Unambiguous conversations backfill to the correct Instance.
- Ambiguous conversations are reported and left unresolved.
- A new resolved message never appends to an ambiguous legacy conversation.
- Existing explicitly owned conversations preserve ownership.
- The old uniqueness constraint is replaced only after duplicate preflight checks pass.

## 13. Acceptance Criteria

- Every active Facebook and Instagram Instance can be assigned at most one Primary Agent, and automation is blocked while it is unassigned.
- The Primary Agent is the single canonical owner for both inbox and default comment routing.
- Page reassignment updates Instance ownership and Comment Reply binding atomically.
- New private messages select the Primary Agent from their Instance, not tenant priority.
- Two client Pages cannot collide into one conversation for the same external user.
- Every Comment Reply Profile exposes modes and separate public/private instructions.
- `reply_and_dm` publishes the public reply only after confirmed private success.
- Retrying public delivery never repeats private delivery.
- Page reassignment cannot change the Agent, instructions, or rendered text of an execution already classified.
- Duplicate Meta webhooks never produce duplicate replies.
- Comment AI has no access to Agent commands or cross-client knowledge.
- Missing permissions, invalid Agents, and provider ineligibility are visible and fail closed.
- Automated, integration, migration, and provider-adapter tests cover the scenarios in this specification.

## 14. Explicitly Superseded Decisions

The following statements in the 2026-07-27 Comment Reply Engine design are superseded:

- Private replies are no longer a non-goal.
- The existing Facebook private-reply feature must converge into the same durable execution and delivery model rather than remain an unrelated inline feature.
- A Comment Reply execution may now produce two provider deliveries, while still producing no more than one delivery of each kind.

All other compatible safety, webhook verification, token encryption, permission readiness, rule matching, and outbox decisions remain in force.
