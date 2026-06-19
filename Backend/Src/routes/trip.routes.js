import { Router } from "express";
import { protect } from "../Middlewares/auth.middleware.js";
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTripMembers
} from "../Controllers/trip.controller.js";

const router = Router();

router.post("/", protect, createTrip);
router.get("/", protect, getTrips);

router.get(
  "/:tripId/members",
  protect,
  getTripMembers
);

router.get(
  "/:id",
  protect,
  getTripById
);

router.put(
  "/:id",
  protect,
  updateTrip
);

router.delete(
  "/:id",
  protect,
  deleteTrip
);
export default router;
