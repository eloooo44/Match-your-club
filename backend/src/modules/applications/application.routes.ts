import { Router } from "express";
import * as applicationController from "./application.controller";

const router = Router();

router.post("/", applicationController.createApplication);

router.get("/club/:clubId", applicationController.getClubApplications);

router.get("/player/:playerId", applicationController.getPlayerApplications);

router.patch("/:id", applicationController.updateApplicationStatus);

export default router;
