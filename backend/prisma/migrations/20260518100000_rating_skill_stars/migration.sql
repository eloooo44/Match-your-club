CREATE TABLE "RatingSkill" (
  "id" SERIAL NOT NULL,
  "ratingId" INTEGER NOT NULL,
  "skill" "FootballSkill" NOT NULL,
  "stars" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RatingSkill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RatingSkill_ratingId_skill_key" ON "RatingSkill"("ratingId", "skill");

ALTER TABLE "RatingSkill"
ADD CONSTRAINT "RatingSkill_ratingId_fkey"
FOREIGN KEY ("ratingId") REFERENCES "Rating"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
