-- Link ratings directly to the trial training they came from.
ALTER TABLE "Rating" ADD COLUMN "trialTrainingId" INTEGER;

WITH ranked_trial_ratings AS (
  SELECT
    r.id AS "ratingId",
    t.id AS "trialTrainingId",
    ROW_NUMBER() OVER (
      PARTITION BY r.id
      ORDER BY t."scheduledAt" DESC, t.id DESC
    ) AS rn
  FROM "Rating" r
  INNER JOIN "ClubProfile" c ON c."userId" = r."fromUserId"
  INNER JOIN "TrialTraining" t
    ON t."playerId" = r."playerId"
    AND t."clubId" = c.id
    AND t.status = 'COMPLETED'
  WHERE r."ratingType" = 'TRIAL'
    AND r."trialTrainingId" IS NULL
)
UPDATE "Rating" r
SET "trialTrainingId" = ranked_trial_ratings."trialTrainingId"
FROM ranked_trial_ratings
WHERE r.id = ranked_trial_ratings."ratingId"
  AND ranked_trial_ratings.rn = 1;

INSERT INTO "Rating" (
  "playerId",
  "fromUserId",
  "trialTrainingId",
  "ratingType",
  "score",
  "comment",
  "createdAt"
)
SELECT
  t."playerId",
  c."userId",
  t.id,
  'TRIAL',
  ROUND(
    (
      pa.tempo +
      pa.shooting +
      pa.passing +
      pa.dribbling +
      pa.defending +
      pa.physical
    ) / 6.0
  )::INTEGER,
  t.feedback,
  COALESCE(t."selectedDate", t."scheduledAt", CURRENT_TIMESTAMP)
FROM "TrialTraining" t
INNER JOIN "ClubProfile" c ON c.id = t."clubId"
INNER JOIN "PlayerAttributes" pa ON pa."playerId" = t."playerId"
WHERE t.status = 'COMPLETED'
  AND NOT EXISTS (
    SELECT 1
    FROM "Rating" r
    WHERE r."trialTrainingId" = t.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "Rating" r
    WHERE r."playerId" = t."playerId"
      AND r."fromUserId" = c."userId"
      AND r."ratingType" = 'TRIAL'
  );

CREATE UNIQUE INDEX "Rating_trialTrainingId_key" ON "Rating"("trialTrainingId");

ALTER TABLE "Rating" ADD CONSTRAINT "Rating_trialTrainingId_fkey"
FOREIGN KEY ("trialTrainingId") REFERENCES "TrialTraining"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
