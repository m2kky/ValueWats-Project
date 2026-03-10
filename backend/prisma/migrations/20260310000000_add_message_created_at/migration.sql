-- AlterTable
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_tenant_id_created_at_idx" ON "messages"("tenant_id", "created_at" DESC);
