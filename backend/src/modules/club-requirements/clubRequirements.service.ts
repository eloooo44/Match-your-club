import prisma from "../../lib/prisma";
import { FootballSkill } from "@prisma/client";
import {
  CreateClubRequirementBody,
  UpdateClubRequirementBody,
} from "./clubRequirements.types";

const FOOTBALL_SKILL_ALIASES: Record<string, FootballSkill> = {
  REFLEXE: FootballSkill.REFLEXE,
  STRAFRAUMBEHERRSCHUNG: FootballSkill.STRAFRAUMBEHERRSCHUNG,
  ZWEIKAMPFSTAERKE: FootballSkill.ZWEIKAMPFSTAERKE,
  ZWEIKAMPFSTÄRKE: FootballSkill.ZWEIKAMPFSTAERKE,
  KOPFBALLSPIEL: FootballSkill.KOPFBALLSPIEL,
  SPIELAUFBAU: FootballSkill.SPIELAUFBAU,
  PASSGENAUIGKEIT: FootballSkill.PASSGENAUIGKEIT,
  SPIELUEBERSICHT: FootballSkill.SPIELUEBERSICHT,
  SPIELÜBERSICHT: FootballSkill.SPIELUEBERSICHT,
  TEMPO: FootballSkill.TEMPO,
  TORABSCHLUSS: FootballSkill.TORABSCHLUSS,
  DRIBBLING: FootballSkill.DRIBBLING,
  AUSDAUER: FootballSkill.AUSDAUER,
  PHYSIS: FootballSkill.PHYSIS,
  DEFENSIVARBEIT: FootballSkill.DEFENSIVARBEIT,
  PRESSING: FootballSkill.PRESSING,
  FLANKENSPIEL: FootballSkill.FLANKENSPIEL,
  BALLKONTROLLE: FootballSkill.BALLKONTROLLE,
  ABSCHLUSS: FootballSkill.ABSCHLUSS,
  "EINS-GEGEN-EINS": FootballSkill.EINS_GEGEN_EINS,
  EINS_GEGEN_EINS: FootballSkill.EINS_GEGEN_EINS,
  "HOHE BÄLLE": FootballSkill.HOHE_BAELLE,
  "HOHE BAELLE": FootballSkill.HOHE_BAELLE,
  FUßSPIEL: FootballSkill.FUSSSPIEL,
  FUSSSPIEL: FootballSkill.FUSSSPIEL,
  ABSTÖSSE: FootballSkill.ABSTOESSE,
  ABSTOESSE: FootballSkill.ABSTOESSE,
  ABSCHLÄGE: FootballSkill.ABSCHLAEGE,
  ABSCHLAEGE: FootballSkill.ABSCHLAEGE,
  SPIELERÖFFNUNG: FootballSkill.SPIELEROEFFNUNG,
  SPIELEROEFFNUNG: FootballSkill.SPIELEROEFFNUNG,
  KOMMUNIKATION: FootballSkill.KOMMUNIKATION,
  STELLUNGSSPIEL: FootballSkill.STELLUNGSSPIEL,
  FANGSICHERHEIT: FootballSkill.FANGSICHERHEIT,
  REAKTIONSSCHNELLIGKEIT: FootballSkill.REAKTIONSSCHNELLIGKEIT,
  ELFMETER: FootballSkill.ELFMETER,
  "ELFMETER-KILLER": FootballSkill.ELFMETER,
  "MITSPIELENDER TORMANN": FootballSkill.MITSPIELENDER_TORMANN,
  MITSPIELENDER_TORMANN: FootballSkill.MITSPIELENDER_TORMANN,
};

const normalizeFootballSkills = (skills: string[] | string = []) => {
  const rawSkills = Array.isArray(skills) ? skills : skills.split(",");

  return Array.from(
    new Set(
      rawSkills
        .map((skill) => {
          const normalized = String(skill).trim().toUpperCase();

          return FOOTBALL_SKILL_ALIASES[normalized];
        })
        .filter((skill): skill is FootballSkill => Boolean(skill)),
    ),
  );
};

const getClubByUserId = async (userId: number) => {
  const club = await prisma.clubProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!club) {
    throw new Error("Club profile not found");
  }

  return club;
};

export const createClubRequirement = async (
  userId: number,
  data: CreateClubRequirementBody,
) => {
  const club = await getClubByUserId(userId);

  const requirement = await prisma.clubRequirement.create({
    data: {
      clubId: club.id,

      position: data.position,

      minTempo: data.minTempo,
      minShooting: data.minShooting,
      minPassing: data.minPassing,
      minDribbling: data.minDribbling,
      minDefending: data.minDefending,
      minPhysical: data.minPhysical,

      tempoWeight: data.tempoWeight ?? 1,
      shootingWeight: data.shootingWeight ?? 1,
      passingWeight: data.passingWeight ?? 1,
      dribblingWeight: data.dribblingWeight ?? 1,
      defendingWeight: data.defendingWeight ?? 1,
      physicalWeight: data.physicalWeight ?? 1,

      requiredSkills: normalizeFootballSkills(data.requiredSkills),
      highlightedSkills: normalizeFootballSkills(data.highlightedSkills),

      description: data.description,
    },
  });

  return requirement;
};

export const getMyClubRequirements = async (userId: number) => {
  const club = await getClubByUserId(userId);

  return prisma.clubRequirement.findMany({
    where: {
      clubId: club.id,
    },
    orderBy: {
      id: "desc",
    },
  });
};

export const updateClubRequirement = async (
  userId: number,
  requirementId: number,
  data: UpdateClubRequirementBody,
) => {
  const club = await getClubByUserId(userId);

  const existingRequirement = await prisma.clubRequirement.findFirst({
    where: {
      id: requirementId,
      clubId: club.id,
    },
  });

  if (!existingRequirement) {
    throw new Error("Requirement not found");
  }

  return prisma.clubRequirement.update({
    where: {
      id: requirementId,
    },
    data: {
      ...data,
      ...(data.requiredSkills !== undefined
        ? { requiredSkills: normalizeFootballSkills(data.requiredSkills) }
        : {}),
      ...(data.highlightedSkills !== undefined
        ? { highlightedSkills: normalizeFootballSkills(data.highlightedSkills) }
        : {}),
    },
  });
};

export const deleteClubRequirement = async (
  userId: number,
  requirementId: number,
) => {
  const club = await getClubByUserId(userId);

  const existingRequirement = await prisma.clubRequirement.findFirst({
    where: {
      id: requirementId,
      clubId: club.id,
    },
  });

  if (!existingRequirement) {
    throw new Error("Requirement not found");
  }

  await prisma.clubRequirement.delete({
    where: {
      id: requirementId,
    },
  });

  return {
    message: "Requirement deleted",
  };
};
