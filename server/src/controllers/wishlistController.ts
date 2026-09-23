import { Response } from "express";
import mongoose from "mongoose";

import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

/**
 * Helper function
 * Ensures productId is always a single string.
 */
function getProductId(req: AuthRequest): string | null {
  const productId = req.params.productId;

  if (Array.isArray(productId)) {
    return productId[0] || null;
  }

  return productId || null;
}

/**
 * GET /api/wishlist
 * Get current user's wishlist
 */
export async function getWishlist(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wishlist = await Wishlist.findOne({
      user: userId,
    });

    return res.status(200).json({
      success: true,
      productIds: wishlist
        ? wishlist.products.map((id) => id.toString())
        : [],
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
    });
  }
}

/**
 * POST /api/wishlist/:productId
 * Add product to wishlist
 */
export async function addToWishlist(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    const productId = getProductId(req);

    // Check authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check product ID
    if (
      !productId ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check whether product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Add product to wishlist
    const wishlist = await Wishlist.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $addToSet: {
          products: product._id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      productIds: wishlist.products.map((id) =>
        id.toString()
      ),
    });
  } catch (error) {
    console.error("Add wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist",
    });
  }
}

/**
 * DELETE /api/wishlist/:productId
 * Remove product from wishlist
 */
export async function removeFromWishlist(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    const productId = getProductId(req);

    // Check authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check product ID
    if (
      !productId ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Remove product from wishlist
    const wishlist = await Wishlist.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $pull: {
          products: productId,
        },
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      productIds: wishlist
        ? wishlist.products.map((id) => id.toString())
        : [],
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist",
    });
  }
}

/**
 * DELETE /api/wishlist
 * Clear entire wishlist
 */
export async function clearWishlist(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;

    // Check authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Clear wishlist
    await Wishlist.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $set: {
          products: [],
        },
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared",
      productIds: [],
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
    });
  }
}