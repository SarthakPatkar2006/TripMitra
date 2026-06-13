import { Router } from "express";
import { getUserNotifications, markAsRead } from "../Controllers/notification.controller.js";
import { protect } from "../Middlewares/auth.middleware.js";

const router = Router();

// A user must be logged in to check their notifications
router.get("/", protect, getUserNotifications);
router.patch("/:notificationId/read", protect, markAsRead);

export default router;