import prisma from "../../lib/prisma";
import { FootballSkill, PlayerPosition } from "@prisma/client";
import { getMatchesForPlayer as getPlayerMatches } from "../players/player.service";

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

  if (playerPositions.includes(required)) return 1;
  if (required === PlayerPosition.GK || playerPositions.includes(PlayerPosition.GK)) return 0;

  const hasSharedGroup = POSITION_GROUPS.some(
    (group) =>
      group.includes(required) &&
      playerPositions.some((position) => group.includes(position)),
  );

  return hasSharedGroup ? 0.6 : 0.1;
};

export const getMatchesForClub = async (userId: number) => {
  const club = await prisma.clubProfile.findUnique({
    where: {
      userId,
    },
    include: {
      requirements: true,
    },
  });

  if (!club) {
    throw new Error("Club profile not found");
  }

  const players = await prisma.playerProfile.findMany({
    include: {
      attributes: true,
      ratings: true,
    },
  });

  const matches = [];

  for (const requirement of club.requirements) {
    for (const player of players) {
      const explanation: any = {};
      const playerSkills = new Set(player.skills);
      const highlightedSkills = new Set(player.highlightedSkills);
      const requiredSkills = requirement.requiredSkills ?? [];
      const importantSkills = requirement.highlightedSkills ?? [];
      const explicitSkillScore = requiredSkills.length > 0
        ? requiredSkills.reduce((sum, skill) => {
            if (!playerSkills.has(skill)) return sum;

            return sum + (highlightedSkills.has(skill) ? 1 : 0.8);
          }, 0) / requiredSkills.length
        : 0;
      const importantSkillBonus = importantSkills.length > 0
        ? importantSkills.reduce(
            (sum, skill) => sum + (highlightedSkills.has(skill) ? 1 : 0),
            0,
          ) / importantSkills.length
        : 0;
      const positionSkills =
        POSITION_SKILLS[requirement.position as PlayerPosition] ?? [];
      const positionSkillScore =
        positionSkills.length > 0
          ? positionSkills.reduce(
              (sum, skill) => sum + (playerSkills.has(skill) ? 1 : 0),
              0,
            ) / positionSkills.length
          : 0;
      const combinedSkillScore =
        requiredSkills.length > 0 || importantSkills.length > 0
          ? Math.min(explicitSkillScore + importantSkillBonus * 0.2, 1)
          : positionSkillScore * 0.8;
      const positionScore = player.position.includes(requirement.position as PlayerPosition)
        ? 1
        : calculatePositionProximity(player.position, requirement.position);

      if (requirement.position === "GK") {
        const matchScore =
          requiredSkills.length > 0 || importantSkills.length > 0
            ? combinedSkillScore
            : player.position.includes(PlayerPosition.GK)
              ? 1
              : 0;

        if (matchScore <= 0) continue;

        matches.push({
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          location: player.location,
          description: player.description,
          profileImagePath: player.profileImagePath,
          profileImageUrl: player.profileImageUrl,
          matchScore,
          performanceScore: matchScore,
          trustScore: 0,
          explanation: {
            skills: {
              player: player.skills,
              highlighted: player.highlightedSkills,
              required: requiredSkills,
              important: importantSkills,
              score: combinedSkillScore,
            },
          },
        });
        continue;
      }

      if (!player.attributes) continue;

      let weightedScore = 0;
      let totalWeight = 0;

      const evaluate = (
        key: string,
        playerValue: number,
        requiredValue: number,
        weight: number,
      ) => {
        totalWeight += weight;

        const rawRatio = Math.min(playerValue / requiredValue, 1);

        const ratio = Math.pow(rawRatio, 2);

        weightedScore += ratio * weight;

        explanation[key] = {
          player: playerValue,
          required: requiredValue,
          score: ratio,
          weight,
        };
      };

      evaluate(
        "tempo",
        player.attributes.tempo,
        requirement.minTempo,
        requirement.tempoWeight,
      );

      evaluate(
        "shooting",
        player.attributes.shooting,
        requirement.minShooting,
        requirement.shootingWeight,
      );

      evaluate(
        "passing",
        player.attributes.passing,
        requirement.minPassing,
        requirement.passingWeight,
      );

      evaluate(
        "dribbling",
        player.attributes.dribbling,
        requirement.minDribbling,
        requirement.dribblingWeight,
      );

      evaluate(
        "defending",
        player.attributes.defending,
        requirement.minDefending,
        requirement.defendingWeight,
      );

      evaluate(
        "physical",
        player.attributes.physical,
        requirement.minPhysical,
        requirement.physicalWeight,
      );

      const attributeScore = weightedScore / totalWeight;
      const positionAttributeWeights =
        POSITION_ATTRIBUTE_WEIGHTS[
          requirement.position as Exclude<PlayerPosition, "GK">
        ];
      const evaluateCriticalAttribute = (
        key: keyof typeof player.attributes,
        requiredValue: number,
      ) =>
        Math.pow(
          Math.min(player.attributes![key] / Math.max(requiredValue, 1), 1),
          2,
        );
      const criticalAttributeScore = positionAttributeWeights
        ? Object.entries(positionAttributeWeights).reduce(
            (sum, [key, weight]) => {
              const requiredValue =
                requirement[
                  `min${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof typeof requirement
                ];

              return (
                sum +
                evaluateCriticalAttribute(
                  key as keyof typeof player.attributes,
                  Number(requiredValue),
                ) *
                  Number(weight)
              );
            },
            0,
          ) /
          Object.values(positionAttributeWeights).reduce(
            (sum, weight) => sum + Number(weight),
            0,
          )
        : attributeScore;
      const baseMatchScore =
        attributeScore * 0.45 +
        criticalAttributeScore * 0.25 +
        combinedSkillScore * 0.2 +
        positionScore * 0.1;
      const positionCap =
        positionScore >= 1 ? 1 : 0.48 + positionScore * 0.42;
      const skillAdjustedCap =
        combinedSkillScore < 0.5
          ? Math.max(positionCap - 0.08, 0.35)
          : positionCap;
      const matchScore = Math.min(baseMatchScore, skillAdjustedCap);

      let trustScore = 0;

      if (player.ratings.length > 0) {
        const average =
          player.ratings.reduce((sum, rating) => sum + rating.score, 0) /
          player.ratings.length;

        trustScore = average <= 5 ? average / 5 : average / 99;
      }

      matches.push({
        playerId: player.id,
        playerName: player.name,
        position: player.position,

        location: player.location,
        description: player.description,

        profileImagePath: player.profileImagePath,

        profileImageUrl: player.profileImageUrl,

        matchScore: matchScore * 0.8 + trustScore * 0.2,

        performanceScore: attributeScore,

        trustScore,

        explanation,
      });
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};

export const getMatchesForPlayer = async (userId: number) => {
  const matches = await getPlayerMatches(userId);

  return matches.filter((match) => match.matchScore > 75);
};
