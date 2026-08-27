ALTER TABLE "salla_pending_authorizations"
  ADD COLUMN "event_created_at" TIMESTAMP(3);

CREATE TABLE "salla_pending_pairings" (
  "merchant_id" TEXT NOT NULL,
  "integration_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salla_pending_pairings_pkey" PRIMARY KEY ("merchant_id")
);

CREATE UNIQUE INDEX "salla_pending_pairings_integration_id_key"
  ON "salla_pending_pairings"("integration_id");

CREATE INDEX "salla_pending_pairings_expires_at_idx"
  ON "salla_pending_pairings"("expires_at");

ALTER TABLE "salla_pending_pairings"
  ADD CONSTRAINT "salla_pending_pairings_integration_id_fkey"
  FOREIGN KEY ("integration_id") REFERENCES "Integration"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
