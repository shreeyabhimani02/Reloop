import { Response } from "express";
import mongoose from "mongoose";

import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export async function markConversationAsRead(
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

    const conversationId = Array.isArray(
      req.params.conversationId
    )
      ? req.params.conversationId[0]
      : req.params.conversationId;

    if (
      !mongoose.Types.ObjectId.isValid(
        conversationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: {
          readBy: userId,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error(
      "Mark conversation as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark conversation as read",
    });
  }
}