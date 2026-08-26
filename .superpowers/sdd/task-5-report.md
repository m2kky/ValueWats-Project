# Task 5 Report: Canonical Store Capability Persistence

## Status

Implemented from `main` HEAD `6720e99` with one generalized capability service and a terminal compatibility re-export.

Planned commit message: `feat(agents): add canonical Store capability`

## Implementation

- Added strict Store config schema `{ maxResults: integer 1..5 }`.
- Added catalog capability `store_catalog_read` with `external_read` risk, internal delivery, no terminal command, and a required `store_salla` integration policy.
- Moved the existing capability update implementation to `agentCapabilityService.js`.
- Kept `terminalCapabilityService.js` as aliases to the generalized factory, normalizer, and singleton; there is no second implementation.
- Added canonical Store normalization:
  - Enabled: trimmed integration ID/instructions and validated `maxResults`.
  - Disabled: `integrationId: null`, empty instructions, and `{ maxResults: 5 }`.
- Validated an enabled Store integration inside the existing serializable transaction as active, same-tenant, and type `store_salla` before any capability write.
- Preserved one compare-and-increment `configVersion` update per successful request and existing `P2034` conflict handling.
- Preserved fail-closed duplicate detection and one canonical row update/create path per agent/key.
- Added Store to the legacy projection as enabled/instructions/config only. The integration ID remains only on the canonical row.
- Added preferred `PUT /api/agents/:id/capabilities` and retained `PUT /api/agents/:id/terminal-capabilities` as two paths on the same handler and singleton, both requiring `agents.manage`.
- Kept runtime authority canonical: no Store runtime reads were added against legacy `actionConfig`; existing runtime policy loads `AgentAction` rows.
- Kept Store catalog reads out of the mutation command registry.

## Tests

- Added DB integration coverage for:
  - Enabled canonical Store persistence and legacy projection.
  - Foreign, inactive, wrong-type, and missing integrations.
  - Disabled default persistence.
  - Strict `maxResults` rejection.
  - Duplicate canonical rows failing closed.
  - Preferred and legacy endpoints sharing behavior, permission enforcement, one row, and one version increment per call.
- Added compatibility coverage proving the terminal factory re-exports the generalized factory.
- Updated the command registry assertion to preserve all six existing mutation commands while explicitly excluding the read-only Store capability.

## Verification

- TDD RED: direct normalization assertion failed because the prior service returned no `store_catalog_read`.
- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- Node syntax checks for every changed JavaScript source and test file: passed.
- `npx vitest run tests/unit/agents/commandRegistry.test.js`: passed, 19 tests.
- Direct no-DB transaction contract check: passed for serializable isolation, enabled/disabled Store persistence, integration query scope, one row on repeat update, one increment per call, and compatibility identity.
- `git diff --check`: passed; only Git line-ending notices were emitted.
- Focused integration command attempted once with a 15-second hard bound:

  `node ./node_modules/vitest/vitest.mjs run tests/integration/agents/terminal-capabilities.test.js tests/integration/agents/store-capability.test.js --pool=threads --maxWorkers=1 --testTimeout=5000 --hookTimeout=5000 --teardownTimeout=1000`

  Result: unavailable. Vitest started but PostgreSQL at `localhost:5434` is known unavailable and the process produced no test result before the bound, so it was terminated. The integration tests were not weakened or skipped.

## Self-Review

- Tenant boundary: the agent lookup and integration lookup both require the request tenant; foreign integrations fail before writes.
- Integration state: enabled Store requires exactly the referenced active `store_salla` row; blank and nonexistent IDs return `CAPABILITY_INTEGRATION_INVALID`.
- Atomicity: integration validation, duplicate check, canonical writes, legacy projection, and version update share one serializable transaction.
- Concurrency: the compare-and-increment update and `P2034` mapping preserve stale-write behavior and a single successful version increment.
- Canonical authority: Store integration linkage exists only on `AgentAction`; legacy projection carries no integration authority.
- API surface: there is one save handler, one singleton service, one preferred endpoint, and one compatibility alias.
- Scope: no dependency, Prisma schema, migration, Store runtime, or command implementation was added.

## Concerns

- PostgreSQL-backed integration results remain unverified locally and must be rerun when `valuewats_agent_test` is available on port 5434.
- `AgentAction` has no database unique constraint on `(agentId, key)`. The existing serializable service path prevents normal duplicate creation and fails closed if duplicates exist, but out-of-band writes can still create duplicates. A schema migration was intentionally not added because it is outside the Task 5 brief and listed files.
- Unrelated pre-existing changes in `logs/CHANGELOG.md` and `docs/superpowers/plans/2026-07-25-agents-command-platform.md` were preserved and excluded from the Task 5 commit.
