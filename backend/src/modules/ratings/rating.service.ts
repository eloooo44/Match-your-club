import prisma from "../../lib/prisma";

import { CreateRatingBody } from "./rating.types";

export const createRating = async (
  fromUserId: number,
  data: CreateRatingBody,
) => {
  const relation = await prisma.playerClubHistory.findFirst({
    where: {
      playerId: data.playerId,
      clubId: data.clubId,
    },
  });

  if (!relation) {
    throw new Error("Club has no football relationship with this player");
  }

  return prisma.rating.create({
    data: {
      playerId: data.playerId,

      fromUserId,

      ratingType: data.ratingType,

      score: data.score,

      comment: data.comment,
    },
  });
};

export const getPlayerRatings = async (playerId: number) => {
  return prisma.rating.findMany({
    where: {
      playerId,
    },

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
  });
};
