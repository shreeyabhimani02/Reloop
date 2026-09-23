import { Router } from "express";

import {
  createOrGetConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
} from "../controllers/conversationController.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  markConversationAsRead,
} from "../controllers/messageController.js";

const router = Router();

/**
 * Create or get conversation
 */
router.post(
  "/",
  authMiddleware,
  createOrGetConversation
);

/**
 * Get logged-in user's conversations
 */
router.get(
  "/",
  authMiddleware,
  getMyConversations
);

router.patch(
  "/:conversationId/read",
  authMiddleware,
  markConversationAsRead
);

/**
 * Get messages
 */
router.get(
  "/:conversationId/messages",
  authMiddleware,
  getConversationMessages
);

/**
 * Send message
 */
router.post(
  "/:conversationId/messages",
  authMiddleware,
  sendMessage
);

export default router;