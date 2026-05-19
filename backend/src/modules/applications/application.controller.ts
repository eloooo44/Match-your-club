import { Request, Response } from "express";
import * as applicationService from "./application.service";

export const createApplication = async (req: Request, res: Response) => {
  try {
    const { playerId, clubId, message } = req.body;

    const application = await applicationService.createApplication(
      Number(playerId),
      Number(clubId),
      message,
    );

    res.status(201).json(application);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const getClubApplications = async (req: Request, res: Response) => {
  try {
    const clubId = Number(req.params.clubId);

    const applications = await applicationService.getClubApplications(clubId);

    res.json(applications);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getPlayerApplications = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);

    const applications =
      await applicationService.getPlayerApplications(playerId);

    res.json(applications);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const applicationId = Number(req.params.id);

    const { status } = req.body;

    const updated = await applicationService.updateApplicationStatus(
      applicationId,
      status,
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
