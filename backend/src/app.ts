import express from "express";
import cors from "cors";
import playerRoutes from "./modules/players/player.routes";
import playerAttributesRoutes from "./modules/player-attributes/playerAttributes.routes";
import clubRoutes from "./modules/clubs/club.routes";
import clubRequirementsRoutes from "./modules/club-requirements/clubRequirements.routes";
import matchingRoutes from "./modules/matching/matching.routes";
import recommendationRoutes from "./modules/recommendations/recommendation.routes";
import authRoutes from "./modules/auth/auth.routes";
import { authenticate } from "./middleware/auth.middleware";
import attributeVerificationRoutes from "./modules/attributeVerifications/attributeVerification.routes";
import connectionRoutes from "./modules/connections/connection.routes";
import verificationRoutes from "./modules/verification/verification.routes";
import playerClubHistoryRoutes from "./modules/playerClubHistory/playerClubHistory.routes";
import ratingRoutes from "./modules/ratings/rating.routes";
import applicationRoutes from "./modules/applications/application.routes";
import path from "path";
import trialTrainingRoutes from "./modules/trialTrainings/trialTraining.routes";
import contactRequestRoutes from "./modules/contactRequests/contactRequest.routes";
import playerVideoRoutes from "./modules/playerVideos/playerVideo.routes";
import oefbRoutes from "./modules/oefb/oefb.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/matching", matchingRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/applications", applicationRoutes);
app.use("/api/trial-trainings", trialTrainingRoutes);
app.use("/api/contact-requests", contactRequestRoutes);
app.use("/api/player-videos", playerVideoRoutes);
app.use("/api/oefb", oefbRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/attribute-verifications", attributeVerificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/player-club-history", playerClubHistoryRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/player-attributes", playerAttributesRoutes);
app.use("/api/club-requirements", clubRequirementsRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (_, res) => {
  res.json({
    message: "Match Your Club API running",
  });
});

app.get("/api/protected", authenticate, (req, res) => {
  res.json({
    message: "Protected route works",
  });
});

app.use("/api/auth", authRoutes);

export default app;
