import { Response } from "express";
import crypto from "crypto";
import { AuthRequest } from "../middleware/auth.middleware.js";
import cloudinary from "../config/cloudinary.js";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
];

const MAX_LISTING_IMAGE_SIZE = 10 * 1024 * 1024;

const LISTING_ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
];

export async function getAvatarUploadSignature(
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

    const timestamp = Math.floor(
      Date.now() / 1000
    );

    const randomId = crypto
      .randomBytes(12)
      .toString("hex");

    const folder = `reloop/avatars/${userId}`;

    const publicId = `avatar_${randomId}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return res.status(200).json({
      success: true,
      cloudName:
        process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:
        process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      signature,
      maxFileSize: MAX_AVATAR_SIZE,
      allowedFormats: ALLOWED_FORMATS,
    });
  } catch (error) {
    console.error(
      "Cloudinary signature error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate upload signature",
    });
  }
}

export async function getListingUploadSignature(
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

    const timestamp = Math.floor(
      Date.now() / 1000
    );

    const randomId = crypto
      .randomBytes(12)
      .toString("hex");

    const folder = `reloop/listings/${userId}`;

    const publicId = `listing_${randomId}`;

    const signature =
      cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder,
          public_id: publicId,
        },
        process.env.CLOUDINARY_API_SECRET!
      );

    return res.status(200).json({
      success: true,
      cloudName:
        process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:
        process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      signature,
      maxFileSize:
        MAX_LISTING_IMAGE_SIZE,
      allowedFormats:
        LISTING_ALLOWED_FORMATS,
    });
  } catch (error) {
    console.error(
      "Cloudinary listing signature error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate listing upload signature",
    });
  }
}