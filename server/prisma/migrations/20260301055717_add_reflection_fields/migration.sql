-- CreateEnum
CREATE TYPE "ReflectionMode" AS ENUM ('QUICK', 'GUIDED', 'DEEP', 'CHAT');

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "aiResponse" TEXT,
ADD COLUMN     "emotionalTrendSnapshot" JSONB,
ADD COLUMN     "intensity" SMALLINT,
ADD COLUMN     "mode" "ReflectionMode" NOT NULL DEFAULT 'DEEP',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
