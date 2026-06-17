import express from "express";
import { protect }
from "../Middlewares/auth.middleware.js";

import {
  createDay,
  getTripDays,
  getDay,
  updateDay,
  deleteDay
} from "../Controllers/itinerary.controller.js";

const router =
  express.Router();

router.post(
  "/",
  protect,
  createDay
);

router.get(
  "/trip/:tripId",
  protect,
  getTripDays
);

router.get(
  "/:id",
  protect,
  getDay
);

router.put(
  "/:id",
  protect,
  updateDay
);

router.delete(
  "/:id",
  protect,
  deleteDay
);

export default router;