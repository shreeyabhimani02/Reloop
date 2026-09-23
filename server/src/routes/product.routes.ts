import { Router } from "express";

import {
  getProducts,
  getProductById,
  getSearchSuggestions,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
} from "../controllers/product.controller.js";

import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Public routes

router.get("/", getProducts);

router.get("/suggestions", getSearchSuggestions);

router.get("/seller/:sellerId", getSellerProducts);

router.get("/:id", getProductById);

// Protected routes

router.post("/", authMiddleware, createProduct);

router.put("/:id", authMiddleware, updateProduct);

router.delete("/:id", authMiddleware, deleteProduct);

export default router;