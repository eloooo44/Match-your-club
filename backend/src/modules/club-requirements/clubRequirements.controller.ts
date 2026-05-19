import { Response } from "express";

import * as requirementsService from "./clubRequirements.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const createClubRequirement = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const requirement = await requirementsService.createClubRequirement(
      req.user!.userId,
      req.body,
    );

    res.status(201).json(requirement);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getMyClubRequirements = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const requirements = await requirementsService.getMyClubRequirements(
      req.user!.userId,
    );

    res.json(requirements);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updateClubRequirement = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const requirement = await requirementsService.updateClubRequirement(
      req.user!.userId,
      Number(req.params.id),
      req.body,
    );

    res.json(requirement);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const deleteClubRequirement = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const result = await requirementsService.deleteClubRequirement(
      req.user!.userId,
      Number(req.params.id),
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
