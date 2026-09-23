import { Router } from "express";

import { analyzeListing } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/analyze-listing",
  authMiddleware,
  analyzeListing
);

export default router;