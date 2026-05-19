ALTER TABLE "PlayerClubHistory"
ADD COLUMN "clubName" TEXT NOT NULL DEFAULT 'Unbekannter Verein';

ALTER TABLE "PlayerClubHistory"
ALTER COLUMN "clubId" DROP NOT NULL;

UPDATE "PlayerClubHistory"
SET "clubName" = "ClubProfile"."clubName"
FROM "ClubProfile"
WHERE "PlayerClubHistory"."clubId" = "ClubProfile"."id";

ALTER TABLE "PlayerClubHistory"
ALTER COLUMN "clubName" DROP DEFAULT;
