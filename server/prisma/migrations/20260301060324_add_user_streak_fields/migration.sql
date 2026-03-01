-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastReflectionAt" TIMESTAMP(3),
ADD COLUMN     "reflectionStreak" INTEGER NOT NULL DEFAULT 0;
