import prisma from "../../lib/prisma";

export const createPlayerClubHistory = async (data: {
  playerId: number;
  clubId?: number;
  clubName: string;
  relationType: string;
  teamCategory?: string;
  startDate?: string;
  endDate?: string;
  games?: number;
  goals?: number;
  yellowCards?: number;
  redCards?: number;
}) => {
  return prisma.playerClubHistory.create({
    data: {
      clubName: data.clubName,
      relationType: data.relationType,
      teamCategory: data.teamCategory?.trim() || undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      games: data.games ?? undefined,
      goals: data.goals ?? undefined,
      yellowCards: data.yellowCards ?? undefined,
      redCards: data.redCards ?? undefined,
      player: {
        connect: {
          id: Number(data.playerId),
        },
      },
      ...(data.clubId
        ? {
            club: {
              connect: {
                id: Number(data.clubId),
              },
            },
          }
        : {}),
    },
  });
};
