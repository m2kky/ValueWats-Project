-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'marketing';
ALTER TABLE "campaigns" ADD COLUMN "target_config" JSONB;
