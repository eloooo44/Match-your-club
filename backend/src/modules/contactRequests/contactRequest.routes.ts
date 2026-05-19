import { Router } from "express";

import * as contactRequestController from "./contactRequest.controller";

const router = Router();

router.post("/", contactRequestController.createContactRequest);

router.get("/club/:clubId", contactRequestController.getClubContactRequests);

router.patch("/:id", contactRequestController.updateContactRequestStatus);

export default router;
