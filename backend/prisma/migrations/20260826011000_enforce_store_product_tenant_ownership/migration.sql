CREATE UNIQUE INDEX IF NOT EXISTS "Integration_id_tenantId_key"
  ON "Integration"("id", "tenantId");

ALTER TABLE "store_products"
  DROP CONSTRAINT IF EXISTS "store_products_integration_id_fkey";

ALTER TABLE "store_products"
  ADD CONSTRAINT "store_products_integration_id_tenant_id_fkey"
  FOREIGN KEY ("integration_id", "tenant_id") REFERENCES "Integration"("id", "tenantId")
  ON DELETE CASCADE ON UPDATE CASCADE;
