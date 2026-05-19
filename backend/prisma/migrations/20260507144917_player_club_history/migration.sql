-- CreateTable
CREATE TABLE "PlayerClubHistory" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "clubId" INTEGER NOT NULL,
    "relationType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerClubHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayerClubHistory" ADD CONSTRAINT "PlayerClubHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerClubHistory" ADD CONSTRAINT "PlayerClubHistory_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
