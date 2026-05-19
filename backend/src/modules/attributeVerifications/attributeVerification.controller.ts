import { Response } from "express";

import * as attributeVerificationService from "./attributeVerification.service";

import { AuthRequest } from "../../middleware/auth.middleware";

export const createAttributeVerification = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const verification =
      await attributeVerificationService.createAttributeVerification(
        req.user!.userId,
        req.body,
      );

    res.status(201).json(verification);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getPlayerAttributeVerifications = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const verifications =
      await attributeVerificationService.getPlayerAttributeVerifications(
        Number(req.params.playerId),
      );

    res.json(verifications);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getMutualConnections = async (req: AuthRequest, res: Response) => {
  try {
    const result = await connectionService.getMutualConnections(
      req.user!.userId,

      Number(req.params.userId),
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
