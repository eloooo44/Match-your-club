import { Response } from "express";

import * as ratingService from "./rating.service";

import { AuthRequest } from "../../middleware/auth.middleware";

export const createRating = async (req: AuthRequest, res: Response) => {
  try {
    const rating = await ratingService.createRating(req.user!.userId, req.body);

    res.status(201).json(rating);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getPlayerRatings = async (req: AuthRequest, res: Response) => {
  try {
    const ratings = await ratingService.getPlayerRatings(
      Number(req.params.playerId),
    );

    res.json(ratings);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
