import { Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

// Get reviews for a product
export async function getProductReviews(
  req: AuthRequest,
  res: Response
) {
  try {
    const productId = getParam(req.params.productId);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const reviews = await Review.find({
      product: productId,
    })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 });

    const ratingStats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return res.json({
      success: true,
      reviews,
      stats: {
        averageRating:
          ratingStats.length > 0
            ? Number(ratingStats[0].averageRating.toFixed(1))
            : 0,
        totalReviews:
          ratingStats.length > 0
            ? ratingStats[0].totalReviews
            : 0,
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
}

// Create a review
export async function createReview(
  req: AuthRequest,
  res: Response
) {
  try {
    const productId = getParam(req.params.productId);
    const { rating, comment } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (
      typeof comment !== "string" ||
      comment.trim().length < 3
    ) {
      return res.status(400).json({
        success: false,
        message: "Review must contain at least 3 characters",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Seller cannot review their own product
    if (product.seller.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot review your own listing",
      });
    }

    const existingReview = await Review.findOne({
      product: productId,
      reviewer: req.userId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      product: productId,
      reviewer: req.userId,
      seller: product.seller,
      rating,
      comment: comment.trim(),
    });

    await updateSellerRating(product.seller.toString());

    const populatedReview = await Review.findById(review._id)
      .populate("reviewer", "name avatar");

    return res.status(201).json({
      success: true,
      review: populatedReview,
      message: "Review added successfully",
    });
  } catch (error) {
    console.error("Create review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
}

// Update a review
export async function updateReview(
  req: AuthRequest,
  res: Response
) {
  try {
    const reviewId = getParam(req.params.reviewId);
    const { rating, comment } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    if (
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (
      typeof comment !== "string" ||
      comment.trim().length < 3
    ) {
      return res.status(400).json({
        success: false,
        message: "Review must contain at least 3 characters",
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.reviewer.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own review",
      });
    }

    review.rating = rating;
    review.comment = comment.trim();

    await review.save();

    await updateSellerRating(review.seller.toString());

    const populatedReview = await Review.findById(review._id)
      .populate("reviewer", "name avatar");

    return res.json({
      success: true,
      review: populatedReview,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Update review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
}

// Delete a review
export async function deleteReview(
  req: AuthRequest,
  res: Response
) {
  try {
    const reviewId = getParam(req.params.reviewId);

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.reviewer.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    const sellerId = review.seller.toString();

    await Review.findByIdAndDelete(reviewId);

    await updateSellerRating(sellerId);

    return res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
}

// Recalculate seller rating
async function updateSellerRating(
  sellerId: string
) {
  const stats = await Review.aggregate([
    {
      $match: {
        seller: new mongoose.Types.ObjectId(sellerId),
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const rating =
    stats.length > 0
      ? Number(stats[0].averageRating.toFixed(1))
      : 0;

  const totalRatings =
    stats.length > 0
      ? stats[0].totalRatings
      : 0;

  await User.findByIdAndUpdate(sellerId, {
    rating,
    totalRatings,
  });
}