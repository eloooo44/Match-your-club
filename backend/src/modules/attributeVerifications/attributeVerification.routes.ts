import { Router } from "express";

import * as attributeVerificationController from "./attributeVerification.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  attributeVerificationController.createAttributeVerification,
);

router.get(
  "/player/:playerId",
  authenticate,
  attributeVerificationController.getPlayerAttributeVerifications,
);

export default router;
