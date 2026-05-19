import prisma from "../../lib/prisma";

export const createApplication = async (
  playerId: number,
  clubId: number,
  message?: string,
) => {
  const existingApplication = await prisma.application.findFirst({
    where: {
      playerId,
      clubId,
    },
  });

  if (existingApplication) {
    throw new Error("Application already exists");
  }

  return prisma.application.create({
    data: {
      message,

      player: {
        connect: {
          id: playerId,
        },
      },

      club: {
        connect: {
          id: clubId,
        },
      },
    },
  });
};

export const getClubApplications = async (clubId: number) => {
  return prisma.application.findMany({
    where: {
      clubId,
    },

    include: {
      player: true,
    },
  });
};

export const getPlayerApplications = async (playerId: number) => {
  return prisma.application.findMany({
    where: {
      playerId,
    },
    include: {
      club: true,
    },
  });
};

export const updateApplicationStatus = async (
  applicationId: number,
  status: string,
) => {
  return prisma.application.update({
    where: {
      id: applicationId,
    },

    data: {
      status,
    },
  });
};
