import { Router } from "express";

import * as playerVideoController from "./playerVideo.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { uploadVideo } from "../../middleware/upload.middleware";

const router = Router();

router.post(
  "/",
  uploadVideo.single("video"),
  playerVideoController.createPlayerVideo,
);

router.get("/player/:playerId", playerVideoController.getPlayerVideos);

router.post(
  "/",
  authenticate,
  authorize(["PLAYER"]),
  uploadVideo.single("video"),
  playerVideoController.createPlayerVideo,
);

router.get("/", playerVideoController.getAllVideos);

router.delete("/:id", playerVideoController.deletePlayerVideo);

export default router;
