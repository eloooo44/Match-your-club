UPDATE "Rating"
SET
  "tempo" = NULL,
  "shooting" = NULL,
  "passing" = NULL,
  "dribbling" = NULL,
  "defending" = NULL,
  "physical" = NULL
WHERE "createdAt" < TIMESTAMP '2026-05-16 00:00:00'
  AND "tempo" = "score"
  AND "shooting" = "score"
  AND "passing" = "score"
  AND "dribbling" = "score"
  AND "defending" = "score"
  AND "physical" = "score";
