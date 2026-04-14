-- Migration: update_plan_pricing_model
-- Adds user/MAC pricing fields and refreshes default plan catalog.

ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "includedUsers" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "additionalUserPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "includedMac" INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS "macOveragePer100" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "unlimitedUsers" BOOLEAN NOT NULL DEFAULT false;

-- Align legacy subscription names with the new plan taxonomy.
UPDATE "tenants" SET "subscription_plan" = 'starter' WHERE "subscription_plan" = 'basic';
UPDATE "tenants" SET "subscription_plan" = 'growth' WHERE "subscription_plan" = 'pro';
UPDATE "tenants" SET "subscription_plan" = 'scale' WHERE "subscription_plan" IN ('business', 'advanced');

-- Upsert new plan catalog.
INSERT INTO "plans" (
  "id",
  "name",
  "maxMessagesPerDay",
  "maxContactsPerCampaign",
  "maxInstances",
  "includedUsers",
  "additionalUserPrice",
  "includedMac",
  "macOveragePer100",
  "unlimitedUsers",
  "workingHoursEnabled",
  "workingHoursStart",
  "workingHoursEnd",
  "workingDays",
  "price"
)
VALUES
  (
    gen_random_uuid()::text,
    'starter',
    500,
    1000,
    1,
    5,
    12.00,
    1000,
    10.00,
    false,
    false,
    '09:00',
    '22:00',
    ARRAY['Mon','Tue','Wed','Thu','Fri','Sat']::TEXT[],
    69.00
  ),
  (
    gen_random_uuid()::text,
    'growth',
    3000,
    10000,
    5,
    10,
    18.00,
    3000,
    12.00,
    false,
    true,
    '08:00',
    '23:00',
    ARRAY['Mon','Tue','Wed','Thu','Fri','Sat']::TEXT[],
    149.00
  ),
  (
    gen_random_uuid()::text,
    'scale',
    15000,
    50000,
    20,
    20,
    24.00,
    10000,
    15.00,
    false,
    true,
    '00:00',
    '23:59',
    ARRAY['Mon','Tue','Wed','Thu','Fri','Sat']::TEXT[],
    279.00
  ),
  (
    gen_random_uuid()::text,
    'enterprise',
    100000,
    500000,
    100,
    0,
    0,
    0,
    0,
    true,
    true,
    '00:00',
    '23:59',
    ARRAY['Mon','Tue','Wed','Thu','Fri','Sat']::TEXT[],
    0.00
  )
ON CONFLICT ("name") DO UPDATE SET
  "maxMessagesPerDay" = EXCLUDED."maxMessagesPerDay",
  "maxContactsPerCampaign" = EXCLUDED."maxContactsPerCampaign",
  "maxInstances" = EXCLUDED."maxInstances",
  "includedUsers" = EXCLUDED."includedUsers",
  "additionalUserPrice" = EXCLUDED."additionalUserPrice",
  "includedMac" = EXCLUDED."includedMac",
  "macOveragePer100" = EXCLUDED."macOveragePer100",
  "unlimitedUsers" = EXCLUDED."unlimitedUsers",
  "workingHoursEnabled" = EXCLUDED."workingHoursEnabled",
  "workingHoursStart" = EXCLUDED."workingHoursStart",
  "workingHoursEnd" = EXCLUDED."workingHoursEnd",
  "workingDays" = EXCLUDED."workingDays",
  "price" = EXCLUDED."price";

-- Keep tenants aligned with active plans by plan name.
UPDATE "tenants" t
SET "plan_id" = p."id"
FROM "plans" p
WHERE p."name" = LOWER(COALESCE(t."subscription_plan", ''));

-- Remove deprecated plan names after tenant references are migrated.
DELETE FROM "plans" WHERE "name" IN ('basic', 'pro', 'business', 'advanced');

