import { Router } from "express";
import {
  register,
  login,
  getMe,
} from "../controllers/auth.controller.js";

import {
  registerValidation,
  loginValidation,
  validateRequest,
} from "../middleware/validation.js";

import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post(
  "/register",
  registerValidation,
  validateRequest,
  register
);

router.post(
  "/login",
  loginValidation,
  validateRequest,
  login
);

router.get(
  "/me",
  authMiddleware,
  getMe
);

export default router;