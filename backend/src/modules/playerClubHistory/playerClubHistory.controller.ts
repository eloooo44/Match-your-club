import { Request, Response } from "express";
import * as playerClubHistoryService from "./playerClubHistory.service";

export const createPlayerClubHistory = async (req: Request, res: Response) => {
  try {
    const history = await playerClubHistoryService.createPlayerClubHistory(
      req.body,
    );

    res.status(201).json(history);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};
