/*
  Warnings:

  - You are about to drop the `music_favorites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "music_favorites" DROP CONSTRAINT "music_favorites_userId_fkey";

-- DropTable
DROP TABLE "music_favorites";
