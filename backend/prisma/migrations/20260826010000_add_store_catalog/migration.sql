ALTER TABLE "Integration"
  ADD COLUMN IF NOT EXISTS "external_account_id" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "Integration_type_external_account_id_key"
  ON "Integration"("type", "external_account_id");

CREATE TABLE IF NOT EXISTS "store_products" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "integration_id" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "sku" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "image_url" TEXT,
  "product_url" TEXT,
  "price" DECIMAL(18,2),
  "sale_price" DECIMAL(18,2),
  "currency" TEXT,
  "status" TEXT NOT NULL,
  "is_available" BOOLEAN NOT NULL DEFAULT false,
  "quantity" INTEGER,
  "unlimited_quantity" BOOLEAN NOT NULL DEFAULT false,
  "variants" JSONB,
  "provider_updated_at" TIMESTAMP(3),
  "synced_at" TIMESTAMP(3) NOT NULL,
  "last_verified_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "store_products_integration_id_external_id_key"
  ON "store_products"("integration_id", "external_id");
CREATE INDEX IF NOT EXISTS "store_products_tenant_id_integration_id_deleted_at_idx"
  ON "store_products"("tenant_id", "integration_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "store_products_integration_id_sku_idx"
  ON "store_products"("integration_id", "sku");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_products_tenant_id_fkey'
  ) THEN
    ALTER TABLE "store_products"
      ADD CONSTRAINT "store_products_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_products_integration_id_fkey'
  ) THEN
    ALTER TABLE "store_products"
      ADD CONSTRAINT "store_products_integration_id_fkey"
      FOREIGN KEY ("integration_id") REFERENCES "Integration"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
