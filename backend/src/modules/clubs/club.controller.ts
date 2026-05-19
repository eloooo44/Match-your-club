import { Request, Response } from "express";

import * as clubService from "./club.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const createClubProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await clubService.createClubProfile(
      req.body.userId,
      req.body,
    );

    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getMyClubProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await clubService.getMyClubProfile(req.user!.userId);

    res.json(profile);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getClubDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const dashboard = await clubService.getClubDashboard(req.user!.userId);

    res.json(dashboard);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getAllClubs = async (req: AuthRequest, res: Response) => {
  try {
    const clubs = await clubService.getAllClubs();

    res.json(clubs);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getClubRatings = async (req: Request, res: Response) => {
  try {
    const clubId = Number(req.params.id);
    const ratings = await clubService.getClubRatings(clubId);

    res.json(ratings);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getClubCompetitionOptions = async (
  _req: Request,
  res: Response,
) => {
  try {
    const options = await clubService.getClubCompetitionOptions();

    res.json(options);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const previewOefbClubProfile = async (req: Request, res: Response) => {
  try {
    const url = typeof req.query.url === "string" ? req.query.url : "";

    if (!url) {
      return res.status(400).json({
        message: "URL fehlt.",
      });
    }

    const preview = await clubService.previewOefbClubProfile(url);

    res.json(preview);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const uploadClubLogo = async (req: Request, res: Response) => {
  try {
    const clubId = Number(req.params.id);

    if (!req.file) {
      throw new Error("No logo uploaded");
    }

    const updatedClub = await clubService.uploadClubLogo(clubId, req.file.path);

    res.json(updatedClub);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updateOefbClubProfile = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const oefbClubProfileUrl = String(req.body?.oefbClubProfileUrl ?? "");
    const updatedClub = await clubService.updateOefbClubProfile(
      req.user!.userId,
      oefbClubProfileUrl,
    );

    res.json(updatedClub);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updateMyClubContact = async (req: AuthRequest, res: Response) => {
  try {
    const updatedClub = await clubService.updateMyClubContact(
      req.user!.userId,
      req.body,
    );

    res.json(updatedClub);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
