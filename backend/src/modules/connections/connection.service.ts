import prisma from "../../lib/prisma";

export const sendConnectionRequest = async (
  userId: number,
  connectedUserId: number,
) => {
  if (userId === connectedUserId) {
    throw new Error("Cannot connect with yourself");
  }

  const existing = await prisma.connection.findFirst({
    where: {
      userId,
      connectedUserId,
    },
  });

  if (existing) {
    throw new Error("Connection already exists");
  }

  return prisma.connection.create({
    data: {
      userId,

      connectedUserId,

      status: "PENDING",
    },
  });
};

export const acceptConnection = async (connectionId: number) => {
  return prisma.connection.update({
    where: {
      id: connectionId,
    },

    data: {
      status: "ACCEPTED",
    },
  });
};

export const getMyConnections = async (userId: number) => {
  return prisma.connection.findMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          connectedUserId: userId,
        },
      ],

      status: "ACCEPTED",
    },

    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },

      connectedUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
};

export const getMutualConnections = async (
  currentUserId: number,
  otherUserId: number,
) => {
  const currentConnections = await prisma.connection.findMany({
    where: {
      OR: [
        {
          userId: currentUserId,
        },
        {
          connectedUserId: currentUserId,
        },
      ],

      status: "ACCEPTED",
    },
  });

  const otherConnections = await prisma.connection.findMany({
    where: {
      OR: [
        {
          userId: otherUserId,
        },
        {
          connectedUserId: otherUserId,
        },
      ],

      status: "ACCEPTED",
    },
  });

  const currentConnectionIds = currentConnections.map((c) =>
    c.userId === currentUserId ? c.connectedUserId : c.userId,
  );

  const otherConnectionIds = otherConnections.map((c) =>
    c.userId === otherUserId ? c.connectedUserId : c.userId,
  );

  const mutualIds = currentConnectionIds.filter((id) =>
    otherConnectionIds.includes(id),
  );

  const mutualUsers = await prisma.user.findMany({
    where: {
      id: {
        in: mutualIds,
      },
    },

    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  return {
    count: mutualUsers.length,

    mutualConnections: mutualUsers,
  };
};
