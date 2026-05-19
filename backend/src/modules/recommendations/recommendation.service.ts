import prisma from "../../lib/prisma";

import { CreateRecommendationBody } from "./recommendation.types";

export const createRecommendation = async (
  userId: number,
  data: CreateRecommendationBody,
) => {
  const player = await prisma.playerProfile.findUnique({
    where: {
      id: data.toPlayerId,
    },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  const recommendation = await prisma.recommendation.create({
    data: {
      fromUserId: userId,

      toPlayerId: data.toPlayerId,

      text: data.text,
    },
  });

  return recommendation;
};

export const getPlayerRecommendations = async (playerId: number) => {
  const recommendations = await prisma.recommendation.findMany({
    where: {
      toPlayerId: playerId,
    },

    include: {
      fromUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const enhancedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            {
              userId: rec.fromUserId,
              connectedUserId: playerId,
            },
            {
              userId: playerId,
              connectedUserId: rec.fromUserId,
            },
          ],

          status: "ACCEPTED",
        },
      });

      return {
        ...rec,

        trusted: connection !== null,
      };
    }),
  );

  return enhancedRecommendations;
};
