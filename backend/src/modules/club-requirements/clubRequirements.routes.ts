import { Router } from "express";

import * as requirementsController from "./clubRequirements.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, requirementsController.getMyClubRequirements);

router.post("/", authenticate, requirementsController.createClubRequirement);

router.patch(
  "/:id",
  authenticate,
  requirementsController.updateClubRequirement,
);

router.delete(
  "/:id",
  authenticate,
  requirementsController.deleteClubRequirement,
);

export default router;
