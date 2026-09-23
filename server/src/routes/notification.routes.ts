import { Router } from "express";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getNotifications
);

router.patch(
  "/read-all",
  authMiddleware,
  markAllNotificationsRead
);

router.patch(
  "/:notificationId/read",
  authMiddleware,
  markNotificationRead
);

router.delete(
  "/:notificationId",
  authMiddleware,
  deleteNotification
);

export default router;