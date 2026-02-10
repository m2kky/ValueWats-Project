-- AlterTable: Add media_url and media_type to campaigns
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "media_url" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "media_type" TEXT;

-- AlterTable: Add media_url and media_type to messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "media_url" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "media_type" TEXT;
