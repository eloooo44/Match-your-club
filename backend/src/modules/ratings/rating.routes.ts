import { Router } from "express";

import * as ratingController from "./rating.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, ratingController.createRating);

router.get(
  "/player/:playerId",
  authenticate,
  ratingController.getPlayerRatings,
);

export default router;
