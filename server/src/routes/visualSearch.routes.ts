import { Router } from "express";
import { visualSearch } from "../controllers/visualSearch.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  visualSearch
);

export default router;