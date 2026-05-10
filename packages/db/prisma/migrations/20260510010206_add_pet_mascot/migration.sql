-- CreateEnum
CREATE TYPE "PetState" AS ENUM ('ALIVE', 'SLEEPING', 'SICK', 'DEAD');

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Michi',
    "state" "PetState" NOT NULL DEFAULT 'ALIVE',
    "hunger" INTEGER NOT NULL DEFAULT 50,
    "energy" INTEGER NOT NULL DEFAULT 80,
    "health" INTEGER NOT NULL DEFAULT 100,
    "mood" INTEGER NOT NULL DEFAULT 70,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "bornAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diedAt" TIMESTAMP(3),
    "deathCount" INTEGER NOT NULL DEFAULT 0,
    "causeOfDeath" TEXT,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_rules" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "delta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pets_guildId_key" ON "pets"("guildId");

-- CreateIndex
CREATE INDEX "pets_nextTickAt_state_idx" ON "pets"("nextTickAt", "state");

-- CreateIndex
CREATE INDEX "training_rules_guildId_isActive_idx" ON "training_rules"("guildId", "isActive");

-- CreateIndex
CREATE INDEX "activity_logs_guildId_createdAt_idx" ON "activity_logs"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_petId_createdAt_idx" ON "activity_logs"("petId", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_windowStart_idx" ON "rate_limit_buckets"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_buckets_scope_windowStart_key" ON "rate_limit_buckets"("scope", "windowStart");
