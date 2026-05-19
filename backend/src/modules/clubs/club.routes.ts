import { Router } from "express";

import * as clubController from "./club.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { uploadImage } from "../../middleware/upload.middleware";

const router = Router();

router.post("/profile", clubController.createClubProfile);

router.get("/me", authenticate, clubController.getMyClubProfile);

router.get("/dashboard", authenticate, clubController.getClubDashboard);

router.get("/", clubController.getAllClubs);

router.get("/:id/ratings", clubController.getClubRatings);

router.get("/competition-options", clubController.getClubCompetitionOptions);

router.get("/oefb-preview", clubController.previewOefbClubProfile);

router.patch(
  "/me/oefb-profile",
  authenticate,
  clubController.updateOefbClubProfile,
);

router.patch("/me/contact", authenticate, clubController.updateMyClubContact);

router.patch(
  "/:id/logo",
  uploadImage.single("logo"),
  clubController.uploadClubLogo,
);

export default router;
