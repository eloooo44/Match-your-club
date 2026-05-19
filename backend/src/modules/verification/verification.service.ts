import prisma from "../../lib/prisma";

export const verifyPlayer = async (playerId: number) => {
  const player = await prisma.playerProfile.findUnique({
    where: {
      id: playerId,
    },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  const connections = await prisma.connection.count({
    where: {
      OR: [
        {
          userId: player.userId,
        },
        {
          connectedUserId: player.userId,
        },
      ],

      status: "ACCEPTED",
    },
  });

  const recommendations = await prisma.recommendation.count({
    where: {
      toPlayerId: playerId,
    },
  });

  const ratings = await prisma.rating.findMany({
    where: {
      playerId,
    },
  });

  let trustScore = 0;

  if (ratings.length > 0) {
    trustScore =
      ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;
  }

  const verified = connections >= 3 && recommendations >= 2 && trustScore >= 4;

  await prisma.playerProfile.update({
    where: {
      id: playerId,
    },

    data: {
      verified,
    },
  });

  return {
    verified,

    stats: {
      connections,
      recommendations,
      trustScore,
    },
  };
};
