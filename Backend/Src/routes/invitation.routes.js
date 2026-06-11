import { Router } from "express";

import { protect }
from "../Middlewares/auth.middleware.js";

import {
  inviteMember,
   acceptInvitation,
  rejectInvitation
}
from "../Controllers/invitation.controller.js";

const router = Router();

router.post(
  "/trips/:tripId/invite",
  protect,
  inviteMember
);
router.post(
  "/:id/accept",
  protect,
  acceptInvitation
);

router.post(
  "/:id/reject",
  protect,
  rejectInvitation
);


export default router;