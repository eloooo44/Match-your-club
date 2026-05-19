-- CreateTable
CREATE TABLE "ClubRequirement" (
    "id" SERIAL NOT NULL,
    "clubId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "minTempo" INTEGER NOT NULL,
    "minShooting" INTEGER NOT NULL,
    "minPassing" INTEGER NOT NULL,
    "minDribbling" INTEGER NOT NULL,
    "minDefending" INTEGER NOT NULL,
    "minPhysical" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "ClubRequirement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClubRequirement" ADD CONSTRAINT "ClubRequirement_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
