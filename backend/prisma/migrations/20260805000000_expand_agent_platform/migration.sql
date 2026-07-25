-- Forward-only expand migration for the agent command platform.
-- The IF NOT EXISTS reconciliation below is limited to Task-2-relevant
-- columns that exist in schema.prisma but are absent from the checked-in
-- migration lineage on a clean database.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentRuntimeMode') THEN
    CREATE TYPE "AgentRuntimeMode" AS ENUM ('legacy', 'shadow', 'v2');
  END IF;
END $$;

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "agent_runtime_mode" "AgentRuntimeMode" NOT NULL DEFAULT 'legacy';

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "assignment_version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "AIAgent"
  ADD COLUMN IF NOT EXISTS "actionConfig" JSONB,
  ADD COLUMN IF NOT EXISTS "allowGroupResponse" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "allowedGroups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "configVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "workingHoursTimezone" TEXT NOT NULL DEFAULT 'Africa/Cairo';

ALTER TABLE "AgentAction"
  ADD COLUMN IF NOT EXISTS "key" TEXT,
  ADD COLUMN IF NOT EXISTS "integration_id" TEXT;

DO $$
BEGIN
  IF to_regclass('"Integration"') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentAction_integration_id_fkey'
  ) THEN
    ALTER TABLE "AgentAction"
      ADD CONSTRAINT "AgentAction_integration_id_fkey"
      FOREIGN KEY ("integration_id") REFERENCES "Integration"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "AgentKnowledge"
  ADD COLUMN IF NOT EXISTS "fileKey" TEXT,
  ADD COLUMN IF NOT EXISTS "chunkIndex" INTEGER NOT NULL DEFAULT 0;
