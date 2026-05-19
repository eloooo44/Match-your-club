DO $$
BEGIN
  CREATE TYPE "FootballSkill" AS ENUM (
    'REFLEXE',
    'STRAFRAUMBEHERRSCHUNG',
    'ZWEIKAMPFSTAERKE',
    'KOPFBALLSPIEL',
    'SPIELAUFBAU',
    'PASSGENAUIGKEIT',
    'SPIELUEBERSICHT',
    'TEMPO',
    'TORABSCHLUSS',
    'DRIBBLING'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PlayerProfile"
ADD COLUMN IF NOT EXISTS "heightCm" INTEGER;

ALTER TABLE "PlayerProfile"
ALTER COLUMN "skills" DROP DEFAULT;

CREATE OR REPLACE FUNCTION map_football_skills(skills text[])
RETURNS "FootballSkill"[] AS $$
  SELECT ARRAY(
    SELECT mapped_skill::"FootballSkill"
    FROM (
      SELECT DISTINCT CASE
        WHEN skill IN ('REFLEXE', 'Reflexe') THEN 'REFLEXE'
        WHEN skill IN ('STRAFRAUMBEHERRSCHUNG', 'Strafraumbeherrschung') THEN 'STRAFRAUMBEHERRSCHUNG'
        WHEN skill IN ('ZWEIKAMPFSTAERKE', 'ZWEIKAMPFSTÄRKE', 'Zweikampfstärke', 'Zweikampfstaerke') THEN 'ZWEIKAMPFSTAERKE'
        WHEN skill IN ('KOPFBALLSPIEL', 'Kopfballspiel') THEN 'KOPFBALLSPIEL'
        WHEN skill IN ('SPIELAUFBAU', 'Spielaufbau') THEN 'SPIELAUFBAU'
        WHEN skill IN ('PASSGENAUIGKEIT', 'Passgenauigkeit') THEN 'PASSGENAUIGKEIT'
        WHEN skill IN ('SPIELUEBERSICHT', 'SPIELÜBERSICHT', 'Spielübersicht', 'Spieluebersicht') THEN 'SPIELUEBERSICHT'
        WHEN skill IN ('TEMPO', 'Tempo') THEN 'TEMPO'
        WHEN skill IN ('TORABSCHLUSS', 'Torabschluss') THEN 'TORABSCHLUSS'
        WHEN skill IN ('DRIBBLING', 'Dribbling') THEN 'DRIBBLING'
        ELSE NULL
      END AS mapped_skill
      FROM unnest(skills) AS skill
    ) mapped
    WHERE mapped_skill IS NOT NULL
    LIMIT 3
  );
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE "PlayerProfile"
ALTER COLUMN "skills" TYPE "FootballSkill"[]
USING map_football_skills("skills");

DROP FUNCTION map_football_skills(text[]);

ALTER TABLE "PlayerProfile"
ALTER COLUMN "skills" SET DEFAULT ARRAY[]::"FootballSkill"[];
