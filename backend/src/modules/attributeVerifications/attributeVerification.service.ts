import prisma from "../../lib/prisma";

import { CreateAttributeVerificationBody } from "./attributeVerification.types";

export const createAttributeVerification = async (
  fromUserId: number,
  data: CreateAttributeVerificationBody,
) => {
  const existing = await prisma.attributeVerification.findFirst({
    where: {
      fromUserId,

      playerId: data.playerId,

      attribute: data.attribute,
    },
  });

  if (existing) {
    throw new Error("Attribute already verified");
  }

  return prisma.attributeVerification.create({
    data: {
      playerId: data.playerId,

      fromUserId,

      attribute: data.attribute,
    },
  });
};

export const getPlayerAttributeVerifications = async (playerId: number) => {
  const verifications = await prisma.attributeVerification.findMany({
    where: {
      playerId,
    },
  });

  const grouped: Record<string, number> = {};

  verifications.forEach((verification) => {
    if (!grouped[verification.attribute]) {
      grouped[verification.attribute] = 0;
    }

    grouped[verification.attribute] += 1;
  });

  return grouped;
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
