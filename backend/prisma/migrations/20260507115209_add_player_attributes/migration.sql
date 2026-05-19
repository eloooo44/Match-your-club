-- CreateTable
CREATE TABLE "PlayerAttributes" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "tempo" INTEGER NOT NULL,
    "shooting" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "dribbling" INTEGER NOT NULL,
    "defending" INTEGER NOT NULL,
    "physical" INTEGER NOT NULL,

    CONSTRAINT "PlayerAttributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAttributes_playerId_key" ON "PlayerAttributes"("playerId");

-- AddForeignKey
ALTER TABLE "PlayerAttributes" ADD CONSTRAINT "PlayerAttributes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
