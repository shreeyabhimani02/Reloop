import { Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

// Get notifications
export async function getNotifications(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notifications = await Notification.find({
      user: req.userId,
    })
      .populate("product", "title images price")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.userId,
      read: false,
    });

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

// Mark one notification as read
export async function markNotificationRead(
  req: AuthRequest,
  res: Response
) {
  try {
    const notificationId =
      Array.isArray(req.params.notificationId)
        ? req.params.notificationId[0]
        : req.params.notificationId;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(notificationId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          user: req.userId,
        },
        {
          read: true,
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    await Notification.updateMany(
      {
        user: req.userId,
        read: false,
      },
      {
        read: true,
      }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
}

// Delete one notification
export async function deleteNotification(
  req: AuthRequest,
  res: Response
) {
  try {
    const notificationId =
      Array.isArray(req.params.notificationId)
        ? req.params.notificationId[0]
        : req.params.notificationId;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(notificationId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification =
      await Notification.findOneAndDelete({
        _id: notificationId,
        user: req.userId,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error(
      "Delete notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
}
