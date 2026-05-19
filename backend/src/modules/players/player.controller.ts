import * as playerService from "./player.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SearchPlayersFilters } from "./player.types";

interface JwtPayload {
  userId: number;
  role: string;
}

const normalizeQueryFilters = (
  query: Request["query"],
): SearchPlayersFilters => {
  const normalizedEntries = Object.entries(query).map(([key, value]) => [
    key,
    Array.isArray(value) ? value[0] : value,
  ]);

  return Object.fromEntries(normalizedEntries);
};

const getUserIdFromAuthHeader = (authHeader?: string) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return undefined;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    return decoded.userId;
  } catch {
    return undefined;
  }
};

export const createPlayerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await playerService.createPlayerProfile(
      req.user!.userId,
      req.body,
    );

    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await playerService.getMyProfile(req.user!.userId);

    res.json(profile);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getPlayerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const dashboard = await playerService.getPlayerDashboard(req.user!.userId);

    res.json(dashboard);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await playerService.updateMyProfile(
      req.user!.userId,
      req.body,
    );

    res.json(profile);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const players = await playerService.getAllPlayers();

    res.json(players);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const searchPlayers = async (req: Request, res: Response) => {
  try {
    const filters = normalizeQueryFilters(req.query);

    const clubUserId = getUserIdFromAuthHeader(req.headers.authorization);

    const players = await playerService.searchPlayers(filters, clubUserId);

    res.json(players);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const deletePlayer = async (req: Request, res: Response) => {
  try {
    await playerService.deletePlayer(Number(req.params.id));

    res.json({
      message: "Player deleted",
    });
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const uploadPlayerImage = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.id);

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "No image uploaded",
      });
    }

    const player = await playerService.uploadPlayerImage(playerId, file.path);

    res.json(player);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updatePlayerImageUrl = async (req: Request, res: Response) => {
  try {
    const player = await playerService.updatePlayerImageUrl(
      Number(req.params.id),
      req.body.profileImageUrl,
    );

    res.json(player);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
