import { Response } from "express";

import * as matchingService from "./matching.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const getMatchesForClub = async (req: AuthRequest, res: Response) => {
  try {
    const matches = await matchingService.getMatchesForClub(req.user!.userId);

    res.json(matches);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getMatchesForPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const matches = await matchingService.getMatchesForPlayer(req.user!.userId);

    res.json(matches);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
