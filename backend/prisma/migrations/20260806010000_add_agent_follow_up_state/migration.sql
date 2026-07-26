ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "lastFollowUpAt" TIMESTAMP(3);
