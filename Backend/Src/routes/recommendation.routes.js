import { Router } from "express";
import { protect }
from "../Middlewares/auth.middleware.js";

import {
  getRecommendations
} from "../Controllers/recommendation.controller.js";

const router = Router();

router.get(
  "/:tripId",
  protect,
  getRecommendations
);

export default router;