import prisma from "../../lib/prisma";

export const createContactRequest = async (data: any) => {
  return prisma.contactRequest.create({
    data: {
      playerId: data.playerId,
      clubId: data.clubId,
      message: data.message,
    },
  });
};

export const getClubContactRequests = async (clubId: number) => {
  return prisma.contactRequest.findMany({
    where: {
      clubId,
    },

    include: {
      player: true,
    },
  });
};

export const updateContactRequestStatus = async (
  requestId: number,
  status: string,
) => {
  return prisma.contactRequest.update({
    where: {
      id: requestId,
    },

    data: {
      status,
    },
  });
};
