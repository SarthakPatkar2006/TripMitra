// import { Router } from "express";

// import {
//   generatePlan,
//   getTripItinerary
// } from "../Controllers/planner.controller.js";

// import {
//   protect
// } from "../Middlewares/auth.middleware.js";

// const router = Router();

// router.post(
//   "/:id/generate-plan",
//   protect,
//   generatePlan
// );
// router.get(
//   "/:id/itinerary",
//   protect,
//   getTripItinerary
// );

// export default router;
import { Router } from "express";
import { getTripItinerary } from "../Controllers/planner.controller.js";
import { protect } from "../Middlewares/auth.middleware.js";

const router = Router();

// React calls: GET /api/planner/12345
// This route strictly matches that exact URL!
router.get(
  "/:id",
  protect,
  getTripItinerary
);

export default router;