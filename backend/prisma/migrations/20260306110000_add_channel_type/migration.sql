-- AlterTable
ALTER TABLE "instances" ADD COLUMN "channel_type" TEXT NOT NULL DEFAULT 'whatsapp';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "channel_type" TEXT NOT NULL DEFAULT 'whatsapp';

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN "channel_type" TEXT NOT NULL DEFAULT 'whatsapp';

-- DropIndex
DROP INDEX "conversations_tenant_id_contact_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "conversations_tenant_id_contact_number_channel_type_key" ON "conversations"("tenant_id", "contact_number", "channel_type");
