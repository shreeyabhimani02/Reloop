import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  avatarPublicId?: string;
  bio?: string;
  location?: string;

  rating: number;
  totalRatings: number;

  itemsSold: number;
  responseRate: number;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    avatar: { type: String, default: "" },

    avatarPublicId: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: [300, "Bio cannot exceed 300 characters"],
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },

    itemsSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>(
  "User",
  userSchema
);

export default User;