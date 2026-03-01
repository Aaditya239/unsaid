-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('WORK', 'HEALTH', 'PERSONAL', 'STUDY', 'FINANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "musicArtist" VARCHAR(255),
ADD COLUMN     "musicPlatform" VARCHAR(50) DEFAULT 'YOUTUBE',
ADD COLUMN     "musicThumbnail" TEXT,
ADD COLUMN     "musicTitle" VARCHAR(255),
ADD COLUMN     "musicUrl" TEXT,
ADD COLUMN     "musicVideoId" VARCHAR(100);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "moodTaskCorrelationData" TEXT,
ADD COLUMN     "productivityInsightsCache" TEXT;

-- CreateTable
CREATE TABLE "calm_sessions" (
    "id" TEXT NOT NULL,
    "sound" VARCHAR(100) NOT NULL,
    "duration" INTEGER NOT NULL,
    "focusMode" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calm_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "TaskCategory" NOT NULL DEFAULT 'OTHER',
    "energyLevelRequired" "EnergyLevel" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "taskDate" TEXT,
    "reminderTime" TIMESTAMP(3),
    "recurring" "RecurringType" NOT NULL DEFAULT 'NONE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "focusMinutes" INTEGER NOT NULL DEFAULT 0,
    "focusSessionsCount" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "emotionalFeedback" TEXT,
    "breakdownGenerated" BOOLEAN NOT NULL DEFAULT false,
    "burnoutFlag" BOOLEAN NOT NULL DEFAULT false,
    "scheduledStartTime" TEXT,
    "resistanceFlag" BOOLEAN NOT NULL DEFAULT false,
    "resistanceFlaggedAt" TIMESTAMP(3),
    "parentTaskId" TEXT,
    "linkedCalmSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dailyLoadScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loadLabel" TEXT NOT NULL DEFAULT 'Balanced',
    "heavyDayStreak" INTEGER NOT NULL DEFAULT 0,
    "focusScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "focusMinutesTotal" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksPlanned" INTEGER NOT NULL DEFAULT 0,
    "moodCorrelationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dominantMoodOnDay" TEXT,
    "moodIntensityAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyLetterContent" TEXT,
    "weeklyLetterDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "thumbnail" TEXT,
    "channelTitle" VARCHAR(500) NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "journalReminderTime" TEXT NOT NULL DEFAULT '20:30',
    "moodReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "moodIntervalHours" INTEGER NOT NULL DEFAULT 2,
    "aiSupportEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastMoodReminderSent" TIMESTAMP(3),
    "lastJournalReminderSent" TIMESTAMP(3),
    "lastAiSupportSent" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "dndStart" TEXT DEFAULT '21:00',
    "dndEnd" TEXT DEFAULT '09:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calm_sessions_userId_idx" ON "calm_sessions"("userId");

-- CreateIndex
CREATE INDEX "calm_sessions_createdAt_idx" ON "calm_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "calm_sessions_userId_createdAt_idx" ON "calm_sessions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "tasks_isCompleted_idx" ON "tasks"("isCompleted");

-- CreateIndex
CREATE INDEX "tasks_taskDate_idx" ON "tasks"("taskDate");

-- CreateIndex
CREATE INDEX "task_analytics_userId_idx" ON "task_analytics"("userId");

-- CreateIndex
CREATE INDEX "task_analytics_date_idx" ON "task_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "task_analytics_userId_date_key" ON "task_analytics"("userId", "date");

-- CreateIndex
CREATE INDEX "youtube_favorites_userId_idx" ON "youtube_favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_favorites_userId_videoId_key" ON "youtube_favorites"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "journal_entries_userId_isPinned_idx" ON "journal_entries"("userId", "isPinned");

-- AddForeignKey
ALTER TABLE "calm_sessions" ADD CONSTRAINT "calm_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_analytics" ADD CONSTRAINT "task_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_favorites" ADD CONSTRAINT "youtube_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
