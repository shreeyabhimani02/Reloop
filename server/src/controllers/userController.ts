import { Response } from "express";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import cloudinary from "../config/cloudinary.js";

/**
 * GET /api/users/me
 * Get current user's profile
 */
export async function getMyProfile(
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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        avatarPublicId: user.avatarPublicId,
        bio: user.bio,
        location: user.location,
        rating: user.rating,
        totalRatings: user.totalRatings,
        itemsSold: user.itemsSold,
        responseRate: user.responseRate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
}

/**
 * PUT /api/users/me
 * Update current user's profile
 */
export async function updateMyProfile(
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

    const {
      name,
      bio,
      location,
      avatar,
      avatarPublicId,
    } = req.body;

    const updates: {
      name?: string;
      bio?: string;
      location?: string;
      avatar?: string;
      avatarPublicId?: string;
    } = {};

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (bio !== undefined) {
      updates.bio = bio.trim();
    }

    if (location !== undefined) {
      updates.location = location.trim();
    }

    if (avatar !== undefined) {
      updates.avatar = avatar.trim();
    }

    if (avatarPublicId !== undefined) {
      updates.avatarPublicId =
        avatarPublicId.trim();
    }

    if (
      updates.name !== undefined &&
      updates.name.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    if (
      updates.name !== undefined &&
      updates.name.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 50 characters",
      });
    }

    if (
      updates.bio !== undefined &&
      updates.bio.length > 300
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Bio cannot exceed 300 characters",
      });
    }

    if (
      updates.avatarPublicId &&
      !updates.avatarPublicId.startsWith(
        `reloop/avatars/${userId}/`
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar asset",
      });
    }

    const existingUser =
      await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldAvatarPublicId =
      existingUser.avatarPublicId;

    const user =
      await User.findByIdAndUpdate(
        userId,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the old avatar only after
    // the new avatar has been saved successfully.
    if (
      updates.avatarPublicId &&
      oldAvatarPublicId &&
      oldAvatarPublicId !==
        updates.avatarPublicId
    ) {
      try {
        await cloudinary.uploader.destroy(
          oldAvatarPublicId
        );
      } catch (deleteError) {
        console.error(
          "Old avatar deletion failed:",
          deleteError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        avatarPublicId:
          user.avatarPublicId,
        bio: user.bio,
        location: user.location,
        rating: user.rating,
        totalRatings:
          user.totalRatings,
        itemsSold: user.itemsSold,
        responseRate:
          user.responseRate,
        createdAt:
          user.createdAt,
        updatedAt:
          user.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile",
    });
  }
}

/**
 * GET /api/users/:userId
 * Get public seller profile
 */
export async function getPublicUser(
  req: AuthRequest,
  res: Response
) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId).select(
      "name avatar bio location rating totalRatings itemsSold responseRate createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        rating: user.rating,
        totalRatings: user.totalRatings,
        itemsSold: user.itemsSold,
        responseRate: user.responseRate,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Get public seller profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller profile",
    });
  }
}