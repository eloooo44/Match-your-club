import { Router } from "express";

import * as matchingController from "./matching.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.get("/club", authenticate, matchingController.getMatchesForClub);
router.get("/player", authenticate, matchingController.getMatchesForPlayer);

export default router;
