-- AlterTable: Make instanceId optional in Campaigns
ALTER TABLE "campaigns" ALTER COLUMN "instance_id" DROP NOT NULL;

-- AlterTable: Add instance_switch_count to Campaigns
ALTER TABLE "campaigns" ADD COLUMN "instance_switch_count" INTEGER NOT NULL DEFAULT 50;

-- CreateTable: CampaignInstance
CREATE TABLE "campaign_instances" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "campaign_instances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "campaign_instances" ADD CONSTRAINT "campaign_instances_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_instances" ADD CONSTRAINT "campaign_instances_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
