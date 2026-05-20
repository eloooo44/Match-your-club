import { Router } from "express";

import * as playerController from "./player.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { playerImageUpload } from "../../config/playerImageUpload";

const router = Router();

router.post("/profile", authenticate, playerController.createPlayerProfile);

router.get("/me", authenticate, playerController.getMyProfile);

router.get("/dashboard", authenticate, playerController.getPlayerDashboard);

router.patch("/me", authenticate, playerController.updateMyProfile);

router.delete("/me", authenticate, playerController.deleteMyPlayerAccount);

router.get("/search", playerController.searchPlayers);

router.get("/", playerController.getAllPlayers);

router.delete("/:id", authenticate, playerController.deletePlayer);

router.post(
  "/upload-image/:id",
  playerImageUpload.single("image"),
  playerController.uploadPlayerImage,
);

router.patch("/image-url/:id", playerController.updatePlayerImageUrl);

export default router;
