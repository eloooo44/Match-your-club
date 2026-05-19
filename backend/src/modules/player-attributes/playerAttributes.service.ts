import prisma from "../../lib/prisma";
import { CreatePlayerAttributesBody } from "./playerAttributes.types";

export const createPlayerAttributes = async (
  userId: number,
  data: CreatePlayerAttributesBody,
) => {
  const profile = await prisma.playerProfile.findUnique({
    where: {
      id: data.playerId,
    },
  });

  if (!profile) {
    throw new Error("Player profile not found");
  }

  const existingAttributes = await prisma.playerAttributes.findUnique({
    where: {
      playerId: profile.id,
    },
  });

  if (existingAttributes) {
    throw new Error("Attributes already exist");
  }

  const attributes = await prisma.playerAttributes.create({
    data: {
      playerId: profile.id,
      tempo: data.tempo,
      shooting: data.shooting,
      passing: data.passing,
      dribbling: data.dribbling,
      defending: data.defending,
      physical: data.physical,
    },
  });

  return attributes;
};
