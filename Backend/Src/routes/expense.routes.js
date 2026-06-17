import { Router } from "express";
import {
  createExpense,
  getTripExpenses,
  getTripSettlements,
  deleteExpense
}
from "../Controllers/expense.controller.js";
import { protect } from "../Middlewares/auth.middleware.js";

const router = Router();

// All expense actions require a logged-in user
router.post("/log", protect, createExpense);
router.get("/trip/:tripId", protect, getTripExpenses);
router.get("/trip/:tripId/settlements", protect, getTripSettlements);
router.delete(
  "/:id",
  protect,
  deleteExpense
);
export default router;