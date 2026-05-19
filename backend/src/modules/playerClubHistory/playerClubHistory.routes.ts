import { Router } from "express";

import * as playerClubHistoryController from "./playerClubHistory.controller";

const router = Router();

router.post("/", playerClubHistoryController.createPlayerClubHistory);

export default router;
