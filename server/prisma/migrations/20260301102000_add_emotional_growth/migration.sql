-- CreateTable
CREATE TABLE "emotional_growth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "delta" INTEGER DEFAULT 0,
    "consistencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emotional_growth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emotional_growth_userId_weekStart_key" ON "emotional_growth"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "emotional_growth_userId_idx" ON "emotional_growth"("userId");

-- CreateIndex
CREATE INDEX "emotional_growth_weekStart_idx" ON "emotional_growth"("weekStart");

-- AddForeignKey
ALTER TABLE "emotional_growth" ADD CONSTRAINT "emotional_growth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
