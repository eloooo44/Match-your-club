import prisma from "../../lib/prisma";
import fs from "fs/promises";
import path from "path";

export const createPlayerVideo = async (data: any) => {
  return prisma.playerVideo.create({
    data: {
      playerId: Number(data.playerId),
      title: data.title,
      videoUrl: data.videoUrl || null,
      videoPath: data.videoPath || null,
    },
  });
};

export const getPlayerVideos = async (playerId: number) => {
  return prisma.playerVideo.findMany({
    where: {
      playerId,
    },
  });
};

export const getAllVideos = async () => {
  return prisma.playerVideo.findMany();
};

export const deletePlayerVideo = async (videoId: number) => {
  const video = await prisma.playerVideo.findUnique({
    where: {
      id: videoId,
    },
  });

  if (!video) {
    throw new Error("Video not found");
  }

  const deletedVideo = await prisma.playerVideo.delete({
    where: {
      id: videoId,
    },
  });

  if (video.videoPath) {
    const absoluteVideoPath = path.resolve(video.videoPath);
    const uploadsRoot = path.resolve("uploads");

    if (absoluteVideoPath.startsWith(uploadsRoot)) {
      await fs.unlink(absoluteVideoPath).catch((error) => {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      });
    }
  }

  return deletedVideo;
};
