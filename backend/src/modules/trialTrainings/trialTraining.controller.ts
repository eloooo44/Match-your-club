import { Request, Response } from "express";

import * as trialTrainingService from "./trialTraining.service";

export const createTrialTraining = async (req: Request, res: Response) => {
  try {
    const training = await trialTrainingService.createTrialTraining(req.body);

    res.status(201).json(training);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getClubTrialTrainings = async (req: Request, res: Response) => {
  try {
    const clubId = Number(req.params.clubId);

    const trainings = await trialTrainingService.getClubTrialTrainings(clubId);

    res.json(trainings);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updateTrialTrainingStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const trainingId = Number(req.params.id);

    const { status, feedback } = req.body;

    const updated = await trialTrainingService.updateTrialTrainingStatus(
      trainingId,
      status,
      feedback,
      req.body,
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getPlayerTrialTrainings = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);

    const trainings =
      await trialTrainingService.getPlayerTrialTrainings(playerId);

    res.json(trainings);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const reviewTrialTraining = async (req: Request, res: Response) => {
  try {
    const trainingId = Number(req.params.id);

    const updated = await trialTrainingService.reviewTrialTraining(
      trainingId,
      req.body,
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
