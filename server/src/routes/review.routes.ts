import { Router } from "express";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Public
router.get("/product/:productId", getProductReviews);

// Protected
router.post(
  "/product/:productId",
  authMiddleware,
  createReview
);

router.patch(
  "/:reviewId",
  authMiddleware,
  updateReview
);

router.delete(
  "/:reviewId",
  authMiddleware,
  deleteReview
);

export default router;