-- AlterTable
CREATE SEQUENCE clubprofile_id_seq;
ALTER TABLE "ClubProfile" ALTER COLUMN "id" SET DEFAULT nextval('clubprofile_id_seq');
ALTER SEQUENCE clubprofile_id_seq OWNED BY "ClubProfile"."id";

-- AlterTable
CREATE SEQUENCE playerprofile_id_seq;
ALTER TABLE "PlayerProfile" ALTER COLUMN "id" SET DEFAULT nextval('playerprofile_id_seq');
ALTER SEQUENCE playerprofile_id_seq OWNED BY "PlayerProfile"."id";
