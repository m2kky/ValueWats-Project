-- Migration: add_global_templates
-- Phase 5: Global Message Templates Library

-- Create global_templates table
CREATE TABLE "global_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "global_templates_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint bridging to tenants
ALTER TABLE "global_templates" ADD CONSTRAINT "global_templates_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

