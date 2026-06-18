import { Router } from "express";

import { protect }
from "../Middlewares/auth.middleware.js";

import {
  inviteMember,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  removeMember,
    getPendingInvitations,
     getInvitationByToken
} from "../Controllers/invitation.controller.js";

const router = Router();

router.get(
  "/",
  protect,
  getMyInvitations
);

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

router.delete(
  "/:tripId/members/:memberId",
  protect,
  removeMember
);
router.get(
  "/trips/:tripId/pending",
  protect,
  getPendingInvitations
);
router.get(
  "/token/:token",
  getInvitationByToken
);
export default router;