-- AlterTable: Add delay fields to campaigns
ALTER TABLE "campaigns" ADD COLUMN "delay_min" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "campaigns" ADD COLUMN "delay_max" INTEGER NOT NULL DEFAULT 15;
