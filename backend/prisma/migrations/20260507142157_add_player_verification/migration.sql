-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AttributeVerification" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "attribute" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributeVerification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AttributeVerification" ADD CONSTRAINT "AttributeVerification_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeVerification" ADD CONSTRAINT "AttributeVerification_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
