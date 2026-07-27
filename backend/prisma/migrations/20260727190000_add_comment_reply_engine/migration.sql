-- Add Comment Reply Engine configuration and operational ledger tables.
ALTER TYPE "OutboxStatus" ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TYPE "CommentReplyExecutionStatus" AS ENUM ('received', 'skipped', 'processing', 'ready', 'failed');
CREATE TYPE "CommentReplyPlatform" AS ENUM ('facebook', 'instagram');

CREATE TABLE "comment_reply_profiles" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "ai_fallback_enabled" BOOLEAN NOT NULL DEFAULT false,
  "default_match_mode" TEXT NOT NULL DEFAULT 'contains_any',
  "config_version" INTEGER NOT NULL DEFAULT 1,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comment_reply_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_channel_bindings" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "instance_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "external_account_id" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "permission_state" TEXT NOT NULL DEFAULT 'unknown',
  "last_permission_check_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comment_channel_bindings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_reply_rules" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL,
  "match_mode" TEXT NOT NULL,
  "keywords" TEXT[],
  "shared_rotation_cursor" INTEGER NOT NULL DEFAULT 0,
  "facebook_rotation_cursor" INTEGER NOT NULL DEFAULT 0,
  "instagram_rotation_cursor" INTEGER NOT NULL DEFAULT 0,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comment_reply_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_reply_variants" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "rule_id" TEXT NOT NULL,
  "platform" "CommentReplyPlatform",
  "body" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comment_reply_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_post_overrides" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "binding_id" TEXT NOT NULL,
  "external_post_id" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'inherit',
  "override_profile_id" TEXT,
  "post_name" TEXT,
  "thumbnail_url" TEXT,
  "post_published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comment_post_overrides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_reply_executions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "instance_id" TEXT,
  "binding_id" TEXT,
  "profile_id" TEXT,
  "agent_id" TEXT,
  "agent_name_snapshot" TEXT,
  "platform" "CommentReplyPlatform" NOT NULL,
  "provider_account_id" TEXT NOT NULL,
  "external_comment_id" TEXT NOT NULL,
  "external_post_id" TEXT NOT NULL,
  "parent_comment_id" TEXT,
  "comment_text" TEXT,
  "commenter_external_id" TEXT,
  "commenter_name" TEXT,
  "post_name" TEXT,
  "event_created_at" TIMESTAMP(3),
  "is_self" BOOLEAN NOT NULL DEFAULT false,
  "skip_reason" TEXT,
  "route_source" TEXT,
  "rule_id" TEXT,
  "rule_name_snapshot" TEXT,
  "variant_id" TEXT,
  "profile_config_version" INTEGER,
  "agent_config_version" INTEGER,
  "rendered_reply" TEXT,
  "status" "CommentReplyExecutionStatus" NOT NULL DEFAULT 'received',
  "provider_reply_id" TEXT,
  "error_code" TEXT,
  "error_message" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lease_expires_at" TIMESTAMP(3),
  "lease_token" TEXT,
  "outbox_event_id" TEXT,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comment_reply_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comment_reply_profiles_tenant_id_agent_id_key"
  ON "comment_reply_profiles"("tenant_id", "agent_id");
CREATE UNIQUE INDEX "comment_channel_bindings_tenant_id_instance_id_key"
  ON "comment_channel_bindings"("tenant_id", "instance_id");
CREATE UNIQUE INDEX "comment_channel_bindings_provider_external_account_id_key"
  ON "comment_channel_bindings"("provider", "external_account_id");
CREATE INDEX "comment_reply_rules_profile_id_deleted_at_is_enabled_priority_idx"
  ON "comment_reply_rules"("profile_id", "deleted_at", "is_enabled", "priority");
CREATE UNIQUE INDEX "comment_post_overrides_tenant_id_binding_id_external_post_id_key"
  ON "comment_post_overrides"("tenant_id", "binding_id", "external_post_id");
CREATE UNIQUE INDEX "comment_reply_executions_outbox_event_id_key"
  ON "comment_reply_executions"("outbox_event_id");
CREATE UNIQUE INDEX "comment_reply_executions_platform_provider_account_id_external_comment_id_key"
  ON "comment_reply_executions"("platform", "provider_account_id", "external_comment_id");
CREATE INDEX "comment_reply_executions_status_available_at_idx"
  ON "comment_reply_executions"("status", "available_at");
CREATE INDEX "comment_reply_executions_status_lease_expires_at_idx"
  ON "comment_reply_executions"("status", "lease_expires_at");
CREATE INDEX "comment_reply_executions_tenant_id_profile_id_received_at_idx"
  ON "comment_reply_executions"("tenant_id", "profile_id", "received_at" DESC);
CREATE INDEX "comment_reply_executions_tenant_id_profile_id_created_at_id_idx"
  ON "comment_reply_executions"("tenant_id", "profile_id", "created_at" DESC, "id");

ALTER TABLE "comment_reply_profiles"
  ADD CONSTRAINT "comment_reply_profiles_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_profiles_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_channel_bindings"
  ADD CONSTRAINT "comment_channel_bindings_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_channel_bindings_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "comment_reply_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_channel_bindings_instance_id_fkey"
  FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reply_rules"
  ADD CONSTRAINT "comment_reply_rules_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_rules_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "comment_reply_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reply_variants"
  ADD CONSTRAINT "comment_reply_variants_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_variants_rule_id_fkey"
  FOREIGN KEY ("rule_id") REFERENCES "comment_reply_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_post_overrides"
  ADD CONSTRAINT "comment_post_overrides_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_post_overrides_binding_id_fkey"
  FOREIGN KEY ("binding_id") REFERENCES "comment_channel_bindings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_post_overrides_override_profile_id_fkey"
  FOREIGN KEY ("override_profile_id") REFERENCES "comment_reply_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comment_reply_executions"
  ADD CONSTRAINT "comment_reply_executions_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_executions_instance_id_fkey"
  FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_executions_binding_id_fkey"
  FOREIGN KEY ("binding_id") REFERENCES "comment_channel_bindings"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_executions_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "comment_reply_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_executions_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_executions_rule_id_fkey"
  FOREIGN KEY ("rule_id") REFERENCES "comment_reply_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_executions_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "comment_reply_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "comment_reply_executions_outbox_event_id_fkey"
  FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
