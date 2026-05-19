import { Router } from "express";

import * as verificationController from "./verification.controller";

const router = Router();

router.post("/player/:playerId", verificationController.verifyPlayer);

export default router;
