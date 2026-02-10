-- AlterTable
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "wamid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "messages_wamid_key" ON "messages"("wamid");
