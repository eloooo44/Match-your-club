-- Store player birthdates exactly as DD/MM/YYYY text.
ALTER TABLE "PlayerProfile"
ALTER COLUMN "birthdate" TYPE TEXT
USING to_char("birthdate", 'DD/MM/YYYY');
