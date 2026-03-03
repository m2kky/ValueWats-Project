-- Migration: add_plans_and_blacklist
-- Phase 2: Add subscription plans table
-- Phase 3: Add blacklisted field to contacts

-- Create plans table
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxMessagesPerDay" INTEGER NOT NULL DEFAULT 300,
    "maxContactsPerCampaign" INTEGER NOT NULL DEFAULT 500,
    "maxInstances" INTEGER NOT NULL DEFAULT 2,
    "workingHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '22:00',
    "workingDays" TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat']::TEXT[],
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on plan name
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- Add planId to tenants
ALTER TABLE "tenants" ADD COLUMN "plan_id" TEXT;

-- Add FK constraint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Phase 3: Add opt-out blacklist fields to contacts
ALTER TABLE "contacts" ADD COLUMN "blacklisted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contacts" ADD COLUMN "blacklisted_at" TIMESTAMP(3);

-- Seed default plans (idempotent)
INSERT INTO "plans" ("id", "name", "maxMessagesPerDay", "maxContactsPerCampaign", "maxInstances", "workingHoursEnabled", "workingHoursStart", "workingHoursEnd", "price")
VALUES
    (gen_random_uuid()::text, 'basic',      200,  300,   1, false, '09:00', '22:00', 99.00),
    (gen_random_uuid()::text, 'pro',        1000, 2000,  5, true,  '08:00', '23:00', 299.00),
    (gen_random_uuid()::text, 'enterprise', 5000, 10000, 20, true, '00:00', '23:59', 999.00)
ON CONFLICT ("name") DO NOTHING;
