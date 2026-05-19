-- AlterTable
ALTER TABLE "ClubProfile" ADD COLUMN     "phone" VARCHAR(32);

-- AlterTable
ALTER TABLE "PlayerProfile" ALTER COLUMN "position" DROP DEFAULT;
