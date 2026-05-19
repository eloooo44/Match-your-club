/*
  Warnings:

  - You are about to drop the column `url` on the `PlayerVideo` table. All the data in the column will be lost.
  - Added the required column `videoUrl` to the `PlayerVideo` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `PlayerVideo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PlayerVideo" DROP COLUMN "url",
ADD COLUMN     "videoUrl" TEXT NOT NULL,
ALTER COLUMN "title" SET NOT NULL;
