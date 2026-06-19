import { Router } from "express";
import { protect } from "../Middlewares/auth.middleware.js";

import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense
} from "../Controllers/expense.controller.js";

const router = Router();

router.post(
  "/trips/:tripId/expenses",
  protect,
  addExpense
);

router.get(
  "/trips/:tripId/expenses",
  protect,
  getExpenses
);

router.put(
  "/expenses/:expenseId",
  protect,
  updateExpense
);

router.delete(
  "/expenses/:expenseId",
  protect,
  deleteExpense
);

export default router;