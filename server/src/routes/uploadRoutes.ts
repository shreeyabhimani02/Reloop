import { Router } from "express";

import {
  getAvatarUploadSignature,
  getListingUploadSignature,
} from "../controllers/uploadController.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/avatar/signature",
  authMiddleware,
  getAvatarUploadSignature
);

router.get(
  "/listing/signature",
  authMiddleware,
  getListingUploadSignature
);

export default router;