import { Router } from "express";
import * as oefbController from "./oefb.controller";

const router = Router();

router.get("/player", oefbController.getPlayerProfile);

export default router;
