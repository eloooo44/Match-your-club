import prisma from "../../lib/prisma";
import { FootballSkill, PlayerPosition } from "@prisma/client";
import type { ClubRequirement, PlayerProfile, Prisma } from "@prisma/client";
import { fetchOefbPlayerProfile } from "../oefb/oefb.service";
import type { OefbStatistic } from "../oefb/oefb.types";
import type {
  CreatePlayerProfileBody,
  SearchPlayersFilters,
  UpdatePlayerProfileBody,
} from "./player.types";

const PLAYER_POSITIONS = new Set<PlayerPosition>([
  PlayerPosition.GK,
  PlayerPosition.IV,
  PlayerPosition.LV,
  PlayerPosition.RV,
  PlayerPosition.ZDM,
  PlayerPosition.ZM,
  PlayerPosition.ZOM,
  PlayerPosition.ST,
  PlayerPosition.LF,
  PlayerPosition.RF,
]);

const FOOTBALL_SKILLS = new Set<FootballSkill>([
  FootballSkill.REFLEXE,
  FootballSkill.STRAFRAUMBEHERRSCHUNG,
  FootballSkill.ZWEIKAMPFSTAERKE,
  FootballSkill.KOPFBALLSPIEL,
  FootballSkill.SPIELAUFBAU,
  FootballSkill.PASSGENAUIGKEIT,
  FootballSkill.SPIELUEBERSICHT,
  FootballSkill.TEMPO,
  FootballSkill.TORABSCHLUSS,
  FootballSkill.DRIBBLING,
]);

const POSITION_ALIASES: Record<string, PlayerPosition> = {
  GK: PlayerPosition.GK,
  GOALKEEPER: PlayerPosition.GK,
  TORWART: PlayerPosition.GK,
  TORMANN: PlayerPosition.GK,
  IV: PlayerPosition.IV,
  CB: PlayerPosition.IV,
  "CENTER BACK": PlayerPosition.IV,
  "CENTRE BACK": PlayerPosition.IV,
  INNENVERTEIDIGER: PlayerPosition.IV,
  LV: PlayerPosition.LV,
  LB: PlayerPosition.LV,
  LINKSVERTEIDIGER: PlayerPosition.LV,
  RV: PlayerPosition.RV,
  RB: PlayerPosition.RV,
  RECHTSVERTEIDIGER: PlayerPosition.RV,
  ZDM: PlayerPosition.ZDM,
  CDM: PlayerPosition.ZDM,
  "DEFENSIVES MITTELFELD": PlayerPosition.ZDM,
  ZM: PlayerPosition.ZM,
  CM: PlayerPosition.ZM,
  MITTELFELD: PlayerPosition.ZM,
  ZOM: PlayerPosition.ZOM,
  CAM: PlayerPosition.ZOM,
  "OFFENSIVES MITTELFELD": PlayerPosition.ZOM,
  ST: PlayerPosition.ST,
  STRIKER: PlayerPosition.ST,
  FORWARD: PlayerPosition.ST,
  ANGRIFFER: PlayerPosition.ST,
  STUERMER: PlayerPosition.ST,
  STURMER: PlayerPosition.ST,
  LF: PlayerPosition.LF,
  LW: PlayerPosition.LF,
  LINKSAUSSEN: PlayerPosition.LF,
  RF: PlayerPosition.RF,
  RW: PlayerPosition.RF,
  RECHTSAUSSEN: PlayerPosition.RF,
};

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
  HOHE_BAELLE: FootballSkill.HOHE_BAELLE,
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

const normalizePlayerPosition = (position: string) => {
  const normalized = position.trim().toUpperCase();

  if (PLAYER_POSITIONS.has(normalized as PlayerPosition)) {
    return normalized as PlayerPosition;
  }

  return POSITION_ALIASES[normalized];
};

const normalizePlayerPositions = (
  positions: CreatePlayerProfileBody["position"],
) => {
  const rawPositions = Array.isArray(positions)
    ? positions
    : positions.split(",");

  const normalizedPositions = rawPositions
    .map((position) => normalizePlayerPosition(position))
    .filter((position): position is PlayerPosition => Boolean(position));

  return Array.from(new Set(normalizedPositions)).slice(0, 3);
};

const normalizeFootballSkill = (skill: string) => {
  const normalized = skill.trim().toUpperCase();

  if (FOOTBALL_SKILLS.has(normalized as FootballSkill)) {
    return normalized as FootballSkill;
  }

  return FOOTBALL_SKILL_ALIASES[normalized];
};

const normalizeFootballSkills = (
  skills: CreatePlayerProfileBody["skills"] = [],
) => {
  const rawSkills = Array.isArray(skills) ? skills : skills.split(",");
  const normalizedSkills = rawSkills
    .map((skill) => normalizeFootballSkill(String(skill)))
    .filter((skill): skill is FootballSkill => Boolean(skill));

  return Array.from(new Set(normalizedSkills));
};

const normalizeTeamCategory = (value?: string) => {
  const normalized = value?.trim().toUpperCase() ?? "";

  if (/^U(?:[1-9]|1[0-8])$/.test(normalized)) {
    return "Nachwuchs";
  }

  return value?.trim() || undefined;
};

const getPreferredOefbStat = (statistics: OefbStatistic[]) => {
  const preferredCategories = ["KM", "1B", "RES", "U23", "U18", "U17", "U16"];

  return (
    preferredCategories
      .map((category) =>
        statistics.find((stat) => {
          const statCategory = stat.category?.trim().toUpperCase();
          const statLabel = stat.label?.trim().toUpperCase();

          return statCategory === category || statLabel === category;
        }),
      )
      .find(Boolean) ??
    statistics.find((stat) => {
      const category = (stat.category ?? stat.label)?.trim().toUpperCase() ?? "";

      return !/^U\d{1,2}$/.test(category);
    }) ??
    statistics[0]
  );
};

const toNullableNumber = (value: number | undefined) => value ?? null;

const syncPlayerFromOefb = async (player: {
  id: number;
  oefbProfileUrl: string | null;
}) => {
  if (!player.oefbProfileUrl) {
    return;
  }

  try {
    const profile = await fetchOefbPlayerProfile(player.oefbProfileUrl);
    const currentClub = profile.currentClub.name?.trim() ?? "";
    const preferredStat = getPreferredOefbStat(profile.statistics);
    const teamCategory = normalizeTeamCategory(
      preferredStat?.category ?? preferredStat?.label,
    );
    for (const entry of profile.history) {
      const clubName = entry.club.trim();

      if (!clubName) {
        continue;
      }

      const isCurrentClub =
        currentClub &&
        clubName.toLowerCase() === currentClub.toLowerCase();
      const existingEntry = await prisma.playerClubHistory.findFirst({
        where: {
          playerId: player.id,
          clubName: {
            equals: clubName,
            mode: "insensitive",
          },
        },
        orderBy: {
          id: "asc",
        },
      });
      const data = {
        clubName,
        startDate: entry.from ? new Date(entry.from) : null,
        endDate: entry.to ? new Date(entry.to) : null,
        ...(isCurrentClub && preferredStat
          ? {
              teamCategory,
              games: toNullableNumber(preferredStat.games),
              goals: toNullableNumber(preferredStat.goals),
              yellowCards: toNullableNumber(preferredStat.yellowCards),
              redCards: toNullableNumber(preferredStat.redCards),
            }
          : {}),
      };

      if (existingEntry) {
        await prisma.playerClubHistory.update({
          where: {
            id: existingEntry.id,
          },
          data,
        });
      } else {
        await prisma.playerClubHistory.create({
          data: {
            playerId: player.id,
            relationType: "PLAYER",
            ...data,
          },
        });
      }
    }
  } catch (error) {
    console.warn(
      `ÖFB-Live-Aktualisierung für Spieler ${player.id} fehlgeschlagen. Gespeicherte Daten werden verwendet.`,
      error,
    );
  }
};

const syncPlayerByUserIdFromOefb = async (userId: number) => {
  const player = await prisma.playerProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      oefbProfileUrl: true,
    },
  });

  if (player) {
    await syncPlayerFromOefb(player);
  }
};

const syncAllPlayersFromOefb = async () => {
  const players = await prisma.playerProfile.findMany({
    where: {
      oefbProfileUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      oefbProfileUrl: true,
    },
  });

  await Promise.all(players.map((player) => syncPlayerFromOefb(player)));
};

export const createPlayerProfile = async (
  userId: number,
  data: CreatePlayerProfileBody,
) => {
  const positions = normalizePlayerPositions(data.position);

  if (positions.length === 0) {
    throw new Error("Please select at least one valid player position");
  }

  const existingClub = await prisma.clubProfile.findUnique({
    where: {
      userId,
    },
  });

  if (existingClub) {
    throw new Error("User already has a club profile");
  }

  const existingProfile = await prisma.playerProfile.findUnique({
    where: {
      userId,
    },
  });

  if (existingProfile) {
    throw new Error("Profile already exists");
  }

  const profile = await prisma.playerProfile.create({
    data: {
      userId,
      name: data.name,
      birthdate: data.birthdate,
      position: positions,
      location: data.location,
      description: data.description,
      openToPlay: data.openToPlay ?? true,
      profileImageUrl: data.profileImageUrl,
      oefbProfileUrl: data.oefbProfileUrl,
      skills: normalizeFootballSkills(data.skills),
      highlightedSkills: normalizeFootballSkills(data.highlightedSkills),
      preferredFoot: data.preferredFoot,
      weakFootRating: data.weakFootRating,
      heightCm: data.heightCm,
    },
  });

  return profile;
};

export const getMyProfile = async (userId: number) => {
  await syncPlayerByUserIdFromOefb(userId);

  return prisma.playerProfile.findUnique({
    where: {
      userId,
    },
    include: {
      attributes: true,
      videos: true,
      clubHistory: {
        orderBy: {
          startDate: "desc",
        },
      },
      ratings: {
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          trialTraining: {
            include: {
              club: true,
            },
          },
          skillRatings: true,
        },
      },
      applications: {
        include: {
          club: true,
        },
      },
      trialTrainings: {
        include: {
          club: true,
        },
      },
      contactRequests: {
        include: {
          club: true,
        },
      },
    },
  });
};

const calculatePlayerClubMatches = async (
  player: NonNullable<Awaited<ReturnType<typeof getMyProfile>>>,
) => {
  if (!player.attributes) {
    return [];
  }

  const clubs = await prisma.clubProfile.findMany({
    include: {
      requirements: true,
    },
  });

  const matches = clubs
    .map((club) => {
      const matchingRequirements = club.requirements.filter((requirement) =>
        player.position.includes(requirement.position as PlayerPosition),
      );

      if (matchingRequirements.length === 0) {
        return undefined;
      }

      const bestScore = matchingRequirements.reduce((best, requirement) => {
        const weightedValues = [
          {
            playerValue: player.attributes!.tempo,
            requiredValue: requirement.minTempo,
            weight: requirement.tempoWeight,
          },
          {
            playerValue: player.attributes!.shooting,
            requiredValue: requirement.minShooting,
            weight: requirement.shootingWeight,
          },
          {
            playerValue: player.attributes!.passing,
            requiredValue: requirement.minPassing,
            weight: requirement.passingWeight,
          },
          {
            playerValue: player.attributes!.dribbling,
            requiredValue: requirement.minDribbling,
            weight: requirement.dribblingWeight,
          },
          {
            playerValue: player.attributes!.defending,
            requiredValue: requirement.minDefending,
            weight: requirement.defendingWeight,
          },
          {
            playerValue: player.attributes!.physical,
            requiredValue: requirement.minPhysical,
            weight: requirement.physicalWeight,
          },
        ];

        const totalWeight = weightedValues.reduce(
          (sum, value) => sum + value.weight,
          0,
        );
        const weightedScore =
          weightedValues.reduce((sum, value) => {
            const ratio = Math.min(value.playerValue / value.requiredValue, 1);
            return sum + Math.pow(ratio, 2) * value.weight;
          }, 0) / totalWeight;

        return Math.max(best, weightedScore);
      }, 0);

      return {
        id: club.id,
        clubName: club.clubName,
        league: club.league,
        location: club.location,
        logoPath: club.logoPath,
        matchScore: Math.round(bestScore * 100),
      };
    })
    .filter((match): match is NonNullable<typeof match> => Boolean(match))
    .sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};

export const getMatchesForPlayer = async (userId: number) => {
  const player = await getMyProfile(userId);

  if (!player) {
    throw new Error("Player profile not found");
  }

  return calculatePlayerClubMatches(player);
};

export const getPlayerDashboard = async (userId: number) => {
  const player = await getMyProfile(userId);

  if (!player) {
    throw new Error("Player profile not found");
  }

  const matches = await getMatchesForPlayer(userId);
  const interactedClubMap = new Map<
    number,
    {
      id: number;
      clubName: string;
      league: string;
      location: string;
      logoPath: string | null;
      interactionTypes: Set<string>;
    }
  >();

  const addClubInteraction = (
    club: {
      id: number;
      clubName: string;
      league: string;
      location: string;
      logoPath: string | null;
    },
    interactionType: string,
  ) => {
    const existing = interactedClubMap.get(club.id);

    if (existing) {
      existing.interactionTypes.add(interactionType);
      return;
    }

    interactedClubMap.set(club.id, {
      ...club,
      interactionTypes: new Set([interactionType]),
    });
  };

  for (const application of player.applications) {
    addClubInteraction(application.club, "Bewerbung");
  }

  for (const trialTraining of player.trialTrainings) {
    addClubInteraction(trialTraining.club, "Probetraining");
  }

  for (const contactRequest of player.contactRequests) {
    addClubInteraction(contactRequest.club, "Kontakt");
  }

  const interactedClubs = Array.from(interactedClubMap.values()).map(
    (club) => ({
      ...club,
      interactionTypes: Array.from(club.interactionTypes),
    }),
  );

  return {
    counts: {
      applications: player.applications.length,
      trialTrainings: player.trialTrainings.length,
      matches: matches.length,
      interactedClubs: interactedClubs.length,
    },
    matches: matches.slice(0, 5),
    interactedClubs,
  };
};

export const getAllPlayers = async () => {
  await syncAllPlayersFromOefb();

  return prisma.playerProfile.findMany({
    include: {
      attributes: true,
      videos: true,
      clubHistory: {
        orderBy: {
          startDate: "desc",
        },
      },
      ratings: {
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          trialTraining: {
            include: {
              club: true,
            },
          },
          skillRatings: true,
        },
      },
      trialTrainings: {
        where: {
          status: "COMPLETED",
        },
        include: {
          club: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const updateMyProfile = async (
  userId: number,
  data: UpdatePlayerProfileBody,
) => {
  const updateData: Prisma.PlayerProfileUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.birthdate !== undefined) updateData.birthdate = data.birthdate;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.openToPlay !== undefined) updateData.openToPlay = data.openToPlay;
  if (data.oefbProfileUrl !== undefined)
    updateData.oefbProfileUrl = data.oefbProfileUrl;
  if (data.skills !== undefined)
    updateData.skills = normalizeFootballSkills(data.skills);
  if (data.highlightedSkills !== undefined)
    updateData.highlightedSkills = normalizeFootballSkills(data.highlightedSkills);
  if (data.preferredFoot !== undefined)
    updateData.preferredFoot = data.preferredFoot;
  if (data.heightCm !== undefined) updateData.heightCm = data.heightCm;
  if (data.weakFootRating !== undefined) {
    updateData.weakFootRating = data.weakFootRating;
  }

  if (data.position !== undefined) {
    const positions = normalizePlayerPositions(data.position);

    if (positions.length === 0) {
      throw new Error("Please select at least one valid player position");
    }

    updateData.position = positions;
  }

  return prisma.playerProfile.update({
    where: {
      userId,
    },
    data: updateData,
    include: {
      attributes: true,
      videos: true,
      clubHistory: {
        orderBy: {
          startDate: "desc",
        },
      },
      ratings: {
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          trialTraining: {
            include: {
              club: true,
            },
          },
          skillRatings: true,
        },
      },
    },
  });
};

export const deletePlayer = async (id: number) => {
  await prisma.playerAttributes.deleteMany({
    where: {
      playerId: id,
    },
  });

  await prisma.rating.deleteMany({
    where: {
      playerId: id,
    },
  });

  await prisma.recommendation.deleteMany({
    where: {
      toPlayerId: id,
    },
  });

  await prisma.attributeVerification.deleteMany({
    where: {
      playerId: id,
    },
  });

  return prisma.playerProfile.delete({
    where: {
      id,
    },
  });
};

export const deleteOwnPlayer = async (id: number, userId: number) => {
  const player = await prisma.playerProfile.findUnique({
    where: {
      id,
    },
    select: {
      userId: true,
    },
  });

  if (!player) {
    throw new Error("Player profile not found");
  }

  if (player.userId !== userId) {
    throw new Error("You can only delete your own player profile");
  }

  return deletePlayer(id);
};

export const deleteMyPlayerAccount = async (userId: number) => {
  const player = await prisma.playerProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!player) {
    throw new Error("Player profile not found");
  }

  await prisma.$transaction([
    prisma.ratingSkill.deleteMany({
      where: {
        rating: {
          fromUserId: userId,
        },
      },
    }),
    prisma.rating.deleteMany({
      where: {
        fromUserId: userId,
      },
    }),
    prisma.recommendation.deleteMany({
      where: {
        fromUserId: userId,
      },
    }),
    prisma.attributeVerification.deleteMany({
      where: {
        fromUserId: userId,
      },
    }),
    prisma.user.delete({
      where: {
        id: userId,
      },
    }),
  ]);
};

export const uploadPlayerImage = async (
  playerId: number,
  imagePath: string,
) => {
  return prisma.playerProfile.update({
    where: {
      id: playerId,
    },

    data: {
      profileImagePath: imagePath,
    },
  });
};

export const updatePlayerImageUrl = async (
  playerId: number,
  profileImageUrl: string,
) => {
  return prisma.playerProfile.update({
    where: {
      id: playerId,
    },

    data: {
      profileImageUrl,
    },
  });
};

const toBoolean = (value?: string) => {
  if (value === "true") return true;

  if (value === "false") return false;

  return undefined;
};

const toNumber = (value?: string, fallback = 0) => {
  if (!value) return fallback;

  const parsed = Number(value);

  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBirthdate = (birthdate: string) => {
  const slashMatch = birthdate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(birthdate);

  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const calculateAge = (birthdate: string) => {
  const birthday = parseBirthdate(birthdate);

  if (!birthday) {
    return undefined;
  }

  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDelta = today.getMonth() - birthday.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthday.getDate())
  ) {
    age -= 1;
  }

  return age;
};

const normalizePositionFilter = (position?: string) => {
  if (!position?.trim()) {
    return undefined;
  }

  const normalizedPosition = normalizePlayerPosition(position);

  if (!normalizedPosition) {
    return undefined;
  }

  return {
    position: {
      has: normalizedPosition,
    },
  } satisfies Prisma.PlayerProfileWhereInput;
};

const calculateOverallScore = (player: {
  attributes: {
    tempo: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  } | null;
}) => {
  if (!player.attributes) return 0;

  const { tempo, shooting, passing, dribbling, defending, physical } =
    player.attributes;

  return (tempo + shooting + passing + dribbling + defending + physical) / 6;
};

const calculateRatingAttributeScore = (rating: {
  score: number;
  tempo?: number | null;
  shooting?: number | null;
  passing?: number | null;
  dribbling?: number | null;
  defending?: number | null;
  physical?: number | null;
}) => {
  const values = [
    rating.tempo,
    rating.shooting,
    rating.passing,
    rating.dribbling,
    rating.defending,
    rating.physical,
  ];

  if (values.every((value) => typeof value === "number")) {
    return (
      (values as number[]).reduce((sum, value) => sum + value, 0) /
      values.length
    );
  }

  return rating.score;
};

const POSITION_GROUPS: PlayerPosition[][] = [
  [PlayerPosition.ST, PlayerPosition.LF, PlayerPosition.RF, PlayerPosition.ZOM],
  [PlayerPosition.ZOM, PlayerPosition.ZM, PlayerPosition.ZDM],
  [PlayerPosition.LV, PlayerPosition.RV, PlayerPosition.LF, PlayerPosition.RF],
  [PlayerPosition.IV, PlayerPosition.ZDM],
  [PlayerPosition.LV, PlayerPosition.RV, PlayerPosition.IV, PlayerPosition.ZDM],
];

const POSITION_ATTRIBUTE_WEIGHTS: Record<
  Exclude<PlayerPosition, "GK">,
  Partial<Record<"tempo" | "shooting" | "passing" | "dribbling" | "defending" | "physical", number>>
> = {
  [PlayerPosition.ST]: { shooting: 3, tempo: 2, physical: 2 },
  [PlayerPosition.LF]: { tempo: 3, dribbling: 3, shooting: 2, passing: 1 },
  [PlayerPosition.RF]: { tempo: 3, dribbling: 3, shooting: 2, passing: 1 },
  [PlayerPosition.ZOM]: { passing: 3, dribbling: 2, shooting: 2 },
  [PlayerPosition.ZM]: { passing: 3, dribbling: 1, defending: 1, physical: 1 },
  [PlayerPosition.ZDM]: { defending: 3, physical: 2, passing: 2 },
  [PlayerPosition.IV]: { defending: 3, physical: 2, passing: 1 },
  [PlayerPosition.LV]: { tempo: 2, defending: 2, physical: 2, passing: 1, dribbling: 1 },
  [PlayerPosition.RV]: { tempo: 2, defending: 2, physical: 2, passing: 1, dribbling: 1 },
};

const POSITION_SKILLS: Record<PlayerPosition, FootballSkill[]> = {
  [PlayerPosition.GK]: [
    FootballSkill.REFLEXE,
    FootballSkill.STRAFRAUMBEHERRSCHUNG,
    FootballSkill.ABSTOESSE,
    FootballSkill.SPIELEROEFFNUNG,
    FootballSkill.FANGSICHERHEIT,
    FootballSkill.STELLUNGSSPIEL,
  ],
  [PlayerPosition.ST]: [
    FootballSkill.ABSCHLUSS,
    FootballSkill.TEMPO,
    FootballSkill.DRIBBLING,
    FootballSkill.BALLKONTROLLE,
    FootballSkill.KOPFBALLSPIEL,
  ],
  [PlayerPosition.LF]: [
    FootballSkill.TEMPO,
    FootballSkill.DRIBBLING,
    FootballSkill.FLANKENSPIEL,
    FootballSkill.BALLKONTROLLE,
  ],
  [PlayerPosition.RF]: [
    FootballSkill.TEMPO,
    FootballSkill.DRIBBLING,
    FootballSkill.FLANKENSPIEL,
    FootballSkill.BALLKONTROLLE,
  ],
  [PlayerPosition.ZOM]: [
    FootballSkill.PASSGENAUIGKEIT,
    FootballSkill.SPIELUEBERSICHT,
    FootballSkill.BALLKONTROLLE,
    FootballSkill.ABSCHLUSS,
  ],
  [PlayerPosition.ZM]: [
    FootballSkill.PASSGENAUIGKEIT,
    FootballSkill.SPIELUEBERSICHT,
    FootballSkill.SPIELAUFBAU,
    FootballSkill.AUSDAUER,
  ],
  [PlayerPosition.ZDM]: [
    FootballSkill.DEFENSIVARBEIT,
    FootballSkill.ZWEIKAMPFSTAERKE,
    FootballSkill.PASSGENAUIGKEIT,
    FootballSkill.PHYSIS,
    FootballSkill.SPIELAUFBAU,
  ],
  [PlayerPosition.IV]: [
    FootballSkill.DEFENSIVARBEIT,
    FootballSkill.ZWEIKAMPFSTAERKE,
    FootballSkill.KOPFBALLSPIEL,
    FootballSkill.PHYSIS,
  ],
  [PlayerPosition.LV]: [
    FootballSkill.TEMPO,
    FootballSkill.AUSDAUER,
    FootballSkill.DEFENSIVARBEIT,
    FootballSkill.FLANKENSPIEL,
  ],
  [PlayerPosition.RV]: [
    FootballSkill.TEMPO,
    FootballSkill.AUSDAUER,
    FootballSkill.DEFENSIVARBEIT,
    FootballSkill.FLANKENSPIEL,
  ],
};

const calculatePositionProximity = (
  playerPositions: PlayerPosition[],
  requirementPosition: string,
) => {
  const required = requirementPosition as PlayerPosition;

  if (playerPositions.includes(required)) {
    return 1;
  }

  if (required === PlayerPosition.GK || playerPositions.includes(PlayerPosition.GK)) {
    return 0;
  }

  const hasSharedGroup = POSITION_GROUPS.some(
    (group) =>
      group.includes(required) &&
      playerPositions.some((position) => group.includes(position)),
  );

  return hasSharedGroup ? 0.6 : 0.1;
};

const calculateSkillFit = (
  playerSkills: Set<FootballSkill>,
  highlightedSkills: Set<FootballSkill>,
  requiredSkills: FootballSkill[],
  importantSkills: FootballSkill[],
) => {
  const skillScore = requiredSkills.length > 0
    ? requiredSkills.reduce((sum, skill) => {
        if (!playerSkills.has(skill)) {
          return sum;
        }

        return sum + (highlightedSkills.has(skill) ? 1 : 0.8);
      }, 0) / requiredSkills.length
    : 0;
  const importantSkillBonus = importantSkills.length > 0
    ? importantSkills.reduce((sum, skill) => {
        if (!highlightedSkills.has(skill)) {
          return sum;
        }

        return sum + 1;
      }, 0) / importantSkills.length
    : 0;

  return Math.min(skillScore + importantSkillBonus * 0.2, 1);
};

const calculateClubFit = (
  player: Pick<PlayerProfile, "position"> & {
    skills?: FootballSkill[];
    highlightedSkills?: FootballSkill[];
    attributes: {
      tempo: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defending: number;
      physical: number;
    } | null;
  },
  requirements: ClubRequirement[],
) => {
  if (requirements.length === 0) {
    return null;
  }

  const positionRequirements = requirements.filter((requirement) =>
    player.position.includes(requirement.position as PlayerPosition),
  );

  const relevantRequirements =
    positionRequirements.length > 0 ? positionRequirements : requirements;

  let bestScore = 0;

  for (const requirement of relevantRequirements) {
    const playerSkills = new Set(player.skills ?? []);
    const highlightedSkills = new Set(player.highlightedSkills ?? []);
    const requiredSkills = requirement.requiredSkills ?? [];
    const importantSkills = requirement.highlightedSkills ?? [];
    const positionSkills =
      POSITION_SKILLS[requirement.position as PlayerPosition] ?? [];
    const hasExplicitSkillRequirements =
      requiredSkills.length > 0 || importantSkills.length > 0;
    const explicitSkillScore = calculateSkillFit(
      playerSkills,
      highlightedSkills,
      requiredSkills,
      importantSkills,
    );
    const positionSkillScore =
      positionSkills.length > 0
        ? positionSkills.reduce(
            (sum, skill) => sum + (playerSkills.has(skill) ? 1 : 0),
            0,
          ) / positionSkills.length
        : 0;
    const combinedSkillScore = hasExplicitSkillRequirements
      ? explicitSkillScore
      : positionSkillScore * 0.8;

    if (requirement.position === "GK") {
      const gkScore =
        requiredSkills.length > 0 || importantSkills.length > 0
          ? combinedSkillScore
          : player.position.includes(PlayerPosition.GK)
            ? 1
            : 0;

      if (gkScore > bestScore) {
        bestScore = gkScore;
      }

      continue;
    }

    if (!player.attributes) {
      continue;
    }

    const positionScore = player.position.includes(requirement.position as PlayerPosition)
      ? 1
      : calculatePositionProximity(player.position, requirement.position);
    const evaluate = (playerValue: number, requiredValue: number) => {
      const safeRequirement = Math.max(requiredValue, 1);

      return Math.pow(Math.min(playerValue / safeRequirement, 1), 2);
    };

    const weightedScore =
      evaluate(player.attributes.tempo, requirement.minTempo) *
        requirement.tempoWeight +
      evaluate(player.attributes.shooting, requirement.minShooting) *
        requirement.shootingWeight +
      evaluate(player.attributes.passing, requirement.minPassing) *
        requirement.passingWeight +
      evaluate(player.attributes.dribbling, requirement.minDribbling) *
        requirement.dribblingWeight +
      evaluate(player.attributes.defending, requirement.minDefending) *
        requirement.defendingWeight +
      evaluate(player.attributes.physical, requirement.minPhysical) *
        requirement.physicalWeight;

    const totalWeight =
      requirement.tempoWeight +
      requirement.shootingWeight +
      requirement.passingWeight +
      requirement.dribblingWeight +
      requirement.defendingWeight +
      requirement.physicalWeight;

    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const positionAttributeWeights =
      POSITION_ATTRIBUTE_WEIGHTS[
        requirement.position as Exclude<PlayerPosition, "GK">
      ];
    const criticalAttributeScore = positionAttributeWeights
      ? Object.entries(positionAttributeWeights).reduce(
          (sum, [key, weight]) =>
            sum +
            evaluate(
              player.attributes![key as keyof typeof player.attributes],
              requirement[
                `min${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof ClubRequirement
              ] as number,
            ) *
              Number(weight),
          0,
        ) /
        Object.values(positionAttributeWeights).reduce(
          (sum, weight) => sum + Number(weight),
          0,
        )
      : score;
    const baseScore =
      score * 0.45 +
      criticalAttributeScore * 0.25 +
      combinedSkillScore * 0.2 +
      positionScore * 0.1;
    const positionCap =
      positionScore >= 1 ? 1 : 0.48 + positionScore * 0.42;
    const skillAdjustedCap =
      combinedSkillScore < 0.5
        ? Math.max(positionCap - 0.08, 0.35)
        : positionCap;
    const finalScore = Math.min(baseScore, skillAdjustedCap);

    if (finalScore > bestScore) {
      bestScore = finalScore;
    }
  }

  return bestScore;
};

export const searchPlayers = async (
  filters: SearchPlayersFilters,
  clubUserId?: number,
) => {
  await syncAllPlayersFromOefb();

  const openToPlayFilter = toBoolean(filters.openToPlay);
  const availableImmediatelyFilter = toBoolean(filters.availableImmediately);
  const verifiedFilter = toBoolean(filters.verified);
  const hasExternalRatingFilter = toBoolean(filters.hasExternalRating);
  const hasVideoFilter = toBoolean(filters.hasVideo);

  const minAge = toNumber(filters.minAge, 0);
  const maxAge = toNumber(filters.maxAge, 0);

  const minTempo = toNumber(filters.tempo, 0);
  const minShooting = toNumber(filters.shooting, 0);
  const minPassing = toNumber(filters.passing, 0);
  const minDribbling = toNumber(filters.dribbling, 0);
  const minDefending = toNumber(filters.defending, 0);
  const minPhysical = toNumber(filters.physical, 0);
  const minScore = toNumber(filters.minScore, 0);

  const whereClauses: Prisma.PlayerProfileWhereInput[] = [];

  if (openToPlayFilter === true || availableImmediatelyFilter === true) {
    whereClauses.push({
      openToPlay: true,
    });
  }

  if (openToPlayFilter === false) {
    whereClauses.push({
      openToPlay: false,
    });
  }

  if (verifiedFilter !== undefined) {
    whereClauses.push({
      verified: verifiedFilter,
    });
  }

  if (hasVideoFilter === true) {
    whereClauses.push({
      videos: {
        some: {},
      },
    });
  }

  const positionCondition = normalizePositionFilter(filters.position);

  if (positionCondition) {
    whereClauses.push(positionCondition);
  }

  if (filters.location) {
    whereClauses.push({
      location: {
        contains: filters.location,
        mode: "insensitive",
      },
    });
  }

  if (
    minTempo > 0 ||
    minShooting > 0 ||
    minPassing > 0 ||
    minDribbling > 0 ||
    minDefending > 0 ||
    minPhysical > 0
  ) {
    whereClauses.push({
      attributes: {
        is: {
          tempo: {
            gte: minTempo,
          },

          shooting: {
            gte: minShooting,
          },

          passing: {
            gte: minPassing,
          },

          dribbling: {
            gte: minDribbling,
          },

          defending: {
            gte: minDefending,
          },

          physical: {
            gte: minPhysical,
          },
        },
      },
    });
  }

  const where: Prisma.PlayerProfileWhereInput =
    whereClauses.length > 0
      ? {
          AND: whereClauses,
        }
      : {};

  const [players, club] = await Promise.all([
    prisma.playerProfile.findMany({
      where,
      include: {
        attributes: true,
        ratings: true,
        videos: true,
      },
    }),
    clubUserId
      ? prisma.clubProfile.findUnique({
          where: {
            userId: clubUserId,
          },

          include: {
            requirements: true,
          },
        })
      : Promise.resolve(null),
  ]);

  let enrichedPlayers = players
    .map((player) => {
      const overallScore = calculateOverallScore(player);

      const externalRating =
        player.ratings.length > 0
          ? player.ratings.reduce(
              (sum, rating) => sum + calculateRatingAttributeScore(rating),
              0,
            ) / player.ratings.length
          : 0;
      const externalRatingCount = player.ratings.length;

      const clubFit = club ? calculateClubFit(player, club.requirements) : null;

      return {
        ...player,
        overallScore,
        selfRating: overallScore,
        averageRating: externalRating,
        externalRating,
        ratingCount: externalRatingCount,
        externalRatingCount,
        clubFit,
        clubFitPercent: clubFit === null ? null : Math.round(clubFit * 100),
      };
    })
    .filter((player) => player.overallScore >= minScore)
    .filter((player) => {
      if (hasExternalRatingFilter === true) {
        return player.externalRatingCount > 0;
      }

      return true;
    })
    .filter((player) => {
      if (minAge <= 0 && maxAge <= 0) {
        return true;
      }

      const age = calculateAge(player.birthdate);

      if (age === undefined) {
        return false;
      }

      return (minAge <= 0 || age >= minAge) && (maxAge <= 0 || age <= maxAge);
    });

  switch (filters.sortBy) {
    case "matchScore":
      enrichedPlayers.sort((a, b) => (b.clubFit ?? -1) - (a.clubFit ?? -1));
      break;

    case "highestTempo":
      enrichedPlayers.sort(
        (a, b) => (b.attributes?.tempo ?? 0) - (a.attributes?.tempo ?? 0),
      );
      break;

    case "newestPlayers":
      enrichedPlayers.sort((a, b) => b.id - a.id);
      break;

    case "bestRated":
      enrichedPlayers.sort((a, b) => b.externalRating - a.externalRating);
      break;

    default:
      enrichedPlayers.sort((a, b) => b.overallScore - a.overallScore);
      break;
  }

  return enrichedPlayers;
};
