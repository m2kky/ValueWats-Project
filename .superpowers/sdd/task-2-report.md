# Task 2 Report: Secure Setup Boundaries and Expand Schema

Date: 2026-07-25

## Changed Files

- `backend/.env.example`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260805000000_expand_agent_platform/migration.sql`
- `backend/src/agents/agent.routes.js`
- `backend/src/agents/config/agentSetupSchemas.js`
- `backend/src/agents/config/agentSetupService.js`
- `backend/src/agents/config/legacyActionConfigProjection.js`
- `backend/src/agents/runtime/runtimeFlags.js`
- `backend/src/middleware/tenantContext.js`
- `backend/src/routes/auth.js`
- `backend/src/routes/team.js`
- `backend/scripts/verify-migration-on-copy.js`
- `backend/tests/integration/agents/setup-security.test.js`
- `backend/tests/integration/agents/agent-lifecycle.test.js`
- `.superpowers/sdd/task-2-report.md`

## RED Evidence

- Command: `npx vitest run tests/integration/agents/setup-security.test.js tests/integration/agents/agent-lifecycle.test.js`
- Environment: `DATABASE_URL=postgresql://postgres:postgres@localhost:55434/valuewats_agent_test?schema=public`, `REDIS_PORT=6381`, `JWT_SECRET=test-secret`
- Result after writing tests and regenerating the pre-Task-2 Prisma client: `2 failed` files, `10 failed` tests.
- Expected failures observed:
  - Missing expand columns: `AIAgent.isPublished`, `users.is_active`.
  - Missing Task 2 modules/files: `src/agents/runtime/runtimeFlags`, `scripts/verify-migration-on-copy.js`.
  - Existing routes still performed unsafe setup writes and hard-delete behavior.

## GREEN Evidence

- Command: `npx vitest run tests/integration/agents/setup-security.test.js tests/integration/agents/agent-lifecycle.test.js`
- Environment: `DATABASE_URL=postgresql://postgres:postgres@localhost:55434/valuewats_agent_test?schema=public`, `REDIS_PORT=6381`, `JWT_SECRET=test-secret`
- Result: `2 passed` files, `10 passed` tests.

## Verification Results

- `npx prisma migrate deploy`
  - Result: pass.
  - Final result: `No pending migrations to apply`.
  - Note: the first test-database attempt failed because the clean migration lineage lacks the unrelated `Integration` table. The Task 2 migration was changed to add `AgentAction.integration_id` forward-safely and only add the FK when `Integration` exists, then the failed test attempt was marked rolled back and deploy passed.
- `npx prisma validate`
  - Result: pass.
- `npx prisma generate`
  - Result: pass.
- Targeted Task 2 tests
  - Result: pass, `10 passed`.
- `npm run test:agents`
  - Result: fail, `25 passed`, `2 expected fail`, `2 failed`.
  - Failing tests are pre-existing characterization assertions that conflict with Task 2 requirements:
    - hard-delete characterization now conflicts with required soft delete/history preservation.
    - schema drift characterization expects `vector(768)`, while Task 2 requires `Unsupported("vector(1536)")`.
- Migration-copy verifier
  - Command: `node scripts/verify-migration-on-copy.js`
  - Environment: `SOURCE_DATABASE_URL=postgresql://postgres:postgres@localhost:55434/valuewats_agent_pre_migration_test?schema=public`, `TARGET_DATABASE_URL=postgresql://postgres:postgres@localhost:55434/valuewats_agent_migration_test?schema=public`, `POSTGRES_DOCKER_CONTAINER=valuewats-agent-postgres-55434`
  - Result: pass.
  - Representative counts preserved: tenants 1, users 1, AIAgent 1, AgentAction 1, AgentKnowledge 1, conversations 1, ConversationAgent 1.
- `npx prisma migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script`
  - Result: pass command execution.
  - Task-2-relevant missing columns are reconciled.
  - Residual broader drift remains outside Task 2 scope: workflow tables, snippets/lifecycle rules, contact field definitions, conversation CRM fields, missing `Integration` table/FK, and some index/FK/default differences.
- `git diff --check`
  - Result: pass with line-ending warnings only.

## Residual Concerns

- The checked-in migration lineage still has broader pre-existing drift outside Task 2. This task intentionally added only forward-safe reconciliation needed for Task 2 setup/lifecycle paths.
- `npm run test:agents` still fails because Task 1 characterization tests assert the old unsafe behavior. Updating those tests is outside the owned Task 2 file set.
- `backend/src/agents/agent.service.js` remains outside the Task 2 owned files, so legacy runtime team assignment lookup still needs a later owned task to exclude inactive users there.
