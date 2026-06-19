import { Router } from "express";
import { protect } from "../Middlewares/auth.middleware.js";

import {
  getFinanceSummary,
  getCategoryAnalytics,
  getTimeline,
  getBudgetPrediction,
  getSettlements
} from "../Controllers/finance.controller.js";

const router = Router();
console.log(
  "Finance routes loaded"
);
router.get(
  "/trips/:tripId/finance/summary",
  protect,
  getFinanceSummary
);

router.get(
  "/trips/:tripId/finance/categories",
  protect,
  getCategoryAnalytics
);

router.get(
  "/trips/:tripId/finance/timeline",
  protect,
  getTimeline
);

router.get(
  "/trips/:tripId/finance/prediction",
  protect,
  getBudgetPrediction
);

router.get(
  "/trips/:tripId/settlements",
  protect,
  getSettlements
);

export default router;