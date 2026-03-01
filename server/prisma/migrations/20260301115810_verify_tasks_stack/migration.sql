/*
  Warnings:

  - The `energyLevel` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "Emotion" ADD VALUE 'TIRED';

-- AlterEnum
ALTER TYPE "Mood" ADD VALUE 'CONFUSED';

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "affectedBy" VARCHAR(100),
ADD COLUMN     "drainedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "energyLevel" VARCHAR(50),
ADD COLUMN     "need" VARCHAR(100);

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "energyLevel",
ADD COLUMN     "energyLevel" "EnergyLevel" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "journal_entries_energyLevel_idx" ON "journal_entries"("energyLevel");
