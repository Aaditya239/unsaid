-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'SAD', 'ANGRY', 'CALM', 'ANXIOUS', 'EXCITED', 'TIRED', 'STRESSED', 'GRATEFUL', 'NEUTRAL');

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL,
    "mood" "Mood" NOT NULL,
    "intensity" SMALLINT NOT NULL,
    "note" VARCHAR(500),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mood_entries_userId_idx" ON "mood_entries"("userId");

-- CreateIndex
CREATE INDEX "mood_entries_createdAt_idx" ON "mood_entries"("createdAt");

-- CreateIndex
CREATE INDEX "mood_entries_userId_createdAt_idx" ON "mood_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "mood_entries_mood_idx" ON "mood_entries"("mood");

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
