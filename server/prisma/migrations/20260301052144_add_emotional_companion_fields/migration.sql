-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('MORNING', 'NIGHT', 'MANUAL');

-- AlterTable
ALTER TABLE "mood_entries" ADD COLUMN     "aiInsightShown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contextTag" VARCHAR(100),
ADD COLUMN     "entryType" "EntryType" NOT NULL DEFAULT 'MANUAL';
