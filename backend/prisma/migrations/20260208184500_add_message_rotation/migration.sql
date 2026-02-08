-- AlterTable: Add message_rotation_count to Campaigns
ALTER TABLE "campaigns" ADD COLUMN "message_rotation_count" INTEGER NOT NULL DEFAULT 1;

-- CreateTable: MessageTemplate
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
