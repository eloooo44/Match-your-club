import { Request, Response } from "express";

import * as playerVideoService from "./playerVideo.service";

export const createPlayerVideo = async (req: Request, res: Response) => {
  try {
    const { playerId, title, videoUrl } = req.body;

    let videoPath: string | null = null;

    if (req.file) {
      videoPath = req.file.path;
    }

    if (!videoUrl && !videoPath) {
      return res.status(400).json({
        message: "Either videoUrl or uploaded video required",
      });
    }

    const video = await playerVideoService.createPlayerVideo({
      playerId,
      title,
      videoUrl,
      videoPath,
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getPlayerVideos = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);

    const videos = await playerVideoService.getPlayerVideos(playerId);

    res.json(videos);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const videos = await playerVideoService.getAllVideos();

    res.json(videos);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const deletePlayerVideo = async (req: Request, res: Response) => {
  try {
    const videoId = Number(req.params.id);

    await playerVideoService.deletePlayerVideo(videoId);

    res.json({
      message: "Video deleted",
    });
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
