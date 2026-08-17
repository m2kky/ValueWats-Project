-- Add explicit, instruction-driven Comment AI configuration. The legacy
-- ai_fallback_enabled column remains as a compatibility projection for one
-- release; new runtimes read ai_mode.
ALTER TABLE "comment_reply_profiles"
  ADD COLUMN "ai_mode" TEXT NOT NULL DEFAULT 'rules_only',
  ADD COLUMN "comment_ai_instructions" TEXT,
  ADD COLUMN "private_reply_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "private_reply_instructions" TEXT,
  ADD COLUMN "public_after_private_success" BOOLEAN NOT NULL DEFAULT true;

UPDATE "comment_reply_profiles"
SET "ai_mode" = CASE
  WHEN "ai_fallback_enabled" THEN 'rules_then_ai'
  ELSE 'rules_only'
END;

ALTER TABLE "comment_reply_profiles"
  ADD CONSTRAINT "comment_reply_profiles_ai_mode_check"
  CHECK ("ai_mode" IN ('rules_only', 'rules_then_ai', 'ai_only'));

CREATE TYPE "CommentReplyDeliveryKind" AS ENUM ('private_message', 'public_reply');
CREATE TYPE "CommentReplyDeliveryStatus" AS ENUM (
  'pending',
  'dispatching',
  'succeeded',
  'failed',
  'outcome_unknown',
  'cancelled'
);

CREATE TABLE "comment_reply_deliveries" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "execution_id" TEXT NOT NULL,
  "kind" "CommentReplyDeliveryKind" NOT NULL,
  "status" "CommentReplyDeliveryStatus" NOT NULL DEFAULT 'pending',
  "rendered_text" TEXT NOT NULL,
  "provider_message_id" TEXT,
  "idempotency_key" TEXT NOT NULL,
  "outbox_event_id" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lease_expires_at" TIMESTAMP(3),
  "lease_token" TEXT,
  "completed_at" TIMESTAMP(3),
  "error_code" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comment_reply_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comment_reply_deliveries_execution_id_kind_key"
  ON "comment_reply_deliveries"("execution_id", "kind");
CREATE UNIQUE INDEX "comment_reply_deliveries_tenant_id_idempotency_key_key"
  ON "comment_reply_deliveries"("tenant_id", "idempotency_key");
CREATE UNIQUE INDEX "comment_reply_deliveries_outbox_event_id_key"
  ON "comment_reply_deliveries"("outbox_event_id");
CREATE INDEX "comment_reply_deliveries_status_available_at_idx"
  ON "comment_reply_deliveries"("status", "available_at");
CREATE INDEX "comment_reply_deliveries_status_lease_expires_at_idx"
  ON "comment_reply_deliveries"("status", "lease_expires_at");
CREATE INDEX "comment_reply_deliveries_tenant_id_execution_id_created_at_idx"
  ON "comment_reply_deliveries"("tenant_id", "execution_id", "created_at" DESC);

ALTER TABLE "comment_reply_deliveries"
  ADD CONSTRAINT "comment_reply_deliveries_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_reply_deliveries"
  ADD CONSTRAINT "comment_reply_deliveries_execution_id_fkey"
  FOREIGN KEY ("execution_id") REFERENCES "comment_reply_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_reply_deliveries"
  ADD CONSTRAINT "comment_reply_deliveries_outbox_event_id_fkey"
  FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
