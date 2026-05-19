-- AlterTable
ALTER TABLE "PlayerVideo" ADD COLUMN     "videoPath" TEXT,
ALTER COLUMN "videoUrl" DROP NOT NULL;
