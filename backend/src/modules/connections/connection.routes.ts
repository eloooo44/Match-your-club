import { Router } from "express";

import * as connectionController from "./connection.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/request",
  authenticate,
  connectionController.sendConnectionRequest,
);

router.patch(
  "/accept/:id",
  authenticate,
  connectionController.acceptConnection,
);

router.get(
  "/mutual/:userId",
  authenticate,
  connectionController.getMutualConnections,
);

router.get("/my", authenticate, connectionController.getMyConnections);

export default router;
