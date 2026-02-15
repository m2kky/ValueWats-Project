-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "templateType" TEXT,
    "instructions" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'deepseek',
    "aiModel" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 500,
    "greeting" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "responseStyle" TEXT NOT NULL DEFAULT 'concise',
    "useHistory" BOOLEAN NOT NULL DEFAULT true,
    "historyLength" INTEGER NOT NULL DEFAULT 10,
    "followUpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "followUpDelay" INTEGER NOT NULL DEFAULT 300,
    "followUpMessage" TEXT,
    "workingHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workingHours" JSONB,
    "outOfHoursMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentKnowledge" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'text',
    "sourceUrl" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "embedding" vector(1536),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRoutingRule" (
    "id" TEXT NOT NULL,
    "fromAgentId" TEXT NOT NULL,
    "toAgentId" TEXT,
    "toTeamId" TEXT,
    "toUserId" TEXT,
    "triggerType" TEXT NOT NULL,
    "keywords" TEXT[],
    "minConfidence" DOUBLE PRECISION,
    "failedAttempts" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationAgent" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "handoffReason" TEXT,
    "messagesCount" INTEGER NOT NULL DEFAULT 0,
    "successful" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConversationAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleStage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactField" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactField_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "currentAgentId" TEXT,
ADD COLUMN "lifecycleStageId" TEXT,
ADD COLUMN "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "escalated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "escalatedAt" TIMESTAMP(3),
ADD COLUMN "escalationReason" TEXT,
ADD COLUMN "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastBotResponseAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AIAgent_tenantId_isActive_idx" ON "AIAgent"("tenantId", "isActive");
CREATE INDEX "AIAgent_tenantId_templateType_idx" ON "AIAgent"("tenantId", "templateType");
CREATE INDEX "AgentAction_agentId_type_idx" ON "AgentAction"("agentId", "type");
CREATE INDEX "AgentKnowledge_agentId_isActive_idx" ON "AgentKnowledge"("agentId", "isActive");
CREATE INDEX "AgentRoutingRule_fromAgentId_isActive_idx" ON "AgentRoutingRule"("fromAgentId", "isActive");
CREATE INDEX "ConversationAgent_conversationId_idx" ON "ConversationAgent"("conversationId");
CREATE INDEX "ConversationAgent_agentId_idx" ON "ConversationAgent"("agentId");
CREATE INDEX "LifecycleStage_tenantId_order_idx" ON "LifecycleStage"("tenantId", "order");
CREATE INDEX "ContactField_tenantId_contactNumber_idx" ON "ContactField"("tenantId", "contactNumber");
CREATE UNIQUE INDEX "ContactField_tenantId_contactNumber_fieldName_key" ON "ContactField"("tenantId", "contactNumber", "fieldName");

-- AddForeignKey
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentKnowledge" ADD CONSTRAINT "AgentKnowledge_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentRoutingRule" ADD CONSTRAINT "AgentRoutingRule_fromAgentId_fkey" FOREIGN KEY ("fromAgentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentRoutingRule" ADD CONSTRAINT "AgentRoutingRule_toAgentId_fkey" FOREIGN KEY ("toAgentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationAgent" ADD CONSTRAINT "ConversationAgent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationAgent" ADD CONSTRAINT "ConversationAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_currentAgentId_fkey" FOREIGN KEY ("currentAgentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_lifecycleStageId_fkey" FOREIGN KEY ("lifecycleStageId") REFERENCES "LifecycleStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LifecycleStage" ADD CONSTRAINT "LifecycleStage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactField" ADD CONSTRAINT "ContactField_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
