ALTER TABLE "contact_notes"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "agent_id" TEXT;

ALTER TABLE "contact_notes"
  ADD CONSTRAINT "contact_notes_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "AIAgent"("id") ON DELETE SET NULL;

ALTER TABLE "contact_notes"
  ADD CONSTRAINT "contact_notes_exactly_one_actor_check"
  CHECK (("user_id" IS NOT NULL)::int + ("agent_id" IS NOT NULL)::int = 1);
