import { Router }
from "express";

import {
  getTripMembers
}
from "../Controllers/tripMember.controller.js";

import {
  protect
}
from "../Middlewares/auth.middleware.js";

const router =
  Router();

router.get(
  "/trip/:tripId",
  protect,
  getTripMembers
);

export default router;