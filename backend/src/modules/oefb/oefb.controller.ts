import { Request, Response } from "express";
import * as oefbService from "./oefb.service";

export const getPlayerProfile = async (req: Request, res: Response) => {
  try {
    const url = typeof req.query.url === "string" ? req.query.url : "";

    if (!url) {
      return res.status(400).json({
        message: "URL fehlt.",
      });
    }

    const profile = await oefbService.fetchOefbPlayerProfile(url);

    res.json(profile);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
