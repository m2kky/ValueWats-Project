CREATE TABLE IF NOT EXISTS "Integration" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "credentials" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Integration_tenantId_type_idx"
  ON "Integration"("tenantId", "type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Integration_tenantId_fkey'
  ) THEN
    ALTER TABLE "Integration"
      ADD CONSTRAINT "Integration_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentAction_integration_id_fkey'
  ) THEN
    ALTER TABLE "AgentAction"
      ADD CONSTRAINT "AgentAction_integration_id_fkey"
      FOREIGN KEY ("integration_id") REFERENCES "Integration"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
