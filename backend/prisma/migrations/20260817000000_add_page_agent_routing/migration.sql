-- Add canonical connected-account ownership. The relation stays nullable so an
-- agency can connect a Page before choosing the Agent that represents it.
ALTER TABLE "instances"
  ADD COLUMN "primary_agent_id" TEXT;

-- Promote the provider account from ChatMessage to Conversation identity.
-- Historical conversations are backfilled only when every resolved message
-- points at exactly one Instance. Ambiguous legacy containers stay NULL.
ALTER TABLE "conversations"
  ADD COLUMN "instance_id" TEXT;

WITH "unambiguous_conversations" AS (
  SELECT
    "conversation_id",
    MIN("instance_id") AS "instance_id"
  FROM "chat_messages"
  WHERE "instance_id" IS NOT NULL
  GROUP BY "conversation_id"
  HAVING COUNT(DISTINCT "instance_id") = 1
)
UPDATE "conversations" AS "conversation"
SET "instance_id" = "resolved"."instance_id"
FROM "unambiguous_conversations" AS "resolved"
WHERE "conversation"."id" = "resolved"."conversation_id";

ALTER TABLE "conversations"
  DROP CONSTRAINT IF EXISTS "conversations_tenant_id_contact_number_channel_type_key";

CREATE UNIQUE INDEX "conversations_tenant_id_instance_id_contact_number_channel_type_key"
  ON "conversations"("tenant_id", "instance_id", "contact_number", "channel_type");

CREATE INDEX "conversations_tenant_id_instance_id_last_message_at_idx"
  ON "conversations"("tenant_id", "instance_id", "last_message_at" DESC);

ALTER TABLE "instances"
  ADD CONSTRAINT "instances_primary_agent_id_fkey"
  FOREIGN KEY ("primary_agent_id") REFERENCES "AIAgent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_instance_id_fkey"
  FOREIGN KEY ("instance_id") REFERENCES "instances"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
