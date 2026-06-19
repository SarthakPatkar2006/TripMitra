import { Router } from "express";

import { protect }
from "../Middlewares/auth.middleware.js";

import {
  contribute,
  getWallet,
  getTransactions
}
from "../Controllers/wallet.controller.js";

const router =
  Router();

router.post(
  "/trips/:tripId/wallet/contribute",
  protect,
  contribute
);

router.get(
  "/trips/:tripId/wallet",
  protect,
  getWallet
);

router.get(
  "/trips/:tripId/wallet/transactions",
  protect,
  getTransactions
);

export default router;