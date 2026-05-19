import { Request, Response } from "express";

import * as recommendationService from "./recommendation.service";

import { AuthRequest } from "../../middleware/auth.middleware";

export const createRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const recommendation = await recommendationService.createRecommendation(
      req.user!.userId,
      req.body,
    );

    res.status(201).json(recommendation);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getPlayerRecommendations = async (req: Request, res: Response) => {
  try {
    const recommendations =
      await recommendationService.getPlayerRecommendations(
        Number(req.params.playerId),
      );

    res.json(recommendations);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
