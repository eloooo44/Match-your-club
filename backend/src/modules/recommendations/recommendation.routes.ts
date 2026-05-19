import { Router } from "express";

import * as recommendationController from "./recommendation.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, recommendationController.createRecommendation);

router.get(
  "/player/:playerId",
  recommendationController.getPlayerRecommendations,
);

export default router;
