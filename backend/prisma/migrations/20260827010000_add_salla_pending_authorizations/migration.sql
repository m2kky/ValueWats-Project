CREATE TABLE "salla_pending_authorizations" (
  "merchant_id" TEXT NOT NULL,
  "credentials" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salla_pending_authorizations_pkey" PRIMARY KEY ("merchant_id")
);

CREATE INDEX "salla_pending_authorizations_expires_at_idx"
  ON "salla_pending_authorizations"("expires_at");
