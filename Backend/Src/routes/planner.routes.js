import { Router } from "express";

import {
  generatePlan,
  getTripItinerary
} from "../Controllers/planner.controller.js";

import {
  protect
} from "../Middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/:id/generate-plan",
  protect,
  generatePlan
);
router.get(
  "/:id/itinerary",
  protect,
  getTripItinerary
);

export default router;