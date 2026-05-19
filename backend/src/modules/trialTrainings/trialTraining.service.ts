import prisma from "../../lib/prisma";
import { FootballSkill } from "@prisma/client";

const attributeKeys = [
  "tempo",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
] as const;

const calculateAttributeScore = (
  attributes: Record<(typeof attributeKeys)[number], number>,
) => {
  return Math.round(
    attributeKeys.reduce((sum, key) => sum + attributes[key], 0) /
      attributeKeys.length,
  );
};

const normalizeSkillRatings = (
  skillRatings: unknown,
  allowedSkills: FootballSkill[] = [],
) => {
  if (!skillRatings || typeof skillRatings !== "object") {
    return [];
  }

  const allowedSkillSet = new Set(allowedSkills);
  const validSkills = new Set(Object.values(FootballSkill));

  return Object.entries(skillRatings as Record<string, unknown>)
    .map(([skill, rawStars]) => {
      const stars = Number(rawStars);
      const normalizedStars = Math.round(stars * 2) / 2;

      if (
        !validSkills.has(skill as FootballSkill) ||
        (allowedSkillSet.size > 0 && !allowedSkillSet.has(skill as FootballSkill)) ||
        !Number.isFinite(normalizedStars)
      ) {
        return null;
      }

      return {
        skill: skill as FootballSkill,
        stars: Math.min(Math.max(normalizedStars, 0.5), 5),
      };
    })
    .filter((entry): entry is { skill: FootballSkill; stars: number } =>
      Boolean(entry),
    );
};

const upsertTrialRating = async (
  trial: {
    id: number;
    playerId: number;
    feedback: string | null;
    club: {
      userId: number;
    };
    player: {
      attributes: Record<(typeof attributeKeys)[number], number> | null;
      skills: FootballSkill[];
    };
  },
  score?: number,
  comment?: string | null,
  reviewedAttributes?: Record<(typeof attributeKeys)[number], number>,
  reviewedSkills: { skill: FootballSkill; stars: number }[] = [],
) => {
  if (!trial.player.attributes) {
    return null;
  }

  const ratingAttributes = reviewedAttributes ?? trial.player.attributes;
  const ratingScore = score ?? calculateAttributeScore(ratingAttributes);

  const rating = await prisma.rating.upsert({
    where: {
      trialTrainingId: trial.id,
    },
    update: {
      score: ratingScore,
      comment: comment ?? trial.feedback,
      tempo: ratingAttributes.tempo,
      shooting: ratingAttributes.shooting,
      passing: ratingAttributes.passing,
      dribbling: ratingAttributes.dribbling,
      defending: ratingAttributes.defending,
      physical: ratingAttributes.physical,
    },
    create: {
      playerId: trial.playerId,
      fromUserId: trial.club.userId,
      trialTrainingId: trial.id,
      ratingType: "TRIAL",
      score: ratingScore,
      comment: comment ?? trial.feedback,
      tempo: ratingAttributes.tempo,
      shooting: ratingAttributes.shooting,
      passing: ratingAttributes.passing,
      dribbling: ratingAttributes.dribbling,
      defending: ratingAttributes.defending,
      physical: ratingAttributes.physical,
    },
  });

  if (reviewedSkills.length > 0) {
    await prisma.ratingSkill.deleteMany({
      where: {
        ratingId: rating.id,
      },
    });

    await prisma.ratingSkill.createMany({
      data: reviewedSkills.map((skillRating) => ({
        ratingId: rating.id,
        skill: skillRating.skill,
        stars: skillRating.stars,
      })),
    });
  }

  return rating;
};

const createTrialRating = async (
  trial: {
    id: number;
    playerId: number;
    feedback: string | null;
    club: {
      userId: number;
    };
    player: {
      attributes: Record<(typeof attributeKeys)[number], number> | null;
      skills: FootballSkill[];
    };
  },
  score: number,
  comment: string | null | undefined,
  reviewedAttributes: Record<(typeof attributeKeys)[number], number>,
  reviewedSkills: { skill: FootballSkill; stars: number }[] = [],
) => {
  const existingRating = await prisma.rating.findUnique({
    where: {
      trialTrainingId: trial.id,
    },
  });

  if (existingRating) {
    throw new Error("Diese Probetraining-Bewertung wurde bereits gespeichert.");
  }

  const rating = await prisma.rating.create({
    data: {
      playerId: trial.playerId,
      fromUserId: trial.club.userId,
      trialTrainingId: trial.id,
      ratingType: "TRIAL",
      score,
      comment,
      tempo: reviewedAttributes.tempo,
      shooting: reviewedAttributes.shooting,
      passing: reviewedAttributes.passing,
      dribbling: reviewedAttributes.dribbling,
      defending: reviewedAttributes.defending,
      physical: reviewedAttributes.physical,
    },
  });

  if (reviewedSkills.length > 0) {
    await prisma.ratingSkill.createMany({
      data: reviewedSkills.map((skillRating) => ({
        ratingId: rating.id,
        skill: skillRating.skill,
        stars: skillRating.stars,
      })),
    });
  }

  return rating;
};

export const createTrialTraining = async (data: any) => {
  const scheduledAt = new Date(data.scheduledAt);
  const existingActiveTrial = await prisma.trialTraining.findFirst({
    where: {
      playerId: data.playerId,
      clubId: data.clubId,
      status: {
        not: "COMPLETED",
      },
    },
  });

  if (existingActiveTrial) {
    throw new Error("Active trial training already exists");
  }

  return prisma.trialTraining.create({
    data: {
      playerId: data.playerId,

      clubId: data.clubId,

      scheduledAt,

      selectedDate: data.selectedDate ? new Date(data.selectedDate) : scheduledAt,

      alternativeDate1: data.alternativeDate1
        ? new Date(data.alternativeDate1)
        : null,

      alternativeDate2: data.alternativeDate2
        ? new Date(data.alternativeDate2)
        : null,

      alternativeDate3: data.alternativeDate3
        ? new Date(data.alternativeDate3)
        : null,

      notes: data.notes,
    },
  });
};

export const getClubTrialTrainings = async (clubId: number) => {
  return prisma.trialTraining.findMany({
    where: {
      clubId,
    },

    include: {
      club: true,
      rating: true,
      player: {
        include: {
          attributes: true,
        },
      },
    },
  });
};

export const updateTrialTrainingStatus = async (
  trainingId: number,
  status: string,
  feedback?: string,
  data: any = {},
) => {
  const containsDateChange =
    data.scheduledAt !== undefined ||
    data.alternativeDate1 !== undefined ||
    data.alternativeDate2 !== undefined ||
    data.alternativeDate3 !== undefined ||
    data.selectedDate !== undefined;

  if (containsDateChange) {
    const existingTrial = await prisma.trialTraining.findUnique({
      where: {
        id: trainingId,
      },
      select: {
        status: true,
      },
    });

    if (!existingTrial) {
      throw new Error("Trial training not found");
    }

    if (existingTrial.status === "COMPLETED" || status === "COMPLETED") {
      throw new Error("Completed trial trainings cannot be rescheduled");
    }
  }

  const updatedTrial = await prisma.trialTraining.update({
    where: {
      id: trainingId,
    },

    data: {
      ...(status ? { status } : {}),
      ...(feedback !== undefined ? { feedback } : {}),
      ...(data.scheduledAt
        ? {
            scheduledAt: new Date(data.scheduledAt),
            ...(data.selectedDate === undefined
              ? { selectedDate: new Date(data.scheduledAt) }
              : {}),
          }
        : {}),
      ...(data.alternativeDate1 !== undefined
        ? {
            alternativeDate1: data.alternativeDate1
              ? new Date(data.alternativeDate1)
              : null,
          }
        : {}),
      ...(data.alternativeDate2 !== undefined
        ? {
            alternativeDate2: data.alternativeDate2
              ? new Date(data.alternativeDate2)
              : null,
          }
        : {}),
      ...(data.alternativeDate3 !== undefined
        ? {
            alternativeDate3: data.alternativeDate3
              ? new Date(data.alternativeDate3)
              : null,
          }
        : {}),
      ...(data.selectedDate !== undefined
        ? {
            selectedDate: data.selectedDate ? new Date(data.selectedDate) : null,
          }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
    include: {
      club: true,
      player: {
        include: {
          attributes: true,
        },
      },
    },
  });

  return updatedTrial;
};

export const getPlayerTrialTrainings = async (playerId: number) => {
  return prisma.trialTraining.findMany({
    where: {
      playerId,
    },

    include: {
      club: true,
      rating: true,
    },
  });
};

export const reviewTrialTraining = async (trainingId: number, review: any) => {
  const trial = await prisma.trialTraining.findUnique({
    where: {
      id: trainingId,
    },

    include: {
      rating: true,
      player: {
        include: {
          attributes: true,
        },
      },
    },
  });

  if (!trial || !trial.player.attributes) {
    throw new Error("Player attributes not found");
  }

  if (trial.rating) {
    throw new Error("Diese Probetraining-Bewertung wurde bereits gespeichert.");
  }

  const attrs = trial.player.attributes;

  const incomingValue = (key: (typeof attributeKeys)[number]) => {
    const value = Number(review[key]);
    return Number.isFinite(value) ? value : attrs[key];
  };

  const reviewedAttributes = {
    tempo: incomingValue("tempo"),
    shooting: incomingValue("shooting"),
    passing: incomingValue("passing"),
    dribbling: incomingValue("dribbling"),
    defending: incomingValue("defending"),
    physical: incomingValue("physical"),
  };
  const reviewedSkills = normalizeSkillRatings(
    review.skillRatings,
    trial.player.skills,
  );
  const hasFeedback = typeof review.feedback === "string" && review.feedback.trim().length > 0;
  const hasChangedAttribute = attributeKeys.some(
    (key) => reviewedAttributes[key] !== attrs[key],
  );
  const hasChangedSkillRating = reviewedSkills.some(
    (skillRating) => skillRating.stars !== 3,
  );

  if (!hasFeedback && !hasChangedAttribute && !hasChangedSkillRating) {
    throw new Error(
      "Bitte passe mindestens einen Wert an oder schreibe ein Feedback, bevor du die Bewertung speicherst.",
    );
  }

  const reviewScore = calculateAttributeScore(reviewedAttributes);

  const updatedTrial = await prisma.trialTraining.update({
    where: {
      id: trainingId,
    },

    data: {
      status: "COMPLETED",
      feedback: review.feedback,
    },
    include: {
      club: true,
      player: {
        include: {
          attributes: true,
        },
      },
    },
  });

  await createTrialRating(
    updatedTrial,
    reviewScore,
    review.feedback,
    reviewedAttributes,
    reviewedSkills,
  );

  return updatedTrial;
};
