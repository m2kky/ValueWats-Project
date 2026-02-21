-- AlterTable
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "variables" JSONB;
