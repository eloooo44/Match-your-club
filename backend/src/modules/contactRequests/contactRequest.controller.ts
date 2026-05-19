import { Request, Response } from "express";

import * as contactRequestService from "./contactRequest.service";

export const createContactRequest = async (req: Request, res: Response) => {
  try {
    const request = await contactRequestService.createContactRequest(req.body);

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getClubContactRequests = async (req: Request, res: Response) => {
  try {
    const clubId = Number(req.params.clubId);

    const requests = await contactRequestService.getClubContactRequests(clubId);

    res.json(requests);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const updateContactRequestStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const requestId = Number(req.params.id);

    const { status } = req.body;

    const updated = await contactRequestService.updateContactRequestStatus(
      requestId,
      status,
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
