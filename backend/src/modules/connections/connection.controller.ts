import { Response } from "express";

import * as connectionService from "./connection.service";

import { AuthRequest } from "../../middleware/auth.middleware";

export const sendConnectionRequest = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const connection = await connectionService.sendConnectionRequest(
      req.user!.userId,
      req.body.connectedUserId,
    );

    res.status(201).json(connection);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const acceptConnection = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await connectionService.acceptConnection(
      Number(req.params.id),
    );

    res.json(connection);
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

export const getMyConnections = async (req: AuthRequest, res: Response) => {
  try {
    const connections = await connectionService.getMyConnections(
      req.user!.userId,
    );

    res.json(connections);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
