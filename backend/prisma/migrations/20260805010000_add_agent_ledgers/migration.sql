-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "AgentCommandStatus" AS ENUM (
    'proposed',
    'authorized',
    'running',
    'succeeded',
    'failed',
    'denied',
    'conflict',
    'shadowed',
    'outcome_unknown'
);

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'dispatching', 'succeeded', 'failed', 'outcome_unknown');

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "inbound_message_id" TEXT NOT NULL,
    "source_agent_id" TEXT,
    "agent_config_version" INTEGER,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'pending',
    "error_code" TEXT,
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lease_expires_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_commands" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "source_agent_id" TEXT,
    "type" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "result" JSONB,
    "status" "AgentCommandStatus" NOT NULL DEFAULT 'proposed',
    "idempotency_key" TEXT NOT NULL,
    "terminal_slot" BOOLEAN,
    "error_code" TEXT,
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lease_expires_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "command_id" TEXT,
    "run_id" TEXT,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lease_expires_at" TIMESTAMP(3),
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatched_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_runs_inbound_message_id_key" ON "agent_runs"("inbound_message_id");
CREATE INDEX "agent_runs_tenant_id_status_idx" ON "agent_runs"("tenant_id", "status");
CREATE INDEX "agent_runs_status_lease_expires_at_idx" ON "agent_runs"("status", "lease_expires_at");
CREATE UNIQUE INDEX "agent_commands_tenant_id_idempotency_key_key" ON "agent_commands"("tenant_id", "idempotency_key");
CREATE UNIQUE INDEX "agent_commands_run_id_terminal_slot_key" ON "agent_commands"("run_id", "terminal_slot");
CREATE INDEX "agent_commands_tenant_id_status_idx" ON "agent_commands"("tenant_id", "status");
CREATE INDEX "agent_commands_status_lease_expires_at_idx" ON "agent_commands"("status", "lease_expires_at");
CREATE UNIQUE INDEX "outbox_events_tenant_id_idempotency_key_key" ON "outbox_events"("tenant_id", "idempotency_key");
CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events"("status", "available_at");
CREATE INDEX "outbox_events_status_lease_expires_at_idx" ON "outbox_events"("status", "lease_expires_at");

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_source_agent_id_fkey"
FOREIGN KEY ("source_agent_id") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_commands" ADD CONSTRAINT "agent_commands_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_commands" ADD CONSTRAINT "agent_commands_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_commands" ADD CONSTRAINT "agent_commands_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_commands" ADD CONSTRAINT "agent_commands_source_agent_id_fkey"
FOREIGN KEY ("source_agent_id") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_command_id_fkey"
FOREIGN KEY ("command_id") REFERENCES "agent_commands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
