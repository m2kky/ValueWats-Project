-- Migration: add_onboarding_wizard
-- Adds onboarding wizard fields to tenants and user profile fields to users

-- Add onboarding fields to tenants table
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "industry" TEXT,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "org_size" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_type" TEXT,
  ADD COLUMN IF NOT EXISTS "chat_purposes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "referral_source" TEXT;

-- Add profile fields to users table
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "org_role" TEXT;
