import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  seller: mongoose.Types.ObjectId;
  location: string;
  brand?: string;
  size?: string;
  color?: string;
  views: number;
  likes: number;
  isSold: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: [
        "New",
        "Like New",
        "Good",
        "Fair",
      ],
    },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: (images: string[]) => images.length > 0,
        message: "At least one image is required",
      },
    },

    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    size: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    color: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    isSold: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ title: "text", description: "text", brand: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ seller: 1 });

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;