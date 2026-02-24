-- AlterTable: Add fail_reason to messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "fail_reason" TEXT;
