-- AlterTable
ALTER TABLE "tasks"
ADD COLUMN "energyLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "emotionalWeight" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN "estimatedMinutes" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN "completionFeeling" TEXT;

-- Backfill energyLevel from existing energyLevelRequired
UPDATE "tasks" SET "energyLevel" = "energyLevelRequired";

-- CreateTable
CREATE TABLE "emotional_capacity_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "energyUsed" INTEGER NOT NULL DEFAULT 0,
    "gentleModeActive" BOOLEAN NOT NULL DEFAULT false,
    "consistencyBonusAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotional_capacity_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emotional_capacity_days_userId_date_key" ON "emotional_capacity_days"("userId", "date");

-- CreateIndex
CREATE INDEX "emotional_capacity_days_userId_idx" ON "emotional_capacity_days"("userId");

-- CreateIndex
CREATE INDEX "emotional_capacity_days_date_idx" ON "emotional_capacity_days"("date");

-- AddForeignKey
ALTER TABLE "emotional_capacity_days" ADD CONSTRAINT "emotional_capacity_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
