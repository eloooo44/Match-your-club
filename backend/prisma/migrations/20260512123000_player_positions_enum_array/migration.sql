CREATE TYPE "PlayerPosition" AS ENUM (
  'GK',
  'IV',
  'LV',
  'RV',
  'ZDM',
  'ZM',
  'ZOM',
  'ST',
  'LF',
  'RF'
);

ALTER TABLE "PlayerProfile"
ADD COLUMN "position_new" "PlayerPosition"[] NOT NULL DEFAULT ARRAY['ZM']::"PlayerPosition"[];

UPDATE "PlayerProfile"
SET "position_new" = mapped_positions.position_values
FROM (
  SELECT
    "id",
    array_agg(mapped_position::"PlayerPosition") AS position_values
  FROM (
    SELECT DISTINCT ON ("id", mapped_position)
      "id",
      mapped_position,
      position_order
    FROM (
      SELECT
        "id",
        CASE
          WHEN upper(trim(position_value)) IN ('GK', 'GOALKEEPER', 'TORWART', 'TORMANN') THEN 'GK'
          WHEN upper(trim(position_value)) IN ('IV', 'CB', 'CENTER BACK', 'CENTRE BACK', 'INNENVERTEIDIGER') THEN 'IV'
          WHEN upper(trim(position_value)) IN ('LV', 'LB', 'LINKSVERTEIDIGER') THEN 'LV'
          WHEN upper(trim(position_value)) IN ('RV', 'RB', 'RECHTSVERTEIDIGER') THEN 'RV'
          WHEN upper(trim(position_value)) IN ('ZDM', 'CDM', 'DEFENSIVES MITTELFELD') THEN 'ZDM'
          WHEN upper(trim(position_value)) IN ('ZM', 'CM', 'MITTELFELD') THEN 'ZM'
          WHEN upper(trim(position_value)) IN ('ZOM', 'CAM', 'OFFENSIVES MITTELFELD') THEN 'ZOM'
          WHEN upper(trim(position_value)) IN ('ST', 'STRIKER', 'FORWARD', 'ANGRIFFER', 'STUERMER', 'STURMER') THEN 'ST'
          WHEN upper(trim(position_value)) IN ('LF', 'LW', 'LINKSAUSSEN') THEN 'LF'
          WHEN upper(trim(position_value)) IN ('RF', 'RW', 'RECHTSAUSSEN') THEN 'RF'
          ELSE 'ZM'
        END AS mapped_position,
        position_order
      FROM "PlayerProfile",
      unnest(string_to_array("position", ',')) WITH ORDINALITY AS positions(position_value, position_order)
    ) AS normalized_positions
    ORDER BY "id", mapped_position, position_order
  ) AS deduped_positions
  WHERE position_order <= 3
  GROUP BY "id"
) AS mapped_positions
WHERE "PlayerProfile"."id" = mapped_positions."id";

ALTER TABLE "PlayerProfile" DROP COLUMN "position";
ALTER TABLE "PlayerProfile" RENAME COLUMN "position_new" TO "position";

ALTER TABLE "PlayerProfile"
ADD CONSTRAINT "PlayerProfile_position_max_3" CHECK (cardinality("position") BETWEEN 1 AND 3);
