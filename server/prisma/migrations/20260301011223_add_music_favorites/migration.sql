-- CreateTable
CREATE TABLE "music_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "trackId" VARCHAR(100) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "artist" VARCHAR(500) NOT NULL,
    "artwork" TEXT,
    "streamUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "music_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "music_favorites_userId_idx" ON "music_favorites"("userId");

-- CreateIndex
CREATE INDEX "music_favorites_userId_provider_idx" ON "music_favorites"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "music_favorites_userId_provider_trackId_key" ON "music_favorites"("userId", "provider", "trackId");

-- AddForeignKey
ALTER TABLE "music_favorites" ADD CONSTRAINT "music_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
