import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer is required"],
    },

    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [3, "Review must be at least 3 characters"],
      maxlength: [500, "Review cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// One review per user for each product
reviewSchema.index(
  { product: 1, reviewer: 1 },
  { unique: true }
);

// Faster product review queries
reviewSchema.index({ product: 1, createdAt: -1 });

// Faster seller rating queries
reviewSchema.index({ seller: 1 });

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;