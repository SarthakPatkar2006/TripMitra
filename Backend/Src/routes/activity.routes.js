import { Router } from "express";

import {
  addActivity,
  updateActivity,
  deleteActivity
} from "../Controllers/activity.controller.js";

import {
  protect
} from "../Middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/",
  protect,
  addActivity
);

router.put(
  "/:id",
  protect,
  updateActivity
);

router.delete(
  "/:id",
  protect,
  deleteActivity
);

export default router;