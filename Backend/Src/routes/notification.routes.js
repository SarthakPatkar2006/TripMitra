import { Router } from "express";
import { protect } from "../Middlewares/auth.middleware.js";

import {
  getNotifications,
  markAsRead,
  markAllAsRead
} from "../Controllers/notification.controller.js";

const router = Router();

router.get(
  "/",
  protect,
  getNotifications
);
router.patch(
  "/read-all",
  protect,
  markAllAsRead
);

router.patch(
  "/:id/read",
  protect,
  markAsRead
);


export default router;