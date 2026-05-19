import { Request, Response } from "express";

import * as authService from "./auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await authService.getAllUsers();

    res.json(users);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
