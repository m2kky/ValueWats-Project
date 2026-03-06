-- CreateTable
CREATE TABLE "saved_segments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_segments_tenant_id_name_key" ON "saved_segments"("tenant_id", "name");

-- AddForeignKey
ALTER TABLE "saved_segments" ADD CONSTRAINT "saved_segments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ALTER TABLE campaigns
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "saved_segment_id" TEXT;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_saved_segment_id_fkey" FOREIGN KEY ("saved_segment_id") REFERENCES "saved_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
