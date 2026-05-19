import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

import * as trialTrainingController from "./trialTraining.controller";

const router = Router();

router.post("/", trialTrainingController.createTrialTraining);

router.get("/club/:clubId", trialTrainingController.getClubTrialTrainings);

router.patch("/:id", trialTrainingController.updateTrialTrainingStatus);

router.post(
  "/",
  authenticate,
  authorize(["CLUB"]),
  trialTrainingController.createTrialTraining,
);

router.get(
  "/player/:playerId",
  trialTrainingController.getPlayerTrialTrainings,
);

router.patch("/:id/review", trialTrainingController.reviewTrialTraining);
export default router;
