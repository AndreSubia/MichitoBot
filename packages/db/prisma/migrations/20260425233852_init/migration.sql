CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "KnowledgeKind" AS ENUM ('FACT', 'QA', 'STYLE');

-- CreateEnum
CREATE TYPE "TrainingSource" AS ENUM ('TEACH', 'APPROVED_REPLY', 'ADMIN_UPLOAD');

-- CreateEnum
CREATE TYPE "ModerationActionKind" AS ENUM ('GRANT_ROLE', 'REVOKE_ROLE', 'BAN', 'KICK', 'TIMEOUT', 'NOTE', 'FLAG');

-- CreateTable
CREATE TABLE "guild_settings" (
    "guildId" TEXT NOT NULL,
    "personality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_settings_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "guild_allowed_channels" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_allowed_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_role_policies" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "canGrant" BOOLEAN NOT NULL DEFAULT false,
    "canRevoke" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_role_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "kind" "KnowledgeKind" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "approvedForTraining" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_logs" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commandName" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_events" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_examples" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "source" "TrainingSource" NOT NULL,
    "messages" JSONB NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "kind" "ModerationActionKind" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_configs" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "llmModel" TEXT,
    "embeddingModel" TEXT,
    "temperature" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guild_allowed_channels_guildId_idx" ON "guild_allowed_channels"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "guild_allowed_channels_guildId_channelId_key" ON "guild_allowed_channels"("guildId", "channelId");

-- CreateIndex
CREATE INDEX "guild_role_policies_guildId_idx" ON "guild_role_policies"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "guild_role_policies_guildId_roleId_key" ON "guild_role_policies"("guildId", "roleId");

-- CreateIndex
CREATE INDEX "knowledge_entries_guildId_idx" ON "knowledge_entries"("guildId");

-- CreateIndex
CREATE INDEX "knowledge_chunks_guildId_idx" ON "knowledge_chunks"("guildId");

-- CreateIndex
CREATE INDEX "knowledge_chunks_entryId_idx" ON "knowledge_chunks"("entryId");

-- CreateIndex
CREATE INDEX "interaction_logs_guildId_idx" ON "interaction_logs"("guildId");

-- CreateIndex
CREATE INDEX "interaction_logs_createdAt_idx" ON "interaction_logs"("createdAt");

-- CreateIndex
CREATE INDEX "feedback_events_guildId_idx" ON "feedback_events"("guildId");

-- CreateIndex
CREATE INDEX "training_examples_guildId_idx" ON "training_examples"("guildId");

-- CreateIndex
CREATE INDEX "moderation_actions_guildId_idx" ON "moderation_actions"("guildId");

-- CreateIndex
CREATE INDEX "audit_logs_guildId_idx" ON "audit_logs"("guildId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "model_configs_guildId_key" ON "model_configs"("guildId");

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "knowledge_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
