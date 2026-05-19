/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `ContactRequest` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `ContactRequest` table. All the data in the column will be lost.
  - Added the required column `clubId` to the `ContactRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerId` to the `ContactRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContactRequest" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "clubId" INTEGER NOT NULL,
ADD COLUMN     "playerId" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
