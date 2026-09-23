import { Router } from "express";

import {
  getMyProfile,
  updateMyProfile,
  getPublicUser,
} from "../controllers/userController.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

/*
 * IMPORTANT:
 * Keep /me before /:userId
 */

// Private profile
router.get(
  "/me",
  authMiddleware,
  getMyProfile
);

// Update private profile
router.put(
  "/me",
  authMiddleware,
  updateMyProfile
);

// Public seller profile
router.get(
  "/:userId",
  getPublicUser
);

export default router;