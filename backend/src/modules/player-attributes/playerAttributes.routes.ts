import { Router } from "express";

import * as attributesController from "./playerAttributes.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  attributesController.createPlayerAttributes
);

export default router;