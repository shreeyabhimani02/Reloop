import { Response } from "express";
import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Product from "../models/Product.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { Server } from "socket.io";

let io: Server | null = null;

export function setConversationIO(server: Server) {
  io = server;
}

/**
 * Create or get an existing conversation
 */
export async function createOrGetConversation(
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

    const { sellerId, productId } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    if (sellerId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
    }

    if (
      productId &&
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // If a product is supplied, make sure it exists
    if (productId) {
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
    }

    // Find existing conversation
    const participantIds = [
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(sellerId),
    ];

    let conversation = await Conversation.findOne({
      participants: {
        $all: participantIds,
        $size: 2,
      },
      ...(productId
        ? {
            product: new mongoose.Types.ObjectId(productId),
          }
        : {}),
    })
      .populate(
        "participants",
        "name avatar rating totalRatings"
      )
      .populate(
        "product",
        "title price images condition"
      );

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participants: participantIds,
        ...(productId
          ? {
              product: new mongoose.Types.ObjectId(
                productId
              ),
            }
          : {}),
      });

      conversation = await Conversation.findById(
        conversation._id
      )
        .populate(
          "participants",
          "name avatar rating totalRatings"
        )
        .populate(
          "product",
          "title price images condition"
        );
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
}


/**
 * Get all conversations for the logged-in user
 */
export async function getMyConversations(
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

    const conversations =
      await Conversation.find({
        participants: userId,
      })
        .populate(
          "participants",
          "name avatar rating totalRatings"
        )
        .populate(
          "product",
          "title price images condition"
        )
        .sort({
          lastMessageAt: -1,
          updatedAt: -1,
        });

    // Calculate unread message count for each conversation
    const conversationsWithUnreadCounts =
      await Promise.all(
        conversations.map(async (conversation) => {
          const unreadCount =
            await Message.countDocuments({
              conversation: conversation._id,
              sender: { $ne: userId },
              readBy: { $ne: userId },
            });

          return {
            ...conversation.toObject(),
            unreadCount,
          };
        })
      );

    return res.status(200).json({
      success: true,
      conversations: conversationsWithUnreadCounts,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
}


/**
 * Get messages from a conversation
 */
export async function getConversationMessages(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    const conversationId = Array.isArray(
    req.params.conversationId
    )
    ? req.params.conversationId[0]
    : req.params.conversationId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

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

    // Security check:
    // only participants can access messages
    const conversation =
      await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message:
          "Conversation not found or access denied",
      });
    }

    const messages =
      await Message.find({
        conversation: conversationId,
      })
        .populate(
          "sender",
          "name avatar"
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
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

    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const trimmedText = text.trim();

    if (trimmedText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text: trimmedText,
      readBy: [userId],
    });

    conversation.lastMessage = trimmedText;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name avatar");

    if (!populatedMessage) {
      return res.status(500).json({
        success: false,
        message: "Failed to load created message",
      });
    }

    /* ---------------------------------------------------------------------- */
    /* Real-time Socket.IO broadcast                                          */
    /* ---------------------------------------------------------------------- */

    if (io) {
      io.to(`conversation:${conversationId}`).emit(
        "new_message",
        populatedMessage
      );
    }

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
}