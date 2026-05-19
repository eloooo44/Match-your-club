import { Response } from "express";

import * as attributesService from "./playerAttributes.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const createPlayerAttributes = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const attributes =
      await attributesService.createPlayerAttributes(
        req.user!.userId,
        req.body
      );

    res.status(201).json(attributes);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};