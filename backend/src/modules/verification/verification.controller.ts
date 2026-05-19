import { Request, Response } from "express";

import * as verificationService from "./verification.service";

export const verifyPlayer = async (req: Request, res: Response) => {
  try {
    const result = await verificationService.verifyPlayer(
      Number(req.params.playerId),
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
